import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";

const getRequiredEnv = (name: string): string => {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not defined`);
  return value;
};

const pool = new Pool({ connectionString: getRequiredEnv("DATABASE_URL") });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🧹 Cleaning all ecommerce data while preserving registered accounts...");

  try {
    // 1. Delete Cart Items and Carts
    await prisma.$executeRawUnsafe(`DELETE FROM "CartItem";`);
    await prisma.$executeRawUnsafe(`DELETE FROM "Cart";`);
    console.log("✓ Cleared Cart & CartItem");

    // 2. Delete Return Items and Return Requests
    await prisma.$executeRawUnsafe(`DELETE FROM "ReturnItem";`);
    await prisma.$executeRawUnsafe(`DELETE FROM "ReturnRequest";`);
    console.log("✓ Cleared ReturnRequest & ReturnItem");

    // 3. Delete Order Items and Orders
    await prisma.$executeRawUnsafe(`DELETE FROM "OrderItem";`);
    await prisma.$executeRawUnsafe(`DELETE FROM "Order";`);
    console.log("✓ Cleared Order & OrderItem");

    // 4. Delete POS data
    await prisma.$executeRawUnsafe(`DELETE FROM "POSOrderItem";`);
    await prisma.$executeRawUnsafe(`DELETE FROM "POSOrder";`);
    console.log("✓ Cleared POS Orders");

    // 5. Delete Invoices & EWayBills
    await prisma.$executeRawUnsafe(`DELETE FROM "PaymentAllocation";`);
    await prisma.$executeRawUnsafe(`DELETE FROM "InvoiceItem";`);
    await prisma.$executeRawUnsafe(`DELETE FROM "EWayBill";`);
    await prisma.$executeRawUnsafe(`DELETE FROM "Invoice";`);
    console.log("✓ Cleared Invoices & Allocations");

    // 6. Delete Inventory movements and stock items linked to products
    await prisma.$executeRawUnsafe(`DELETE FROM "StockMovement";`);
    await prisma.$executeRawUnsafe(`DELETE FROM "StockItem";`);
    await prisma.$executeRawUnsafe(`DELETE FROM "GatePassItem";`);
    await prisma.$executeRawUnsafe(`DELETE FROM "GatePass";`);
    await prisma.$executeRawUnsafe(`DELETE FROM "PurchaseItem";`);
    await prisma.$executeRawUnsafe(`DELETE FROM "PurchaseOrder";`);
    console.log("✓ Cleared Stock & Inventory Movements");

    // 7. Delete Product Listings and Products
    await prisma.$executeRawUnsafe(`DELETE FROM "ProductListing";`);
    await prisma.$executeRawUnsafe(`DELETE FROM "Product";`);
    console.log("✓ Cleared ProductListing & Product catalog");

    // 8. Delete Marketplace Events
    await prisma.$executeRawUnsafe(`DELETE FROM "MarketplaceEvent";`);
    console.log("✓ Cleared Marketplace Events");

    // Count preserved accounts
    const userCount: any = await prisma.$queryRawUnsafe(`SELECT count(*) as count FROM "User";`);
    const orgCount: any = await prisma.$queryRawUnsafe(`SELECT count(*) as count FROM "Organization";`);
    console.log(`✅ Ecommerce tables purged! Preserved ${userCount[0]?.count || 0} registered users and ${orgCount[0]?.count || 0} organizations.`);
  } catch (err) {
    console.error("❌ Error during ecommerce data cleanup:", err);
    throw err;
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
