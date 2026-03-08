"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerActivityFlows = registerActivityFlows;
const viewActivitiesFlow_1 = require("./viewActivitiesFlow");
const clearActivitiesFlow_1 = require("./clearActivitiesFlow");
const deleteActivityFlow_1 = require("./deleteActivityFlow");
const guard_1 = require("../../../core/auth/guard");
function registerActivityFlows(router) {
    const bot = router.bot;
    // View Activities (Registered Only)
    router.registerCallback(/^view_recent_/, guard_1.Guard.registeredOnlyCallback(bot, (query) => (0, viewActivitiesFlow_1.handleViewActivities)(bot, query)));
    router.registerCallback('view_all_activities', guard_1.Guard.registeredOnlyCallback(bot, (query) => (0, viewActivitiesFlow_1.handleViewActivities)(bot, query)));
    // Clear Activities (Admin Only)
    router.registerCallback(/^clear_activities_/, guard_1.Guard.adminOnlyCallback(bot, (query) => (0, clearActivitiesFlow_1.handleClearActivities)(bot, query)));
    // Delete Single Activity Start (Admin Only)
    router.registerCallback('delete_act_start', guard_1.Guard.adminOnlyCallback(bot, (query) => {
        bot.answerCallbackQuery(query.id);
        (0, deleteActivityFlow_1.startDeleteActivityFlow)(bot, query.message.chat.id);
    }));
    // Register Multi-step Delete Flow
    (0, deleteActivityFlow_1.registerDeleteActivityFlow)(router);
}
