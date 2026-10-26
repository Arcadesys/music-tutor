export type Theme = "system" | "light" | "dark";
export const THEME_KEY = "music-tutor:theme";
export function themeFromValue(value: string | null | undefined): Theme {
  return value === "light" || value === "dark" ? value : "system";
}
// Runs before first paint. CSS handles system preference and live OS changes.
// Storage is optional, so a blocked read must never prevent the page rendering.
export const THEME_INIT_SCRIPT = `(function(){try{var t=localStorage.getItem('music-tutor:theme');document.documentElement.dataset.theme=t==='light'||t==='dark'?t:'system';}catch(e){}})();`;
