import { getFeatureFlags } from '../../utils/configuration';
import AgentQueueStatsConfig from './types/ServiceConfiguration';

const { enabled = false, serverless_function_url = '' } =
  (getFeatureFlags()?.features?.agent_queue_stats as AgentQueueStatsConfig) || {};

export const isFeatureEnabled = () => enabled;

export const getServerlessFunctionUrl = () => serverless_function_url;
