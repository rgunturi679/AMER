import * as Flex from '@twilio/flex-ui';
import React from 'react';

import ActivityDurationTimer from '../../custom-components/ActivityDurationTimer';

export const componentName = 'NoTasksCanvas';
export const componentHook = function addActivityDurationTimer(flex: typeof Flex, _manager: Flex.Manager) {
  flex.NoTasksCanvas.Content.add(<ActivityDurationTimer key="activity-duration-timer" />, {
    sortOrder: 1,
  });
};
