import { ITask } from '@twilio/flex-ui';
import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { Box } from '@twilio-paste/core/box';
import { Text } from '@twilio-paste/core/text';

import AppState from '../../../../types/manager/AppState';
import { reduxNamespace } from '../../../../utils/state';
import { HoldTimeState } from '../../flex-hooks/states/holdTimeSlice';

export interface OwnProps {
  task?: ITask;
}

const formatDuration = (ms: number): string => {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
};

const HoldTimeDisplay = ({ task }: OwnProps) => {
  const [, setClock] = useState(true);

  const holdTimeState = useSelector(
    (state: AppState) => state[reduxNamespace].holdTime as HoldTimeState,
  );

  useEffect(() => {
    const interval = setInterval(() => setClock((c) => !c), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!task) return;
    const entry = holdTimeState?.tasks?.[task.sid];
    console.debug('[hold-time] HoldTimeDisplay state', {
      taskSid: task.sid,
      isOnHold: entry?.holdStartTime != null,
      holdStartTime: entry?.holdStartTime,
      totalHoldMs: entry?.totalHoldMs,
    });
  }, [holdTimeState, task]);

  if (!task) return null;

  const entry = holdTimeState?.tasks?.[task.sid];
  const isOnHold = entry?.holdStartTime !== null && entry?.holdStartTime !== undefined;
  const currentHoldMs = isOnHold ? Date.now() - (entry.holdStartTime as number) : 0;
  const totalHoldMs = (entry?.totalHoldMs ?? 0) + currentHoldMs;

  if (totalHoldMs === 0 && !isOnHold) return null;

  return (
    <Box paddingTop="space30" paddingBottom="space30" paddingLeft="space50">
      {isOnHold && (
        <Text as="p" fontSize="fontSize20" color="colorTextWarning">
          On Hold: {formatDuration(currentHoldMs)}
        </Text>
      )}
      {entry?.totalHoldMs > 0 && (
        <Text as="p" fontSize="fontSize20" color="colorTextWeak">
          Total Hold Time: {formatDuration(totalHoldMs)}
        </Text>
      )}
    </Box>
  );
};

export default HoldTimeDisplay;
