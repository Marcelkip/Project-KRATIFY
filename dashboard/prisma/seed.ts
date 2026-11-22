import bcrypt from "bcrypt";
import { prisma } from "@/lib/prisma";

async function main() {
  const email = process.env.SEED_USER_EMAIL?.toLowerCase();
  const plainPassword = process.env.SEED_USER_PASSWORD;
  const name = process.env.SEED_USER_NAME;

  if (!email || !plainPassword || !name) {
    throw new Error(
      "Set SEED_USER_EMAIL, SEED_USER_PASSWORD and SEED_USER_NAME in your local .env file."
    );
  }

  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    console.log("User already exists:", email);
    return;
  }

  const hashedPassword = await bcrypt.hash(plainPassword, 10);

  const user = await prisma.user.create({
    data: {
      email,
      name,
      password: hashedPassword,
    },
  });

  console.log("Seeded user:", user.email);
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
