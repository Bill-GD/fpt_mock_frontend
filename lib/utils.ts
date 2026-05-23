export const deferStateUpdate = (fn: () => void): void => {
  Promise.resolve().then(fn);
};

