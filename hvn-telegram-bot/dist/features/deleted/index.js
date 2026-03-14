"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerDeletedFeature = registerDeletedFeature;
const deletedMenu_1 = require("./commands/deletedMenu");
const restoreDeletedFlow_1 = require("./flows/restoreDeletedFlow");
function registerDeletedFeature(router) {
    (0, deletedMenu_1.registerDeletedFeature)(router);
    (0, restoreDeletedFlow_1.registerRestoreDeletedFlow)(router);
}
