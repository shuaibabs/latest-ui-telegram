"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerInventoryFeature = registerInventoryFeature;
const inventoryMenu_1 = require("./commands/inventoryMenu");
const addNumberFlow_1 = require("./flows/addNumberFlow");
const updateStatusFlow_1 = require("./flows/updateStatusFlow");
const assignToUserFlow_1 = require("./flows/assignToUserFlow");
const deleteNumbersFlow_1 = require("./flows/deleteNumbersFlow");
const markAsSoldFlow_1 = require("./flows/markAsSoldFlow");
const prebookFlow_1 = require("./flows/prebookFlow");
const searchFlow_1 = require("./flows/searchFlow");
const detailNumberFlow_1 = require("./flows/detailNumberFlow");
function registerInventoryFeature(router) {
    (0, inventoryMenu_1.registerInventoryMenu)(router);
    (0, addNumberFlow_1.registerAddNumberFlow)(router);
    (0, updateStatusFlow_1.registerUpdateStatusFlow)(router);
    (0, assignToUserFlow_1.registerAssignToUserFlow)(router);
    (0, deleteNumbersFlow_1.registerDeleteNumbersFlow)(router);
    (0, markAsSoldFlow_1.registerMarkAsSoldFlow)(router);
    (0, prebookFlow_1.registerPrebookFlow)(router);
    (0, searchFlow_1.registerSearchFlow)(router);
    (0, detailNumberFlow_1.registerDetailNumberFlow)(router);
}
