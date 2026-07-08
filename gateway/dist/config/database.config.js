"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.databaseConfig = void 0;
const env_1 = require("./env");
exports.databaseConfig = {
    uri: env_1.env.MONGO_URI,
    dbName: env_1.env.DATABASE_NAME,
};
//# sourceMappingURL=database.config.js.map