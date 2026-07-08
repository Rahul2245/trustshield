// test-rabbitmq.ts

import amqp from "amqplib";
import { rabbitmqConfig } from '../../config/rabbitmq.config';

async function test() {
    try {
        const connection = await amqp.connect(rabbitmqConfig.url);

        console.log("RabbitMQ Connected");

        await connection.close();

        console.log("Connection Closed");
    } catch (err) {
        console.error("Failed", err);
    }
}

test();