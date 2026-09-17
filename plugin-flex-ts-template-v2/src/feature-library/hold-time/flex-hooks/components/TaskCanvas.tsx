import * as Flex from '@twilio/flex-ui';

import HoldTimeDisplay from '../../custom-components/HoldTimeDisplay';
import { FlexComponent } from '../../../../types/feature-loader';

export const componentName = FlexComponent.TaskCanvas;
export const componentHook = function addHoldTimeDisplay(flex: typeof Flex) {
  flex.TaskCanvas.Content.add(<HoldTimeDisplay key="hold-time-display" />, {
    sortOrder: -1,
    if: (props) => props.task?.taskChannelUniqueName === 'voice',
  });
};
