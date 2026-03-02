import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
async function main() {
  await prisma.examAttempt.findMany({
    where: {
      exam: {
        grades: { none: { notes: 'test' } }
      }
    }
  })
}
main()
