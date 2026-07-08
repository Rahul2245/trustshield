/**
 * Seed script to create an admin user for the TrustShield dashboard.
 * Run: npx ts-node src/scripts/seed-admin.ts
 */
import dotenv from "dotenv";
import mongoose from "mongoose";

dotenv.config();

import { UserRole } from "../core/enums/user-role.enum";
import { UserModel } from "../modules/users/models/user.model";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@trustshield.io";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "Admin@Trust123";

async function seedAdmin() {
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
        console.error("MONGO_URI is required");
        process.exit(1);
    }

    await mongoose.connect(mongoUri, {
        dbName: process.env.DATABASE_NAME || "trust_db",
    });

    const existing = await UserModel.findOne({ email: ADMIN_EMAIL });
    if (existing) {
        existing.role = UserRole.ADMIN;
        existing.status = "ACTIVE";
        if (process.env.FORCE_ADMIN_PASSWORD === "true") {
            existing.password = ADMIN_PASSWORD;
        }
        await existing.save();
        console.log(`Updated existing user to ADMIN: ${ADMIN_EMAIL}`);
    } else {
        await UserModel.create({
            email: ADMIN_EMAIL,
            password: ADMIN_PASSWORD,
            role: UserRole.ADMIN,
            status: "ACTIVE",
        });
        console.log(`Created admin user: ${ADMIN_EMAIL}`);
    }

    await mongoose.disconnect();
    process.exit(0);
}

seedAdmin().catch((err) => {
    console.error(err);
    process.exit(1);
});
