"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerUserCommands = registerUserCommands;
const env_1 = require("../../../config/env");
const addUserCommand_1 = require("./addUserCommand");
const deleteUserCommand_1 = require("./deleteUserCommand");
const editUserCommand_1 = require("./editUserCommand");
const listUsersCommand_1 = require("./listUsersCommand");
const manageUsersCommand_1 = require("./manageUsersCommand");
const guard_1 = require("../../../core/auth/guard");
const hvnManageUsersGroupId = env_1.env.TG_GROUP_USERS;
function registerUserCommands(router) {
    const bot = router.bot;
    const allowedGroups = hvnManageUsersGroupId ? [hvnManageUsersGroupId] : [];
    // Group-specific Start/Menu command
    router.register(/\/start/, guard_1.Guard.adminOnlyCommand(bot, (msg) => (0, manageUsersCommand_1.manageUsersCommand)(bot, msg)), allowedGroups);
    router.register(/\/addUser/, guard_1.Guard.adminOnlyCommand(bot, (msg) => (0, addUserCommand_1.addUserCommand)(bot, msg)), allowedGroups);
    router.register(/\/deleteUser/, guard_1.Guard.adminOnlyCommand(bot, (msg) => (0, deleteUserCommand_1.deleteUserCommand)(bot, msg)), allowedGroups);
    router.register(/\/editUser/, guard_1.Guard.adminOnlyCommand(bot, (msg) => (0, editUserCommand_1.editUserCommand)(bot, msg)), allowedGroups);
    router.register(/\/listUsers/, guard_1.Guard.adminOnlyCommand(bot, (msg) => (0, listUsersCommand_1.listUsersCommand)(bot, msg)), allowedGroups);
    router.register(/\/manageUsers/, guard_1.Guard.adminOnlyCommand(bot, (msg) => (0, manageUsersCommand_1.manageUsersCommand)(bot, msg)), allowedGroups);
    // Global Cancel Command
    router.register(/\/cancel/, (msg) => {
        // Handled individually by flow listeners
    });
    // Register Callbacks for Inline Menu
    router.registerCallback('manage_users_start', guard_1.Guard.adminOnlyCallback(bot, (query) => (0, manageUsersCommand_1.manageUsersCommand)(bot, query.message)), allowedGroups);
    router.registerCallback('manage_users_list', guard_1.Guard.adminOnlyCallback(bot, (query) => (0, listUsersCommand_1.listUsersCommand)(bot, query.message)), allowedGroups);
    router.registerCallback('manage_users_add', guard_1.Guard.adminOnlyCallback(bot, (query) => (0, addUserCommand_1.addUserCommand)(bot, query.message)), allowedGroups);
    router.registerCallback('manage_users_edit', guard_1.Guard.adminOnlyCallback(bot, (query) => (0, editUserCommand_1.editUserCommand)(bot, query.message)), allowedGroups);
    router.registerCallback('manage_users_delete', guard_1.Guard.adminOnlyCallback(bot, (query) => (0, deleteUserCommand_1.deleteUserCommand)(bot, query.message)), allowedGroups);
}
