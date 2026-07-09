import * as Flex from '@twilio/flex-ui';

import { FlexEvent } from '../../../../types/feature-loader';
import { StatsHelper } from '../../utils/StatsHelper';

export const eventName = FlexEvent.pluginsInitialized;
export const eventHook = function initAgentQueueStatsHelper(_flex: typeof Flex, manager: Flex.Manager) {
  const ic = manager.insightsClient as any;
  console.log('[agent-queue-stats] pluginsInitialized: insightsClient available?', !!ic);
  console.log('[agent-queue-stats] pluginsInitialized: insightsClient connectionState=', ic?.connectionState);
  console.log('[agent-queue-stats] pluginsInitialized: insightsClient token present?', !!ic?.token);
  if (!manager.insightsClient) {
    console.error('[agent-queue-stats] pluginsInitialized: insightsClient is not available, cannot start StatsHelper');
    return;
  }
  new StatsHelper(manager);
};
