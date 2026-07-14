import * as Flex from '@twilio/flex-ui';

import { FlexEvent } from '../../../../types/feature-loader';
import { StatsHelper } from '../../utils/StatsHelper';

let statsHelper: StatsHelper | null = null;
let listeningForConnection = false;

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
    return;
  }

  // Token arrived but insightsClient is still connecting (common in SSO/iframe flows).
  // Wait for the connected event rather than giving up.
  if (!listeningForConnection) {
    listeningForConnection = true;
    console.log('[agent-queue-stats] tokenUpdated: registering connectionStateChanged listener');
    const onStateChanged = (state: string) => {
      console.log('[agent-queue-stats] connectionStateChanged:', state);
      if (state === 'connected' && !statsHelper) {
        ic.removeListener('connectionStateChanged', onStateChanged);
        console.log('[agent-queue-stats] connectionStateChanged: connected, starting StatsHelper');
        statsHelper = new StatsHelper(manager);
      }
    };
    ic.on('connectionStateChanged', onStateChanged);
  } else {
    console.log('[agent-queue-stats] tokenUpdated: already listening for connectionStateChanged, skipping');
  }
};
