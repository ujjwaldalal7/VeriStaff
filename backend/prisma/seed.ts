import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client.js";
import { hashPassword } from "../src/utils/password.js";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!
});

const prisma = new PrismaClient({ adapter });

async function main() {
  const passwordHash = await hashPassword(""); // Set a default password for the admin user

  const tenant = await prisma.tenant.upsert({
    where: { domain: "demo.veristaff.local" },
    update: {},
    create: {
      name: "VeriStaff Demo Organization",
      domain: "demo.veristaff.local",
      primaryColor: "#1E40AF",
      secondaryColor: "#3B82F6",
      footerAddress: "Demo organization"
    }
  });

  await prisma.user.upsert({
    where: { email: "admin@veristaff.local" },
    update: {
      passwordHash,
      role: "SUPER_ADMIN",
      tenantId: tenant.id
    },
    create: {
      email: "admin@veristaff.local",
      passwordHash,
      role: "SUPER_ADMIN",
      tenantId: tenant.id
    }
  });

  const employee = await prisma.employee.upsert({
    where: {
      tenantId_employeeCode: {
        tenantId: tenant.id,
        employeeCode: "VS001"
      }
    },
    update: {},
    create: {
      tenantId: tenant.id,
      employeeCode: "VS001",
      firstName: "Demo",
      lastName: "Employee",
      department: "Engineering",
      designation: "Software Engineer",
      joiningDate: new Date(),
      basicSalary: 60000,
      hra: 24000,
      allowances: 10000,
      deductions: 5000,
      status: "ACTIVE"
    }
  });

  console.log("Seed complete:", {
    tenant: tenant.domain,
    adminEmail: "admin@veristaff.local",
    adminPassword: "", // Default password for the admin user
    employeeId: employee.id
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
