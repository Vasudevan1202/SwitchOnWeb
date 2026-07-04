(function () {
  const STORAGE_KEY = 'switchon-survey-submitted';
  const surveySteps = [
    {
      id: 'about',
      title: 'About You',
      description: 'A quick introduction to understand who is experiencing this everyday charging issue.',
      questions: [
        { name: 'age', type: 'radio', label: 'What is your age group?', options: ['Under 18', '18–24', '25–34', '35–44', '45+'], required: true },
        { name: 'occupation', type: 'radio', label: 'What is your current occupation?', options: ['School Student', 'College Student', 'Employee', 'Business Owner', 'Homemaker', 'Other'], required: true }
      ]
    },
    {
      id: 'habits',
      title: 'Charging Habits',
      description: 'These questions help us understand how often this problem affects daily charging habits.',
      questions: [
        { name: 'chargingFrequency', type: 'radio', label: 'How often do you charge your phone?', options: ['Once a day', 'Twice a day', 'More than twice', 'Only when battery is low'], required: true },
        { name: 'forgotCharger', type: 'radio', label: 'Have you ever plugged your phone into the charger but forgotten to turn ON the wall switch?', options: ['Yes', 'No'], required: true },
        { name: 'frequency', type: 'radio', label: 'If yes, how often does this happen?', options: ['Daily', 'Weekly', 'Monthly', 'Rarely', 'Never'], required: false, visibleWhen: (responses) => responses.forgotCharger === 'Yes' },
        { name: 'realization', type: 'checkbox', label: 'How did you realize your phone was not charging?', options: ['Checked the battery later', 'Needed the phone urgently', 'Battery percentage did not increase', 'Someone informed me', 'Other'], required: true },
        { name: 'problems', type: 'checkbox', label: 'Has this ever caused any of these problems?', options: ['Missed an important call', 'Missed an online class or meeting', 'Phone switched off unexpectedly', 'Delayed my work', 'No major problem'], required: true },
        { name: 'frustrationRating', type: 'rating', label: 'How frustrating is this problem?', required: true }
      ]
    },
    {
      id: 'validation',
      title: 'SwitchOn Validation',
      description: 'Your feedback will help us shape the ideal reminder experience and product form factor.',
      questions: [
        { name: 'productInterest', type: 'radio', label: 'If a device could remind you immediately that your phone is plugged in but the wall switch is OFF, would you use it?', options: ['Definitely', 'Probably', 'Not sure', 'Probably not', 'Definitely not'], required: true },
        { name: 'reminderPreference', type: 'checkbox', label: 'Which reminder would you prefer?', options: ['LED', 'Buzzer', 'Mobile Notification', 'Smartwatch Notification', 'Any reminder'], required: true },
        { name: 'productPreference', type: 'radio', label: 'Where would you like this feature integrated?', options: ['Inside Charger', 'Smart Wall Socket', 'Plug Adapter', 'Extension Board', 'Mobile App + Hardware'], required: true },
        { name: 'expectedPrice', type: 'radio', label: 'How much would you pay?', options: ['Less than ₹300', '₹300–500', '₹500–800', '₹800–1000', 'More than ₹1000'], required: true },
        { name: 'recommendationRating', type: 'rating', label: 'How likely are you to recommend this product?', required: true },
        { name: 'supportedDevices', type: 'checkbox', label: 'Besides phones, what other devices should support this?', options: ['Laptop', 'Tablet', 'Wireless Earbuds', 'Smartwatch', 'Power Bank', 'Camera Battery'], required: true },
        { name: 'chargingLocation', type: 'radio', label: 'Where do you usually charge your phone?', options: ['Bedroom', 'Living Room', 'Home Office', 'Kitchen', 'Other'], required: true },
        { name: 'suggestions', type: 'textarea', label: 'Any suggestions?', required: false },
        { name: 'betaTester', type: 'radio', label: 'Would you like to become a prototype tester?', options: ['Yes', 'No'], required: true }
      ]
    },
    {
      id: 'beta',
      title: 'Prototype Tester',
      description: 'We would love to invite a few passionate users to try the first version of SwitchOn.',
      questions: [
        { name: 'name', type: 'text', label: 'Name', required: true, visibleWhen: (responses) => responses.betaTester === 'Yes' },
        { name: 'email', type: 'email', label: 'Email', required: true, visibleWhen: (responses) => responses.betaTester === 'Yes' },
        { name: 'phone', type: 'text', label: 'Phone Number', required: true, visibleWhen: (responses) => responses.betaTester === 'Yes' }
      ]
    }
  ];

  const state = { currentStep: 0, responses: {}, isSubmitting: false };
  const alreadySubmitted = localStorage.getItem(STORAGE_KEY);
  const surveyShell = document.getElementById('survey-shell');
  const stepContent = document.getElementById('survey-step-content');
  const stepTitle = document.getElementById('step-title');
  const stepDescription = document.getElementById('step-description');
  const progressBar = document.getElementById('survey-progress-fill');
  const stepIndicator = document.getElementById('step-indicator');
  const prevButton = document.getElementById('survey-prev');
  const nextButton = document.getElementById('survey-next');
  const submitButton = document.getElementById('survey-submit');
  const status = document.getElementById('survey-status');
  const successState = document.getElementById('survey-success-state');
  const completedState = document.getElementById('survey-complete-state');

  if (alreadySubmitted) {
    surveyShell.classList.add('is-complete');
    completedState.hidden = false;
    return;
  }

  const renderStep = () => {
    const step = surveySteps[state.currentStep];
    if (!step) return;

    stepTitle.textContent = step.title;
    stepDescription.textContent = step.description;
    const visibleQuestions = step.questions.filter((question) => !question.visibleWhen || question.visibleWhen(state.responses));

    stepContent.innerHTML = visibleQuestions.map((question) => renderQuestion(question)).join('');
    progressBar.style.width = `${((state.currentStep + 1) / surveySteps.length) * 100}%`;
    stepIndicator.textContent = `Step ${state.currentStep + 1} of ${surveySteps.length}`;
    prevButton.disabled = state.currentStep === 0;
    nextButton.hidden = state.currentStep === surveySteps.length - 1;
    submitButton.hidden = state.currentStep !== surveySteps.length - 1;
    if (state.currentStep === surveySteps.length - 1) {
      submitButton.disabled = state.isSubmitting;
    }
    status.textContent = '';
    status.className = 'form-status';
  };

  const renderQuestion = (question) => {
    const value = state.responses[question.name];
    if (question.type === 'radio') {
      return `
        <div class="form-field">
          <label>${question.label}${question.required ? ' *' : ''}</label>
          <div class="choice-grid">
            ${question.options.map((option) => `
              <label class="choice-pill ${value === option ? 'active' : ''}">
                <input type="radio" name="${question.name}" value="${option}" ${value === option ? 'checked' : ''}>
                <span>${option}</span>
              </label>
            `).join('')}
          </div>
        </div>
      `;
    }

    if (question.type === 'checkbox') {
      const selectedValues = Array.isArray(value) ? value : [];
      return `
        <div class="form-field">
          <label>${question.label}${question.required ? ' *' : ''}</label>
          <div class="choice-grid">
            ${question.options.map((option) => `
              <label class="choice-pill ${selectedValues.includes(option) ? 'active' : ''}">
                <input type="checkbox" name="${question.name}" value="${option}" ${selectedValues.includes(option) ? 'checked' : ''}>
                <span>${option}</span>
              </label>
            `).join('')}
          </div>
        </div>
      `;
    }

    if (question.type === 'rating') {
      const currentValue = Number(value || 0);
      return `
        <div class="form-field">
          <label>${question.label}${question.required ? ' *' : ''}</label>
          <div class="star-rating" data-name="${question.name}">
            ${[1, 2, 3, 4, 5].map((step) => `<button type="button" class="star-btn ${step <= currentValue ? 'active' : ''}" data-value="${step}" aria-label="Rate ${step} out of 5">★</button>`).join('')}
          </div>
        </div>
      `;
    }

    if (question.type === 'textarea') {
      return `
        <div class="form-field">
          <label>${question.label}</label>
          <textarea name="${question.name}" rows="4" placeholder="Share any suggestions you have for SwitchOn">${value || ''}</textarea>
        </div>
      `;
    }

    return `
      <div class="form-field">
        <label>${question.label}${question.required ? ' *' : ''}</label>
        <input type="${question.type}" name="${question.name}" value="${value || ''}" placeholder="Type your answer" />
      </div>
    `;
  };

  const validateStep = () => {
    const step = surveySteps[state.currentStep];
    const visibleQuestions = step.questions.filter((question) => !question.visibleWhen || question.visibleWhen(state.responses));
    const requiredQuestions = visibleQuestions.filter((question) => question.required);

    for (const question of requiredQuestions) {
      const value = state.responses[question.name];
      if (question.type === 'checkbox') {
        if (!Array.isArray(value) || value.length === 0) {
          return `${question.label} is required.`;
        }
      } else if (question.type === 'rating') {
        if (!value || Number(value) < 1) {
          return `${question.label} is required.`;
        }
      } else if (!String(value || '').trim()) {
        return `${question.label} is required.`;
      }
    }

    if (state.currentStep === 1) {
      if (state.responses.forgotCharger === 'Yes' && !state.responses.frequency) {
        return 'Please tell us how often this happens.';
      }
    }

    if (state.currentStep === 3) {
      if (state.responses.betaTester === 'Yes') {
        if (!state.responses.name || !state.responses.email || !state.responses.phone) {
          return 'Please provide your name, email, and phone number for prototype testing.';
        }
      }
    }

    return '';
  };

  const handleStepChange = (direction) => {
    const error = validateStep();
    if (error) {
      status.textContent = error;
      status.className = 'form-status error';
      return;
    }

    state.currentStep = Math.max(0, Math.min(surveySteps.length - 1, state.currentStep + direction));
    renderStep();
  };

  const handleFieldChange = (event) => {
    const target = event.target;
    const fieldName = target.name;

    if (!fieldName) return;

    if (target.type === 'checkbox') {
      const current = Array.isArray(state.responses[fieldName]) ? state.responses[fieldName] : [];
      const nextValue = target.checked ? [...current, target.value] : current.filter((value) => value !== target.value);
      state.responses[fieldName] = nextValue;
    } else if (target.type === 'radio') {
      state.responses[fieldName] = target.value;
    } else if (target.classList.contains('star-btn')) {
      state.responses[fieldName] = target.dataset.value;
    } else {
      state.responses[fieldName] = target.value;
    }

    if (target.type === 'radio' && (fieldName === 'forgotCharger' || fieldName === 'betaTester')) {
      renderStep();
    } else if (target.type === 'checkbox' || target.type === 'radio' || target.classList.contains('star-btn')) {
      renderStep();
    }
  };

  stepContent.addEventListener('change', handleFieldChange);
  stepContent.addEventListener('input', (event) => {
    const target = event.target;
    if (target.tagName === 'TEXTAREA' || target.tagName === 'INPUT' && !target.type.match(/^(radio|checkbox)$/)) {
      state.responses[target.name] = target.value;
    }
  });
  stepContent.addEventListener('click', (event) => {
    const button = event.target.closest('.star-btn');
    if (!button) return;
    const fieldName = button.closest('.star-rating').dataset.name;
    state.responses[fieldName] = button.dataset.value;
    renderStep();
  });

  prevButton.addEventListener('click', () => handleStepChange(-1));
  nextButton.addEventListener('click', () => handleStepChange(1));

  submitButton.addEventListener('click', async () => {
    const error = validateStep();
    if (error) {
      status.textContent = error;
      status.className = 'form-status error';
      return;
    }

    state.isSubmitting = true;
    submitButton.classList.add('is-loading');
    submitButton.disabled = true;
    status.textContent = 'Saving your response securely to SwitchOn…';
    status.className = 'form-status';

    try {
      const payload = {
        age: state.responses.age,
        occupation: state.responses.occupation,
        chargingFrequency: state.responses.chargingFrequency,
        forgotCharger: state.responses.forgotCharger,
        frequency: state.responses.frequency || '',
        realization: state.responses.realization || [],
        problems: state.responses.problems || [],
        frustrationRating: Number(state.responses.frustrationRating || 0),
        productInterest: state.responses.productInterest,
        reminderPreference: state.responses.reminderPreference || [],
        productPreference: state.responses.productPreference,
        expectedPrice: state.responses.expectedPrice,
        recommendationRating: Number(state.responses.recommendationRating || 0),
        supportedDevices: state.responses.supportedDevices || [],
        chargingLocation: state.responses.chargingLocation,
        suggestions: state.responses.suggestions || '',
        betaTester: state.responses.betaTester,
        name: state.responses.name || '',
        email: state.responses.email || '',
        phone: state.responses.phone || '',
        timestamp: window.firebase && window.firebase.firestore && window.firebase.firestore.FieldValue
          ? window.firebase.firestore.FieldValue.serverTimestamp()
          : new Date()
      };

      const result = await window.submitToFirestore('surveyResponses', payload);
      if (!result.ok) {
        throw new Error(result.error || 'Submission failed.');
      }

      localStorage.setItem(STORAGE_KEY, 'submitted');
      surveyShell.classList.add('is-complete');
      successState.hidden = false;
      surveyShell.scrollIntoView({ behavior: 'smooth', block: 'start' });
      status.textContent = 'Your response is saved. Thank you for helping improve SwitchOn.';
      status.className = 'form-status success';
    } catch (error) {
      console.error(error);
      status.textContent = 'Submission failed. Please try again in a moment.';
      status.className = 'form-status error';
    } finally {
      state.isSubmitting = false;
      submitButton.classList.remove('is-loading');
      submitButton.disabled = false;
    }
  });

  renderStep();
})();
