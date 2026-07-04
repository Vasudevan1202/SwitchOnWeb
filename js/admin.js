(function () {
  const config = window.FIREBASE_CONFIG;
  if (!config) {
    document.body.innerHTML = '<main class="section"><div class="container"><p>Firebase is not configured for the admin dashboard.</p></main>';
    return;
  }

  firebase.initializeApp(config);
  const auth = firebase.auth();
  const db = firebase.firestore();

  const state = { responses: [] };
  const elements = {
    loginButton: document.getElementById('admin-login'),
    email: document.getElementById('admin-email'),
    password: document.getElementById('admin-password'),
    status: document.getElementById('admin-status'),
    dashboard: document.getElementById('admin-dashboard'),
    total: document.getElementById('admin-total'),
    beta: document.getElementById('admin-beta'),
    rating: document.getElementById('admin-rating'),
    frustration: document.getElementById('admin-frustration'),
    search: document.getElementById('admin-search'),
    age: document.getElementById('admin-age'),
    occupation: document.getElementById('admin-occupation'),
    ratingFilter: document.getElementById('admin-rating-filter'),
    exportButton: document.getElementById('admin-export'),
    list: document.getElementById('admin-list')
  };

  const renderResponses = () => {
    const query = elements.search.value.trim().toLowerCase();
    const ageFilter = elements.age.value;
    const occupationFilter = elements.occupation.value;
    const ratingFilter = elements.ratingFilter.value;

    const filtered = state.responses.filter((response) => {
      const matchesQuery = !query || [response.name, response.email, response.age, response.occupation, response.productPreference].join(' ').toLowerCase().includes(query);
      const matchesAge = !ageFilter || response.age === ageFilter;
      const matchesOccupation = !occupationFilter || response.occupation === occupationFilter;
      const matchesRating = !ratingFilter || String(response.recommendationRating) === ratingFilter;
      return matchesQuery && matchesAge && matchesOccupation && matchesRating;
    });

    elements.total.textContent = filtered.length;
    elements.beta.textContent = filtered.filter((item) => item.betaTester === 'Yes').length;
    elements.rating.textContent = (filtered.reduce((sum, item) => sum + (Number(item.recommendationRating) || 0), 0) / (filtered.length || 1)).toFixed(1);
    elements.frustration.textContent = (filtered.reduce((sum, item) => sum + (Number(item.frustrationRating) || 0), 0) / (filtered.length || 1)).toFixed(1);

    elements.list.innerHTML = filtered.slice(0, 15).map((response) => `
      <div class="contact-meta-item" style="margin-bottom: 0.6rem;">
        <strong>${response.name || response.email || 'Anonymous'}</strong>
        <p>${response.age || '—'} • ${response.occupation || '—'} • Rating ${response.recommendationRating || '—'}</p>
        <div class="decision-actions">
          <button class="btn btn-secondary" onclick="window.deleteSurveyResponse('${response.id}')">Delete</button>
        </div>
      </div>
    `).join('');
  };

  window.deleteSurveyResponse = async (id) => {
    if (!confirm('Delete this survey response?')) return;
    await db.collection('surveyResponses').doc(id).delete();
    elements.status.textContent = 'Response deleted.';
    elements.status.className = 'form-status success';
  };

  const populateFilters = () => {
    const ages = [...new Set(state.responses.map((item) => item.age).filter(Boolean))];
    const occupations = [...new Set(state.responses.map((item) => item.occupation).filter(Boolean))];
    elements.age.innerHTML = ['<option value="">All</option>', ...ages.map((value) => `<option value="${value}">${value}</option>`)].join('');
    elements.occupation.innerHTML = ['<option value="">All</option>', ...occupations.map((value) => `<option value="${value}">${value}</option>`)].join('');
  };

  const loadResponses = () => {
    db.collection('surveyResponses').orderBy('timestamp', 'desc').onSnapshot((snapshot) => {
      state.responses = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      populateFilters();
      renderResponses();
    });
  };

  elements.loginButton.addEventListener('click', async () => {
    try {
      await auth.signInWithEmailAndPassword(elements.email.value, elements.password.value);
      elements.status.textContent = 'Signed in.';
      elements.status.className = 'form-status success';
      elements.dashboard.hidden = false;
      loadResponses();
    } catch (error) {
      elements.status.textContent = 'Login failed.';
      elements.status.className = 'form-status error';
    }
  });

  elements.exportButton.addEventListener('click', () => {
    const headers = ['Name', 'Email', 'Phone', 'Age', 'Occupation', 'Charging Frequency', 'Forgot Charger', 'Frequency', 'Realization', 'Problems', 'Frustration Rating', 'Product Interest', 'Reminder Preference', 'Product Preference', 'Expected Price', 'Recommendation Rating', 'Supported Devices', 'Charging Location', 'Suggestions', 'Beta Tester', 'Timestamp'];
    const rows = state.responses.map((response) => [response.name || '', response.email || '', response.phone || '', response.age || '', response.occupation || '', response.chargingFrequency || '', response.forgotCharger || '', response.frequency || '', (response.realization || []).join('; '), (response.problems || []).join('; '), response.frustrationRating || '', response.productInterest || '', (response.reminderPreference || []).join('; '), response.productPreference || '', response.expectedPrice || '', response.recommendationRating || '', (response.supportedDevices || []).join('; '), response.chargingLocation || '', response.suggestions || '', response.betaTester || '', response.timestamp?.toDate ? response.timestamp.toDate().toISOString() : '']);
    const csv = [headers.join(','), ...rows.map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'switchon-survey-responses.csv';
    link.click();
  });

  ['input', 'change'].forEach((eventName) => {
    [elements.search, elements.age, elements.occupation, elements.ratingFilter].forEach((element) => {
      element.addEventListener(eventName, renderResponses);
    });
  });
})();
