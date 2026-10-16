import { getFeatureFlags } from '../../utils/configuration';
import HangUpByConfig from './types/ServiceConfiguration';

const { enabled = false } = (getFeatureFlags()?.features?.hang_up_by as HangUpByConfig) || {};

console.debug('[hang-up-by] Config loaded', { enabled });

export const isFeatureEnabled = () => {
  return enabled;
};
