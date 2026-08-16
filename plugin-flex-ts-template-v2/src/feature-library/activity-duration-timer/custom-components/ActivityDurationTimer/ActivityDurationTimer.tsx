import React, { useEffect, useState } from 'react';
import { Manager, useFlexSelector } from '@twilio/flex-ui';
import { Flex as FlexBox } from '@twilio-paste/core/flex';
import { Text } from '@twilio-paste/core/text';

import logger from '../../../../utils/logger';

interface ActivityDurationTimerProps {
  direction?: 'row' | 'column';
}

const ActivityDurationTimer: React.FC<ActivityDurationTimerProps> = ({ direction = 'column' }) => {
  const [elapsed, setElapsed] = useState<string>('00:00:00');
  const manager = Manager.getInstance();

  const workerActivityName = useFlexSelector((state) => state.flex.worker.activity.name);
  const workerActivitySid = useFlexSelector((state) => state.flex.worker.activity.sid);

  useEffect(() => {
    // Set up interval to update elapsed time every second
    const interval = setInterval(() => {
      try {
        const worker = manager.workerClient?.attributes;
        if (!worker) {
          return;
        }

        // Get the activity duration in milliseconds
        // If not available, calculate from activity change time
        let durationMs = 0;

        if (worker.activity_duration_ms) {
          durationMs = worker.activity_duration_ms;
        } else if (worker.activity_change_timestamp) {
          // Calculate elapsed time from timestamp
          durationMs = Date.now() - worker.activity_change_timestamp;
        } else {
          // Fallback: use 0
          durationMs = 0;
        }

        // Convert milliseconds to HH:MM:SS format
        const totalSeconds = Math.floor(durationMs / 1000);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;

        const formatted = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

        setElapsed(formatted);
      } catch (error: any) {
        logger.debug('[activity-duration-timer] Error calculating duration:', error);
      }
    }, 1000);

    // Cleanup interval on component unmount
    return () => {
      clearInterval(interval);
    };
  }, [manager]);

  return (
    <FlexBox vertical={direction === 'column'} marginLeft="space20" marginRight="space20" marginTop="space20">
      <Text as="p" fontSize="fontSize20" fontWeight="fontWeightBold" color="colorTextInverse">
        {workerActivityName || 'Activity'}
      </Text>
      <Text as="p" fontSize="fontSize30" fontWeight="fontWeightBold" color="colorTextInverse" marginTop="space10">
        {elapsed}
      </Text>
      <Text as="p" fontSize="fontSize10" color="colorTextInverse" marginTop="space10">
        Time in current activity
      </Text>
    </FlexBox>
  );
};

export default ActivityDurationTimer;
