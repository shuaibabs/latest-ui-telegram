"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerDealerFeature = registerDealerFeature;
const dealerMenu_1 = require("./commands/dealerMenu");
const addDealerFlow_1 = require("./flows/addDealerFlow");
const deleteDealerFlow_1 = require("./flows/deleteDealerFlow");
function registerDealerFeature(router) {
    (0, dealerMenu_1.registerDealerFeature)(router);
    (0, addDealerFlow_1.registerAddDealerFlow)(router);
    (0, deleteDealerFlow_1.registerDeleteDealerFlow)(router);
}
