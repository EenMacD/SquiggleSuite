<template>
  <router-view />
</template>

<style>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');

:root {
  /* Sophisticated Dark Theme */
  --bg: #0F172A;
  --surface: #1E293B;
  --surface-2: #334155;
  --surface-hover: #475569;
  --text: rgba(248,250,252,0.95);
  --text-secondary: rgba(203,213,225,0.85);
  --muted: rgba(148,163,184,0.75);
  --border: rgba(71,85,105,0.4);
  --border-strong: rgba(100,116,139,0.6);
  --accent: #3B82F6;
  --accent-hover: #2563EB;
  --accent-contrast: #FFFFFF;
  --focus: rgba(59, 130, 246, 0.4);
  --radius: 16px;
  --radius-sm: 12px;
  --radius-xs: 8px;
  --space-1: 4px; --space-2: 8px; --space-3: 12px; --space-4: 16px; --space-5: 24px; --space-6: 32px;
  --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  --shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
  --shadow-md: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
  --shadow-lg: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1);
  --shadow-xl: 0 25px 50px -12px rgb(0 0 0 / 0.25);
  --ease: cubic-bezier(0.4, 0, 0.2, 1);
  --ease-in: cubic-bezier(0.4, 0, 1, 1);
  --ease-out: cubic-bezier(0, 0, 0.2, 1);
  --sidebar-width: 320px;
  --btn-bg: var(--surface-2);
  --btn-text: var(--text);
  --btn-border: var(--border);
  --btn-hover-bg: var(--surface-hover);
  --btn-active-bg: #1E293B;
  --btn-disabled-opacity: 0.5;
  --btn-primary-bg: var(--accent);
  --btn-primary-text: var(--accent-contrast);
  --btn-primary-hover-bg: var(--accent-hover);
  --btn-primary-active-bg: #1D4ED8;
  --appbar-h: 60px;
  --team-red: #EF4444;
  --team-blue: #3B82F6;
  --gradient-primary: linear-gradient(135deg, #3B82F6 0%, #2563EB 100%);
  --gradient-surface: linear-gradient(180deg, rgba(51, 65, 85, 0.8) 0%, rgba(30, 41, 59, 0.95) 100%);
  --gradient-shimmer: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.06) 50%, transparent 100%);
  --color-text: var(--text);
  --color-background: var(--surface);
  --color-background-soft: var(--surface);
  --color-background-mute: var(--surface-2);
  --color-border: var(--border);
  --color-border-hover: var(--border-strong);
  --color-accent: var(--accent);
}
@media (min-width: 1024px) {
  :root { --appbar-h: 72px; }
}

*, *::before, *::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

html, body, #app {
  background: var(--bg);
  color: var(--text);
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  letter-spacing: -0.011em;
  min-height: 100vh;
}
</style>
