import nodemailer from 'nodemailer';
import { logger } from '../logger/logger';

class EmailService {
    private transporter: nodemailer.Transporter | null = null;
    private initialized = false;

    async connect(): Promise<void> {
        try {
            const host = process.env.SMTP_HOST;
            const port = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT) : 587;
            const user = process.env.SMTP_USER;
            const pass = process.env.SMTP_PASS;

            if (host && user && pass) {
                this.transporter = nodemailer.createTransport({
                    host,
                    port,
                    secure: port === 465, // true for 465, false for other ports
                    auth: { user, pass }
                });
                logger.info({ host }, 'SMTP connection initialized with provided credentials');
            } else {
                logger.warn('No SMTP credentials found. Creating Ethereal test account...');
                const testAccount = await nodemailer.createTestAccount();
                this.transporter = nodemailer.createTransport({
                    host: "smtp.ethereal.email",
                    port: 587,
                    secure: false, // true for 465, false for other ports
                    auth: {
                        user: testAccount.user, // generated ethereal user
                        pass: testAccount.pass, // generated ethereal password
                    },
                });
                logger.info('Ethereal test account created successfully.');
            }

            this.initialized = true;
        } catch (error) {
            logger.error(error, 'Failed to initialize EmailService');
        }
    }

    async sendOtpEmail(to: string, otpCode: string): Promise<void> {
        if (!this.initialized) {
            await this.connect();
        }

        if (!this.transporter) {
            logger.warn(`Email transporter is not configured. For testing, your OTP is: ${otpCode}`);
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

            const previewUrl = nodemailer.getTestMessageUrl(info);
            if (previewUrl) {
                logger.info({ emailId: info.messageId, previewUrl }, 'OTP Email sent successfully. Ethereal Preview URL: ' + previewUrl);
            } else {
                logger.info({ emailId: info.messageId }, 'OTP Email sent successfully');
            }
        } catch (error) {
            logger.error(error, 'Failed to send OTP email');
            throw error;
        }
    }
}

export const emailService = new EmailService();
