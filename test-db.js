const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const orgs = await prisma.organization.findMany();
  console.log("ORGANIZATIONS:", JSON.stringify(orgs, null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
