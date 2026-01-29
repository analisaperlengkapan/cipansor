
import { PrismaClient } from '@prisma/client';
import { createInvoice, createPayment, createPaymentType } from '../src/modules/finance/service';
import { setAccountMapping, ACCOUNT_MAPPING_KEYS } from '../src/modules/finance/accounting-config.service';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting Finance Accrual Verification...');

  // 1. Setup Data
  const unitCode = 'TEST-ACCRUAL-' + Date.now();

  // Create Unit
  const unit = await prisma.unit.create({
    data: {
      name: 'Test Unit Accrual',
      type: 'PESANTREN',
      address: 'Test Address',
    }
  });
  console.log('Unit created:', unit.id);

  // Create Accounts
  const accCash = await prisma.accountCode.create({
    data: { code: '1101-' + Date.now(), name: 'Kas Tunai', type: 'ASSET', normalBalance: 'DEBIT' }
  });
  const accAR = await prisma.accountCode.create({
    data: { code: '1103-' + Date.now(), name: 'Piutang Santri', type: 'ASSET', normalBalance: 'DEBIT' }
  });
  const accRev = await prisma.accountCode.create({
    data: { code: '4101-' + Date.now(), name: 'Pendapatan SPP', type: 'REVENUE', normalBalance: 'CREDIT' }
  });
  console.log('Accounts created');

  // Configure Mapping
  await setAccountMapping(unit.id, ACCOUNT_MAPPING_KEYS.ACCOUNTS_RECEIVABLE, accAR.id);
  await setAccountMapping(unit.id, ACCOUNT_MAPPING_KEYS.CASH, accCash.id);
  // Note: createInvoice logic looks for PaymentType.accountId, or falls back to 'ACCOUNT_MAPPING_REVENUE_DEFAULT' (which we didn't export key for, but used string literal in code).
  // Ideally PaymentType account is enough.

  // Create Payment Type
  const paymentType = await createPaymentType({
    unitId: unit.id,
    name: 'SPP Test',
    code: 'SPP-TEST',
    amount: 100000,
    isActive: true,
    accountId: accRev.id,
    isRecurring: true,
    description: 'Test SPP',
  });
  console.log('Payment Type created');

  // Create User & Student
  const user = await prisma.user.create({
    data: {
      name: 'Test Student',
      email: `student-${Date.now()}@test.com`,
      passwordHash: 'hash',
      role: 'STUDENT',
    }
  });

  const student = await prisma.student.create({
    data: {
      userId: user.id,
      unitId: unit.id,
      nis: 'NIS-' + Date.now(),
      gender: 'MALE',
      birthPlace: 'Test',
      birthDate: new Date(),
      address: 'Test',
      parentName: 'Parent',
      parentPhone: '08123',
    }
  });
  console.log('Student created');

  // 2. Test Invoice Creation (Accrual: Expect Dr AR, Cr Revenue)
  console.log('\nTesting createInvoice...');
  const invoice = await createInvoice({
    studentId: student.id,
    paymentTypeId: paymentType.id,
    amount: 100000,
    dueDate: new Date().toISOString(),
    notes: 'Test Invoice',
  });
  console.log('Invoice created:', invoice.id);

  // Verify Invoice Journals
  const invJournals = await prisma.journalEntry.findMany({
    where: { reference: invoice.id, referenceType: 'INVOICE' },
    include: { account: true }
  });

  if (invJournals.length !== 2) {
    throw new Error(`Expected 2 journal entries for invoice, found ${invJournals.length}`);
  }

  const drInv = invJournals.find(j => j.debit.toNumber() > 0);
  const crInv = invJournals.find(j => j.credit.toNumber() > 0);

  if (drInv?.accountId !== accAR.id) throw new Error(`Invoice Debit should be AR (${accAR.id}), found ${drInv?.accountId}`);
  if (crInv?.accountId !== accRev.id) throw new Error(`Invoice Credit should be Revenue (${accRev.id}), found ${crInv?.accountId}`);
  console.log('✅ Invoice Journals Verified (Dr AR, Cr Revenue)');

  // 3. Test Payment Creation (Accrual: Expect Dr Cash, Cr AR)
  console.log('\nTesting createPayment...');
  const payment = await createPayment({
    invoiceId: invoice.id,
    amount: 100000,
    method: 'CASH',
    notes: 'Payment Test'
  });
  console.log('Payment created:', payment.id);

  // Verify Payment Journals
  // Note: createPayment uses JournalReferenceType.PAYMENT (which is an enum or string in DB).
  // In service.ts we used JournalReferenceType.PAYMENT.
  const payJournals = await prisma.journalEntry.findMany({
    where: { reference: payment.id }, // Type might be 'PAYMENT'
    include: { account: true }
  });

  if (payJournals.length !== 2) {
    throw new Error(`Expected 2 journal entries for payment, found ${payJournals.length}`);
  }

  const drPay = payJournals.find(j => j.debit.toNumber() > 0);
  const crPay = payJournals.find(j => j.credit.toNumber() > 0);

  if (drPay?.accountId !== accCash.id) throw new Error(`Payment Debit should be Cash (${accCash.id}), found ${drPay?.accountId}`);
  if (crPay?.accountId !== accAR.id) throw new Error(`Payment Credit should be AR (${accAR.id}), found ${crPay?.accountId}`);

  console.log('✅ Payment Journals Verified (Dr Cash, Cr AR)');

  console.log('\nSUCCESS: Finance Accrual Transition Verified!');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
