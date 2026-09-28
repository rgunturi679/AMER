import { TaskHelper, ITask, Template, templates } from '@twilio/flex-ui';
import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { Text } from '@twilio-paste/core/text';

import AppState from '../../../../types/manager/AppState';
import { reduxNamespace } from '../../../../utils/state';
import { StringTemplates } from '../../flex-hooks/strings/PauseRecording';
import { PauseRecordingState } from '../../flex-hooks/states/PauseRecordingSlice';

export interface OwnProps {
  task?: ITask;
}

const PauseStatusPanel = (props: OwnProps) => {
  const [isLive, setIsLive] = useState(false);
  const [paused, setPaused] = useState(false);

  const { pausedRecordings } = useSelector(
    (state: AppState) => state[reduxNamespace].pauseRecording as PauseRecordingState,
  );

  const updateState = () => {
    const liveCall = props.task ? TaskHelper.isLiveCall(props.task) : false;
    setIsLive(liveCall);

    if (!liveCall || !props.task) {
      setPaused(false);
      return;
    }

    setPaused(!!pausedRecordings?.find((r) => r.reservationSid === props.task?.sid));
  };

  useEffect(() => {
    updateState();
  }, []);

  useEffect(() => {
    updateState();
  }, [pausedRecordings, props.task?.sid]);

  if (!isLive) return null;

  return (
    <Text
      as="p"
      textAlign="center"
      fontWeight="fontWeightBold"
      padding="space50"
      color={paused ? 'colorTextWarningStrong' : 'colorTextSuccess'}
    >
      <Template source={templates[paused ? StringTemplates.RECORDING_PAUSED_LABEL : StringTemplates.RECORDING_ACTIVE_LABEL]} />
    </Text>
  );
};

export default PauseStatusPanel;
