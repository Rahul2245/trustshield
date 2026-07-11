"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const mongoose_1 = __importDefault(require("mongoose"));
dotenv_1.default.config();
const user_role_enum_1 = require("../core/enums/user-role.enum");
const user_model_1 = require("../modules/users/models/user.model");
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "Admin@Trust123";
async function resetAdmins() {
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
        console.error("MONGO_URI is required");
        process.exit(1);
    }
    await mongoose_1.default.connect(mongoUri, {
        dbName: process.env.DATABASE_NAME || "trust_db",
    });
    console.log("Removing existing admins...");
    const result = await user_model_1.UserModel.deleteMany({ role: user_role_enum_1.UserRole.ADMIN });
    console.log(`Removed ${result.deletedCount} existing admins.`);
    const newAdmins = Array.from({ length: 10 }, (_, i) => ({
        email: `admin${i + 1}@trustshield.io`,
        password: ADMIN_PASSWORD,
        role: user_role_enum_1.UserRole.ADMIN,
        status: "ACTIVE"
    }));
    console.log("Creating 10 fixed admins...");
    // We create them one by one to trigger the pre-save hook for password hashing
    for (const adminData of newAdmins) {
        await user_model_1.UserModel.create(adminData);
        console.log(`Created admin: ${adminData.email}`);
    }
    console.log("Database reset complete!");
    await mongoose_1.default.disconnect();
    process.exit(0);
}
resetAdmins().catch((err) => {
    console.error(err);
    process.exit(1);
});
//# sourceMappingURL=seed-admins.js.map