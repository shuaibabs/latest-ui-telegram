import { CommandRouter } from '../../core/router/commandRouter';
import { registerDealerFeature as registerMain } from './commands/dealerMenu';
import { registerAddDealerFlow } from './flows/addDealerFlow';
import { registerDeleteDealerFlow } from './flows/deleteDealerFlow';
import { registerDetailsDealerFlow } from './flows/detailsDealerFlow';

export function registerDealerFeature(router: CommandRouter) {
    registerMain(router);
    registerAddDealerFlow(router);
    registerDeleteDealerFlow(router);
    registerDetailsDealerFlow(router);
}
