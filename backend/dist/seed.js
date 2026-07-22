"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const prisma_1 = require("./prisma");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
async function main() {
    console.log('🌱 Starting database seed process...');
    // 1. Create Default Users for all 4 required roles
    const defaultPasswordHash = await bcryptjs_1.default.hash('password123', 10);
    const users = [
        { email: 'admin@company.com', name: 'Alex Admin', role: 'ADMIN' },
        { email: 'sales@company.com', name: 'Sarah Sales', role: 'SALES' },
        { email: 'warehouse@company.com', name: 'Willy Warehouse', role: 'WAREHOUSE' },
        { email: 'accounts@company.com', name: 'Arthur Accounts', role: 'ACCOUNTS' },
    ];
    for (const u of users) {
        await prisma_1.prisma.user.upsert({
            where: { email: u.email },
            update: { role: u.role, name: u.name, passwordHash: defaultPasswordHash },
            create: {
                email: u.email,
                name: u.name,
                role: u.role,
                passwordHash: defaultPasswordHash,
            },
        });
    }
    console.log('✅ Created 4 Role Users (Password: password123)');
    const adminUser = await prisma_1.prisma.user.findUnique({ where: { email: 'admin@company.com' } });
    if (!adminUser)
        return;
    // 2. Create Sample Customers
    const customerData = [
        {
            name: 'Rajesh Kumar',
            mobile: '+91 9876543210',
            email: 'rajesh@apexdistributors.com',
            businessName: 'Apex Distributors Pvt Ltd',
            gstNumber: '27AAAAA0000A1Z5',
            type: 'WHOLESALE',
            address: 'Plot 42, Industrial Area Phase 2, Mumbai',
            status: 'ACTIVE',
            followUpDate: new Date('2026-07-30'),
            notes: 'Key client for quarterly bulk ordering.',
        },
        {
            name: 'Priya Sharma',
            mobile: '+91 9812345678',
            email: 'priya@techmart.in',
            businessName: 'TechMart Retail Outlets',
            gstNumber: '29BBBBA1111B2Z3',
            type: 'RETAIL',
            address: 'Shop 14, MG Road Mall, Bengaluru',
            status: 'LEAD',
            followUpDate: new Date('2026-07-25'),
            notes: 'Interested in soundbar bulk discount scheme.',
        },
        {
            name: 'Anil Mehta',
            mobile: '+91 9765432109',
            email: 'anil@omnisupply.com',
            businessName: 'Omni Supply Chain Networks',
            gstNumber: '07CCCCC2222C3Z1',
            type: 'DISTRIBUTOR',
            address: 'Sector 62, Noida, UP',
            status: 'ACTIVE',
            followUpDate: new Date('2026-08-05'),
            notes: 'Distributes in North India region.',
        },
    ];
    for (const c of customerData) {
        const existing = await prisma_1.prisma.customer.findFirst({ where: { email: c.email } });
        if (!existing) {
            const cust = await prisma_1.prisma.customer.create({ data: c });
            await prisma_1.prisma.followUpNote.create({
                data: {
                    customerId: cust.id,
                    note: `Initial onboard notes: ${c.notes}`,
                    createdById: adminUser.id,
                },
            });
        }
    }
    console.log('✅ Created initial Customers & Follow-up Notes');
    // 3. Create Sample Products
    const productData = [
        {
            name: 'UltraHD 4K Smart Monitor 27"',
            sku: 'MON-4K-27',
            category: 'Electronics',
            unitPrice: 24999.0,
            currentStock: 45,
            minStockAlert: 10,
            location: 'Warehouse A - Bay 3',
        },
        {
            name: 'Ergonomic Mesh Executive Chair',
            sku: 'CHR-ERG-01',
            category: 'Furniture',
            unitPrice: 8500.0,
            currentStock: 3, // Low stock on purpose
            minStockAlert: 5,
            location: 'Warehouse B - Rack 12',
        },
        {
            name: 'Wireless Noise Cancelling Headphones',
            sku: 'AUD-NC-900',
            category: 'Electronics',
            unitPrice: 6499.0,
            currentStock: 80,
            minStockAlert: 15,
            location: 'Warehouse A - Shelf 8',
        },
        {
            name: 'Mechanical Gaming Keyboard RGB',
            sku: 'KBD-MECH-RGB',
            category: 'Accessories',
            unitPrice: 3200.0,
            currentStock: 2, // Low stock on purpose
            minStockAlert: 8,
            location: 'Warehouse A - Shelf 2',
        },
    ];
    for (const p of productData) {
        const existing = await prisma_1.prisma.product.findUnique({ where: { sku: p.sku } });
        if (!existing) {
            const prod = await prisma_1.prisma.product.create({ data: p });
            await prisma_1.prisma.stockLog.create({
                data: {
                    productId: prod.id,
                    qtyChanged: prod.currentStock,
                    movementType: 'IN',
                    reason: 'Initial Inventory Stock Import',
                    createdById: adminUser.id,
                },
            });
        }
    }
    console.log('✅ Created initial Products & Stock Movement Logs');
    console.log('🎉 Database seeding completed successfully!');
}
main()
    .catch((e) => {
    console.error('Error seeding DB:', e);
    process.exit(1);
})
    .finally(async () => {
    await prisma_1.prisma.$disconnect();
});
