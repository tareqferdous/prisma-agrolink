import { auth } from "../lib/auth";
import { prisma } from "../lib/prisma";

const seed = async () => {
  console.log("🌱 Seeding database...");

  // Admin already আছে কিনা check করো
  const existingAdmin = await prisma.user.findFirst({
    where: { role: "ADMIN" },
  });

  if (existingAdmin) {
    console.log("✅ Admin already exists:", existingAdmin.email);
    await prisma.$disconnect();
    return;
  }

  // Better Auth API দিয়ে user তৈরি করো
  await auth.api.signUpEmail({
    body: {
      name: "AgroLink Admin",
      email: "tareqferdous10@gmail.com",
      password: "admin123456",
      role: "ADMIN",
    },
  });

  // Role আর isVerified update করো
  await prisma.user.update({
    where: { email: "tareqferdous10@gmail.com" },
    data: {
      role: "ADMIN",
      isVerified: true,
      emailVerified: true,
    },
  });

  console.log("✅ Admin created successfully:");
  console.log("   Email: tareqferdous10@gmail.com");
  console.log("   Password: admin123456");
  console.log("   Role: ADMIN");

  await prisma.$disconnect();
};

seed().catch((error) => {
  console.error("❌ Seed failed:", error);
  process.exit(1);
});
