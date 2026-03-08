"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerUsersFeature = registerUsersFeature;
const commands_1 = require("./commands");
const flows_1 = require("./flows");
function registerUsersFeature(router) {
    (0, commands_1.registerUserCommands)(router);
    (0, flows_1.registerUserFlows)(router);
}
