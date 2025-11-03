"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { SESSION_CONFIG } from "@/config/session";

const { INACTIVITY_TIMEOUT, WARNING_TIME, ACTIVITY_THROTTLE, ACTIVITY_EVENTS } =
  SESSION_CONFIG;

export function useAutoLogout() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const timeoutRef = useRef(null);
  const warningTimeoutRef = useRef(null);
  const countdownRef = useRef(null);
  const lastActivityRef = useRef(Date.now());

  const [showWarning, setShowWarning] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);

  const performLogout = useCallback(async () => {
    try {
      setShowWarning(false);
      await signOut({
        redirect: false,
        callbackUrl: "/login",
      });
      router.push("/login");
    } catch (error) {
      console.error("Auto logout error:", error);
      // Force redirect even if signOut fails
      window.location.href = "/login";
    }
  }, [router]);

  const startCountdown = useCallback(() => {
    setTimeRemaining(WARNING_TIME / 1000); // Convert to seconds
    setShowWarning(true);

    countdownRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(countdownRef.current);
          performLogout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [performLogout]);

  const resetTimer = useCallback(() => {
    lastActivityRef.current = Date.now();
    setShowWarning(false);

    // Clear existing timers
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    if (warningTimeoutRef.current) {
      clearTimeout(warningTimeoutRef.current);
    }
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
    }

    // Only set timers if user is authenticated
    if (status === "authenticated" && session) {
      // Set warning timer (5 minutes before logout)
      warningTimeoutRef.current = setTimeout(() => {
        startCountdown();
      }, INACTIVITY_TIMEOUT - WARNING_TIME);

      // Set logout timer (backup in case warning fails)
      timeoutRef.current = setTimeout(() => {
        performLogout();
      }, INACTIVITY_TIMEOUT);
    }
  }, [session, status, startCountdown, performLogout]);

  const handleActivity = useCallback(() => {
    // Only reset if user is authenticated and enough time has passed since last activity
    if (
      status === "authenticated" &&
      Date.now() - lastActivityRef.current > ACTIVITY_THROTTLE
    ) {
      resetTimer();
    }
  }, [resetTimer, status]);

  const extendSession = useCallback(() => {
    resetTimer();
  }, [resetTimer]);

  const logoutNow = useCallback(() => {
    performLogout();
  }, [performLogout]);

  useEffect(() => {
    // Start timer when user is authenticated
    if (status === "authenticated" && session) {
      resetTimer();
    }

    // Cleanup on unmount or when session changes
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (warningTimeoutRef.current) {
        clearTimeout(warningTimeoutRef.current);
      }
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
      }
    };
  }, [session, status, resetTimer]);

  useEffect(() => {
    // Activity events to track
    const events = ACTIVITY_EVENTS;

    // Add event listeners
    events.forEach((event) => {
      document.addEventListener(event, handleActivity, true);
    });

    // Cleanup event listeners
    return () => {
      events.forEach((event) => {
        document.removeEventListener(event, handleActivity, true);
      });
    };
  }, [handleActivity]);

  // Manual reset function that can be called from components
  const resetInactivityTimer = useCallback(() => {
    resetTimer();
  }, [resetTimer]);

  return {
    resetInactivityTimer,
    isAuthenticated: status === "authenticated",
    showWarning,
    timeRemaining,
    extendSession,
    logoutNow,
  };
}
