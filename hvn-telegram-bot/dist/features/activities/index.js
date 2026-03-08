"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerActivitiesFeature = registerActivitiesFeature;
const commands_1 = require("./commands");
const flows_1 = require("./flows");
function registerActivitiesFeature(router) {
    (0, commands_1.registerActivityCommands)(router);
    (0, flows_1.registerActivityFlows)(router);
}
