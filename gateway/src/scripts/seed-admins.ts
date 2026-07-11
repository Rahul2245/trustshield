import dotenv from "dotenv";
import mongoose from "mongoose";

dotenv.config();

import { UserRole } from "../core/enums/user-role.enum";
import { UserModel } from "../modules/users/models/user.model";

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "Admin@Trust123";

async function resetAdmins() {
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
        console.error("MONGO_URI is required");
        process.exit(1);
    }

    await mongoose.connect(mongoUri, {
        dbName: process.env.DATABASE_NAME || "trust_db",
    });

    console.log("Removing existing admins...");
    const result = await UserModel.deleteMany({ role: UserRole.ADMIN });
    console.log(`Removed ${result.deletedCount} existing admins.`);

    const newAdmins = Array.from({ length: 10 }, (_, i) => ({
        email: `admin${i + 1}@trustshield.io`,
        password: ADMIN_PASSWORD,
        role: UserRole.ADMIN,
        status: "ACTIVE" as const
    }));

    console.log("Creating 10 fixed admins...");
    
    // We create them one by one to trigger the pre-save hook for password hashing
    for (const adminData of newAdmins) {
        await UserModel.create(adminData);
        console.log(`Created admin: ${adminData.email}`);
    }

    console.log("Database reset complete!");

    await mongoose.disconnect();
    process.exit(0);
}

resetAdmins().catch((err) => {
    console.error(err);
    process.exit(1);
});
