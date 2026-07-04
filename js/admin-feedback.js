(function () {
  const config = window.FIREBASE_CONFIG;
  if (!config) return;

  firebase.initializeApp(config);
  const db = firebase.firestore();
  const feedbackCollection = db.collection('feedback');
  const feedbackList = document.getElementById('admin-feedback-list');
  const feedbackEmpty = document.getElementById('admin-feedback-empty');
  const searchInput = document.getElementById('feedback-search');
  const ratingFilter = document.getElementById('feedback-rating-filter');
  const purchaseFilter = document.getElementById('feedback-purchase-filter');
  const anonymousFilter = document.getElementById('feedback-anonymous-filter');
  const exportCsvButton = document.getElementById('feedback-export-csv');
  const exportXlsxButton = document.getElementById('feedback-export-xlsx');
  const detailPanel = document.getElementById('admin-detail-panel');
  const detailContent = document.getElementById('admin-detail-content');
  const closeDetailButton = document.getElementById('admin-close-detail');
  const stats = {
    total: document.getElementById('feedback-admin-total'),
    average: document.getElementById('feedback-admin-average'),
    purchase: document.getElementById('feedback-admin-purchase'),
    feature: document.getElementById('feedback-admin-feature'),
    price: document.getElementById('feedback-admin-price'),
    anonymous: document.getElementById('feedback-admin-anonymous')
  };
  let feedbackItems = [];

  const escapeHtml = (value) => String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

  const formatDate = (value) => {
    if (!value) return 'N/A';
    if (value.toDate) return value.toDate().toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true });
    return new Date(value).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true });
  };

  const getFilteredFeedback = () => {
    const query = searchInput.value.trim().toLowerCase();
    return feedbackItems.filter((item) => {
      const haystack = [item.feedback, item.likes, item.improvements, item.name, item.email, item.purchaseInterest, item.priceExpectation].join(' ').toLowerCase();
      const matchesQuery = !query || haystack.includes(query);
      const matchesRating = !ratingFilter.value || String(item.rating) === ratingFilter.value;
      const matchesPurchase = !purchaseFilter.value || item.purchaseInterest === purchaseFilter.value;
      const matchesAnonymous = !anonymousFilter.value || String(item.anonymous) === anonymousFilter.value;
      return matchesQuery && matchesRating && matchesPurchase && matchesAnonymous;
    });
  };

  const renderStats = (items) => {
    stats.total.textContent = items.length;
    const avgRating = items.reduce((sum, item) => sum + Number(item.rating || 0), 0) / (items.length || 1);
    stats.average.textContent = avgRating.toFixed(1);
    const purchaseValues = { Definitely: 5, Probably: 4, Maybe: 3, 'Probably Not': 2, No: 1 };
    const avgPurchase = items.reduce((sum, item) => sum + (purchaseValues[item.purchaseInterest] || 0), 0) / (items.length || 1);
    stats.purchase.textContent = avgPurchase.toFixed(1);
    const featureCounts = items.reduce((acc, item) => {
      const feature = item.improvements || item.likes || 'General feedback';
      acc[feature] = (acc[feature] || 0) + 1;
      return acc;
    }, {});
    stats.feature.textContent = Object.entries(featureCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';
    const priceMap = { 'Less than ₹300': 150, '₹300–₹500': 400, '₹500–₹800': 650, '₹800–₹1000': 900, 'More than ₹1000': 1200 };
    const avgPrice = items.reduce((sum, item) => sum + (priceMap[item.priceExpectation] || 0), 0) / (items.length || 1);
    stats.price.textContent = items.length ? `₹${Math.round(avgPrice).toLocaleString()}` : 'N/A';
    stats.anonymous.textContent = items.filter((item) => item.anonymous).length;
  };

  const openDetail = (item) => {
    const rows = [
      ['Rating', item.rating || 'N/A'],
      ['Name', item.anonymous ? 'Anonymous' : (item.name || 'N/A')],
      ['Email', item.anonymous ? 'Anonymous' : (item.email || 'N/A')],
      ['Anonymous', item.anonymous ? 'Yes' : 'No'],
      ['Purchase Interest', item.purchaseInterest || 'N/A'],
      ['Price Expectation', item.priceExpectation || 'N/A'],
      ['Likes', item.likes || 'N/A'],
      ['Improvements', item.improvements || 'N/A'],
      ['Feedback', item.feedback || 'N/A'],
      ['Approval Status', item.approved ? 'Approved' : 'Pending'],
      ['Submitted Date', formatDate(item.submittedAt)]
    ];
    detailContent.innerHTML = rows.map(([label, value]) => `
      <div class="detail-row">
        <span class="detail-label">${escapeHtml(label)}</span>
        <span class="detail-value">${escapeHtml(value)}</span>
      </div>
    `).join('');
    detailPanel.hidden = false;
  };

  const renderList = () => {
    const filtered = getFilteredFeedback();
    renderStats(filtered);
    if (!filtered.length) {
      feedbackEmpty.hidden = false;
      feedbackList.innerHTML = '';
      return;
    }
    feedbackEmpty.hidden = true;
    feedbackList.innerHTML = `
      <div class="table-wrap">
        <table class="admin-table feedback-admin-table">
          <thead>
            <tr>
              <th>Rating</th>
              <th>Name</th>
              <th>Email</th>
              <th>Anonymous</th>
              <th>Purchase Interest</th>
              <th>Submitted Date</th>
              <th>Approval Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${filtered.map((item) => `
              <tr class="feedback-admin-row" data-id="${item.id}">
                <td>${escapeHtml(item.rating || 'N/A')}</td>
                <td>${escapeHtml(item.anonymous ? 'Anonymous' : (item.name || 'N/A'))}</td>
                <td>${escapeHtml(item.anonymous ? 'Anonymous' : (item.email || 'N/A'))}</td>
                <td>${escapeHtml(item.anonymous ? 'Yes' : 'No')}</td>
                <td>${escapeHtml(item.purchaseInterest || 'N/A')}</td>
                <td>${escapeHtml(formatDate(item.submittedAt))}</td>
                <td><span class="status-badge ${item.approved ? 'approved' : 'pending'}">${item.approved ? 'Approved' : 'Pending'}</span></td>
                <td>
                  <div class="admin-feedback-actions">
                    <button class="icon-btn" data-action="approve" data-id="${item.id}">Approve</button>
                    <button class="icon-btn" data-action="reject" data-id="${item.id}">Reject</button>
                    <button class="icon-btn danger" data-action="delete" data-id="${item.id}">Delete</button>
                  </div>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  };

  const exportFeedback = () => {
    const rows = getFilteredFeedback();
    const headers = ['name', 'email', 'anonymous', 'rating', 'feedback', 'likes', 'improvements', 'purchaseInterest', 'priceExpectation', 'approved', 'submittedAt'];
    const csv = [headers.join(','), ...rows.map((item) => headers.map((key) => `"${String(item[key] ?? '').replace(/"/g, '""')}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'switchon-feedback.csv';
    link.click();
  };

  const updateFeedback = async (action, itemId) => {
    const feedbackDoc = feedbackItems.find((item) => item.id === itemId);
    if (!feedbackDoc) return;
    if (action === 'approve') {
      await feedbackCollection.doc(feedbackDoc.id).update({ approved: true });
    } else if (action === 'reject') {
      await feedbackCollection.doc(feedbackDoc.id).update({ approved: false });
    } else if (action === 'delete') {
      await feedbackCollection.doc(feedbackDoc.id).delete();
    }
  };

  const loadFeedback = () => {
    feedbackCollection.orderBy('submittedAt', 'desc').onSnapshot((snapshot) => {
      snapshot.docs.forEach((doc) => console.log(doc.id, doc.data()));
      feedbackItems = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      renderList();
    }, (error) => {
      console.error('Failed to load feedback:', error);
      feedbackEmpty.hidden = false;
      feedbackList.innerHTML = '';
      feedbackEmpty.querySelector('h4').textContent = 'No feedback available.';
      feedbackEmpty.querySelector('p').textContent = 'Unable to load feedback from Firestore right now.';
    });
  };

  feedbackList.addEventListener('click', async (event) => {
    const button = event.target.closest('[data-action]');
    if (button) {
      event.stopPropagation();
      await updateFeedback(button.dataset.action, button.dataset.id);
      return;
    }
    const row = event.target.closest('tr[data-id]');
    if (!row) return;
    const feedbackDoc = feedbackItems.find((item) => item.id === row.dataset.id);
    if (feedbackDoc) openDetail(feedbackDoc);
  });

  [searchInput, ratingFilter, purchaseFilter, anonymousFilter].forEach((element) => {
    element.addEventListener('input', renderList);
    element.addEventListener('change', renderList);
  });

  closeDetailButton.addEventListener('click', () => {
    detailPanel.hidden = true;
  });

  detailPanel.addEventListener('click', (event) => {
    if (event.target.id === 'admin-detail-panel') detailPanel.hidden = true;
  });

  exportCsvButton.addEventListener('click', exportFeedback);
  exportXlsxButton.addEventListener('click', exportFeedback);

  loadFeedback();
})();
