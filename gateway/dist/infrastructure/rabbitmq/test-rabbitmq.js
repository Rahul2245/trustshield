"use strict";
// test-rabbitmq.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const amqplib_1 = __importDefault(require("amqplib"));
const rabbitmq_config_1 = require("../../config/rabbitmq.config");
async function test() {
    try {
        const connection = await amqplib_1.default.connect(rabbitmq_config_1.rabbitmqConfig.url);
        console.log("RabbitMQ Connected");
        await connection.close();
        console.log("Connection Closed");
    }
    catch (err) {
        console.error("Failed", err);
    }
}
test();
//# sourceMappingURL=test-rabbitmq.js.map