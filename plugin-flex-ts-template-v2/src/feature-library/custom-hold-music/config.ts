import { getFeatureFlags } from '../../utils/configuration';

const config = getFeatureFlags()?.features?.custom_hold_music || {};
const { enabled = false, url = '', queue_music = {}, default_url = '' } = config;

export const isFeatureEnabled = () => {
  return enabled;
};

export const getHoldMusicUrl = (queueName?: string) => {
  if (queueName && queue_music[queueName]) {
    return queue_music[queueName];
  }
  return default_url || url;
};

export const getQueueMusicConfig = () => {
  return { queue_music, default_url, url };
};
