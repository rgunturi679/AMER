import * as Flex from '@twilio/flex-ui';

import { FlexEvent } from '../../../../types/feature-loader';
import { taskRemoved } from '../states/holdTimeSlice';

export const eventName = FlexEvent.taskCompleted;
export const eventHook = function cleanupHoldTimeOnComplete(
  _flex: typeof Flex,
  manager: Flex.Manager,
  task: Flex.ITask,
) {
  manager.store.dispatch(taskRemoved(task.sid));
};
