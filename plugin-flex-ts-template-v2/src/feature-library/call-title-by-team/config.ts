import { getFeatureFlags } from '../../utils/configuration';
import CallTitleByTeamConfig from './types/ServiceConfiguration';

const { enabled = false } = (getFeatureFlags()?.features?.call_title_by_team as CallTitleByTeamConfig) || {};

export const isFeatureEnabled = () => {
  return enabled;
};
