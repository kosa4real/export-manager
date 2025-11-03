// Session configuration
export const SESSION_CONFIG = {
  // Inactivity timeout in milliseconds (1 hour)
  INACTIVITY_TIMEOUT: 60 * 60 * 1000,

  // Warning time before logout in milliseconds (5 minutes)
  WARNING_TIME: 5 * 60 * 1000,

  // Activity throttle time in milliseconds (30 seconds)
  ACTIVITY_THROTTLE: 30 * 1000,

  // Events to track for user activity
  ACTIVITY_EVENTS: [
    "mousedown",
    "mousemove",
    "keypress",
    "scroll",
    "touchstart",
    "click",
    "focus",
  ],
};

// Helper functions
export const formatTime = (milliseconds) => {
  const totalSeconds = Math.floor(milliseconds / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  } else {
    return `${seconds}s`;
  }
};

export const formatTimeRemaining = (seconds) => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(
    remainingSeconds
  ).padStart(2, "0")}`;
};
