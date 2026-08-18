import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

import { QueueStats } from '../../utils/StatsHelper';

export interface AgentQueueStatsState {
  stats: Array<QueueStats>;
}

const initialState: AgentQueueStatsState = { stats: [] };

const agentQueueStatsSlice = createSlice({
  name: 'agentQueueStats',
  initialState,
  reducers: {
    updateStats(state, action: PayloadAction<Array<QueueStats>>) {
      action.payload.forEach((item) => {
        const existingIndex = state.stats.findIndex(
          (queueStats) => queueStats.queue.queue_sid === item.queue.queue_sid,
        );

        if (existingIndex >= 0) {
          state.stats[existingIndex] = item;
        } else {
          state.stats.push(item);
        }
      });
    },
  },
});

export const { updateStats } = agentQueueStatsSlice.actions;
export const reducerHook = () => ({ agentQueueStats: agentQueueStatsSlice.reducer });
