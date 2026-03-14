"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerLocationsFeature = registerLocationsFeature;
const locationsMenu_1 = require("./commands/locationsMenu");
const listLocationsFlow_1 = require("./flows/listLocationsFlow");
const editLocationFlow_1 = require("./flows/editLocationFlow");
function registerLocationsFeature(router) {
    (0, locationsMenu_1.registerLocationsFeature)(router);
    (0, listLocationsFlow_1.registerListLocationsFlow)(router);
    (0, editLocationFlow_1.registerEditLocationFlow)(router);
}
