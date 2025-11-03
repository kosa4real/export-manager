# Auto Logout Feature

## Overview

The auto logout feature automatically logs users out after a period of inactivity to enhance security. Users receive a warning before being logged out and can extend their session if needed.

## Configuration

### Default Settings

- **Inactivity Timeout**: 1 hour (60 minutes)
- **Warning Time**: 5 minutes before logout
- **Activity Throttle**: 30 seconds (prevents excessive timer resets)

### Configurable Options

Settings can be modified in `src/config/session.js`:

```javascript
export const SESSION_CONFIG = {
  INACTIVITY_TIMEOUT: 60 * 60 * 1000, // 1 hour in milliseconds
  WARNING_TIME: 5 * 60 * 1000, // 5 minutes in milliseconds
  ACTIVITY_THROTTLE: 30 * 1000, // 30 seconds in milliseconds
  ACTIVITY_EVENTS: [
    // Events that reset the timer
    "mousedown",
    "mousemove",
    "keypress",
    "scroll",
    "touchstart",
    "click",
    "focus",
  ],
};
```

## How It Works

### 1. Activity Tracking

The system tracks user activity through various DOM events:

- Mouse movements and clicks
- Keyboard input
- Scrolling
- Focus events
- Touch events (mobile)

### 2. Timer Management

- **Main Timer**: Counts down from the inactivity timeout
- **Warning Timer**: Triggers the warning modal 5 minutes before logout
- **Countdown Timer**: Shows real-time countdown in the warning modal

### 3. User Experience Flow

1. User logs in and timer starts
2. Any activity resets the timer (throttled to prevent excessive resets)
3. After 55 minutes of inactivity, warning modal appears
4. User can choose to "Stay Logged In" or "Logout Now"
5. If no action is taken, user is automatically logged out after 5 more minutes

## Components

### `useAutoLogout` Hook

Located in `src/hooks/useAutoLogout.js`

**Returns:**

- `resetInactivityTimer()`: Manually reset the timer
- `isAuthenticated`: Boolean indicating if user is logged in
- `showWarning`: Boolean for warning modal visibility
- `timeRemaining`: Seconds remaining before logout
- `extendSession()`: Extend the session (hide warning and reset timer)
- `logoutNow()`: Immediately log out the user

### `SessionTimeoutWarning` Component

Located in `src/components/SessionTimeoutWarning.js`

A modal that appears 5 minutes before logout with:

- Countdown timer showing time remaining
- "Stay Logged In" button to extend session
- "Logout Now" button for immediate logout

### `SessionStatus` Component

Located in `src/components/SessionStatus.js`

Shows session time remaining in the header (desktop only).

### `SessionSettings` Component

Located in `src/components/SessionSettings.js`

Admin-only component for configuring session timeout settings.

## Implementation

### 1. Add to Layout

The auto logout functionality is integrated into `GlobalLayout.js`:

```javascript
import { useAutoLogout } from "@/hooks/useAutoLogout";
import SessionTimeoutWarning from "./SessionTimeoutWarning";

const GlobalLayout = ({ children }) => {
  const { showWarning, timeRemaining, extendSession, logoutNow } =
    useAutoLogout();

  return (
    <div>
      {/* Your layout content */}

      {showWarning && (
        <SessionTimeoutWarning
          timeRemaining={timeRemaining}
          onExtendSession={extendSession}
          onLogout={logoutNow}
        />
      )}
    </div>
  );
};
```

### 2. Manual Timer Reset

You can manually reset the timer in any component:

```javascript
import { useAutoLogout } from "@/hooks/useAutoLogout";

const MyComponent = () => {
  const { resetInactivityTimer } = useAutoLogout();

  const handleImportantAction = () => {
    // Perform action
    resetInactivityTimer(); // Reset timer after important action
  };
};
```

## Testing

### Test Page

Visit `/test-session` to test the auto logout functionality:

- Shows current session information
- Provides activity test elements
- Displays auto logout configuration
- Admin settings (for admin users)

### Manual Testing

1. Log in to the application
2. Leave the browser idle for 55 minutes
3. Verify warning modal appears
4. Test both "Stay Logged In" and "Logout Now" options
5. Verify automatic logout after 60 minutes total

### Automated Testing

```javascript
// Example test case
describe("Auto Logout", () => {
  it("should show warning after inactivity period", async () => {
    // Mock timers and test warning appearance
  });

  it("should logout user after timeout", async () => {
    // Test automatic logout functionality
  });
});
```

## Security Considerations

### Benefits

- Prevents unauthorized access to unattended sessions
- Reduces risk of session hijacking
- Complies with security best practices
- Configurable timeout periods

### Implementation Notes

- Timer resets are throttled to prevent performance issues
- Multiple timer cleanup prevents memory leaks
- Graceful fallback if logout fails
- Works across browser tabs (session-based)

## Browser Compatibility

The auto logout feature works in all modern browsers:

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## Troubleshooting

### Common Issues

**Timer not resetting:**

- Check if activity events are being captured
- Verify user is authenticated
- Check throttling settings

**Warning not appearing:**

- Verify component is rendered in layout
- Check timer configuration
- Ensure no JavaScript errors

**Logout not working:**

- Check NextAuth configuration
- Verify API endpoints are accessible
- Check network connectivity

### Debug Mode

Add logging to track timer behavior:

```javascript
// In useAutoLogout.js
console.log("Timer reset at:", new Date().toISOString());
console.log("Warning triggered at:", new Date().toISOString());
console.log("Logout performed at:", new Date().toISOString());
```

## Future Enhancements

### Possible Improvements

- Server-side session validation
- Multiple device session management
- Customizable warning messages
- Activity heatmap analytics
- Grace period for network issues
- Remember user preference for timeout duration
