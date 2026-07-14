import * as Flex from '@twilio/flex-ui';

import { FlexEvent } from '../../../../types/feature-loader';
import { StatsHelper } from '../../utils/StatsHelper';

let statsHelper: StatsHelper | null = null;

export const eventName = FlexEvent.tokenUpdated;
export const eventHook = function onTokenUpdated(_flex: typeof Flex, manager: Flex.Manager) {
  if (statsHelper) return;
  statsHelper = new StatsHelper(manager);
};
