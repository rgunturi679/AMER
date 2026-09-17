import * as Flex from '@twilio/flex-ui';

import { FlexActionEvent, FlexAction } from '../../../../types/feature-loader';
import { holdEnded } from '../states/holdTimeSlice';

export const actionEvent = FlexActionEvent.after;
export const actionName = FlexAction.UnholdCall;
export const actionHook = function trackHoldEnd(_flex: typeof Flex, manager: Flex.Manager) {
  Flex.Actions.addListener(`${actionEvent}${actionName}`, (payload) => {
    const taskSid = payload?.task?.sid;
    if (!taskSid) {
      console.debug('[hold-time] UnholdCall fired but no task SID found', payload);
      return;
    }
    const timestamp = Date.now();
    const existingEntry = (manager.store.getState() as any)?.[
      'plugin-flex-ts-template-v2'
    ]?.holdTime?.tasks?.[taskSid];
    const holdDurationMs =
      existingEntry?.holdStartTime != null ? timestamp - existingEntry.holdStartTime : 0;
    console.debug('[hold-time] Hold ended', { taskSid, holdDurationMs, timestamp });
    manager.store.dispatch(holdEnded({ taskSid, timestamp }));
  });
};
