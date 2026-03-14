"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerHistoryFeature = registerHistoryFeature;
const historyMenu_1 = require("./commands/historyMenu");
const detailHistoryFlow_1 = require("./flows/detailHistoryFlow");
function registerHistoryFeature(router) {
    (0, historyMenu_1.registerHistoryMenu)(router);
    (0, detailHistoryFlow_1.registerDetailHistoryFlow)(router);
}
