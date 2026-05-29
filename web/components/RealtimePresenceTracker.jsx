import { useEffect, useRef } from 'react';
import { supabaseBrowser } from '../lib/supabaseBrowser';
import { getOrCreateVisitorSession } from '../lib/analyticsSession';

const HEARTBEAT_MS = 60 * 1000;

export default function RealtimePresenceTracker() {
  const inFlightRef = useRef(false);

  useEffect(() => {
    let active = true;
    let timer = null;

    async function sendHeartbeat() {
      if (!active || typeof window === 'undefined' || inFlightRef.current) return;
      inFlightRef.current = true;
      try {
        const { data } = await supabaseBrowser.auth.getSession();
        const session = data?.session || null;
        const body = {
          session_key: getOrCreateVisitorSession(),
          path: window.location.pathname,
          referrer: document.referrer || '',
          user_id: session?.user?.id || null,
          user_email: session?.user?.email || null,
          is_authenticated: !!session?.user,
        };
        await fetch('/api/heartbeat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
          },
          body: JSON.stringify(body),
          keepalive: true,
        });
      } catch {
      } finally {
        inFlightRef.current = false;
      }
    }

    sendHeartbeat();
    timer = window.setInterval(sendHeartbeat, HEARTBEAT_MS);

    const onFocus = () => sendHeartbeat();
    const onVisibility = () => {
      if (document.visibilityState === 'visible') sendHeartbeat();
    };
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      active = false;
      if (timer) window.clearInterval(timer);
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  return null;
}
