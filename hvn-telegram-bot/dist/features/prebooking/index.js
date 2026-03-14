"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerPrebookingFeature = registerPrebookingFeature;
const prebookMenu_1 = require("./commands/prebookMenu");
const listPrebookFlow_1 = require("./flows/listPrebookFlow");
const searchPrebookFlow_1 = require("./flows/searchPrebookFlow");
const detailPrebookFlow_1 = require("./flows/detailPrebookFlow");
const cancelPrebookFlow_1 = require("./flows/cancelPrebookFlow");
function registerPrebookingFeature(router) {
    (0, prebookMenu_1.registerPrebookMenu)(router);
    (0, listPrebookFlow_1.registerListPrebookFlow)(router);
    (0, searchPrebookFlow_1.registerSearchPrebookFlow)(router);
    (0, detailPrebookFlow_1.registerDetailPrebookFlow)(router);
    (0, cancelPrebookFlow_1.registerCancelPrebookFlow)(router);
}
