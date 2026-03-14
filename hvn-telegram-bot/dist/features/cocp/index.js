"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerCOCPFeature = registerCOCPFeature;
const cocpMenu_1 = require("./commands/cocpMenu");
const listCOCPFlow_1 = require("./flows/listCOCPFlow");
const searchCOCPFlow_1 = require("./flows/searchCOCPFlow");
const detailCOCPFlow_1 = require("./flows/detailCOCPFlow");
const editCOCPFlow_1 = require("./flows/editCOCPFlow");
function registerCOCPFeature(router) {
    (0, cocpMenu_1.registerCOCPMenu)(router);
    (0, listCOCPFlow_1.registerListCOCPFlow)(router);
    (0, searchCOCPFlow_1.registerSearchCOCPFlow)(router);
    (0, detailCOCPFlow_1.registerDetailCOCPFlow)(router);
    (0, editCOCPFlow_1.registerEditCOCPFlow)(router);
}
