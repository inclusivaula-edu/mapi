const listeners = {};

export function emit(event, payload) {
  if (!listeners[event]) return;

  listeners[event].forEach((fn) => fn(payload));
}

export function on(event, fn) {
  if (!listeners[event]) {
    listeners[event] = [];
  }

  listeners[event].push(fn);
}