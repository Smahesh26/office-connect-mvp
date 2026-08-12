import * as dotenv from 'dotenv';
dotenv.config();
import prisma from './src/config/prisma';

async function main() {
    const users = await prisma.user.findMany({select: {id:true, email:true}});
    console.log(users);
}
main().catch(console.error).finally(()=>prisma.$disconnect());
