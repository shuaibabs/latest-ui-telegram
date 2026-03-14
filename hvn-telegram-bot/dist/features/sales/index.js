"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerSalesFeature = registerSalesFeature;
const salesMenu_1 = require("./commands/salesMenu");
const listSalesFlow_1 = require("./flows/listSalesFlow");
const searchSalesFlow_1 = require("./flows/searchSalesFlow");
const detailSalesFlow_1 = require("./flows/detailSalesFlow");
const vendorSalesFlow_1 = require("./flows/vendorSalesFlow");
const cancelSaleFlow_1 = require("./flows/cancelSaleFlow");
function registerSalesFeature(router) {
    (0, salesMenu_1.registerSalesMenu)(router);
    (0, listSalesFlow_1.registerListSalesFlow)(router);
    (0, searchSalesFlow_1.registerSearchSalesFlow)(router);
    (0, detailSalesFlow_1.registerDetailSalesFlow)(router);
    (0, vendorSalesFlow_1.registerVendorSalesFlow)(router);
    (0, cancelSaleFlow_1.registerCancelSaleFlow)(router);
}
