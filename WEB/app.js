// --- UTILS & DATA ---
const topicsList = [
  'Bootstrap3', 'CSS', 'HTML', 'JQuery', 'JS', 'MySQL', 'PHP', 'XML'
];

const translations = {
  en: {
    title: 'Quiz Master', practice: 'Practice', mock: 'Mock Test', selectLanguage: 'Select Language',
    topics: 'Select Topics', numQuestions: 'Number of Questions', shuffleQ: 'Shuffle Questions',
    shuffleA: 'Shuffle Answers', start: 'Start Quiz', next: 'Next Question', submit: 'Submit Quiz',
    score: 'Your Score', review: 'Review Answers', correct: 'Correct', incorrect: 'Incorrect',
    yourAnswer: 'Your Answer', correctAnswer: 'Correct Answer', backToHome: 'Back to Home',
    hardcoreBtn: '🔥 Hardcore Mode (300 Qs)'
  },
  vn: {
    title: 'Trắc Nghiệm', practice: 'Luyện Tập', mock: 'Thi Thử', selectLanguage: 'Chọn Ngôn Ngữ',
    topics: 'Chọn Chủ Đề', numQuestions: 'Số lượng câu hỏi', shuffleQ: 'Xáo trộn Câu Hỏi',
    shuffleA: 'Xáo trộn Đáp Án', start: 'Bắt Đầu', next: 'Câu Tiếp', submit: 'Nộp Bài',
    score: 'Điểm Của Bạn', review: 'Xem Lại Đáp Án', correct: 'Đúng', incorrect: 'Sai',
    yourAnswer: 'Đáp án của bạn', correctAnswer: 'Đáp án đúng', backToHome: 'Về Trang Chủ',
    hardcoreBtn: '🔥 Cường Độ Cao (300 Câu)'
  }
};

const shuffleArray = (array) => {
  const newArr = [...array];
  for (let i = newArr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
  }
  return newArr;
};

const fetchQuizData = async (language, topic) => {
  try {
    const response = await fetch(`./quiz/${language}/${topic}-Quiz.json`);
    if (!response.ok) throw new Error('File not found');
    const data = await response.json();
    return data.map(q => ({...q, topic}));
  } catch (err) {
    console.error('Error fetching quiz data for', topic, err);
    return [];
  }
};

// --- APP STATE ---
const appState = {
  language: 'vn',
  mode: 'practice',
  selectedTopics: [],
  mockNumQuestions: {},
  shuffleQuestions: true,
  shuffleAnswers: true,
  quizData: [],
  baseQuestions: [],
  currentQuestionIndex: 0,
  userAnswers: {},
  timerInterval: null,
  timeoutNext: null
};

const appContainer = document.getElementById('app');

const render = (element) => {
  appContainer.innerHTML = '';
  appContainer.appendChild(element);
};

// --- SCREENS ---

const renderSetupScreen = () => {
  const t = translations[appState.language];
  const container = document.createElement('div');
  container.className = 'glass-card';

  const topicsHTML = topicsList.map(topic => `
    <div class="topic-btn ${appState.selectedTopics.includes(topic) ? 'active' : ''}" data-topic="${topic}">
      ${topic}
    </div>
  `).join('');

  container.innerHTML = `
    <h1>${t.title}</h1>
    <div class="radio-group">
      <input type="radio" id="lang-en" name="language" value="en" class="radio-btn" ${appState.language === 'en' ? 'checked' : ''}>
      <label for="lang-en" class="radio-label">🇬🇧 English</label>
      <input type="radio" id="lang-vn" name="language" value="vn" class="radio-btn" ${appState.language === 'vn' ? 'checked' : ''}>
      <label for="lang-vn" class="radio-label">🇻🇳 Tiếng Việt</label>
    </div>
    
    <div class="radio-group">
      <input type="radio" id="mode-practice" name="mode" value="practice" class="radio-btn" ${appState.mode === 'practice' ? 'checked' : ''}>
      <label for="mode-practice" class="radio-label">${t.practice}</label>
      <input type="radio" id="mode-mock" name="mode" value="mock" class="radio-btn" ${appState.mode === 'mock' ? 'checked' : ''}>
      <label for="mode-mock" class="radio-label">${t.mock}</label>
    </div>
    
    <div class="form-group">
      <label>${t.topics}</label>
      <div class="topics-grid" id="topics-container">
        ${topicsHTML}
      </div>
    </div>
    
    <div class="form-group" id="mock-questions-group" style="display: ${appState.mode === 'mock' ? 'block' : 'none'};">
      <label>${t.numQuestions}</label>
      <div id="mock-questions-container"></div>
    </div>

    <div class="switch-group">
      <label>${t.shuffleQ}</label>
      <label class="switch">
        <input type="checkbox" id="shuffle-q" ${appState.shuffleQuestions ? 'checked' : ''}>
        <span class="slider"></span>
      </label>
    </div>
    <div class="switch-group">
      <label>${t.shuffleA}</label>
      <label class="switch">
        <input type="checkbox" id="shuffle-a" ${appState.shuffleAnswers ? 'checked' : ''}>
        <span class="slider"></span>
      </label>
    </div>
    
    <button id="start-btn" class="btn-primary">${t.start}</button>
    <div style="text-align: center; margin: 1rem 0; font-weight: bold; color: #475569;">HOẶC</div>
    <button id="hardcore-btn" class="btn-hardcore">${t.hardcoreBtn}</button>
  `;

  const renderMockInputs = () => {
    const c = container.querySelector('#mock-questions-container');
    c.innerHTML = appState.selectedTopics.map(topic => `
      <div class="mock-input-row" data-topic="${topic}" style="display:flex; align-items:center; margin-top:0.75rem;">
        <span style="width: 120px; font-weight:600;">${topic}</span>
        <input type="number" class="mock-num-input" data-topic="${topic}" min="1" max="50" value="${appState.mockNumQuestions[topic] || 10}">
      </div>
    `).join('');
    
    c.querySelectorAll('.mock-num-input').forEach(inp => {
      inp.addEventListener('change', ev => {
        appState.mockNumQuestions[ev.target.dataset.topic] = parseInt(ev.target.value) || 10;
      });
    });
  };

  if (appState.mode === 'mock') renderMockInputs();

  container.querySelectorAll('input[name="language"]').forEach(r => r.addEventListener('change', e => {
    appState.language = e.target.value;
    render(renderSetupScreen()); 
  }));

  container.querySelectorAll('input[name="mode"]').forEach(r => r.addEventListener('change', e => {
    appState.mode = e.target.value;
    const mockGroup = container.querySelector('#mock-questions-group');
    if (appState.mode === 'practice') {
      mockGroup.style.display = 'none';
      if (appState.selectedTopics.length > 1) {
        const first = appState.selectedTopics[0];
        appState.selectedTopics = [first];
        container.querySelectorAll('.topic-btn').forEach(b => {
          b.classList.toggle('active', b.dataset.topic === first);
        });
      }
    } else {
      mockGroup.style.display = 'block';
      renderMockInputs();
    }
  }));

  container.querySelectorAll('.topic-btn').forEach(btn => btn.addEventListener('click', e => {
    const topic = e.target.dataset.topic;
    if (appState.mode === 'practice') {
      appState.selectedTopics = [topic];
      container.querySelectorAll('.topic-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    } else {
      if (appState.selectedTopics.includes(topic)) {
        appState.selectedTopics = appState.selectedTopics.filter(t => t !== topic);
        btn.classList.remove('active');
      } else {
        appState.selectedTopics.push(topic);
        if (!appState.mockNumQuestions[topic]) appState.mockNumQuestions[topic] = 10;
        btn.classList.add('active');
      }
      renderMockInputs();
    }
  }));

  container.querySelector('#start-btn').addEventListener('click', () => {
    if (appState.selectedTopics.length === 0) return alert('Please select at least one topic!');
    appState.shuffleQuestions = container.querySelector('#shuffle-q').checked;
    appState.shuffleAnswers = container.querySelector('#shuffle-a').checked;
    startQuiz();
  });

  container.querySelector('#hardcore-btn').addEventListener('click', () => {
    appState.mode = 'hardcore';
    document.body.classList.add('hardcore-mode');
    appState.selectedTopics = [...topicsList];
    appState.shuffleQuestions = true;
    appState.shuffleAnswers = true;
    startQuiz();
  });

  return container;
};

const createQuizScreenContainer = () => {
  const container = document.createElement('div');
  container.className = 'glass-card';
  container.innerHTML = `
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 1rem;">
      <div class="badge" id="quiz-badge" style="margin-bottom:0;"></div>
      <button id="home-btn" class="btn-secondary" style="padding: 0.3rem 0.6rem; font-size: 0.85rem;">🏠 Home</button>
    </div>
    <div class="progress-container">
      <div class="progress-bar" id="quiz-progress"></div>
    </div>
    <div class="timer-container" id="timer-container" style="display: none;">
      <div class="timer-bar" id="timer-bar"></div>
    </div>
    <div class="question-text" id="question-text"></div>
    <div class="options-container" id="options-container"></div>
    <button id="action-btn" class="btn-primary" disabled></button>
  `;
  return container;
};

const applyHardcorePenalty = () => {
  if (appState.mode !== 'hardcore' || !appState.baseQuestions || appState.baseQuestions.length === 0) return;
  
  const penaltyCount = 5;
  const newQuestions = [];
  for (let i = 0; i < penaltyCount; i++) {
    const q = appState.baseQuestions[Math.floor(Math.random() * appState.baseQuestions.length)];
    // Make a shallow copy and shuffle its options if needed
    const newQ = { ...q };
    if (appState.shuffleAnswers) {
      newQ.options = shuffleArray([...newQ.options]);
    }
    newQuestions.push(newQ);
  }
  
  const current = appState.currentQuestionIndex;
  let remaining = appState.quizData.slice(current + 1);
  remaining = remaining.concat(newQuestions);
  remaining = shuffleArray(remaining);
  
  appState.quizData = [...appState.quizData.slice(0, current + 1), ...remaining];
  
  const badge = document.getElementById('quiz-badge');
  if (badge && !badge.innerHTML.includes('Phạt')) {
    const penaltyMsg = document.createElement('span');
    penaltyMsg.innerHTML = ' <span style="color:var(--error); font-weight: bold; animation: pulse-red 1s infinite;">(+5 Câu Phạt)</span>';
    badge.appendChild(penaltyMsg);
  }
};

const updateQuizScreen = (container) => {
  const t = translations[appState.language];
  const total = appState.quizData.length;
  const current = appState.currentQuestionIndex;
  const question = appState.quizData[current];
  const progressPercent = (current / total) * 100;
  let selectedOption = appState.userAnswers[current] || null;

  container.querySelector('#home-btn').textContent = `🏠 ${t.backToHome}`;
  container.querySelector('#home-btn').onclick = () => {
    if (confirm('Bạn có chắc chắn muốn về trang chủ? Toàn bộ quá trình sẽ bị hủy bỏ!')) {
      if (appState.timerInterval) clearInterval(appState.timerInterval);
      if (appState.timeoutNext) clearTimeout(appState.timeoutNext);
      initApp();
    }
  };

  container.querySelector('#quiz-badge').textContent = `${question.topic} - ${current + 1} / ${total}`;
  container.querySelector('#quiz-progress').style.width = `${progressPercent}%`;
  
  const oldQText = container.querySelector('#question-text');
  const newQText = oldQText.cloneNode(true);
  newQText.textContent = question.question;
  oldQText.parentNode.replaceChild(newQText, oldQText);

  const optionsContainer = container.querySelector('#options-container');
  optionsContainer.innerHTML = ''; 
  
  const actionBtn = container.querySelector('#action-btn');
  const newActionBtn = actionBtn.cloneNode(true);
  actionBtn.parentNode.replaceChild(newActionBtn, actionBtn);
  
  newActionBtn.textContent = current === total - 1 ? t.submit : t.next;
  newActionBtn.disabled = true;

  const isImmediateFeedback = (appState.mode === 'practice' || appState.mode === 'hardcore');

  question.options.forEach((opt, index) => {
    const btn = document.createElement('button');
    btn.className = 'option-btn';
    btn.style.animationDelay = `${index * 0.05}s`;
    
    if (isImmediateFeedback && selectedOption) {
      if (opt === selectedOption) {
        btn.classList.add(opt === question.answer ? 'correct' : 'incorrect');
      } else if (opt === question.answer) {
        btn.classList.add('correct');
      }
      btn.disabled = true;
      newActionBtn.disabled = false;
    } else if (appState.mode === 'mock' && selectedOption === opt) {
      btn.classList.add('selected');
      newActionBtn.disabled = false;
    }

    btn.textContent = opt;
    btn.addEventListener('click', () => {
      if (isImmediateFeedback && selectedOption) return;
      
      selectedOption = opt;
      appState.userAnswers[current] = opt;
      newActionBtn.disabled = false;

      if (appState.timerInterval) clearInterval(appState.timerInterval);
      if (appState.timeoutNext) clearTimeout(appState.timeoutNext);

      if (isImmediateFeedback) {
        if (opt === question.answer) {
          btn.classList.add('correct');
        } else {
          btn.classList.add('incorrect');
          Array.from(optionsContainer.children).forEach(b => {
            if (b.textContent === question.answer) b.classList.add('correct');
          });
          if (appState.mode === 'hardcore') {
            applyHardcorePenalty();
          }
        }
        Array.from(optionsContainer.children).forEach(b => b.disabled = true);
      } else {
        optionsContainer.querySelectorAll('.option-btn').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
      }
    });
    optionsContainer.appendChild(btn);
  });

  // Setup Timer for Hardcore Mode
  if (appState.timerInterval) clearInterval(appState.timerInterval);
  if (appState.timeoutNext) clearTimeout(appState.timeoutNext);
  
  const timerContainer = container.querySelector('#timer-container');
  const timerBar = container.querySelector('#timer-bar');

  if (appState.mode === 'hardcore' && !selectedOption) {
    timerContainer.style.display = 'block';
    let timeLeft = 15;
    timerBar.style.width = '100%';
    timerBar.style.backgroundColor = 'var(--primary)';
    
    // Clear transition briefly to snap to 100% without animation
    timerBar.style.transition = 'none';
    setTimeout(() => {
      timerBar.style.transition = 'width 0.1s linear, background-color 0.3s ease';
    }, 50);

    appState.timerInterval = setInterval(() => {
      timeLeft -= 0.1;
      const pct = (timeLeft / 15) * 100;
      timerBar.style.width = `${pct}%`;
      
      if (pct <= 30 && timerBar.style.backgroundColor !== 'var(--error)') {
        timerBar.style.backgroundColor = 'var(--error)';
      }
      
      if (timeLeft <= 0) {
        clearInterval(appState.timerInterval);
        if (!selectedOption) {
          selectedOption = 'TIMEOUT';
          appState.userAnswers[current] = null;
          
          Array.from(optionsContainer.children).forEach(b => {
            b.disabled = true;
            if (b.textContent === question.answer) b.classList.add('correct');
          });
          newActionBtn.disabled = false;
          
          if (appState.mode === 'hardcore') {
            applyHardcorePenalty();
          }
          
          appState.timeoutNext = setTimeout(() => {
            newActionBtn.click();
          }, 2000);
        }
      }
    }, 100);
  } else {
    timerContainer.style.display = 'none';
  }

  newActionBtn.addEventListener('click', () => {
    if (appState.timerInterval) clearInterval(appState.timerInterval);
    if (appState.timeoutNext) clearTimeout(appState.timeoutNext);
    container.querySelector('#quiz-progress').style.width = `${((current + 1) / total) * 100}%`;
    
    setTimeout(() => {
      if (current === total - 1) finishQuiz();
      else {
        appState.currentQuestionIndex++;
        updateQuizScreen(container);
      }
    }, 200);
  });
};

const renderResultScreen = () => {
  const t = translations[appState.language];
  const container = document.createElement('div');
  container.className = 'glass-card';

  let correctCount = 0;
  const reviewHTML = appState.quizData.map((q, index) => {
    const isCorrect = appState.userAnswers[index] === q.answer;
    if (isCorrect) correctCount++;
    return `
      <div class="review-item ${isCorrect ? 'correct' : 'incorrect'}">
        <div class="badge">${q.topic}</div>
        <div class="review-question" id="review-q-${index}"></div>
        <div class="review-answer">${t.yourAnswer}: <span class="${isCorrect ? 'text-success' : 'text-error'}" id="review-u-${index}"></span></div>
        ${!isCorrect ? `<div class="review-answer">${t.correctAnswer}: <span class="text-success" id="review-c-${index}"></span></div>` : ''}
      </div>
    `;
  }).join('');

  const scorePercent = Math.round((correctCount / appState.quizData.length) * 100);

  container.innerHTML = `
    <h1>${t.score}</h1>
    <div class="score-display">${scorePercent}%</div>
    <div style="text-align: center; margin-bottom: 2rem; font-size: 1.2rem; font-weight:600;">${correctCount} / ${appState.quizData.length} ${t.correct.toLowerCase()}</div>
    <h2>${t.review}</h2>
    <div class="review-list">${reviewHTML}</div>
    <button id="restart-btn" class="btn-primary" style="margin-top: 2rem;">${t.backToHome}</button>
  `;

  appState.quizData.forEach((q, index) => {
    container.querySelector(`#review-q-${index}`).textContent = q.question;
    container.querySelector(`#review-u-${index}`).textContent = appState.userAnswers[index] || 'TIMEOUT / Không trả lời';
    if (appState.userAnswers[index] !== q.answer) {
      container.querySelector(`#review-c-${index}`).textContent = q.answer;
    }
  });

  container.querySelector('#restart-btn').addEventListener('click', initApp);
  return container;
};

// --- LOGIC ---
const startQuiz = async () => {
  appContainer.innerHTML = '<h2 style="text-align: center;">Loading...</h2>';
  let allQuestions = [];
  
  if (appState.mode === 'hardcore') {
    const allTopicPromises = appState.selectedTopics.map(topic => fetchQuizData(appState.language, topic));
    const allResults = await Promise.all(allTopicPromises);
    
    let baseQuestions = [];
    allResults.forEach(data => baseQuestions = baseQuestions.concat(data));
    appState.baseQuestions = baseQuestions;
    
    let hardcoreQuestions = [...baseQuestions];
    while (hardcoreQuestions.length < 300) {
      hardcoreQuestions.push(baseQuestions[Math.floor(Math.random() * baseQuestions.length)]);
    }
    
    allQuestions = shuffleArray(hardcoreQuestions).slice(0, 300);
  } else {
    for (const topic of appState.selectedTopics) {
      const data = await fetchQuizData(appState.language, topic);
      let topicQuestions = appState.shuffleQuestions ? shuffleArray(data) : data;
      
      let count = appState.mode === 'practice' ? 25 : (appState.mockNumQuestions[topic] || 10);
      allQuestions = allQuestions.concat(topicQuestions.slice(0, count));
    }
    if (appState.mode === 'mock' && appState.shuffleQuestions) {
      allQuestions = shuffleArray(allQuestions);
    }
  }

  if (appState.shuffleAnswers) {
    allQuestions = allQuestions.map(q => ({ ...q, options: shuffleArray(q.options) }));
  }

  appState.quizData = allQuestions;
  appState.currentQuestionIndex = 0;
  appState.userAnswers = {};

  if (appState.quizData.length === 0) {
    alert('Không tìm thấy câu hỏi hoặc có lỗi tải dữ liệu!');
    initApp();
    return;
  }
  
  const quizContainer = createQuizScreenContainer();
  render(quizContainer);
  updateQuizScreen(quizContainer);
};

const finishQuiz = () => {
  render(renderResultScreen());
}

const initApp = () => {
  document.body.classList.remove('hardcore-mode');
  appState.quizData = [];
  appState.currentQuestionIndex = 0;
  appState.userAnswers = {};
  if (appState.timerInterval) clearInterval(appState.timerInterval);
  if (appState.timeoutNext) clearTimeout(appState.timeoutNext);
  render(renderSetupScreen());
};

// Start
initApp();
