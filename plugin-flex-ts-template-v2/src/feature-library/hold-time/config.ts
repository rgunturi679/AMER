import { getFeatureFlags } from '../../utils/configuration';
import HoldTimeConfig from './types/ServiceConfiguration';

const { enabled = false } = (getFeatureFlags()?.features?.hold_time as HoldTimeConfig) || {};

export const isFeatureEnabled = () => {
  return enabled;
};
