import * as Flex from '@twilio/flex-ui';

import { FlexEvent } from '../../../../types/feature-loader';
import { Manager } from '@twilio/flex-ui';
import { createSmsTranscriptFromTask } from '../../helpers/SmsTranscriptHelper';
import logger from '../../../../utils/logger';

export const eventName = FlexEvent.taskCompleted;
export const eventHook = async function handleSmsTranscriptCreation(
  _flex: typeof Flex,
  manager: Manager,
  task: Flex.ITask,
): Promise<void> {
  const { channelType, conversationSid, ticketId } = task.attributes;

  // Only process SMS tasks
  if (channelType !== 'sms' || !conversationSid) {
    return;
  }

  // Must have a ticket ID to create transcript
  if (!ticketId || ticketId === '') {
    logger.debug(`[agent-automation] SMS task ${task.taskSid} has no ticketId, skipping transcript creation`);
    return;
  }

  const accountSid = manager.serviceConfiguration.account_sid;

  // Create transcript asynchronously (fire and forget)
  await createSmsTranscriptFromTask(task, accountSid);
};
