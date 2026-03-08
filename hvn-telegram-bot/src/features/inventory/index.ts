import { CommandRouter } from '../../core/router/commandRouter';
import { registerInventoryMenu } from './commands/inventoryMenu';
import { registerAddNumberFlow } from './flows/addNumberFlow';

export function registerInventoryFeature(router: CommandRouter) {
    registerInventoryMenu(router);
    registerAddNumberFlow(router);
}
