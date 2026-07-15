"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.emailService = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
const logger_1 = require("../logger/logger");
class EmailService {
    transporter = null;
    initialized = false;
    async connect() {
        try {
            // Check if user provided real SMTP credentials
            const host = process.env.SMTP_HOST;
            const port = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT) : 587;
            const user = process.env.SMTP_USER;
            const pass = process.env.SMTP_PASS;
            if (host && user && pass) {
                this.transporter = nodemailer_1.default.createTransport({
                    host,
                    port,
                    secure: port === 465,
                    auth: { user, pass }
                });
                logger_1.logger.info({ host }, 'SMTP connection initialized with provided credentials');
            }
            else if (process.env.NODE_ENV === 'production') {
                logger_1.logger.warn('No SMTP credentials found in production. Skipping Ethereal (since it hangs on deployed servers). Will just log OTP instead.');
            }
            else {
                // Generate ethereal account for testing automatically if no credentials
                logger_1.logger.info('No SMTP credentials found in local env. Generating Ethereal test account...');
                try {
                    // Render/cloud environments often block this or it hangs, so add a 5 second timeout
                    const testAccount = await Promise.race([
                        nodemailer_1.default.createTestAccount(),
                        new Promise((_, reject) => setTimeout(() => reject(new Error("Ethereal timeout")), 5000))
                    ]);
                    this.transporter = nodemailer_1.default.createTransport({
                        host: "smtp.ethereal.email",
                        port: 587,
                        secure: false,
                        auth: {
                            user: testAccount.user,
                            pass: testAccount.pass,
                        },
                    });
                    logger_1.logger.info({ user: testAccount.user }, 'Ethereal SMTP test connection initialized');
                }
                catch (err) {
                    logger_1.logger.warn('Failed to generate Ethereal account (likely blocked by cloud provider). OTP will be logged directly.');
                    this.transporter = null;
                }
            }
            this.initialized = true;
        }
        catch (error) {
            logger_1.logger.error(error, 'Failed to initialize EmailService');
        }
    }
    async sendOtpEmail(to, otpCode) {
        if (!this.initialized || !this.transporter) {
            await this.connect();
        }
        if (!this.transporter) {
            logger_1.logger.warn({ otp: otpCode }, "Email transporter is not available (likely missing SMTP in production). OTP is logged above.");
            return;
        }
        const htmlTemplate = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 10px; background-color: #ffffff;">
                <div style="text-align: center; margin-bottom: 20px;">
                    <h2 style="color: #0f172a; margin: 0;">TrustShield Security</h2>
                </div>
                
                <div style="background-color: #f8fafc; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
                    <h3 style="color: #334155; margin-top: 0;">Dormant Account Interception</h3>
                    <p style="color: #475569; line-height: 1.6;">
                        We noticed you haven't logged in for a while. To ensure the safety of your account and the EchoSphere community, we require Step-Up Authentication.
                    </p>
                    <p style="color: #475569; line-height: 1.6;">
                        Please enter the following 6-digit verification code to complete your login:
                    </p>
                    
                    <div style="text-align: center; margin: 30px 0;">
                        <span style="background-color: #0f172a; color: #ffffff; padding: 15px 30px; border-radius: 6px; font-size: 24px; font-weight: bold; letter-spacing: 5px;">
                            ${otpCode}
                        </span>
                    </div>
                    
                    <p style="color: #64748b; font-size: 14px; text-align: center;">
                        This code will expire in 10 minutes. Do not share this code with anyone.
                    </p>
                </div>
                
                <div style="text-align: center; color: #94a3b8; font-size: 12px;">
                    &copy; ${new Date().getFullYear()} TrustShield Identity Engine
                </div>
            </div>
        `;
        try {
            const info = await this.transporter.sendMail({
                from: process.env.SMTP_FROM || '"TrustShield Security" <security@trustshield.io>',
                to,
                subject: "TrustShield Action Required: Step-up Verification Code",
                html: htmlTemplate,
            });
            logger_1.logger.info({ emailId: info.messageId }, 'OTP Email sent successfully');
            // If using Ethereal, print the preview URL to the console so the user can click it
            if (info.messageId && !process.env.SMTP_HOST) {
                const previewUrl = nodemailer_1.default.getTestMessageUrl(info);
                logger_1.logger.info({ previewUrl }, 'Ethereal Test Email Preview URL (CLICK HERE TO VIEW EMAIL)');
                // Print purely so it's super visible in Docker logs
                console.log(`\n\n======================================================\n📧 VIEW TEST EMAIL HERE: ${previewUrl}\n======================================================\n\n`);
            }
        }
        catch (error) {
            logger_1.logger.error(error, 'Failed to send OTP email');
            throw error;
        }
    }
}
exports.emailService = new EmailService();
//# sourceMappingURL=email.service.js.map