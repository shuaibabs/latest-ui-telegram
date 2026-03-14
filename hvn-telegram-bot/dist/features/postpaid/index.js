"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerPostpaidFeature = registerPostpaidFeature;
const postpaidMenu_1 = require("./commands/postpaidMenu");
const listPostpaidFlow_1 = require("./flows/listPostpaidFlow");
const searchPostpaidFlow_1 = require("./flows/searchPostpaidFlow");
const detailPostpaidFlow_1 = require("./flows/detailPostpaidFlow");
const editPostpaidFlow_1 = require("./flows/editPostpaidFlow");
function registerPostpaidFeature(router) {
    (0, postpaidMenu_1.registerPostpaidMenu)(router);
    (0, listPostpaidFlow_1.registerListPostpaidFlow)(router);
    (0, searchPostpaidFlow_1.registerSearchPostpaidFlow)(router);
    (0, detailPostpaidFlow_1.registerDetailPostpaidFlow)(router);
    (0, editPostpaidFlow_1.registerEditPostpaidFlow)(router);
}
