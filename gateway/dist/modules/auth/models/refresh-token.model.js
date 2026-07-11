"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RefreshTokenModel = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const crypto_1 = __importDefault(require("crypto"));
const RefreshTokenSchema = new mongoose_1.Schema({
    tokenHash: { type: String, required: true },
    userId: { type: mongoose_1.Schema.Types.ObjectId, required: true, ref: 'User' },
    sessionId: { type: String, required: true },
    expiresAt: { type: Date, required: true },
    revoked: { type: Boolean, default: false },
    userAgent: { type: String },
    ipAddress: { type: String },
}, {
    timestamps: true
});
// TTL Index to automatically clean up expired tokens
RefreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
RefreshTokenSchema.index({ userId: 1 });
RefreshTokenSchema.index({ sessionId: 1 });
RefreshTokenSchema.pre('save', function () {
    if (!this.isModified('tokenHash'))
        return;
    const hash = crypto_1.default.createHash('sha256').update(this.tokenHash).digest('hex');
    this.tokenHash = hash;
});
RefreshTokenSchema.methods.compareToken = async function (candidateToken) {
    const hash = crypto_1.default.createHash('sha256').update(candidateToken).digest('hex');
    return this.tokenHash === hash;
};
exports.RefreshTokenModel = mongoose_1.default.model('RefreshToken', RefreshTokenSchema);
//# sourceMappingURL=refresh-token.model.js.map