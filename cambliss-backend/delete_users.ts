import * as dotenv from 'dotenv';
dotenv.config();
import prisma from './src/config/prisma';

async function main() {
    const keepEmail = 'global.admin@cambliss.local';
    console.log(`Deleting all users except: ${keepEmail}`);
    const res = await prisma.user.deleteMany({
        where: {
            email: {
                not: keepEmail
            }
        }
    });
    console.log(`Deleted ${res.count} users.`);
}

main().catch(console.error).finally(()=>prisma.$disconnect());
