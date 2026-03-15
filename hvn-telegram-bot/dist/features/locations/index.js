"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerLocationsFeature = registerLocationsFeature;
const locationsMenu_1 = require("./commands/locationsMenu");
const listLocationsFlow_1 = require("./flows/listLocationsFlow");
const editLocationFlow_1 = require("./flows/editLocationFlow");
const detailsLocationFlow_1 = require("./flows/detailsLocationFlow");
function registerLocationsFeature(router) {
    (0, locationsMenu_1.registerLocationsFeature)(router);
    (0, listLocationsFlow_1.registerListLocationsFlow)(router);
    (0, editLocationFlow_1.registerEditLocationFlow)(router);
    (0, detailsLocationFlow_1.registerDetailsLocationFlow)(router);
}
