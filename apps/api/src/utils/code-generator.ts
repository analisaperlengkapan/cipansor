import { prisma } from '@/lib/prisma';

export const generateUniqueCode = async (prefix: string, table: string): Promise<string> => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const codePrefix = `${prefix}-${year}${month}-`;

  // This is a simplified dynamic query. In a real app with strict types,
  // you might need a mapping or raw query.
  // For safety with "any" table name, we use raw query carefully or specific switch.
  // Using a safe switch for known tables:

  let lastRecord: any = null;

  if (table === 'purchase_requests') {
    lastRecord = await prisma.purchaseRequest.findFirst({
      where: { code: { startsWith: codePrefix } },
      orderBy: { code: 'desc' },
      select: { code: true }
    });
  }
  // Add other tables here

  let sequence = 1;
  if (lastRecord && lastRecord.code) {
    const lastCode = lastRecord.code;
    const lastSequence = parseInt(lastCode.split('-').pop() || '0');
    sequence = lastSequence + 1;
  }

  return `${codePrefix}${String(sequence).padStart(4, '0')}`;
};
