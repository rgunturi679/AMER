import { getFeatureFlags } from '../../utils/configuration';
import AgentQueueStatsConfig from './types/ServiceConfiguration';

const { enabled = false, serverless_function_url = '' } =
  (getFeatureFlags()?.features?.agent_queue_stats as AgentQueueStatsConfig) || {};

export const isFeatureEnabled = () => {
  return enabled;
};

export const getServerlessFunctionUrl = () => {
  return serverless_function_url;
};
