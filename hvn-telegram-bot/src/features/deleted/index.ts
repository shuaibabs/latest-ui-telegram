import { CommandRouter } from '../../core/router/commandRouter';
import { registerDeletedFeature as registerMain } from './commands/deletedMenu';
import { registerRestoreDeletedFlow } from './flows/restoreDeletedFlow';

export function registerDeletedFeature(router: CommandRouter) {
    registerMain(router);
    registerRestoreDeletedFlow(router);
}
