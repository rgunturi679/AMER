import * as Flex from '@twilio/flex-ui';

import { FlexActionEvent, FlexAction } from '../../../../types/feature-loader';
import { screenPop } from '../../utils/ScreenPop';
import { createAICallCentreNote } from '../../utils/AICallNote';
import { getOpenCti } from '../../utils/SfdcHelper';
import logger from '../../../../utils/logger';
import { isScreenPopEnabled, isAiCallLoggingEnabled } from '../../config';

export const actionEvent = FlexActionEvent.after;
export const actionName = FlexAction.AcceptTask;
export const actionHook = function screenPopAfterAccept(flex: typeof Flex) {
  flex.Actions.addListener(`${actionEvent}${actionName}`, async (payload) => {
    if (!getOpenCti()) {
      return;
    }

    let task;

    if (payload.task) {
      task = payload.task;
    } else if (payload.sid) {
      task = flex.TaskHelper.getTaskByTaskSid(payload.sid);
    }

    if (!task) {
      return;
    }

    if (isAiCallLoggingEnabled() && task.attributes.is_call_from_AI === 'true') {
      try {
        createAICallCentreNote(task);
      } catch (error: any) {
        logger.error('[salesforce-integration] Error creating AI call centre note', error);
      }
      return;
    }

    if (!isScreenPopEnabled()) {
      return;
    }

    try {
      screenPop(task);
    } catch (error: any) {
      logger.error('[salesforce-integration] Error calling Open CTI screenPop', error);
    }
  });
};
