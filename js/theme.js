/* Keep the experience fixed in light mode. */
const root = document.documentElement;
root.removeAttribute('data-theme');
root.style.colorScheme = 'light';
