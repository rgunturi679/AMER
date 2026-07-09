import * as Flex from '@twilio/flex-ui';

import { FlexEvent } from '../../../../types/feature-loader';
import { StatsHelper } from '../../utils/StatsHelper';

let statsHelper: StatsHelper | null = null;

export const eventName = FlexEvent.tokenUpdated;
export const eventHook = function onTokenUpdated(_flex: typeof Flex, manager: Flex.Manager, _tokenPayload: any) {
  const ic = manager.insightsClient as any;
  console.log('[agent-queue-stats] tokenUpdated: connectionState=', ic?.connectionState, 'statsHelper exists?', !!statsHelper);

  if (statsHelper) {
    console.log('[agent-queue-stats] tokenUpdated: StatsHelper already running, skipping');
    return;
  }

  if (ic?.connectionState === 'connected') {
    console.log('[agent-queue-stats] tokenUpdated: insightsClient connected, starting StatsHelper');
    statsHelper = new StatsHelper(manager);
  } else {
    console.log('[agent-queue-stats] tokenUpdated: insightsClient still not connected (state=', ic?.connectionState, '), will retry on next tokenUpdated');
  }
};
