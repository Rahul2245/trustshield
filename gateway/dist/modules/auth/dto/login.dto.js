"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loginDto = void 0;
const zod_1 = require("zod");
exports.loginDto = zod_1.z.object({
    email: zod_1.z
        .string()
        .trim()
        .toLowerCase()
        .email("Invalid email address"),
    password: zod_1.z
        .string()
        .min(8, "Password must be at least 8 characters"),
});
//# sourceMappingURL=login.dto.js.map