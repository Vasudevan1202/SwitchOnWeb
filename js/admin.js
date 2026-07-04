(function () {
  const config = window.FIREBASE_CONFIG;
  if (!config) {
    document.body.innerHTML = '<main class="section"><div class="container"><p>Firebase is not configured for the admin dashboard.</p></main>';
    return;
  }

  firebase.initializeApp(config);
  const auth = firebase.auth();
  const db = firebase.firestore();

  const state = { responses: [], activePage: 1, pageSize: 8, selectedResponse: null };
  const elements = {
    loginButton: document.getElementById('admin-login'),
    email: document.getElementById('admin-email'),
    password: document.getElementById('admin-password'),
    status: document.getElementById('admin-status'),
    dashboard: document.getElementById('admin-dashboard'),
    authCard: document.getElementById('admin-auth-card'),
    total: document.getElementById('admin-total'),
    beta: document.getElementById('admin-beta'),
    rating: document.getElementById('admin-rating'),
    frustration: document.getElementById('admin-frustration'),
    reminder: document.getElementById('admin-reminder'),
    price: document.getElementById('admin-price'),
    search: document.getElementById('admin-search'),
    age: document.getElementById('admin-age'),
    occupation: document.getElementById('admin-occupation'),
    interest: document.getElementById('admin-interest'),
    prototypeFilter: document.getElementById('admin-prototype-filter'),
    exportCsv: document.getElementById('admin-export-csv'),
    exportXlsx: document.getElementById('admin-export-xlsx'),
    tableBody: document.getElementById('admin-table-body'),
    emptyState: document.getElementById('admin-empty-state'),
    pagination: document.getElementById('admin-pagination'),
    detailPanel: document.getElementById('admin-detail-panel'),
    detailContent: document.getElementById('admin-detail-content'),
    ageChart: document.getElementById('admin-age-chart'),
    interestChart: document.getElementById('admin-interest-chart'),
    prototypeChart: document.getElementById('admin-prototype-chart')
  };

  const formatValue = (value) => {
    if (value === null || value === undefined || value === '') return 'N/A';
    if (Array.isArray(value)) return value.length ? value.join(', ') : 'N/A';
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    if (value && value.toDate) {
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
    return String(value);
  };

  const formatDate = (value) => formatValue(value);

  const isPrototypeTester = (response) => response.wantsPrototypeTesting === 'Yes' || response.wantsPrototypeTesting === true || response.wantsPrototypeTesting === 'true';

  const countValues = (responses, key) => {
    const counts = {};
    responses.forEach((response) => {
      const rawValue = response[key];
      const value = rawValue === null || rawValue === undefined || rawValue === '' ? 'N/A' : String(rawValue);
      counts[value] = (counts[value] || 0) + 1;
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  };

  const drawBarChart = (canvas, labels, values) => {
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const width = canvas.width = canvas.clientWidth * window.devicePixelRatio;
    const height = canvas.height = canvas.clientHeight * window.devicePixelRatio;
    ctx.setTransform(window.devicePixelRatio, 0, 0, window.devicePixelRatio, 0, 0);
    ctx.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);
    if (!labels.length) {
      ctx.fillStyle = '#475569';
      ctx.font = '14px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('No data yet', canvas.clientWidth / 2, canvas.clientHeight / 2);
      return;
    }
    const chartWidth = canvas.clientWidth - 48;
    const chartHeight = canvas.clientHeight - 40;
    const maxValue = Math.max(...values, 1);
    ctx.strokeStyle = 'rgba(15,23,42,0.12)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i += 1) {
      const y = 24 + (chartHeight / 4) * i;
      ctx.beginPath();
      ctx.moveTo(24, y);
      ctx.lineTo(canvas.clientWidth - 24, y);
      ctx.stroke();
    }
    labels.forEach((label, index) => {
      const barWidth = Math.max(18, chartWidth / labels.length / 1.4);
      const x = 24 + (index * chartWidth) / labels.length + barWidth / 4;
      const barHeight = (values[index] / maxValue) * (chartHeight - 10);
      const y = canvas.clientHeight - 20 - barHeight;
      ctx.fillStyle = ['#2563eb', '#3b82f6', '#22c55e', '#0ea5e9', '#f59e0b', '#8b5cf6'][index % 6];
      ctx.fillRect(x, y, barWidth, barHeight);
      ctx.fillStyle = '#0f172a';
      ctx.font = '11px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(label.slice(0, 10), x + barWidth / 2, canvas.clientHeight - 6);
    });
  };

  const drawDonutChart = (canvas, labels, values) => {
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const width = canvas.width = canvas.clientWidth * window.devicePixelRatio;
    const height = canvas.height = canvas.clientHeight * window.devicePixelRatio;
    ctx.setTransform(window.devicePixelRatio, 0, 0, window.devicePixelRatio, 0, 0);
    ctx.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);
    if (!labels.length) {
      ctx.fillStyle = '#475569';
      ctx.font = '14px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('No data yet', canvas.clientWidth / 2, canvas.clientHeight / 2);
      return;
    }
    const total = values.reduce((sum, value) => sum + value, 0) || 1;
    const centerX = canvas.clientWidth / 2;
    const centerY = canvas.clientHeight / 2;
    const radius = Math.min(canvas.clientWidth, canvas.clientHeight) / 2 - 24;
    let startAngle = -0.5 * Math.PI;
    const colors = ['#2563eb', '#3b82f6', '#22c55e', '#f59e0b'];
    values.forEach((value, index) => {
      const slice = (value / total) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, startAngle, startAngle + slice);
      ctx.closePath();
      ctx.fillStyle = colors[index % colors.length];
      ctx.fill();
      startAngle += slice;
    });
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius * 0.55, 0, Math.PI * 2);
    ctx.fillStyle = '#f8fafc';
    ctx.fill();
  };

  const renderCharts = (responses) => {
    const ageGroups = countValues(responses, 'ageGroup');
    const interests = countValues(responses, 'productInterest');
    const prototypeCounts = [
      ['Yes', responses.filter((response) => isPrototypeTester(response)).length],
      ['No', responses.filter((response) => !isPrototypeTester(response)).length]
    ];
    drawBarChart(elements.ageChart, ageGroups.map(([label]) => label), ageGroups.map(([, count]) => count));
    drawBarChart(elements.interestChart, interests.map(([label]) => label), interests.map(([, count]) => count));
    drawDonutChart(elements.prototypeChart, prototypeCounts.map(([label]) => label), prototypeCounts.map(([, count]) => count));
  };

  const getFilteredResponses = () => {
    const query = elements.search.value.trim().toLowerCase();
    const ageFilter = elements.age.value;
    const occupationFilter = elements.occupation.value;
    const interestFilter = elements.interest.value;
    const prototypeFilter = elements.prototypeFilter.value;

    return state.responses.filter((response) => {
      const haystack = [response.name, response.email, response.phone, response.city, response.ageGroup, response.occupation, response.productInterest].join(' ').toLowerCase();
      const matchesQuery = !query || haystack.includes(query);
      const matchesAge = !ageFilter || response.ageGroup === ageFilter;
      const matchesOccupation = !occupationFilter || response.occupation === occupationFilter;
      const matchesInterest = !interestFilter || response.productInterest === interestFilter;
      const matchesPrototype = !prototypeFilter || response.wantsPrototypeTesting === prototypeFilter;
      return matchesQuery && matchesAge && matchesOccupation && matchesInterest && matchesPrototype;
    });
  };

  const renderStats = (filtered) => {
    elements.total.textContent = filtered.length;
    elements.beta.textContent = filtered.filter((item) => isPrototypeTester(item)).length;
    elements.rating.textContent = (filtered.reduce((sum, item) => sum + (Number(item.recommendationRating) || 0), 0) / (filtered.length || 1)).toFixed(1);
    elements.frustration.textContent = (filtered.reduce((sum, item) => sum + (Number(item.frustrationRating) || 0), 0) / (filtered.length || 1)).toFixed(1);

    const reminderCounts = filtered.flatMap((item) => Array.isArray(item.reminderPreference) ? item.reminderPreference : [item.reminderPreference]).reduce((acc, value) => {
      if (!value) return acc;
      acc[value] = (acc[value] || 0) + 1;
      return acc;
    }, {});
    const mostReminder = Object.entries(reminderCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';
    elements.reminder.textContent = mostReminder;

    const priceMap = { 'Less than ₹300': 150, '₹300–500': 400, '₹500–800': 650, '₹800–1000': 900, 'More than ₹1000': 1200 };
    const avgPrice = filtered.reduce((sum, item) => sum + (priceMap[item.priceExpectation] || 0), 0) / (filtered.length || 1);
    elements.price.textContent = filtered.length ? `₹${Math.round(avgPrice).toLocaleString()}` : 'N/A';
  };

  const renderTable = () => {
    const filtered = getFilteredResponses();
    renderStats(filtered);
    const totalPages = Math.max(1, Math.ceil(filtered.length / state.pageSize));
    if (state.activePage > totalPages) state.activePage = totalPages;

    const start = (state.activePage - 1) * state.pageSize;
    const pageRows = filtered.slice(start, start + state.pageSize);

    elements.tableBody.innerHTML = pageRows.length ? pageRows.map((response) => `
      <tr>
        <td><button class="link-btn" data-action="view" data-id="${response.id}">${formatValue(response.name || response.prototypeName)}</button></td>
        <td>${formatValue(response.email || response.prototypeEmail)}</td>
        <td>${formatValue(response.phone || response.prototypePhone)}</td>
        <td>${formatValue(response.city)}</td>
        <td>${formatValue(response.ageGroup)}</td>
        <td>${formatValue(response.occupation)}</td>
        <td>${formatValue(response.productInterest)}</td>
        <td>${isPrototypeTester(response) ? '<span class="status-badge completed">Yes</span>' : '<span class="status-badge upcoming">No</span>'}</td>
        <td>${formatDate(response.submittedAt)}</td>
        <td>
          <button class="icon-btn" data-action="view" data-id="${response.id}">View</button>
          <button class="icon-btn" data-action="copy" data-id="${response.id}">Copy</button>
          <button class="icon-btn" data-action="print" data-id="${response.id}">Print</button>
          <button class="icon-btn danger" data-action="delete" data-id="${response.id}">Delete</button>
        </td>
      </tr>
    `).join('') : '';

    elements.emptyState.hidden = filtered.length > 0;
    elements.emptyState.style.display = filtered.length ? 'none' : 'grid';
    renderCharts(filtered);
    elements.pagination.innerHTML = Array.from({ length: totalPages }, (_, index) => `<button class="page-chip ${state.activePage === index + 1 ? 'active' : ''}" data-page="${index + 1}">${index + 1}</button>`).join('');
  };

  const exportResponses = () => {
    const rows = getFilteredResponses();
    const headers = ['name','email','phone','city','ageGroup','occupation','chargingFrequency','forgotSwitch','forgotFrequency','realizationMethods','problemsExperienced','frustrationRating','productInterest','reminderPreference','integrationPreference','priceExpectation','recommendationRating','supportedDevices','chargingLocation','suggestions','wantsPrototypeTesting','prototypeName','prototypeEmail','prototypePhone','submittedAt'];
    const csvRows = rows.map((response) => headers.map((key) => `"${String(formatValue(response[key])).replace(/"/g, '""')}"`).join(','));
    const csv = [headers.join(','), ...csvRows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'switchon-responses.csv';
    link.click();
  };

  const openDetail = (response) => {
    const labels = {
      name: 'Name',
      email: 'Email',
      phone: 'Phone',
      city: 'City',
      ageGroup: 'Age Group',
      occupation: 'Occupation',
      chargingFrequency: 'Charging Frequency',
      forgotSwitch: 'Forgot Switch',
      forgotFrequency: 'Forgot Frequency',
      realizationMethods: 'Realization Methods',
      problemsExperienced: 'Problems Experienced',
      frustrationRating: 'Frustration Rating',
      productInterest: 'Product Interest',
      reminderPreference: 'Reminder Preference',
      integrationPreference: 'Integration Preference',
      priceExpectation: 'Price Expectation',
      recommendationRating: 'Recommendation Rating',
      supportedDevices: 'Supported Devices',
      chargingLocation: 'Charging Location',
      suggestions: 'Suggestions',
      wantsPrototypeTesting: 'Prototype Testing',
      prototypeName: 'Prototype Name',
      prototypeEmail: 'Prototype Email',
      prototypePhone: 'Prototype Phone',
      submittedAt: 'Submitted At'
    };
    const entries = Object.entries(response).filter(([key]) => key !== 'id');
    elements.detailContent.innerHTML = entries.map(([key, value]) => `
      <div class="detail-row">
        <span class="detail-label">${labels[key] || key}</span>
        <span class="detail-value">${formatValue(value)}</span>
      </div>
    `).join('');
    elements.detailPanel.hidden = false;
  };

  const populateFilters = () => {
    const ages = [...new Set(state.responses.map((item) => item.ageGroup).filter(Boolean))];
    const occupations = [...new Set(state.responses.map((item) => item.occupation).filter(Boolean))];
    const interests = [...new Set(state.responses.map((item) => item.productInterest).filter(Boolean))];
    elements.age.innerHTML = ['<option value="">All Ages</option>', ...ages.map((value) => `<option value="${value}">${value}</option>`)].join('');
    elements.occupation.innerHTML = ['<option value="">All Occupations</option>', ...occupations.map((value) => `<option value="${value}">${value}</option>`)].join('');
    elements.interest.innerHTML = ['<option value="">All Interests</option>', ...interests.map((value) => `<option value="${value}">${value}</option>`)].join('');
  };

  const loadResponses = () => {
    db.collection('surveyResponses').orderBy('submittedAt', 'desc').onSnapshot((snapshot) => {
      snapshot.docs.forEach((doc) => {
        console.log(doc.data());
      });
      state.responses = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      populateFilters();
      renderTable();
    });
  };

  elements.loginButton.addEventListener('click', async () => {
    try {
      await auth.signInWithEmailAndPassword(elements.email.value, elements.password.value);
      elements.status.textContent = 'Signed in.';
      elements.status.className = 'form-status success';
      elements.authCard.hidden = true;
      elements.dashboard.hidden = false;
      loadResponses();
    } catch (error) {
      elements.status.textContent = 'Login failed.';
      elements.status.className = 'form-status error';
    }
  });

  elements.exportCsv.addEventListener('click', exportResponses);
  elements.exportXlsx.addEventListener('click', exportResponses);

  ['input', 'change'].forEach((eventName) => {
    [elements.search, elements.age, elements.occupation, elements.interest, elements.prototypeFilter].forEach((element) => {
      element.addEventListener(eventName, () => {
        state.activePage = 1;
        renderTable();
      });
    });
  });

  elements.pagination.addEventListener('click', (event) => {
    const button = event.target.closest('[data-page]');
    if (!button) return;
    state.activePage = Number(button.dataset.page);
    renderTable();
  });

  elements.tableBody.addEventListener('click', (event) => {
    const button = event.target.closest('[data-action]');
    if (!button) return;
    const response = state.responses.find((item) => item.id === button.dataset.id);
    if (!response) return;
    const action = button.dataset.action;
    if (action === 'view') openDetail(response);
    if (action === 'copy') {
      navigator.clipboard.writeText(`${response.name || ''}\n${response.email || ''}\n${response.phone || ''}`);
      elements.status.textContent = 'Respondent details copied.';
      elements.status.className = 'form-status success';
    }
    if (action === 'print') window.print();
    if (action === 'delete' && confirm('Delete this response permanently?')) {
      db.collection('surveyResponses').doc(response.id).delete();
      elements.status.textContent = 'Response deleted.';
      elements.status.className = 'form-status success';
    }
  });

  document.getElementById('admin-close-detail').addEventListener('click', () => {
    elements.detailPanel.hidden = true;
  });

  elements.detailPanel.addEventListener('click', (event) => {
    if (event.target.id === 'admin-detail-panel') elements.detailPanel.hidden = true;
  });
})();
