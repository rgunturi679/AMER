import * as Flex from '@twilio/flex-ui';

export const channelHook = (flex: typeof Flex) => {
  console.debug('[call-title-by-team] channelHook invoked');
  const callChannel = flex.DefaultTaskChannels.Call;

  if (!callChannel) {
    console.error('[call-title-by-team] DefaultTaskChannels.Call not found');
    return;
  }

  const getDisplayName = (task: any, originalFn: any) => {
    const team = task?.attributes?.team;
    console.debug('[call-title-by-team] getDisplayName called, team:', team);
    if (team === 'Registration') {
      console.debug('[call-title-by-team] returning custom title for Registration team');
      return 'Q : Invisalign registration team';
    }
    return typeof originalFn === 'function' ? originalFn(task) : originalFn;
  };

  if (callChannel?.templates?.TaskCanvasHeader) {
    console.debug('[call-title-by-team] patching TaskCanvasHeader.title');
    const originalTitle = callChannel.templates.TaskCanvasHeader.title;
    callChannel.templates.TaskCanvasHeader.title = (task: any) => getDisplayName(task, originalTitle);
  } else {
    console.warn('[call-title-by-team] TaskCanvasHeader template not found');
  }

  if (callChannel?.templates?.TaskListItem) {
    console.debug('[call-title-by-team] patching TaskListItem.firstLine');
    const originalFirstLine = callChannel.templates.TaskListItem.firstLine;
    callChannel.templates.TaskListItem.firstLine = (task: any) => getDisplayName(task, originalFirstLine);
  } else {
    console.warn('[call-title-by-team] TaskListItem template not found');
  }

  flex.TaskChannels.register(callChannel);
  console.debug('[call-title-by-team] callChannel re-registered');
};
