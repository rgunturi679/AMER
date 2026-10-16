import { getFeatureFlags } from '../../utils/configuration';
import HoldTimeConfig from './types/ServiceConfiguration';

const { enabled = false } = (getFeatureFlags()?.features?.hold_time as HoldTimeConfig) || {};

console.debug('[hold-time] Config loaded', { enabled });

export const isFeatureEnabled = () => {
  return enabled;
};
