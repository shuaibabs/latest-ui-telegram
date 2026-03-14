"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerPartnersFeature = registerPartnersFeature;
const partnersMenu_1 = require("./commands/partnersMenu");
const listPartnersFlow_1 = require("./flows/listPartnersFlow");
const searchPartnersFlow_1 = require("./flows/searchPartnersFlow");
const detailPartnersFlow_1 = require("./flows/detailPartnersFlow");
function registerPartnersFeature(router) {
    (0, partnersMenu_1.registerPartnersMenu)(router);
    (0, listPartnersFlow_1.registerListPartnersFlow)(router);
    (0, searchPartnersFlow_1.registerSearchPartnersFlow)(router);
    (0, detailPartnersFlow_1.registerDetailPartnersFlow)(router);
}
