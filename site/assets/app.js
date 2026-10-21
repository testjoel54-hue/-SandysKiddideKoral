(() => {
  'use strict';

  const year = document.querySelector('#year');
  if (year) year.textContent = String(new Date().getFullYear());

  // Mobile navigation
  const toggle = document.querySelector('.nav-toggle');
  const nav = document.querySelector('#main-nav');
  function closeNav() {
    if (!toggle || !nav) return;
    nav.classList.remove('open');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', 'Open navigation');
    toggle.querySelector('span').textContent = '\u2630';
  }
  if (toggle && nav) {
    toggle.addEventListener('click', () => {
      const open = nav.classList.toggle('open');
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
      toggle.querySelector('span').textContent = open ? '\u00d7' : '\u2630';
    });
    nav.querySelectorAll('a').forEach(link => link.addEventListener('click', closeNav));
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && nav.classList.contains('open')) {
        closeNav();
        toggle.focus();
      }
    });
    document.addEventListener('click', e => {
      if (!nav.contains(e.target) && !toggle.contains(e.target)) closeNav();
    });
  }

  // Graceful reveal effects, disabled for reduced-motion users.
  const reveals = document.querySelectorAll('.reveal');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduceMotion || !('IntersectionObserver' in window)) {
    reveals.forEach(el => el.classList.add('visible'));
  } else {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px 50px 0px', threshold: 0.06 });
    reveals.forEach(el => observer.observe(el));
  }

  // Interactive age-group filters on Programs page.
  const filterButtons = document.querySelectorAll('[data-filter]');
  const programDetails = document.querySelectorAll('[data-age]');
  function setFilter(filter) {
    if (!programDetails.length) return;
    filterButtons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.filter === filter)));
    programDetails.forEach(card => { card.hidden = filter !== 'all' && card.dataset.age !== filter; });
  }
  if (filterButtons.length) {
    filterButtons.forEach(button => button.addEventListener('click', () => setFilter(button.dataset.filter)));
    const wanted = decodeURIComponent(location.hash.slice(1));
    if (wanted && ['infants','toddlers','preschool','school'].includes(wanted)) {
      setFilter(wanted);
    }
    window.addEventListener('hashchange', () => {
      const hash = decodeURIComponent(location.hash.slice(1));
      if (['infants','toddlers','preschool','school'].includes(hash)) setFilter(hash);
    });
  }

  // FAQ: let each native <details> work without JavaScript dependencies.

  // Contact form: send through the local/Vercel server-side API.
  const form = document.querySelector('#contact-form');
  const status = document.querySelector('#form-status');
  const submit = document.querySelector('#form-submit');
  let pending = false;
  if (form && status && submit) {
    form.addEventListener('submit', async event => {
      event.preventDefault();
      if (pending) return;
      status.hidden = true;
      status.textContent = '';
      status.removeAttribute('data-state');

      form.querySelectorAll('input:not([type="checkbox"]), textarea').forEach(field => {
        if (field.type !== 'email' && field.type !== 'text' && field.type !== 'tel' && field.tagName !== 'TEXTAREA') return;
        field.value = field.value.trim();
      });
      if (!form.reportValidity()) return;
      const data = Object.fromEntries(new FormData(form).entries());
      if (data.website) return; // Honeypot: ignore automated submissions.

      pending = true;
      submit.disabled = true;
      submit.setAttribute('aria-busy', 'true');
      const controller = new AbortController();
      const timer = window.setTimeout(() => controller.abort(), 16000);

      function feedback(message, state) {
        status.hidden = false;
        status.dataset.state = state;
        status.textContent = message;
        status.focus({ preventScroll: true });
      }
      try {
        const response = await fetch('/api/contact', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify(data),
          signal: controller.signal,
          credentials: 'same-origin'
        });
        const result = await response.json().catch(() => null);
        if (response.ok && result?.success === true) {
          form.reset();
          feedback('Thank you! Your inquiry has been submitted. Please call the center if your question is time-sensitive.', 'success');
        } else if (response.status === 503) {
          feedback('Online inquiries are not configured yet. Please call (580) 776-2221 or email weathers79@gmail.com.', 'error');
        } else if (response.status === 429) {
          feedback('Please wait a moment before trying again. You can also call (580) 776-2221.', 'error');
        } else {
          feedback('We could not confirm your message. Please try again later or call the center. Your answers are still here.', 'error');
        }
      } catch (error) {
        feedback(error?.name === 'AbortError'
          ? 'We did not receive confirmation in time; your message may have arrived. Please wait before trying again, or call the center.'
          : 'The connection did not complete. Your answers are saved on this page; please check your connection or call the center.', 'error');
      } finally {
        window.clearTimeout(timer);
        pending = false;
        submit.disabled = false;
        submit.setAttribute('aria-busy', 'false');
      }
    });
  }
})();
