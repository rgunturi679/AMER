export default interface ActivityReservationHandlerConfig {
  enabled: boolean;
  auto_wrapup?: boolean;
  wrapup_timeout_ms?: number;
  update_activity_on_task_accept?: boolean;
  system_activity_names: {
    available: string;
    onATask: string;
    onATaskNoAcd: string;
    wrapup: string;
    wrapupNoAcd: string;
    extendedWrapup: string;
  };
}
