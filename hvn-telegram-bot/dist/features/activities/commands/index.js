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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerActivityCommands = registerActivityCommands;
const env_1 = require("../../../config/env");
const manageActivitiesCommand_1 = require("./manageActivitiesCommand");
const guard_1 = require("../../../core/auth/guard");
function registerActivityCommands(router) {
    const bot = router.bot;
    const activityGroupId = env_1.env.TG_GROUP_ACTIVITY;
    const adminGroupId = env_1.env.TG_GROUP_USERS;
    const allowedGroups = [];
    if (activityGroupId)
        allowedGroups.push(activityGroupId);
    if (adminGroupId)
        allowedGroups.push(adminGroupId);
    // Activity Command (Registered only can view activities)
    router.register(/\/activities/, guard_1.Guard.registeredOnlyCommand(bot, (msg) => (0, manageActivitiesCommand_1.manageActivitiesCommand)(bot, msg)), allowedGroups);
    const activityGroupsOnly = activityGroupId ? [activityGroupId] : [];
    router.register(/^(?:\/start|start)$/i, guard_1.Guard.registeredOnlyCommand(bot, (msg) => (0, manageActivitiesCommand_1.manageActivitiesCommand)(bot, msg)), activityGroupsOnly);
    // Register Callbacks
    router.registerCallback('manage_activities_start', guard_1.Guard.registeredOnlyCallback(bot, (query) => (0, manageActivitiesCommand_1.manageActivitiesCommand)(bot, query.message, query.from)), allowedGroups);
    // BUG-2 Fix Refined: Restrict deletion callbacks to Admin
    router.registerCallback('delete_act_start', guard_1.Guard.adminOnlyCallback(bot, (query) => __awaiter(this, void 0, void 0, function* () {
        const { startDeleteActivityFlow } = yield Promise.resolve().then(() => __importStar(require('../flows/deleteActivityFlow')));
        yield startDeleteActivityFlow(bot, query.message.chat.id);
    })), allowedGroups);
    router.registerCallback('clear_activities_start', guard_1.Guard.adminOnlyCallback(bot, (query) => __awaiter(this, void 0, void 0, function* () {
        yield bot.sendMessage(query.message.chat.id, "⚠️ Are you sure you want to clear ALL activity logs? This cannot be undone.", {
            reply_markup: {
                inline_keyboard: [[
                        { text: "✅ Yes, Clear All", callback_data: "clear_activities_confirm_yes" },
                        { text: "❌ No, Cancel", callback_data: "manage_activities_start" }
                    ]]
            }
        });
    })), allowedGroups);
}
