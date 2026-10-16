import { getFeatureFlags } from '../../utils/configuration';
import CallTitleByTeamConfig from './types/ServiceConfiguration';

const { enabled = false } = (getFeatureFlags()?.features?.call_title_by_team as CallTitleByTeamConfig) || {};

console.debug('[call-title-by-team] Config loaded', { enabled });

export const isFeatureEnabled = () => {
  return enabled;
};
