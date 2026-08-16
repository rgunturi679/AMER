import logger from '../../../utils/logger';

export interface SmsTranscriptPayload {
  conversationSid: string;
  ticketId: string;
  accountSid: string;
  conversationServiceSid?: string;
  taskSid?: string;
}

const DEFAULT_SERVICE_SID = 'IS34bce044e15d43bbaa81595fde70d60f';
const TRANSCRIPT_ENDPOINT = 'https://allotherfunctions-3930.twil.io/ticketForSMS';

/**
 * Creates an SMS transcript/ticket asynchronously when an SMS conversation ends
 * Fires and forgets - does not wait for response
 */
export const createSmsTranscript = async (payload: SmsTranscriptPayload): Promise<void> => {
  const {
    conversationSid,
    ticketId,
    accountSid,
    conversationServiceSid = DEFAULT_SERVICE_SID,
    taskSid,
  } = payload;

  if (!conversationSid || !ticketId) {
    logger.warn('[agent-automation] SMS transcript creation skipped - missing conversationSid or ticketId');
    return;
  }

  const requestBody = new URLSearchParams({
    EventType: 'onConversationStateUpdated',
    ConversationSid: conversationSid,
    StateTo: 'closed',
    StateFrom: 'active',
    ConversationServiceSid: conversationServiceSid,
    AccountSid: accountSid,
  }).toString();

  try {
    logger.info(
      `[agent-automation] Creating SMS transcript for conversation ${conversationSid} with ticket ${ticketId}${taskSid ? ` (task: ${taskSid})` : ''}`,
    );

    // Fire and forget - transcript creation happens async
    fetch(TRANSCRIPT_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: requestBody,
    })
      .then((response) => {
        if (!response.ok) {
          logger.warn(`[agent-automation] SMS transcript request returned status ${response.status}`);
          return response.json().catch(() => ({}));
        }
        return response.json();
      })
      .then((data) => {
        logger.debug(`[agent-automation] SMS transcript created for ${conversationSid}:`, data);
      })
      .catch((error) => {
        logger.error(`[agent-automation] Failed to create SMS transcript for ${conversationSid}:`, error);
      });
  } catch (error: any) {
    logger.error(`[agent-automation] Error initiating SMS transcript creation:`, error);
  }
};

/**
 * Convenience function to create SMS transcript from a Flex task
 */
export const createSmsTranscriptFromTask = async (
  task: any,
  accountSid: string,
): Promise<void> => {
  const { conversationSid, ticketId, conversationServiceSid } = task.attributes;

  if (!conversationSid || task.attributes.channelType !== 'sms') {
    return;
  }

  await createSmsTranscript({
    conversationSid,
    ticketId,
    accountSid,
    conversationServiceSid,
    taskSid: task.taskSid,
  });
};
