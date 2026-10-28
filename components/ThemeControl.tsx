"use client";
import { useEffect, useState } from "react";
import { THEME_KEY, themeFromValue, type Theme } from "@/lib/theme";

export function ThemeControl() {
  const [theme, setTheme] = useState<Theme>("system");
  const [ready, setReady] = useState(false);
  const [warning, setWarning] = useState("");
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setTheme(themeFromValue(document.documentElement.dataset.theme));
      setReady(true);
    }, 0);
    function sync(event: StorageEvent) {
      if (event.key !== THEME_KEY && event.key !== null) return;
      const next = themeFromValue(event.newValue);
      document.documentElement.dataset.theme = next;
      setTheme(next);
    }
    window.addEventListener("storage", sync);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("storage", sync);
    };
  }, []);
  function change(next: Theme) {
    setTheme(next);
    document.documentElement.dataset.theme = next;
    try {
      window.localStorage.setItem(THEME_KEY, next);
      setWarning("");
    } catch {
      setWarning(
        "Appearance changed for this visit. Browser storage is unavailable.",
      );
    }
  }
  return (
    <div className="theme-control">
      <label>
        Appearance
        <select
          disabled={!ready}
          value={theme}
          onChange={(e) => change(e.target.value as Theme)}
        >
          <option value="system">System</option>
          <option value="light">Light</option>
          <option value="dark">Dark</option>
        </select>
      </label>
      {warning && <p role="status">{warning}</p>}
    </div>
  );
}
