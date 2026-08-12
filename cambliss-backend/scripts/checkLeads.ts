import prisma from '../src/config/prisma';

async function checkLeads() {
  const leads = await prisma.lead.findMany({
    include: { contact: true }
  });
  console.log("LEADS:");
  leads.forEach(l => {
    console.log(`- ${l.title}: Contact=${l.contact?.firstName} ${l.contact?.lastName} (${l.contact?.email})`);
  });
  process.exit(0);
}

checkLeads();
