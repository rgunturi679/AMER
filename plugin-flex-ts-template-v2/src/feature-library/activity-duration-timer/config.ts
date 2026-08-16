import { getFeatureFlags } from '../../utils/configuration';
import ActivityDurationTimerConfig from './types/ServiceConfiguration';

const { enabled = false } = (getFeatureFlags()?.features?.activity_duration_timer as ActivityDurationTimerConfig) || {};

export const isFeatureEnabled = () => {
  return enabled;
};
