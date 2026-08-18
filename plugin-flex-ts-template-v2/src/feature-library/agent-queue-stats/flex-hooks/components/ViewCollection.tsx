import React from 'react';
import * as Flex from '@twilio/flex-ui';

import { FlexComponent } from '../../../../types/feature-loader';
import AgentQueueStats from '../../custom-components/AgentQueueStats';

export const componentName = FlexComponent.ViewCollection;
export const componentHook = function addAgentQueueStatsView(flex: typeof Flex) {
  flex.ViewCollection.Content.add(
    <flex.View name="agent-queue-stats" key="agent-queue-stats-view">
      <AgentQueueStats key="agent-queue-stats-view-content" />
    </flex.View>,
  );
};
