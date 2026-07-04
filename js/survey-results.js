(function () {
  const config = window.FIREBASE_CONFIG;
  if (!config) {
    document.body.innerHTML = '<main class="section"><div class="container"><p>Firebase is not configured for survey analytics.</p></main>';
    return;
  }

  firebase.initializeApp(config);
  const db = firebase.firestore();

  const state = { responses: [] };
  const refs = {
    totalResponses: document.getElementById('total-responses'),
    prototypeTesters: document.getElementById('prototype-testers'),
    avgRating: document.getElementById('avg-rating'),
    avgFrustration: document.getElementById('avg-frustration'),
    forgotPercent: document.getElementById('forgot-percent'),
    interestPercent: document.getElementById('interest-percent'),
    mostReminder: document.getElementById('most-reminder'),
    mostProduct: document.getElementById('most-product'),
    avgPrice: document.getElementById('avg-price'),
    betaPercent: document.getElementById('beta-percent')
  };

  const charts = {};

  const createChart = (canvasId, type, data, options = {}) => {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return null;
    return new Chart(canvas.getContext('2d'), { type, data, options });
  };

  const formatPercent = (value) => `${value.toFixed(1)}%`;
  const normalize = (value) => (Array.isArray(value) ? value : [value]);

  const updateStats = () => {
    const responses = state.responses;
    if (!responses.length) {
      Object.values(refs).forEach((element) => {
        if (element) element.textContent = '0';
      });
      return;
    }

    const totalResponses = responses.length;
    const prototypeTesters = responses.filter((item) => item.betaTester === 'Yes').length;
    const avgRating = responses.reduce((sum, item) => sum + (Number(item.recommendationRating) || 0), 0) / totalResponses;
    const avgFrustration = responses.reduce((sum, item) => sum + (Number(item.frustrationRating) || 0), 0) / totalResponses;
    const forgotPercentValue = (responses.filter((item) => item.forgotCharger === 'Yes').length / totalResponses) * 100;
    const interestPercentValue = (responses.filter((item) => ['Definitely', 'Probably'].includes(item.productInterest)).length / totalResponses) * 100;
    const betaPercentValue = (prototypeTesters / totalResponses) * 100;

    refs.totalResponses.textContent = totalResponses.toString();
    refs.prototypeTesters.textContent = prototypeTesters.toString();
    refs.avgRating.textContent = avgRating.toFixed(1);
    refs.avgFrustration.textContent = avgFrustration.toFixed(1);
    refs.forgotPercent.textContent = formatPercent(forgotPercentValue);
    refs.interestPercent.textContent = formatPercent(interestPercentValue);
    refs.betaPercent.textContent = formatPercent(betaPercentValue);

    const reminderCounts = responses.flatMap((item) => normalize(item.reminderPreference)).reduce((acc, value) => {
      acc[value] = (acc[value] || 0) + 1;
      return acc;
    }, {});
    const mostReminderValue = Object.entries(reminderCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || '—';
    refs.mostReminder.textContent = mostReminderValue;

    const productCounts = responses.reduce((acc, item) => {
      acc[item.productPreference] = (acc[item.productPreference] || 0) + 1;
      return acc;
    }, {});
    const mostProductValue = Object.entries(productCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || '—';
    refs.mostProduct.textContent = mostProductValue;

    const priceMap = { 'Less than ₹300': 150, '₹300–500': 400, '₹500–800': 650, '₹800–1000': 900, 'More than ₹1000': 1200 };
    const avgPriceValue = responses.reduce((sum, item) => sum + (priceMap[item.expectedPrice] || 0), 0) / totalResponses;
    refs.avgPrice.textContent = `₹${Math.round(avgPriceValue).toLocaleString()}`;

    renderCharts(responses);
  };

  const renderCharts = (responses) => {
    const ageLabels = ['Under 18', '18–24', '25–34', '35–44', '45+'];
    const occupationLabels = ['School Student', 'College Student', 'Employee', 'Business Owner', 'Homemaker', 'Other'];
    const chargingLabels = ['Once a day', 'Twice a day', 'More than twice', 'Only when battery is low'];
    const forgotLabels = ['Yes', 'No'];
    const problemsLabels = ['Missed an important call', 'Missed an online class or meeting', 'Phone switched off unexpectedly', 'Delayed my work', 'No major problem'];
    const reminderLabels = ['LED', 'Buzzer', 'Mobile Notification', 'Smartwatch Notification', 'Any reminder'];
    const productLabels = ['Inside Charger', 'Smart Wall Socket', 'Plug Adapter', 'Extension Board', 'Mobile App + Hardware'];
    const priceLabels = ['Less than ₹300', '₹300–500', '₹500–800', '₹800–1000', 'More than ₹1000'];
    const deviceLabels = ['Laptop', 'Tablet', 'Wireless Earbuds', 'Smartwatch', 'Power Bank', 'Camera Battery'];

    const counts = (labelSet, accessor) => labelSet.map((label) => responses.filter((item) => accessor(item, label)).length);

    createChart('ageChart', 'pie', {
      labels: ageLabels,
      datasets: [{ data: counts(ageLabels, (item, label) => item.age === label), backgroundColor: ['#2563eb', '#38bdf8', '#14b8a6', '#f59e0b', '#8b5cf6'] }]
    });

    createChart('occupationChart', 'doughnut', {
      labels: occupationLabels,
      datasets: [{ data: counts(occupationLabels, (item, label) => item.occupation === label), backgroundColor: ['#2563eb', '#38bdf8', '#14b8a6', '#f59e0b', '#ef4444', '#a78bfa'] }]
    });

    createChart('chargingChart', 'bar', {
      labels: chargingLabels,
      datasets: [{ label: 'Charging Frequency', data: counts(chargingLabels, (item, label) => item.chargingFrequency === label), backgroundColor: '#2563eb' }]
    });

    createChart('forgotChart', 'pie', {
      labels: forgotLabels,
      datasets: [{ data: counts(forgotLabels, (item, label) => item.forgotCharger === label), backgroundColor: ['#ef4444', '#14b8a6'] }]
    });

    createChart('problemsChart', 'horizontalBar', {
      labels: problemsLabels,
      datasets: [{ label: 'Problems Experienced', data: counts(problemsLabels, (item, label) => normalize(item.problems).includes(label)), backgroundColor: '#3b82f6' }]
    });

    createChart('reminderChart', 'bar', {
      labels: reminderLabels,
      datasets: [{ label: 'Reminder Preference', data: counts(reminderLabels, (item, label) => normalize(item.reminderPreference).includes(label)), backgroundColor: '#0f766e' }]
    });

    createChart('productChart', 'pie', {
      labels: productLabels,
      datasets: [{ data: counts(productLabels, (item, label) => item.productPreference === label), backgroundColor: ['#2563eb', '#38bdf8', '#0f766e', '#f59e0b', '#8b5cf6'] }]
    });

    createChart('priceChart', 'bar', {
      labels: priceLabels,
      datasets: [{ label: 'Expected Price', data: counts(priceLabels, (item, label) => item.expectedPrice === label), backgroundColor: '#22c55e' }]
    });

    createChart('devicesChart', 'radar', {
      labels: deviceLabels,
      datasets: [{ label: 'Supported Devices', data: counts(deviceLabels, (item, label) => normalize(item.supportedDevices).includes(label)), backgroundColor: 'rgba(37,99,235,0.2)', borderColor: '#2563eb', pointBackgroundColor: '#2563eb' }]
    });

    const dailyGrowth = [];
    const dates = responses.map((item) => item.timestamp?.toDate ? item.timestamp.toDate() : new Date(item.timestamp || Date.now()));
    const sortedDates = dates.sort((a, b) => a - b);
    sortedDates.forEach((date, index) => {
      dailyGrowth.push({ x: date.toLocaleDateString(), y: index + 1 });
    });

    createChart('growthChart', 'line', {
      labels: dailyGrowth.map((item) => item.x),
      datasets: [{ label: 'Survey Growth', data: dailyGrowth.map((item) => item.y), borderColor: '#0ea5e9', backgroundColor: 'rgba(14,165,233,0.12)', fill: true, tension: 0.35 }]
    });
  };

  db.collection('surveyResponses').orderBy('timestamp', 'asc').onSnapshot((snapshot) => {
    state.responses = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    updateStats();
  }, (error) => {
    console.error(error);
    document.body.innerHTML = '<main class="section"><div class="container"><p>Unable to load survey data at the moment.</p></main>';
  });
})();
