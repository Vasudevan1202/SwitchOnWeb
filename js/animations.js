/* Intersection-based animation helpers */
const animationElements = document.querySelectorAll('[data-animate]');
const animationObserver = new IntersectionObserver((entries, observer) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    entry.target.classList.add('fade-in-up');
    observer.unobserve(entry.target);
  });
}, { threshold: 0.15 });

animationElements.forEach((element) => animationObserver.observe(element));
