import { CommandRouter } from '../../core/router/commandRouter';
import { registerSalesMenu } from './commands/salesMenu';
import { registerListSalesFlow } from './flows/listSalesFlow';
import { registerSearchSalesFlow } from './flows/searchSalesFlow';
import { registerDetailSalesFlow } from './flows/detailSalesFlow';
import { registerCancelSaleFlow } from './flows/cancelSaleFlow';

export function registerSalesFeature(router: CommandRouter) {
    registerSalesMenu(router);
    registerListSalesFlow(router);
    registerSearchSalesFlow(router);
    registerDetailSalesFlow(router);
    registerCancelSaleFlow(router);
}
