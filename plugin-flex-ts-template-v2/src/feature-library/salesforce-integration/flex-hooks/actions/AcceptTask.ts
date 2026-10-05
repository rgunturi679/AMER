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
    logger.log('[salesforce-integration] afterAcceptTask fired', { sid: payload.sid, taskSid: payload.task?.taskSid });

    if (!getOpenCti()) {
      logger.warn('[salesforce-integration] afterAcceptTask: OpenCTI not available, skipping');
      return;
    }

    let task;

    if (payload.task) {
      task = payload.task;
    } else if (payload.sid) {
      task = flex.TaskHelper.getTaskByTaskSid(payload.sid);
    }

    if (!task) {
      logger.warn('[salesforce-integration] afterAcceptTask: task not found');
      return;
    }

    logger.log('[salesforce-integration] afterAcceptTask: task attributes', {
      taskSid: task.taskSid,
      is_call_from_AI: task.attributes.is_call_from_AI,
      vendor: task.attributes.vendor,
      direction: task.attributes.direction,
      isAiCallLoggingEnabled: isAiCallLoggingEnabled(),
    });

    if (isAiCallLoggingEnabled() && task.attributes.is_call_from_AI === 'true') {
      logger.log('[salesforce-integration] afterAcceptTask: AI call detected, creating Call_Center_Note__c');
      try {
        createAICallCentreNote(task);
      } catch (error: any) {
        logger.error('[salesforce-integration] Error creating AI call centre note', error);
      }
      return;
    }

    if (!isScreenPopEnabled()) {
      logger.log('[salesforce-integration] afterAcceptTask: screen pop disabled, skipping');
      return;
    }

    try {
      screenPop(task);
    } catch (error: any) {
      logger.error('[salesforce-integration] Error calling Open CTI screenPop', error);
    }
  });
};
