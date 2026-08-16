import * as Flex from '@twilio/flex-ui';

export const hookFunction = (flex: typeof Flex) => {
  const callChannel = flex.DefaultTaskChannels.Call;

  const getDisplayName = (task: any, originalFn: any) => {
    if (task.attributes.team === 'Registration') {
      return 'Q : Invisalign registration team';
    }
    return typeof originalFn === 'function' ? originalFn(task) : originalFn;
  };

  if (callChannel?.templates?.TaskCanvasHeader) {
    const originalTitle = callChannel.templates.TaskCanvasHeader.title;
    callChannel.templates.TaskCanvasHeader.title = (task: any) => getDisplayName(task, originalTitle);
  }

  if (callChannel?.templates?.TaskListItem) {
    const originalFirstLine = callChannel.templates.TaskListItem.firstLine;
    callChannel.templates.TaskListItem.firstLine = (task: any) => getDisplayName(task, originalFirstLine);
  }

  flex.TaskChannels.register(callChannel);
};

hookFunction.channelHook = true;
