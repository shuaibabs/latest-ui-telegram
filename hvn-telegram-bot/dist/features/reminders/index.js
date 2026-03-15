"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initRemindersFeature = initRemindersFeature;
const remindersMenu_1 = require("./commands/remindersMenu");
const addReminderFlow_1 = require("./flows/addReminderFlow");
const listRemindersFlow_1 = require("./flows/listRemindersFlow");
function initRemindersFeature(router) {
    (0, remindersMenu_1.registerRemindersFeature)(router);
    (0, addReminderFlow_1.registerAddReminderFlow)(router);
    (0, listRemindersFlow_1.registerListRemindersFlow)(router);
}
