
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

  // Create Campaign
  const campaign = await prisma.donationCampaign.create({
    data: {
        title: 'Test Campaign',
        slug: 'test-campaign-' + Date.now(),
        targetAmount: 10000000,
        createdById: 'SYSTEM_TEST_USER' // Assuming createdById is string and not relation here for simplicity, or dummy
    }
  });
  console.log('Created Campaign:', campaign.id);

  // Create Donation
  const donation = await prisma.donation.create({
    data: {
      amount: 100000,
      type: 'INFAK',
      paymentMethod: 'BANK_TRANSFER',
      donorName: 'Test Donor',
      status: 'PENDING',
      unitId: unit.id,
      campaignId: campaign.id
    }
  });
  console.log('Created Donation:', donation.id);

  // 2. Perform Verify Action (First Time)
  console.log('Verifying Donation (1st)...');
  await donationService.verify(donation.id, 'SYSTEM_TEST_USER', {
    status: 'VERIFIED',
    notes: 'Verified by script'
  });

  // Check Campaign Totals (Should be 100000)
  const campaign1 = await prisma.donationCampaign.findUnique({ where: { id: campaign.id } });
  console.log('Campaign Total (1st Verify):', campaign1?.collectedAmount.toNumber());

  // 3. Test Cancellation
  console.log('Testing Cancellation...');
  await donationService.verify(donation.id, 'SYSTEM_TEST_USER', {
    status: 'CANCELLED',
    notes: 'Cancelled by script'
  });

  // Check Campaign Totals (Should be 0)
  const campaign2 = await prisma.donationCampaign.findUnique({ where: { id: campaign.id } });
  console.log('Campaign Total (Cancelled):', campaign2?.collectedAmount.toNumber());

  // 4. Test Re-verification
  console.log('Testing Re-verification (Cancelled -> Verified)...');
  await donationService.verify(donation.id, 'SYSTEM_TEST_USER', {
    status: 'VERIFIED',
    notes: 'Re-verified by script'
  });

  // Check Campaign Totals (Should be 100000, NOT 200000)
  const campaign3 = await prisma.donationCampaign.findUnique({ where: { id: campaign.id } });
  console.log('Campaign Total (Re-verified):', campaign3?.collectedAmount.toNumber());

  if (campaign3?.collectedAmount.toNumber() === 100000) {
      console.log('SUCCESS: Campaign totals are correct (no double increment).');
  } else {
      console.error('FAILURE: Campaign totals incorrect. Expected 100000, got', campaign3?.collectedAmount.toNumber());
  }

  // 5. Cleanup
  console.log('Cleaning up...');
  await prisma.journalEntry.deleteMany({ where: { reference: donation.id } });
  await prisma.donation.delete({ where: { id: donation.id } });
  await prisma.donationCampaign.delete({ where: { id: campaign.id } });
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
