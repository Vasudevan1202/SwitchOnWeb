(function () {
  const config = window.FIREBASE_CONFIG;
  if (!config) {
    document.body.innerHTML = '<main class="section"><div class="container"><p>Firebase is not configured for feedback.</p></main>';
    return;
  }

  firebase.initializeApp(config);
  const db = firebase.firestore();
  const form = document.getElementById('feedback-form');
  const submitButton = document.getElementById('feedback-submit');
  const status = document.getElementById('feedback-status');
  const stars = document.getElementById('feedback-stars');
  const ratingInput = document.getElementById('feedback-rating');
  const wall = document.getElementById('feedback-wall');
  const pagination = document.getElementById('feedback-pagination');
  const totalElement = document.getElementById('feedback-total');
  const avgRatingElement = document.getElementById('feedback-average-rating');
  const avgPurchaseElement = document.getElementById('feedback-average-purchase');
  const mostFeatureElement = document.getElementById('feedback-most-feature');
  const pageSize = 6;
  let currentPage = 1;
  let feedbackItems = [];
  let submitting = false;

  const escapeHtml = (value) => String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

  const setStatus = (message, type = '') => {
    status.textContent = message;
    status.className = `form-status ${type}`.trim();
  };

  const formatDate = (value) => {
    if (!value) return 'N/A';
    if (value.toDate) {
      const date = value.toDate();
      return date.toLocaleString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    }
    return new Date(value).toLocaleString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const renderStars = (rating) => '★'.repeat(Number(rating || 0));

  const renderWall = () => {
    const totalPages = Math.max(1, Math.ceil(feedbackItems.length / pageSize));
    currentPage = Math.min(currentPage, totalPages);
    const start = (currentPage - 1) * pageSize;
    const pageItems = feedbackItems.slice(start, start + pageSize);

    if (!pageItems.length) {
      wall.innerHTML = '<div class="empty-state"><div class="empty-state-icon">💬</div><h4>No approved feedback yet</h4><p>Be the first to share something thoughtful with the community.</p></div>';
      pagination.innerHTML = '';
      return;
    }

    wall.innerHTML = pageItems.map((item) => `
      <article class="feedback-card glass">
        <div class="feedback-card-top">
          <div class="feedback-stars">${renderStars(item.rating)}</div>
          <span class="status-badge completed">Approved</span>
        </div>
        <p class="feedback-message">${escapeHtml(item.feedback || 'N/A')}</p>
        <div class="feedback-meta-block">
          <p><strong>Liked:</strong> ${escapeHtml(item.likes || 'N/A')}</p>
          <p><strong>Suggestions:</strong> ${escapeHtml(item.improvements || 'N/A')}</p>
          <p><strong>Purchase Interest:</strong> ${escapeHtml(item.purchaseInterest || 'N/A')}</p>
          <p><strong>Price Expectation:</strong> ${escapeHtml(item.priceExpectation || 'N/A')}</p>
        </div>
        <div class="feedback-card-footer">
          <span><strong>Name:</strong> ${escapeHtml(item.anonymous ? 'Anonymous User' : (item.name || 'Anonymous User'))}</span>
          <span>${escapeHtml(formatDate(item.submittedAt))}</span>
        </div>
      </article>
    `).join('');

    pagination.innerHTML = Array.from({ length: totalPages }, (_, index) => `<button class="page-chip ${currentPage === index + 1 ? 'active' : ''}" data-page="${index + 1}">${index + 1}</button>`).join('');
  };

  const renderStats = () => {
    totalElement.textContent = feedbackItems.length;
    const avgRating = feedbackItems.reduce((sum, item) => sum + Number(item.rating || 0), 0) / (feedbackItems.length || 1);
    avgRatingElement.textContent = avgRating.toFixed(1);
    const purchaseValues = { Definitely: 5, Probably: 4, Maybe: 3, 'Probably Not': 2, No: 1 };
    const avgPurchase = feedbackItems.reduce((sum, item) => sum + (purchaseValues[item.purchaseInterest] || 0), 0) / (feedbackItems.length || 1);
    avgPurchaseElement.textContent = avgPurchase.toFixed(1);
    const featureCounts = feedbackItems.reduce((acc, item) => {
      const feature = item.improvements || item.likes || 'General feedback';
      acc[feature] = (acc[feature] || 0) + 1;
      return acc;
    }, {});
    const mostSuggested = Object.entries(featureCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';
    mostFeatureElement.textContent = mostSuggested.length > 24 ? `${mostSuggested.slice(0, 24)}…` : mostSuggested;
  };

  const loadFeedback = () => {
    db.collection('feedback').where('approved', '==', true).orderBy('submittedAt', 'desc').onSnapshot((snapshot) => {
      feedbackItems = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      renderStats();
      renderWall();
    });
  };

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (submitting) return;

    const rating = Number(ratingInput.value || 0);
    const feedback = document.getElementById('feedback-message').value.trim();
    if (!rating || !feedback) {
      setStatus('Please provide a rating and a feedback message.', 'error');
      return;
    }

    const email = document.getElementById('feedback-email').value.trim();
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setStatus('Please enter a valid email address if you provide one.', 'error');
      return;
    }

    submitting = true;
    submitButton.classList.add('is-loading');
    submitButton.disabled = true;
    setStatus('Submitting your feedback securely…', '');

    try {
      const payload = {
        name: document.getElementById('feedback-anonymous').checked ? '' : document.getElementById('feedback-name').value.trim(),
        email: document.getElementById('feedback-anonymous').checked ? '' : email,
        anonymous: document.getElementById('feedback-anonymous').checked,
        rating,
        feedback,
        likes: document.getElementById('feedback-likes').value.trim(),
        improvements: document.getElementById('feedback-improvements').value.trim(),
        purchaseInterest: document.getElementById('feedback-purchase').value,
        priceExpectation: document.getElementById('feedback-price').value,
        approved: false,
        submittedAt: firebase.firestore.FieldValue.serverTimestamp()
      };
      await db.collection('feedback').add(payload);
      form.reset();
      ratingInput.value = '';
      setStatus('Thank you for sharing your feedback. It is now pending approval.', 'success');
    } catch (error) {
      console.error(error);
      setStatus('Submission failed. Please try again in a moment.', 'error');
    } finally {
      submitting = false;
      submitButton.classList.remove('is-loading');
      submitButton.disabled = false;
    }
  });

  stars.addEventListener('click', (event) => {
    const button = event.target.closest('.star-btn');
    if (!button) return;
    const value = button.dataset.value;
    ratingInput.value = value;
    Array.from(stars.querySelectorAll('.star-btn')).forEach((star) => {
      star.classList.toggle('active', Number(star.dataset.value) <= Number(value));
    });
  });

  pagination.addEventListener('click', (event) => {
    const button = event.target.closest('[data-page]');
    if (!button) return;
    currentPage = Number(button.dataset.page);
    renderWall();
  });

  loadFeedback();
})();
