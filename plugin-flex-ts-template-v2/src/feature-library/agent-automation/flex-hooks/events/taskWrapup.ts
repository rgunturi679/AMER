import * as Flex from '@twilio/flex-ui';

import { FlexEvent } from '../../../../types/feature-loader';
import { getMatchingTaskConfiguration } from '../../config';
import { setAutoCompleteTimeout } from '../../utils/wrapupUtils';

export const eventName = FlexEvent.taskWrapup;
export const eventHook = async function setAutoWrapTimeout(flex: typeof Flex, manager: Flex.Manager, task: Flex.ITask) {
  if (!task) {
    return;
  }

  const config = getMatchingTaskConfiguration(task);
  if (!config || !config.auto_wrapup) {
    return;
  }

  const includedQueues = config.included_queue_sids ?? [];
  if (includedQueues.length > 0 && !includedQueues.includes(task.queueSid)) {
    return;
  }

  setAutoCompleteTimeout(manager, task, config);
};
