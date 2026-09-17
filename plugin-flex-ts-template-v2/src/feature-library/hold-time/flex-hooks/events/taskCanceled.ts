import * as Flex from '@twilio/flex-ui';

import { FlexEvent } from '../../../../types/feature-loader';
import { taskRemoved } from '../states/holdTimeSlice';

export const eventName = FlexEvent.taskCanceled;
export const eventHook = function cleanupHoldTimeOnCancel(
  _flex: typeof Flex,
  manager: Flex.Manager,
  task: Flex.ITask,
) {
  manager.store.dispatch(taskRemoved(task.sid));
};
