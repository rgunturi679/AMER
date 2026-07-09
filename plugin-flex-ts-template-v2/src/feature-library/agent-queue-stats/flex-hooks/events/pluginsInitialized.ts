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

  if (ic?.connectionState === 'connected') {
    console.log('[agent-queue-stats] pluginsInitialized: already connected, starting StatsHelper immediately');
    new StatsHelper(manager);
    return;
  }

  console.log('[agent-queue-stats] pluginsInitialized: not connected yet, waiting for connectionStateChanged...');
  const onConnectionStateChanged = (newState: string) => {
    console.log('[agent-queue-stats] pluginsInitialized: connectionStateChanged ->', newState);
    if (newState === 'connected') {
      ic.removeListener('connectionStateChanged', onConnectionStateChanged);
      console.log('[agent-queue-stats] pluginsInitialized: now connected, starting StatsHelper');
      new StatsHelper(manager);
    } else if (newState === 'denied' || newState === 'error') {
      ic.removeListener('connectionStateChanged', onConnectionStateChanged);
      console.error('[agent-queue-stats] pluginsInitialized: insightsClient connection failed with state:', newState);
    }
  };

  ic.on('connectionStateChanged', onConnectionStateChanged);
};
