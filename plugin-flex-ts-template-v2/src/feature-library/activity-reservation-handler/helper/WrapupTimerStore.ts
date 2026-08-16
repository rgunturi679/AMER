const timers = new Map<string, ReturnType<typeof setTimeout>>();

export const setTimer = (sid: string, handle: ReturnType<typeof setTimeout>) => {
  timers.set(sid, handle);
};

export const clearTimer = (sid: string) => {
  const handle = timers.get(sid);
  if (handle) {
    clearTimeout(handle);
    timers.delete(sid);
  }
};
