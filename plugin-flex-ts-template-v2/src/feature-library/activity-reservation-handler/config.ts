import { getFeatureFlags } from '../../utils/configuration';
import ActivityReservationHandlerConfig from './types/ServiceConfiguration';

const {
  enabled = false,
  auto_wrapup = false,
  wrapup_timeout_ms = 60000,
  update_activity_on_task_accept = false,
  system_activity_names = {
    available: 'Available',
    onATask: 'On a Task',
    onATaskNoAcd: 'On a Task, No ACD',
    wrapup: 'Wrap Up',
    wrapupNoAcd: 'Wrap Up, No ACD',
    extendedWrapup: 'Extended Wrap Up',
  },
} = (getFeatureFlags()?.features?.activity_reservation_handler as ActivityReservationHandlerConfig) || {};

console.debug('[activity-reservation-handler] Config loaded', {
  enabled,
  auto_wrapup,
  wrapup_timeout_ms,
  system_activity_names,
});

export const isFeatureEnabled = () => {
  return enabled;
};

export const isAutoWrapupEnabled = () => {
  return auto_wrapup;
};

export const getWrapupTimeoutMs = () => {
  return wrapup_timeout_ms;
};

export const shouldUpdateActivityOnTaskAccept = () => {
  return update_activity_on_task_accept;
};

export const getSystemActivityNames = () => {
  return system_activity_names;
};
