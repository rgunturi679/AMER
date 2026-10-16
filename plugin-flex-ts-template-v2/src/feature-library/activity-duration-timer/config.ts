import { getFeatureFlags } from '../../utils/configuration';
import ActivityDurationTimerConfig from './types/ServiceConfiguration';

const { enabled = false } = (getFeatureFlags()?.features?.activity_duration_timer as ActivityDurationTimerConfig) || {};

console.debug('[activity-duration-timer] Config loaded', { enabled });

export const isFeatureEnabled = () => {
  return enabled;
};
