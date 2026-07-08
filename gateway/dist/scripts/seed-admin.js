"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Seed script to create an admin user for the TrustShield dashboard.
 * Run: npx ts-node src/scripts/seed-admin.ts
 */
const dotenv_1 = __importDefault(require("dotenv"));
const mongoose_1 = __importDefault(require("mongoose"));
dotenv_1.default.config();
const user_role_enum_1 = require("../core/enums/user-role.enum");
const user_model_1 = require("../modules/users/models/user.model");
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@trustshield.io";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "Admin@Trust123";
async function seedAdmin() {
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
        console.error("MONGO_URI is required");
        process.exit(1);
    }
    await mongoose_1.default.connect(mongoUri, {
        dbName: process.env.DATABASE_NAME || "trust_db",
    });
    const existing = await user_model_1.UserModel.findOne({ email: ADMIN_EMAIL });
    if (existing) {
        existing.role = user_role_enum_1.UserRole.ADMIN;
        existing.status = "ACTIVE";
        if (process.env.FORCE_ADMIN_PASSWORD === "true") {
            existing.password = ADMIN_PASSWORD;
        }
        await existing.save();
        console.log(`Updated existing user to ADMIN: ${ADMIN_EMAIL}`);
    }
    else {
        await user_model_1.UserModel.create({
            email: ADMIN_EMAIL,
            password: ADMIN_PASSWORD,
            role: user_role_enum_1.UserRole.ADMIN,
            status: "ACTIVE",
        });
        console.log(`Created admin user: ${ADMIN_EMAIL}`);
    }
    await mongoose_1.default.disconnect();
    process.exit(0);
}
seedAdmin().catch((err) => {
    console.error(err);
    process.exit(1);
});
//# sourceMappingURL=seed-admin.js.map