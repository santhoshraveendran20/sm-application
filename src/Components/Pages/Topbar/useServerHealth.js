import { useCallback, useEffect, useRef, useState } from "react";
import { NodeURL } from "../../../api/api.jsx";

const HEALTHY_INTERVAL = 60000;
const RETRY_INTERVAL = 15000;
const TIMEOUT = 5000;

const ping = async () => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT);
  try {
    const response = await fetch(`${NodeURL}/health`, { signal: controller.signal, cache: "no-store" });
    return response.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
};

export default function useServerHealth() {
  const [state, setState] = useState({ status: "checking", fails: 0, lastChecked: null, lastOk: null });
  const timerRef = useRef(null);
  const aliveRef = useRef(true);

  const check = useCallback(async () => {
    clearTimeout(timerRef.current);
    const ok = await ping();
    if (!aliveRef.current) return;
    const now = new Date();
    setState((prev) => {
      const fails = ok ? 0 : prev.fails + 1;
      return { status: ok ? "available" : fails >= 2 ? "unavailable" : "reconnecting", fails, lastChecked: now, lastOk: ok ? now : prev.lastOk };
    });
    timerRef.current = setTimeout(check, ok ? HEALTHY_INTERVAL : RETRY_INTERVAL);
  }, []);

  useEffect(() => {
    aliveRef.current = true;
    check();
    return () => {
      aliveRef.current = false;
      clearTimeout(timerRef.current);
    };
  }, [check]);

  return { ...state, check };
}
