import * as Flex from '@twilio/flex-ui';

import { FlexEvent } from '../../../../types/feature-loader';
import ActivityManager from '../../helper/ActivityManager';
import { isAutoWrapupEnabled, getWrapupTimeoutMs } from '../../config';
import { setTimer } from '../../helper/WrapupTimerStore';
import logger from '../../../../utils/logger';

export const eventName = FlexEvent.taskWrapup;
export const eventHook = async (_flex: typeof Flex, _manager: Flex.Manager, task: Flex.ITask) => {
  logger.debug(`[activity-reservation-handler] handle ${eventName} for ${task.sid}`);

  await ActivityManager.enforceEvaluatedState();

  if (!isAutoWrapupEnabled()) return;

  const elapsed = Date.now() - task.dateUpdated.getTime();
  const delay = Math.max(0, getWrapupTimeoutMs() - elapsed);

  const handle = setTimeout(() => {
    if (Flex.TaskHelper.isInWrapupMode(task)) {
      Flex.Actions.invokeAction('CompleteTask', { sid: task.sid });
    }
  }, delay);

  setTimer(task.sid, handle);
};
