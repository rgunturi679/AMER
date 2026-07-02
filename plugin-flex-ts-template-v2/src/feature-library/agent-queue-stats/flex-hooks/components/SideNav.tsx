import React from 'react';
import * as Flex from '@twilio/flex-ui';

import { FlexComponent } from '../../../../types/feature-loader';
import AgentQueueStatsSideLink from '../../custom-components/AgentQueueStatsSideLink/AgentQueueStatsSideLink';

export const componentName = FlexComponent.SideNav;
export const componentHook = function addAgentQueueStatsToSideNav(flex: typeof Flex) {
  flex.SideNav.Content.add(
    <AgentQueueStatsSideLink viewName="agent-queue-stats" key="agent-queue-stats-side-nav" />,
  );
};
