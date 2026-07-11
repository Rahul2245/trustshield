"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminLoginSchema = exports.LoginSchema = exports.RegistrationSchema = void 0;
const zod_1 = require("zod");
exports.RegistrationSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(8)
});
exports.LoginSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string(),
    rememberMe: zod_1.z.boolean().optional().default(false)
});
exports.AdminLoginSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string(),
    rememberMe: zod_1.z.boolean().optional().default(false)
});
//# sourceMappingURL=auth.validation.js.map