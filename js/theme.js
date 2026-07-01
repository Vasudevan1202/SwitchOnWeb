/* Theme and accessibility controls */
const STORAGE_KEY = 'switchon-theme';
const root = document.documentElement;
const themeToggle = document.querySelector('.theme-toggle');
const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
const savedTheme = localStorage.getItem(STORAGE_KEY);
const theme = savedTheme || (systemPrefersDark ? 'dark' : 'light');
root.setAttribute('data-theme', theme === 'dark' ? 'dark' : 'light');

const updateThemeLabel = () => {
  if (!themeToggle) return;
  const isDark = root.getAttribute('data-theme') === 'dark';
  themeToggle.setAttribute('aria-label', isDark ? 'Switch to light mode' : 'Switch to dark mode');
  themeToggle.innerHTML = isDark ? '☀️' : '🌙';
};

updateThemeLabel();

if (themeToggle) {
  themeToggle.addEventListener('click', () => {
    const nextTheme = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-theme', nextTheme);
    localStorage.setItem(STORAGE_KEY, nextTheme);
    updateThemeLabel();
  });
}
