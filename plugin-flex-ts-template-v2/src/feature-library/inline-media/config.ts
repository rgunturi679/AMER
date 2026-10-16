import { getFeatureFlags } from '../../utils/configuration';
import InlineMediaConfig from './types/ServiceConfiguration';

const { enabled = false } = (getFeatureFlags()?.features?.inline_media as InlineMediaConfig) || {};

console.debug('[inline-media] Config loaded', { enabled });

export const isFeatureEnabled = () => {
  return enabled;
};
