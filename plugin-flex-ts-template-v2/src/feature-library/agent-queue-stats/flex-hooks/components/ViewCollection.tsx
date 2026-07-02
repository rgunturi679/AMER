import React from 'react';
import * as Flex from '@twilio/flex-ui';

import { FlexComponent } from '../../../../types/feature-loader';
import AgentQueueStatsView from '../../custom-components/AgentQueueStatsView/AgentQueueStatsView';

export const componentName = FlexComponent.ViewCollection;
export const componentHook = function addAgentQueueStatsView(flex: typeof Flex) {
  flex.ViewCollection.Content.add(
    <flex.View name="agent-queue-stats" key="agent-queue-stats-view">
      <AgentQueueStatsView key="agent-queue-stats-view-content" />
    </flex.View>,
  );
};
