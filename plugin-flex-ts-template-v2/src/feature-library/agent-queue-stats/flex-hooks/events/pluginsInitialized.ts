import * as Flex from '@twilio/flex-ui';

import { FlexEvent } from '../../../../types/feature-loader';
import { StatsHelper } from '../../utils/StatsHelper';

export const eventName = FlexEvent.pluginsInitialized;
export const eventHook = function initAgentQueueStatsHelper(_flex: typeof Flex, manager: Flex.Manager) {
  const ic = manager.insightsClient as any;
  console.log('[agent-queue-stats] pluginsInitialized: connectionState=', ic?.connectionState, 'token present?', !!ic?.token);

  if (ic?.connectionState === 'connected') {
    console.log('[agent-queue-stats] pluginsInitialized: already connected, starting StatsHelper');
    new StatsHelper(manager);
    return;
  }

  console.log('[agent-queue-stats] pluginsInitialized: insightsClient not ready, registering connectionStateChanged listener');
  const onStateChanged = (state: string) => {
    console.log('[agent-queue-stats] connectionStateChanged:', state);
    if (state === 'connected') {
      ic.removeListener('connectionStateChanged', onStateChanged);
      new StatsHelper(manager);
    }
  };
  ic.on('connectionStateChanged', onStateChanged);
};
