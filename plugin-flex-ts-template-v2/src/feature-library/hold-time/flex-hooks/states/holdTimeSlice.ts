import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

export interface HoldTimeEntry {
  holdStartTime: number | null;
  totalHoldMs: number;
}

export interface HoldTimeState {
  tasks: Record<string, HoldTimeEntry>;
}

const initialState: HoldTimeState = { tasks: {} };

const holdTimeSlice = createSlice({
  name: 'holdTime',
  initialState,
  reducers: {
    holdStarted(state, action: PayloadAction<{ taskSid: string; timestamp: number }>) {
      const { taskSid, timestamp } = action.payload;
      if (!state.tasks[taskSid]) {
        state.tasks[taskSid] = { holdStartTime: null, totalHoldMs: 0 };
      }
      state.tasks[taskSid].holdStartTime = timestamp;
    },
    holdEnded(state, action: PayloadAction<{ taskSid: string; timestamp: number }>) {
      const { taskSid, timestamp } = action.payload;
      const entry = state.tasks[taskSid];
      if (!entry || entry.holdStartTime === null) return;
      entry.totalHoldMs += timestamp - entry.holdStartTime;
      entry.holdStartTime = null;
    },
    taskRemoved(state, action: PayloadAction<string>) {
      delete state.tasks[action.payload];
    },
  },
});

export const { holdStarted, holdEnded, taskRemoved } = holdTimeSlice.actions;
export const reducerHook = () => ({ holdTime: holdTimeSlice.reducer });
