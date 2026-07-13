import mongoose from "mongoose";
import { rabbitMQClient } from "./src/infrastructure/rabbitmq/connection";
import { v4 as uuidv4 } from "uuid";

async function run() {
    await mongoose.connect("mongodb+srv://Rahul_2245:GameGame2245@trustshield.7fq4rna.mongodb.net/trustshield?retryWrites=true&w=majority&appName=trustshield");
    await rabbitMQClient.connect();
    
    console.log("Publishing test event...");
    await rabbitMQClient.publishThreatEvent({
        eventId: uuidv4(),
        eventType: "content_creation",
        correlationId: uuidv4(),
        timestamp: new Date().toISOString(),
        userId: "test-user-id",
        email: "test@example.com",
        ipAddress: "127.0.0.1",
        userAgent: "curl",
        requestId: uuidv4(),
        metadata: {
            burstVelocity: 0.0,
            targetRecipientRatio: 0.0,
            uriHyperlinkDensity: 0.0,
            sessionDwellDuration: 10.0,
            payloadText: "DROP TABLE users; -- This is a malicious SQL injection attack test! Please trigger the IF and NLP models immediately."
        }
    } as any);
    
    console.log("Event published! Waiting 5 seconds for processing...");
    setTimeout(() => {
        process.exit(0);
    }, 5000);
}
run();
