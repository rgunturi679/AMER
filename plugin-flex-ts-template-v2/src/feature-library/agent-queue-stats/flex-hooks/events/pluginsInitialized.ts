import * as Flex from '@twilio/flex-ui';

import { FlexEvent } from '../../../../types/feature-loader';
import StatsHelper from '../../utils/StatsHelper';

export const eventName = FlexEvent.pluginsInitialized;
export const eventHook = function initAgentQueueStats(_flex: typeof Flex, manager: Flex.Manager) {
  console.log('[AQS:1] pluginsInitialized fired — creating StatsHelper');
  new StatsHelper(manager);
  console.log('[AQS:1] StatsHelper created');
};
