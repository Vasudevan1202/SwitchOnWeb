/* Global site behavior for SwitchOn */
document.addEventListener('DOMContentLoaded', () => {
  const body = document.body;
  const progressBar = document.querySelector('.scroll-progress');
  const readingProgressBar = document.querySelector('.reading-progress');
  const scrollTopButton = document.querySelector('.scroll-top');
  const navToggle = document.querySelector('.nav-toggle');
  const navLinks = document.querySelector('.nav-links');
  const searchToggle = document.querySelector('.search-toggle');
  const searchPanel = document.querySelector('.search-panel');
  const searchInput = document.querySelector('#site-search');
  const results = document.querySelector('.search-results');
  const links = Array.from(document.querySelectorAll('a[href]'));

  const pages = [
    { title: 'Home', url: 'index.html' },
    { title: 'About', url: 'about.html' },
    { title: 'Problem', url: 'problem.html' },
    { title: 'Solution', url: 'solution.html' },
    { title: 'Features', url: 'features.html' },
    { title: 'Prototype', url: 'prototype.html' },
    { title: 'Survey', url: 'survey.html' },
    { title: 'Roadmap', url: 'roadmap.html' },
    { title: 'Founder', url: 'team.html' },
    { title: 'FAQ', url: 'faq.html' },
    { title: 'Contact', url: 'contact.html' },
    { title: 'Waitlist', url: 'waitlist.html' }
  ];

  const updateScrollProgress = () => {
    const scrollTop = window.scrollY;
    const height = document.documentElement.scrollHeight - window.innerHeight;
    const progress = height > 0 ? (scrollTop / height) * 100 : 0;
    if (progressBar) progressBar.style.width = `${progress}%`;
    if (scrollTopButton) scrollTopButton.classList.toggle('visible', scrollTop > 600);
  };

  const updateReadingProgress = () => {
    const scrollTop = window.scrollY;
    const height = document.documentElement.scrollHeight - window.innerHeight;
    const progress = height > 0 ? (scrollTop / height) * 100 : 0;
    if (readingProgressBar) readingProgressBar.style.width = `${Math.min(100, Math.max(0, progress))}%`;
  };

  window.addEventListener('scroll', () => {
    updateScrollProgress();
    updateReadingProgress();
  }, { passive: true });
  updateScrollProgress();
  updateReadingProgress();

  if (scrollTopButton) {
    scrollTopButton.addEventListener('click', (event) => {
      event.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  if (navToggle && navLinks) {
    navToggle.addEventListener('click', () => {
      navLinks.classList.toggle('active');
      navToggle.setAttribute('aria-expanded', navLinks.classList.contains('active'));
    });
  }

  if (searchToggle && searchPanel) {
    searchToggle.addEventListener('click', () => {
      searchPanel.classList.toggle('active');
      if (searchPanel.classList.contains('active') && searchInput) searchInput.focus();
    });
  }

  document.addEventListener('click', (event) => {
    const insideSearch = searchPanel && searchPanel.contains(event.target);
    const clickedSearchToggle = searchToggle && searchToggle.contains(event.target);
    if (!insideSearch && !clickedSearchToggle && searchPanel) {
      searchPanel.classList.remove('active');
    }
  });

  const handleSearch = (value) => {
    const query = value.trim().toLowerCase();
    if (!results) return;
    if (!query) {
      results.innerHTML = '';
      return;
    }
    const filtered = pages.filter((page) => page.title.toLowerCase().includes(query));
    results.innerHTML = filtered.length ? filtered.map((page) => `<a href="${page.url}">${page.title}</a>`).join('') : '<a href="#">No results found</a>';
  };

  if (searchInput) {
    searchInput.addEventListener('input', (event) => handleSearch(event.target.value));
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });

  document.querySelectorAll('.reveal').forEach((element) => observer.observe(element));

  const counters = document.querySelectorAll('[data-count]');
  const countObserver = new IntersectionObserver((entries, observerInstance) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const target = entry.target;
      const finalValue = Number(target.dataset.count || 0);
      const suffix = target.dataset.suffix || '';
      const duration = 1400;
      const startTime = performance.now();
      const updateCount = (time) => {
        const progress = Math.min((time - startTime) / duration, 1);
        const current = Math.floor(progress * finalValue);
        target.textContent = `${current}${suffix}`;
        if (progress < 1) requestAnimationFrame(updateCount);
      };
      requestAnimationFrame(updateCount);
      observerInstance.unobserve(target);
    });
  }, { threshold: 0.6 });

  counters.forEach((counter) => countObserver.observe(counter));

  const hero = document.querySelector('.hero-card');
  if (hero) {
    window.addEventListener('mousemove', (event) => {
      const x = (event.clientX / window.innerWidth - 0.5) * 10;
      const y = (event.clientY / window.innerHeight - 0.5) * 10;
      hero.style.transform = `perspective(900px) rotateY(${x}deg) rotateX(${-y}deg)`;
    });
  }

  const demoSteps = Array.from(document.querySelectorAll('.demo-step'));
  const demoStatusLabel = document.querySelector('.demo-status-label');
  const demoStatusCopy = document.querySelector('.demo-status-copy');
  const demoControls = {
    prev: document.querySelector('[data-demo-control="prev"]'),
    next: document.querySelector('[data-demo-control="next"]'),
    replay: document.querySelector('[data-demo-control="replay"]')
  };

  if (demoSteps.length && demoStatusLabel && demoStatusCopy) {
    const demoMessages = [
      { label: 'Standby', copy: 'The charger is connected and SwitchOn is preparing to verify the outlet.' },
      { label: 'Power check', copy: 'The outlet appears inactive, so the system shifts into a reminder state.' },
      { label: 'Reminder ready', copy: 'A visible alert is shown so the user can act before the morning is lost.' },
      { label: 'Recovery', copy: 'Once power returns, the device transitions back to a calm, ready state.' }
    ];

    let activeDemoStep = 0;

    const updateDemo = () => {
      demoSteps.forEach((step, index) => {
        step.classList.toggle('is-active', index === activeDemoStep);
        step.classList.toggle('is-complete', index < activeDemoStep);
        step.classList.toggle('is-warning', index === activeDemoStep && activeDemoStep > 0);
      });

      demoStatusLabel.textContent = demoMessages[activeDemoStep].label;
      demoStatusCopy.textContent = demoMessages[activeDemoStep].copy;

      if (demoControls.prev) demoControls.prev.disabled = activeDemoStep === 0;
      if (demoControls.next) demoControls.next.disabled = activeDemoStep === demoMessages.length - 1;
    };

    demoControls.prev?.addEventListener('click', () => {
      activeDemoStep = Math.max(0, activeDemoStep - 1);
      updateDemo();
    });

    demoControls.next?.addEventListener('click', () => {
      activeDemoStep = Math.min(demoMessages.length - 1, activeDemoStep + 1);
      updateDemo();
    });

    demoControls.replay?.addEventListener('click', () => {
      activeDemoStep = 0;
      updateDemo();
    });

    updateDemo();
  }

  const navLinksItems = document.querySelectorAll('.nav-links a');
  navLinksItems.forEach((link) => {
    if (link.getAttribute('href') === window.location.pathname.split('/').pop()) {
      link.setAttribute('aria-current', 'page');
    }
  });

  links.forEach((link) => {
    if (link.getAttribute('href')?.startsWith('#')) link.classList.add('smooth-link');
  });

  body.classList.add('loaded');
});
