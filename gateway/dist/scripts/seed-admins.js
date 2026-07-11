"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const env_1 = require("../config/env");
const user_model_1 = require("../modules/users/models/user.model");
const user_role_enum_1 = require("../core/enums/user-role.enum");
const logger_1 = require("../infrastructure/logger/logger");
const ADMINS = [
    { email: 'super_admin@trustshield.io', role: user_role_enum_1.UserRole.SUPER_ADMIN },
    { email: 'admin1@trustshield.io', role: user_role_enum_1.UserRole.ADMIN },
    { email: 'admin2@trustshield.io', role: user_role_enum_1.UserRole.ADMIN },
    { email: 'admin3@trustshield.io', role: user_role_enum_1.UserRole.ADMIN },
    { email: 'analyst1@trustshield.io', role: user_role_enum_1.UserRole.ANALYST },
    { email: 'analyst2@trustshield.io', role: user_role_enum_1.UserRole.ANALYST },
    { email: 'sec_admin@trustshield.io', role: user_role_enum_1.UserRole.SECURITY_ADMIN },
    { email: 'mod1@trustshield.io', role: user_role_enum_1.UserRole.MODERATOR },
    { email: 'mod2@trustshield.io', role: user_role_enum_1.UserRole.MODERATOR },
    { email: 'org_mgr@trustshield.io', role: user_role_enum_1.UserRole.ORG_MANAGER },
];
async function seedAdmins() {
    try {
        await mongoose_1.default.connect(env_1.env.MONGO_URI);
        logger_1.logger.info('Connected to MongoDB. Seeding fixed admins...');
        let createdCount = 0;
        for (const admin of ADMINS) {
            const exists = await user_model_1.UserModel.findOne({ email: admin.email });
            if (!exists) {
                await user_model_1.UserModel.create({
                    email: admin.email,
                    password: 'AdminPassword123!', // Standard initial password, should be forced to change in real prod
                    role: admin.role,
                    status: 'ACTIVE'
                });
                createdCount++;
                logger_1.logger.info(`Seeded admin: ${admin.email}`);
            }
        }
        logger_1.logger.info(`Seeding complete. Created ${createdCount} admins.`);
        process.exit(0);
    }
    catch (error) {
        logger_1.logger.error(error, 'Failed to seed admins');
        process.exit(1);
    }
}
seedAdmins();
//# sourceMappingURL=seed-admins.js.map