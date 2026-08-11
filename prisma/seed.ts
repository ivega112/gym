/* eslint-disable */
// @ts-nocheck
const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const bcrypt = require('bcrypt');
require('dotenv').config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Starting DB seed...");

  // 1. Create Default Settings
  const settings = await prisma.gymSettings.upsert({
    where: { id: "singleton" },
    update: { whatsappNumber: "+962795406137" },
    create: {
      gymName: "نادي الأبطال الرياضي",
      whatsappNumber: "+962795406137",
      expirationThreshold: 7,
      archiveThreshold: 17,
      requireBackup: true,
    },
  });
  console.log("Upserted GymSettings");

  // 2. Create Default Admin User
  const hashedPassword = await bcrypt.hash("admin123", 10);
  const admin = await prisma.user.upsert({
    where: { username: "admin" },
    update: {},
    create: {
      username: "admin",
      passwordHash: hashedPassword,
      fullName: "المدير العام",
      status: "ACTIVE",
    },
  });
  console.log("Upserted default Admin user (admin / admin123)");

  // 3. Create Sample Members
  
  // Date Helpers
  const now = new Date();
  const dateStr = (date) => date.toISOString();
  
  const addDays = (d, days) => {
    const newDate = new Date(d);
    newDate.setDate(newDate.getDate() + days);
    return newDate;
  };

  const addMonths = (d, months) => {
    const newDate = new Date(d);
    newDate.setMonth(newDate.getMonth() + months);
    return newDate;
  };

  // Helper to create member with a subscription
  const createMember = async (memberData, subscriptionData) => {
    return await prisma.member.create({
      data: {
        ...memberData,
        subscriptions: {
          create: subscriptionData
        }
      }
    });
  };

  // Clean existing members if needed (optional)
  await prisma.member.deleteMany({});
  
  // 3.1 ACTIVE Member (Starts today, ends in 1 month)
  const activeMember = await prisma.member.findUnique({ where: { phone: "0551111111" }});
  if (!activeMember) {
    await createMember({
      membershipId: "1001",
      fullName: "أحمد عبدالله",
      phone: "0551111111",
      status: "ACTIVE",
      notes: "عضو جديد نشط",
    }, {
      startDate: now,
      endDate: addMonths(now, 1),
      durationMonths: 1,
      price: 300,
      status: "ACTIVE"
    });
    console.log("Created Active Member");
  }

  // 3.2 EXPIRING_SOON Member (Ends in 3 days)
  const expiringMember = await prisma.member.findUnique({ where: { phone: "0552222222" }});
  if (!expiringMember) {
    const startDateExpiring = addMonths(now, -1);
    startDateExpiring.setDate(startDateExpiring.getDate() + 3); // 1 month - 3 days ago = ends in 3 days
    
    await createMember({
      membershipId: "1002",
      fullName: "محمد خالد",
      phone: "0552222222",
      status: "EXPIRING_SOON", // Member status
    }, {
      startDate: startDateExpiring,
      endDate: addDays(now, 3),
      durationMonths: 1,
      price: 300,
      status: "ACTIVE" // Subscription status
    });
    console.log("Created Expiring Soon Member");
  }

  // 3.3 EXPIRED Member (Ended 5 days ago)
  const expiredMember = await prisma.member.findUnique({ where: { phone: "0553333333" }});
  if (!expiredMember) {
    const startDateExpired = addMonths(now, -3);
    const endDateExpired = addDays(now, -5);
    
    await createMember({
      membershipId: "1003",
      fullName: "سالم فهد",
      phone: "0553333333",
      status: "ACTIVE", // Member status could still be ACTIVE until cron archives them
    }, {
      startDate: startDateExpired,
      endDate: endDateExpired,
      durationMonths: 3,
      price: 800,
      status: "EXPIRED"
    });
    console.log("Created Expired Member");
  }

  // 3.4 FROZEN Member
  const frozenMember = await prisma.member.findUnique({ where: { phone: "0554444444" }});
  if (!frozenMember) {
    const frozenStartDate = addMonths(now, -1); // started 1 month ago
    const frozenEndDate = addMonths(now, 2);    // supposed to end in 2 months (3mo sub)
    
    const member = await createMember({
      membershipId: "1004",
      fullName: "خالد سعد",
      phone: "0554444444",
      status: "FROZEN",
    }, {
      startDate: frozenStartDate,
      endDate: frozenEndDate,
      durationMonths: 3,
      price: 800,
      status: "FROZEN"
    });

    // Create the freeze record
    const sub = await prisma.subscription.findFirst({ where: { memberId: member.id } });
    await prisma.subscriptionFreeze.create({
      data: {
        subscriptionId: sub.id,
        startDate: addDays(now, -10), // frozen 10 days ago
        reason: "Travel",
      }
    });
    console.log("Created Frozen Member");
  }

  console.log("Seed completed successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
