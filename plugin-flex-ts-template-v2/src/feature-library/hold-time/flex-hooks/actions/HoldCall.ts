import * as Flex from '@twilio/flex-ui';

import { FlexActionEvent, FlexAction } from '../../../../types/feature-loader';
import { holdStarted } from '../states/holdTimeSlice';

export const actionEvent = FlexActionEvent.after;
export const actionName = FlexAction.HoldCall;
export const actionHook = function trackHoldStart(_flex: typeof Flex, manager: Flex.Manager) {
  Flex.Actions.addListener(`${actionEvent}${actionName}`, (payload) => {
    const taskSid = payload?.task?.sid;
    if (!taskSid) {
      console.debug('[hold-time] HoldCall fired but no task SID found', payload);
      return;
    }
    const timestamp = Date.now();
    console.debug('[hold-time] Hold started', { taskSid, timestamp });
    manager.store.dispatch(holdStarted({ taskSid, timestamp }));
  });
};
