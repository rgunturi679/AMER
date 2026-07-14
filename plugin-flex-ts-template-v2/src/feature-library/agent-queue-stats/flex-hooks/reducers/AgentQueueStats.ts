import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import { QueueStats } from '../../utils/StatsHelper';

export interface AgentQueueStatsState {
  stats: QueueStats[];
}

const initialState: AgentQueueStatsState = { stats: [] };

const agentQueueStatsSlice = createSlice({
  name: 'agentQueueStats',
  initialState,
  reducers: {
    updateStats(state, action: PayloadAction<QueueStats[]>) {
      action.payload.forEach((incoming) => {
        const idx = state.stats.findIndex((s) => s.queue.queue_sid === incoming.queue.queue_sid);
        if (idx >= 0) {
          state.stats[idx] = incoming;
        } else {
          state.stats.push(incoming);
        }
      });
    },
  },
});

export const { updateStats } = agentQueueStatsSlice.actions;
export const reducerHook = () => ({ agentQueueStats: agentQueueStatsSlice.reducer });
