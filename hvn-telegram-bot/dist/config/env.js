"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GROUPS = exports.env = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const zod_1 = require("zod");
// logger not imported here to avoid circular dependency since logger calls dotenv.config() and might depend on env
dotenv_1.default.config();
const envSchema = zod_1.z.object({
    TELEGRAM_BOT_TOKEN: zod_1.z.string().min(1, 'TELEGRAM_BOT_TOKEN is required'),
    PORT: zod_1.z.string().default('3000'),
    NOTIFY_API_KEY: zod_1.z.string().default('hvn-default-secure-key-2024'), // Shared secret between UI and Bot
    ENABLE_SERVER: zod_1.z.string().default('true'),
    // Telegram Group IDs
    TG_GROUP_INVENTORY: zod_1.z.string().optional(),
    TG_GROUP_SALES: zod_1.z.string().optional(),
    TG_GROUP_ACTIVITY: zod_1.z.string().optional(),
    TG_GROUP_USERS: zod_1.z.string().optional(),
    TG_GROUP_PREBOOKING: zod_1.z.string().optional(),
    TG_GROUP_GLOBAL_HISTORY: zod_1.z.string().optional(),
    TG_GROUP_PARTNERS: zod_1.z.string().optional(),
    TG_GROUP_POSTPAID_NUMBERS: zod_1.z.string().optional(),
    TG_GROUP_SIM_LOCATIONS: zod_1.z.string().optional(),
    TG_GROUP_DEALER_PURCHASES: zod_1.z.string().optional(),
    TG_GROUP_WORK_REMINDERS: zod_1.z.string().optional(),
    TG_GROUP_COCP: zod_1.z.string().optional(),
    TG_GROUP_DELETED_NUMBERS: zod_1.z.string().optional(),
    TG_MASTER_CHANNEL: zod_1.z.string().optional(),
});
const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
    console.error('❌ Environment Variable validation failed:', parsed.error.format());
    process.exit(1);
}
exports.env = parsed.data;
exports.GROUPS = {
    INVENTORY: exports.env.TG_GROUP_INVENTORY || '',
    SALES: exports.env.TG_GROUP_SALES || '',
    ACTIVITY: exports.env.TG_GROUP_ACTIVITY || '',
    USERS: exports.env.TG_GROUP_USERS || '',
    PREBOOKING: exports.env.TG_GROUP_PREBOOKING || '',
    GLOBAL_HISTORY: exports.env.TG_GROUP_GLOBAL_HISTORY || '',
    PARTNERS: exports.env.TG_GROUP_PARTNERS || '',
    POSTPAID_NUMBERS: exports.env.TG_GROUP_POSTPAID_NUMBERS || '',
    SIM_LOCATIONS: exports.env.TG_GROUP_SIM_LOCATIONS || '',
    DEALER_PURCHASES: exports.env.TG_GROUP_DEALER_PURCHASES || '',
    WORK_REMINDERS: exports.env.TG_GROUP_WORK_REMINDERS || '',
    COCP: exports.env.TG_GROUP_COCP || '',
    DELETED_NUMBERS: exports.env.TG_GROUP_DELETED_NUMBERS || '',
    MASTER_CHANNEL: exports.env.TG_MASTER_CHANNEL || '',
};
