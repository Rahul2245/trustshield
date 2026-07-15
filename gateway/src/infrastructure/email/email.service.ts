import nodemailer from 'nodemailer';
import { logger } from '../logger/logger';

class EmailService {
    private transporter: nodemailer.Transporter | null = null;
    private initialized = false;

    async connect(): Promise<void> {
        try {
            // Check if user provided real SMTP credentials
            const host = process.env.SMTP_HOST;
            const port = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT) : 587;
            const user = process.env.SMTP_USER;
            const pass = process.env.SMTP_PASS;

            if (host && user && pass) {
                this.transporter = nodemailer.createTransport({
                    host,
                    port,
                    secure: port === 465,
                    auth: { user, pass }
                });
                logger.info({ host }, 'SMTP connection initialized with provided credentials');
            } else {
                // Generate ethereal account for testing automatically if no credentials
                logger.info('No SMTP credentials found in .env. Generating Ethereal test account...');
                const testAccount = await nodemailer.createTestAccount();
                this.transporter = nodemailer.createTransport({
                    host: "smtp.ethereal.email",
                    port: 587,
                    secure: false,
                    auth: {
                        user: testAccount.user,
                        pass: testAccount.pass,
                    },
                });
                logger.info({ user: testAccount.user }, 'Ethereal SMTP test connection initialized');
            }

            this.initialized = true;
        } catch (error) {
            logger.error(error, 'Failed to initialize EmailService');
        }
    }

    async sendOtpEmail(to: string, otpCode: string): Promise<void> {
        if (!this.initialized || !this.transporter) {
            await this.connect();
        }

        if (!this.transporter) {
            logger.error("Email transporter is not available.");
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

            logger.info({ emailId: info.messageId }, 'OTP Email sent successfully');
            
            // If using Ethereal, print the preview URL to the console so the user can click it
            if (info.messageId && !process.env.SMTP_HOST) {
                const previewUrl = nodemailer.getTestMessageUrl(info);
                logger.info({ previewUrl }, 'Ethereal Test Email Preview URL (CLICK HERE TO VIEW EMAIL)');
                // Print purely so it's super visible in Docker logs
                console.log(`\n\n======================================================\n📧 VIEW TEST EMAIL HERE: ${previewUrl}\n======================================================\n\n`);
            }
        } catch (error) {
            logger.error(error, 'Failed to send OTP email');
            throw error;
        }
    }
}

export const emailService = new EmailService();
