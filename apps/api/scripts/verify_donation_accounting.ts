
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { donationService } from '../src/modules/donation/donation.service';

// Mock AccountType from shared if unavailable
const AccountType = {
  ASSET: 'ASSET',
  REVENUE: 'REVENUE'
};

const prisma = new PrismaClient();

async function main() {
  console.log('Starting verification script...');

  // 1. Setup Data
  const unit = await prisma.unit.create({
    data: {
      name: 'Test Unit Accounting',
      type: 'PESANTREN',
      address: 'Test Address'
    }
  });
  console.log('Created Unit:', unit.id);

  // Create Accounts
  const assetAccount = await prisma.accountCode.create({
    data: {
      code: '1-1-01-TEST',
      name: 'Bank BSI Test',
      type: AccountType.ASSET,
      normalBalance: 'DEBIT'
    }
  });
  console.log('Created Asset Account:', assetAccount.id);

  const revenueAccount = await prisma.accountCode.create({
    data: {
      code: '4-1-01-TEST',
      name: 'Pendapatan Infak Test',
      type: AccountType.REVENUE,
      normalBalance: 'CREDIT'
    }
  });
  console.log('Created Revenue Account:', revenueAccount.id);

  // Create Donation
  const donation = await prisma.donation.create({
    data: {
      amount: 100000,
      type: 'INFAK',
      paymentMethod: 'BANK_TRANSFER',
      donorName: 'Test Donor',
      status: 'PENDING',
      unitId: unit.id
    }
  });
  console.log('Created Donation:', donation.id);

  // 2. Perform Verify Action
  console.log('Verifying Donation...');
  await donationService.verify(donation.id, 'SYSTEM_TEST_USER', {
    status: 'VERIFIED',
    notes: 'Verified by script'
  });

  // 3. Test Duplicate Verification
  console.log('Testing duplicate verification...');
  try {
    await donationService.verify(donation.id, 'SYSTEM_TEST_USER', {
      status: 'VERIFIED',
      notes: 'Duplicate verify attempt'
    });
    console.error('FAILURE: Duplicate verification should have thrown an error.');
  } catch (error: any) {
    if (error.message === 'Donation is already verified') {
        console.log('SUCCESS: Duplicate verification blocked correctly.');
    } else {
        console.error('FAILURE: Unexpected error during duplicate verification:', error.message);
    }
  }

  // 4. Verify Journal Entries
  const journals = await prisma.journalEntry.findMany({
    where: {
      reference: donation.id
    }
  });

  console.log(`Found ${journals.length} journal entries.`);

  const debitEntry = journals.find(j => j.debit.toNumber() > 0 && j.referenceType === 'DONATION');
  const creditEntry = journals.find(j => j.credit.toNumber() > 0 && j.referenceType === 'DONATION');

  if (debitEntry && creditEntry) {
    console.log('SUCCESS: Both Debit and Credit entries found.');
  } else {
    console.error('FAILURE: Missing journal entries.');
  }

  // 5. Test Cancellation
  console.log('Testing Cancellation...');
  await donationService.verify(donation.id, 'SYSTEM_TEST_USER', {
    status: 'CANCELLED',
    notes: 'Cancelled by script'
  });

  // Verify Reversing Entries
  const allJournals = await prisma.journalEntry.findMany({
    where: {
      reference: donation.id
    }
  });

  console.log(`Found ${allJournals.length} total journal entries (expecting 4).`);
  const reversalEntries = allJournals.filter(j => j.referenceType === 'DONATION_CANCEL');

  if (reversalEntries.length === 2) {
      console.log('SUCCESS: Reversal entries found.');
      const reversalDebit = reversalEntries.find(j => j.debit.toNumber() > 0); // Should debit Revenue
      const reversalCredit = reversalEntries.find(j => j.credit.toNumber() > 0); // Should credit Asset

      console.log(`Reversal Debit (Revenue): ${reversalDebit?.debit} - Account: ${reversalDebit?.accountId}`);
      console.log(`Reversal Credit (Asset): ${reversalCredit?.credit} - Account: ${reversalCredit?.accountId}`);
  } else {
      console.error('FAILURE: Reversal entries missing or incorrect count.');
  }

  // 6. Test Re-verification
  console.log('Testing Re-verification (Cancelled -> Verified)...');
  await donationService.verify(donation.id, 'SYSTEM_TEST_USER', {
    status: 'VERIFIED',
    notes: 'Re-verified by script'
  });

  const finalJournals = await prisma.journalEntry.findMany({
    where: {
      reference: donation.id
    }
  });

  console.log(`Found ${finalJournals.length} final journal entries.`);
  const finalReversals = finalJournals.filter(j => j.referenceType === 'DONATION_CANCEL');
  const finalOriginals = finalJournals.filter(j => j.referenceType === 'DONATION');

  if (finalReversals.length === 0 && finalOriginals.length === 2) {
      console.log('SUCCESS: Re-verification cleaned up reversals and kept originals.');
  } else {
      console.error(`FAILURE: Incorrect entry count. Reversals: ${finalReversals.length}, Originals: ${finalOriginals.length}`);
  }

  // 7. Cleanup
  console.log('Cleaning up...');
  await prisma.journalEntry.deleteMany({ where: { reference: donation.id } });
  await prisma.donation.delete({ where: { id: donation.id } });
  await prisma.accountCode.delete({ where: { id: assetAccount.id } });
  await prisma.accountCode.delete({ where: { id: revenueAccount.id } });
  await prisma.unit.delete({ where: { id: unit.id } });

  console.log('Done.');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
