import * as Flex from '@twilio/flex-ui';

import { FlexEvent } from '../../../../types/feature-loader';
import { StatsHelper } from '../../utils/StatsHelper';

let statsHelper: StatsHelper | null = null;

export const eventName = FlexEvent.tokenUpdated;
export const eventHook = function onTokenUpdated(_flex: typeof Flex, manager: Flex.Manager, _tokenPayload: any) {
  // Guard against duplicate initialization — pluginsInitialized handles the initial start via
  // connectionStateChanged; this only fires for subsequent token refreshes.
  if (statsHelper) return;

  const ic = manager.insightsClient as any;
  if (ic?.connectionState === 'connected') {
    statsHelper = new StatsHelper(manager);
  }
};
