import * as Flex from '@twilio/flex-ui';

import ActivityDurationTimer from '../../custom-components/ActivityDurationTimer';
import { FlexComponent } from '../../../../types/feature-loader';

export const componentName = FlexComponent.MainHeader;
export const componentHook = function addActivityDurationTimerToMainHeader(flex: typeof Flex) {
  flex.MainHeader.Content.add(<ActivityDurationTimer key="activity-duration-timer-header" direction="row" />, {
    sortOrder: 0,
    align: 'end',
  });
};
