"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerUserFlows = registerUserFlows;
const createUserFlow_1 = require("./createUserFlow");
const deleteUserFlow_1 = require("./deleteUserFlow");
const editUserFlow_1 = require("./editUserFlow");
function registerUserFlows(router) {
    (0, createUserFlow_1.registerCreateUserFlow)(router);
    (0, deleteUserFlow_1.registerDeleteUserFlow)(router);
    (0, editUserFlow_1.registerEditUserFlow)(router);
}
