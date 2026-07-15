const nodemailer = require("nodemailer");

async function test() {
    console.log("Testing email connection...");
    
    // Testing with quotes
    const passWithQuotes = '"odrb fith abrg zsgo"';
    // Testing without quotes
    const passWithoutQuotes = 'odrb fith abrg zsgo';

    const transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 587,
        secure: false, // true for 465, false for other ports
        auth: { 
            user: 'naanigs2245@gmail.com', 
            pass: passWithoutQuotes 
        }
    });

    try {
        const info = await transporter.sendMail({
            from: '"TrustShield Security" <naanigs2245@gmail.com>',
            to: 'naanigs2245@gmail.com',
            subject: "Test Email",
            text: "This is a test email.",
        });
        console.log("Email sent successfully!", info.messageId);
    } catch (err) {
        console.error("Failed to send email:", err.message);
    }
}

test();
