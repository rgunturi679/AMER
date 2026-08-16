import * as Flex from '@twilio/flex-ui';

import { FlexEvent } from '../../../../types/feature-loader';
import { getMatchingTaskConfiguration } from '../../config';
import logger from '../../../../utils/logger';

export const eventName = FlexEvent.taskAccepted;
export const eventHook = async function playAnnouncementAfterAccept(
  flex: typeof Flex,
  _manager: Flex.Manager,
  task: Flex.ITask,
) {
  const taskConfig = getMatchingTaskConfiguration(task);

  if (!taskConfig || !taskConfig.announcement_enabled) {
    return;
  }

  const announcementUrl = taskConfig.announcement_url || process.env.REACT_APP_ANNOUNCE_MEDIA;

  if (!announcementUrl) {
    logger.warn('[agent-automation] Announcement enabled but no URL provided');
    return;
  }

  try {
    logger.info(`[agent-automation] Playing announcement for task ${task.taskSid}`);
    Flex.AudioPlayerManager.play({
      url: announcementUrl,
      repeatable: false,
    });
  } catch (error: any) {
    logger.error('[agent-automation] Error playing announcement', error);
  }
};
