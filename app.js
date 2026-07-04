/**
 * TelepromptFlow - Sistema de Teleprompter Profissional
 * Lógica do Motor de Rolagem, Importação de Documentos e Reconhecimento de Voz
 */

// ================= ESTADO DA APLICAÇÃO =================
const state = {
  text: '',
  isPlaying: false,
  speedWpm: 120,          // Palavras por minuto
  fontSizeRem: 4.5,       // Tamanho da fonte
  textWidth: 'medium',    // narrow | medium | wide
  guideEnabled: true,
  mirrorEnabled: false,
  voiceScrollEnabled: false,
  
  // Controle de Rolagem
  scrollPos: 0,
  targetScrollPos: 0,     // Usado para interpolação suave na rolagem por voz
  lastTime: 0,
  totalWords: 0,
  
  // Reconhecimento de Voz
  recognition: null,
  currentWordIdx: 0,
  lastSpeechTime: 0,
  
  // Tema
  theme: 'dark'
};

// ================= TEXTOS DE EXEMPLO (PRESETS) =================
const PRESETS = {
  discurso: `Senhores e senhoras, é com grande honra que me dirijo a vocês hoje. 

Estamos vivendo um momento de transformação sem precedentes, onde cada palavra falada e cada ação tomada ressoa no futuro que estamos construindo.

O ritmo do nosso progresso depende da nossa clareza. Falar com calma, respirar entre as sentenças e articular cada ideia com precisão são as chaves para engajar e inspirar o público.

Quando lemos este texto no teleprompter, precisamos lembrar que o silêncio também comunica. A pausa estratégica dá peso à mensagem.

Aproveite este espaço, respire fundo e conduza sua narrativa com convicção e autoridade.`,
  
  noticia: `Boa noite. Começa agora o jornal da noite com os principais destaques do dia no Brasil e no mundo.

A economia nacional registrou um crescimento expressivo de dois vírgula cinco por cento no último trimestre, impulsionada pelo setor de serviços e exportações de tecnologia.

Paralelamente, cientistas anunciaram hoje um novo avanço no tratamento de doenças degenerativas utilizando inteligência artificial para mapeamento celular.

Na cultura, o festival nacional de cinema abre suas portas hoje em Gramado, com mais de cinquenta produções nacionais em exibição.

Voltamos em instantes com mais detalhes sobre a previsão do tempo para todo o país neste fim de semana.`,
  
  dicas: `Bem-vindo às dicas de oratória do TelepromptFlow!

Para uma leitura excelente, siga estes passos simples:

Primeiro: Mantenha sua coluna ereta e os ombros relaxados. Isso melhora sua respiração e projeção vocal.

Segundo: Ajuste o teleprompter para que a linha ativa fique próxima à altura dos seus olhos. Isso evita movimentos verticais excessivos da cabeça.

Terceiro: Utilize a largura estreita do texto. Quanto mais estreito o bloco, menor será o movimento horizontal dos seus olhos, transmitindo mais naturalidade para quem assiste.

Quarto: Regule a velocidade de forma que você fale um pouco mais devagar do que faria em uma conversa informal. A leitura pausada transmite segurança.

Pratique bastante e boa apresentação!`
};

// ================= SELETORES DOM =================
const DOM = {
  // Telas
  setupScreen: document.getElementById('setup-screen'),
  prompterScreen: document.getElementById('prompter-screen'),
  
  // Editor & Importação
  textInput: document.getElementById('text-input'),
  fileUpload: document.getElementById('file-upload'),
  dropZone: document.getElementById('drop-zone'),
  wordCount: document.getElementById('word-count'),
  themeToggle: document.getElementById('theme-toggle'),
  presetDiscurso: document.getElementById('preset-discurso'),
  presetNoticia: document.getElementById('preset-noticia'),
  presetDicas: document.getElementById('preset-dicas'),
  
  // Controles Setup
  speedSlider: document.getElementById('speed-slider'),
  speedValue: document.getElementById('speed-value'),
  fontSizeSlider: document.getElementById('font-size-slider'),
  fontSizeValue: document.getElementById('font-size-value'),
  widthNarrow: document.getElementById('width-narrow'),
  widthMedium: document.getElementById('width-medium'),
  widthWide: document.getElementById('width-wide'),
  guideToggle: document.getElementById('guide-toggle'),
  mirrorToggle: document.getElementById('mirror-toggle'),
  voiceScrollToggle: document.getElementById('voice-scroll-toggle'),
  startBtn: document.getElementById('start-prompter-btn'),
  speechControlWrapper: document.getElementById('speech-control-wrapper'),
  
  // Prompter Playback
  prompterViewport: document.getElementById('prompter-viewport'),
  prompterContent: document.getElementById('prompter-content'),
  readingGuide: document.getElementById('reading-guide'),
  countdownOverlay: document.getElementById('countdown-overlay'),
  countdownNumber: document.getElementById('countdown-number'),
  
  // Header Stats
  statProgress: document.getElementById('stat-progress'),
  statTime: document.getElementById('stat-time'),
  voiceIndicator: document.getElementById('voice-indicator'),
  voiceStatLabel: document.getElementById('voice-stat-label'),
  
  // Floating Controls
  exitBtn: document.getElementById('exit-prompter-btn'),
  playPauseBtn: document.getElementById('play-pause-btn'),
  playIcon: document.getElementById('play-icon'),
  pauseIcon: document.getElementById('pause-icon'),
  fontDecreaseBtn: document.getElementById('font-decrease-btn'),
  fontIncreaseBtn: document.getElementById('font-increase-btn'),
  ctrlFontBadge: document.getElementById('ctrl-font-badge'),
  speedDecreaseBtn: document.getElementById('speed-decrease-btn'),
  speedIncreaseBtn: document.getElementById('speed-increase-btn'),
  ctrlSpeedBadge: document.getElementById('ctrl-speed-badge'),
  ctrlGuideBtn: document.getElementById('ctrl-guide-btn'),
  ctrlMirrorBtn: document.getElementById('ctrl-mirror-btn'),
  ctrlVoiceBtn: document.getElementById('ctrl-voice-btn'),
};

// ================= INICIALIZAÇÃO =================
document.addEventListener('DOMContentLoaded', () => {
  loadSettings();
  initTheme();
  setupEventListeners();
  initSpeechRecognition();
  updateTextStats();
  
  // Carrega o discurso de dicas por padrão
  DOM.textInput.value = PRESETS.dicas;
  updateTextStats();
});

// ================= SISTEMA DE TEMAS =================
function initTheme() {
  const savedTheme = localStorage.getItem('theme') || 'dark';
  setTheme(savedTheme);
}

function setTheme(theme) {
  state.theme = theme;
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('theme', theme);
  
  const moonIcon = DOM.themeToggle.querySelector('.moon-icon');
  const sunIcon = DOM.themeToggle.querySelector('.sun-icon');
  
  if (theme === 'light') {
    moonIcon.classList.add('hidden');
    sunIcon.classList.remove('hidden');
  } else {
    moonIcon.classList.remove('hidden');
    sunIcon.classList.add('hidden');
  }
}

// ================= PERSISTÊNCIA DE PREFERÊNCIAS =================
function saveSettings() {
  const settings = {
    speedWpm: state.speedWpm,
    fontSizeRem: state.fontSizeRem,
    textWidth: state.textWidth,
    guideEnabled: state.guideEnabled,
    mirrorEnabled: state.mirrorEnabled,
    voiceScrollEnabled: state.voiceScrollEnabled
  };
  localStorage.setItem('teleprompt_settings', JSON.stringify(settings));
}

function loadSettings() {
  const saved = localStorage.getItem('teleprompt_settings');
  if (!saved) return;
  
  try {
    const settings = JSON.parse(saved);
    state.speedWpm = settings.speedWpm || 120;
    state.fontSizeRem = settings.fontSizeRem || 4.5;
    state.textWidth = settings.textWidth || 'medium';
    state.guideEnabled = settings.guideEnabled !== undefined ? settings.guideEnabled : true;
    state.mirrorEnabled = settings.mirrorEnabled !== undefined ? settings.mirrorEnabled : false;
    state.voiceScrollEnabled = settings.voiceScrollEnabled !== undefined ? settings.voiceScrollEnabled : false;
    
    // Atualizar inputs visuais
    DOM.speedSlider.value = state.speedWpm;
    DOM.speedValue.textContent = `${state.speedWpm} WPM`;
    DOM.ctrlSpeedBadge.textContent = `${state.speedWpm} WPM`;
    
    DOM.fontSizeSlider.value = state.fontSizeRem;
    DOM.fontSizeValue.textContent = `${state.fontSizeRem.toFixed(1)}rem`;
    DOM.ctrlFontBadge.textContent = state.fontSizeRem.toFixed(1);
    
    // Width
    document.getElementById(`width-${state.textWidth}`).checked = true;
    
    // Toggles
    DOM.guideToggle.checked = state.guideEnabled;
    DOM.mirrorToggle.checked = state.mirrorEnabled;
    DOM.voiceScrollToggle.checked = state.voiceScrollEnabled;
    
    // Sincronizar classes de controle ativo na tela do prompter
    updateControlBtnActiveStates();
  } catch (e) {
    console.error('Erro ao ler configurações salvas:', e);
  }
}

function updateControlBtnActiveStates() {
  DOM.ctrlGuideBtn.classList.toggle('active', state.guideEnabled);
  DOM.ctrlMirrorBtn.classList.toggle('active', state.mirrorEnabled);
  DOM.ctrlVoiceBtn.classList.toggle('active', state.voiceScrollEnabled);
}

// ================= CONTROLE DE ESTATÍSTICAS DO TEXTO =================
function updateTextStats() {
  state.text = DOM.textInput.value.trim();
  
  if (!state.text) {
    DOM.wordCount.textContent = '0 palavras • ~0 min de leitura';
    state.totalWords = 0;
    return;
  }
  
  const words = state.text.split(/\s+/).filter(w => w.length > 0);
  state.totalWords = words.length;
  
  // Estima tempo de leitura baseado em WPM selecionado
  const minutes = state.totalWords / state.speedWpm;
  const minText = Math.floor(minutes);
  const secText = Math.round((minutes - minText) * 60);
  
  let timeStr = '';
  if (minText > 0) {
    timeStr = `~${minText} min ${secText}s`;
  } else {
    timeStr = `~${secText}s`;
  }
  
  DOM.wordCount.textContent = `${state.totalWords} palavras • ${timeStr} de leitura`;
}

// ================= HANDLERS DE IMPORTAÇÃO E PRESETS =================
function setupEventListeners() {
  // Alternância de Tema
  DOM.themeToggle.addEventListener('click', () => {
    setTheme(state.theme === 'dark' ? 'light' : 'dark');
  });

  // Alteração de Sliders
  DOM.speedSlider.addEventListener('input', (e) => {
    state.speedWpm = parseInt(e.target.value);
    DOM.speedValue.textContent = `${state.speedWpm} WPM`;
    DOM.ctrlSpeedBadge.textContent = `${state.speedWpm} WPM`;
    updateTextStats();
    saveSettings();
  });
  
  DOM.fontSizeSlider.addEventListener('input', (e) => {
    state.fontSizeRem = parseFloat(e.target.value);
    DOM.fontSizeValue.textContent = `${state.fontSizeRem.toFixed(1)}rem`;
    DOM.ctrlFontBadge.textContent = state.fontSizeRem.toFixed(1);
    saveSettings();
  });

  // Alteração de Largura
  [DOM.widthNarrow, DOM.widthMedium, DOM.widthWide].forEach(input => {
    input.addEventListener('change', (e) => {
      if (e.target.checked) {
        state.textWidth = e.target.value;
        saveSettings();
      }
    });
  });

  // Toggles de Recursos
  DOM.guideToggle.addEventListener('change', (e) => {
    state.guideEnabled = e.target.checked;
    DOM.ctrlGuideBtn.classList.toggle('active', state.guideEnabled);
    saveSettings();
  });

  DOM.mirrorToggle.addEventListener('change', (e) => {
    state.mirrorEnabled = e.target.checked;
    DOM.ctrlMirrorBtn.classList.toggle('active', state.mirrorEnabled);
    saveSettings();
  });

  DOM.voiceScrollToggle.addEventListener('change', (e) => {
    state.voiceScrollEnabled = e.target.checked;
    DOM.ctrlVoiceBtn.classList.toggle('active', state.voiceScrollEnabled);
    saveSettings();
  });

  // Monitorar Mudanças no Input de Texto
  DOM.textInput.addEventListener('input', updateTextStats);

  // Botões de Preset
  DOM.presetDiscurso.addEventListener('click', () => loadPresetText('discurso'));
  DOM.presetNoticia.addEventListener('click', () => loadPresetText('noticia'));
  DOM.presetDicas.addEventListener('click', () => loadPresetText('dicas'));

  // Drag and Drop de Arquivos
  DOM.dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    DOM.dropZone.classList.add('drag-over');
  });

  DOM.dropZone.addEventListener('dragleave', () => {
    DOM.dropZone.classList.remove('drag-over');
  });

  DOM.dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    DOM.dropZone.classList.remove('drag-over');
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleImportedFile(files[0]);
    }
  });

  DOM.fileUpload.addEventListener('change', (e) => {
    const files = e.target.files;
    if (files.length > 0) {
      handleImportedFile(files[0]);
    }
  });

  // Botões do Teleprompter
  DOM.startBtn.addEventListener('click', startPrompterWorkflow);
  DOM.exitBtn.addEventListener('click', stopPrompter);
  DOM.playPauseBtn.addEventListener('click', togglePlayPause);

  // Floating Control Clicks
  DOM.fontDecreaseBtn.addEventListener('click', () => adjustFontSize(-0.2));
  DOM.fontIncreaseBtn.addEventListener('click', () => adjustFontSize(0.2));
  
  DOM.speedDecreaseBtn.addEventListener('click', () => adjustSpeed(-5));
  DOM.speedIncreaseBtn.addEventListener('click', () => adjustSpeed(5));

  DOM.ctrlGuideBtn.addEventListener('click', () => {
    state.guideEnabled = !state.guideEnabled;
    DOM.guideToggle.checked = state.guideEnabled;
    DOM.ctrlGuideBtn.classList.toggle('active', state.guideEnabled);
    DOM.readingGuide.classList.toggle('hidden', !state.guideEnabled);
    saveSettings();
  });

  DOM.ctrlMirrorBtn.addEventListener('click', () => {
    state.mirrorEnabled = !state.mirrorEnabled;
    DOM.mirrorToggle.checked = state.mirrorEnabled;
    DOM.ctrlMirrorBtn.classList.toggle('active', state.mirrorEnabled);
    DOM.prompterContent.classList.toggle('mirrored-horizontal', state.mirrorEnabled);
    saveSettings();
  });

  DOM.ctrlVoiceBtn.addEventListener('click', () => {
    if (!state.recognition) {
      alert("Reconhecimento de voz não suportado neste navegador.");
      return;
    }
    state.voiceScrollEnabled = !state.voiceScrollEnabled;
    DOM.voiceScrollToggle.checked = state.voiceScrollEnabled;
    DOM.ctrlVoiceBtn.classList.toggle('active', state.voiceScrollEnabled);
    
    if (state.voiceScrollEnabled) {
      if (state.isPlaying) startSpeechRecognition();
    } else {
      stopSpeechRecognition();
    }
    saveSettings();
  });

  // Teclado
  document.addEventListener('keydown', handleGlobalKeydown);
}

function loadPresetText(key) {
  if (PRESETS[key]) {
    DOM.textInput.value = PRESETS[key];
    updateTextStats();
  }
}

function handleImportedFile(file) {
  const reader = new FileReader();
  reader.onload = (e) => {
    DOM.textInput.value = e.target.result;
    updateTextStats();
  };
  reader.readAsText(file);
}

// ================= AJUSTES DENTRO DO PROMPTER =================
function adjustFontSize(delta) {
  state.fontSizeRem = Math.max(2, Math.min(8, state.fontSizeRem + delta));
  DOM.fontSizeSlider.value = state.fontSizeRem;
  DOM.fontSizeValue.textContent = `${state.fontSizeRem.toFixed(1)}rem`;
  DOM.ctrlFontBadge.textContent = state.fontSizeRem.toFixed(1);
  DOM.prompterContent.style.fontSize = `${state.fontSizeRem}rem`;
  saveSettings();
}

function adjustSpeed(delta) {
  state.speedWpm = Math.max(50, Math.min(300, state.speedWpm + delta));
  DOM.speedSlider.value = state.speedWpm;
  DOM.speedValue.textContent = `${state.speedWpm} WPM`;
  DOM.ctrlSpeedBadge.textContent = `${state.speedWpm} WPM`;
  updateTextStats();
  saveSettings();
}

// ================= CONTROLES DE FLUXO E ANIMACAO =================
function startPrompterWorkflow() {
  state.text = DOM.textInput.value.trim();
  
  if (!state.text) {
    alert("Por favor, digite ou importe algum texto antes de iniciar.");
    return;
  }

  // Prepara o conteúdo separando palavras
  preparePrompterContent();

  // Aplica tamanho de fonte e largura do texto no container do Prompter
  DOM.prompterContent.style.fontSize = `${state.fontSizeRem}rem`;
  DOM.prompterViewport.className = `prompter-viewport width-${state.textWidth}`;
  DOM.prompterContent.classList.toggle('mirrored-horizontal', state.mirrorEnabled);
  DOM.readingGuide.classList.toggle('hidden', !state.guideEnabled);

  // Transição de tela
  DOM.setupScreen.classList.add('hidden');
  DOM.prompterScreen.classList.remove('hidden');

  // Reseta posição de rolagem
  state.scrollPos = 0;
  state.targetScrollPos = 0;
  state.currentWordIdx = 0;
  DOM.prompterContent.style.transform = `translateY(0px)`;
  
  // Atualiza indicadores de progresso
  updateProgressStats(0);

  // Dispara a contagem regressiva
  startCountdown(() => {
    playPrompter();
  });
}

function preparePrompterContent() {
  const paragraphs = state.text.split('\n');
  let wordIndex = 0;
  
  const htmlContent = paragraphs.map(paraText => {
    const trimmed = paraText.trim();
    if (!trimmed) return '<p class="prompter-para">&nbsp;</p>';
    
    // Separa as palavras e as envolve em spans
    const wordsHtml = trimmed.split(/\s+/).map(word => {
      // Remove caracteres especiais para fins de comparação limpa do Reconhecimento de Voz
      const cleanWord = word.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"']/g,"");
      const html = `<span class="prompter-word" data-word-idx="${wordIndex}" data-clean="${cleanWord}">${word}</span>`;
      wordIndex++;
      return html;
    }).join(' ');
    
    return `<p class="prompter-para">${wordsHtml}</p>`;
  }).join('');
  
  DOM.prompterContent.innerHTML = htmlContent;
}

function startCountdown(onComplete) {
  DOM.countdownOverlay.classList.remove('hidden');
  let count = 3;
  DOM.countdownNumber.textContent = count;
  
  const interval = setInterval(() => {
    count--;
    if (count > 0) {
      DOM.countdownNumber.textContent = count;
    } else if (count === 0) {
      DOM.countdownNumber.textContent = "VAI!";
    } else {
      clearInterval(interval);
      DOM.countdownOverlay.classList.add('hidden');
      onComplete();
    }
  }, 1000);
}

function playPrompter() {
  if (state.isPlaying) return;
  state.isPlaying = true;
  
  // Atualiza botões
  DOM.playIcon.classList.add('hidden');
  DOM.pauseIcon.classList.remove('hidden');
  
  // Reseta relógio da animação
  state.lastTime = performance.now();
  state.animationId = requestAnimationFrame(scrollLoop);
  
  // Ativa comando de voz se configurado
  if (state.voiceScrollEnabled) {
    startSpeechRecognition();
  }
}

function pausePrompter() {
  if (!state.isPlaying) return;
  state.isPlaying = false;
  
  // Atualiza botões
  DOM.playIcon.classList.remove('hidden');
  DOM.pauseIcon.classList.add('hidden');
  
  cancelAnimationFrame(state.animationId);
  
  // Pausa reconhecimento de voz
  stopSpeechRecognition();
}

function togglePlayPause() {
  if (state.isPlaying) {
    pausePrompter();
  } else {
    playPrompter();
  }
}

function stopPrompter() {
  pausePrompter();
  
  // Transição de tela
  DOM.prompterScreen.classList.add('hidden');
  DOM.setupScreen.classList.remove('hidden');
  
  // Força parada completa da voz
  stopSpeechRecognition();
}

// ================= CORE DE ROLAGEM (LOOP A 60 FPS) =================
function scrollLoop(timestamp) {
  if (!state.isPlaying) return;
  
  const elapsedMs = timestamp - state.lastTime;
  state.lastTime = timestamp;
  
  const contentHeight = DOM.prompterContent.offsetHeight;
  const viewportHeight = DOM.prompterViewport.offsetHeight;
  
  // Se o texto terminou, finaliza
  const maxScroll = contentHeight - (viewportHeight * 0.4); // Compensa o padding de baixo
  
  if (state.scrollPos >= maxScroll) {
    pausePrompter();
    updateProgressStats(100);
    return;
  }
  
  if (state.voiceScrollEnabled) {
    // ROLAGEM POR VOZ: Interpola suavemente até o alvo calculado pela voz
    const diff = state.targetScrollPos - state.scrollPos;
    
    // Se a voz parou de falar há mais de 6 segundos, cai de volta para a rolagem de ritmo base lenta
    const timeSinceSpeech = timestamp - state.lastSpeechTime;
    if (timeSinceSpeech > 6000 && state.lastSpeechTime > 0) {
      // Rolagem de segurança automática caso o narrador mude o ritmo ou se perca
      const speedPxPerMs = calculateScrollSpeedPxPerMs();
      state.scrollPos += speedPxPerMs * elapsedMs;
      state.targetScrollPos = state.scrollPos;
    } else {
      // Interpolação suave para a voz
      state.scrollPos += diff * 0.05; // 0.05 é a velocidade de suavização
    }
  } else {
    // ROLAGEM POR RITMO (WPM): Velocidade de pixel constante por quadro
    const speedPxPerMs = calculateScrollSpeedPxPerMs();
    state.scrollPos += speedPxPerMs * elapsedMs;
  }
  
  // Limites
  state.scrollPos = Math.max(0, Math.min(maxScroll, state.scrollPos));
  
  // Aplica translação (Rolagem Física Real)
  DOM.prompterContent.style.transform = `translateY(${-state.scrollPos}px)`;
  
  // Atualiza progresso e cronômetro
  const progressPercent = Math.min(100, Math.round((state.scrollPos / maxScroll) * 100));
  updateProgressStats(progressPercent);
  
  // Continua o loop
  state.animationId = requestAnimationFrame(scrollLoop);
}

/**
 * Calcula a velocidade de pixel baseado no tamanho do texto e a taxa de WPM.
 * Em média, uma linha de texto tem cerca de 10-15 palavras.
 * Usamos a estimativa do número médio de linhas baseado na altura da fonte.
 */
function calculateScrollSpeedPxPerMs() {
  // Ajuste fino experimental de pixels por palavra
  // WPM * (Pixels por palavra estimada baseado no tamanho da fonte) / 60000 ms
  const pxPerWord = state.fontSizeRem * 14; 
  const speedPxPerMs = (state.speedWpm * pxPerWord) / 60000;
  return speedPxPerMs;
}

function updateProgressStats(percent) {
  DOM.statProgress.textContent = `${percent}%`;
  
  // Calcula tempo restante
  if (state.totalWords === 0) {
    DOM.statTime.textContent = "00:00";
    return;
  }
  
  const wordsRemaining = state.totalWords * (1 - (percent / 100));
  const minRemaining = wordsRemaining / state.speedWpm;
  
  const minText = Math.floor(minRemaining);
  const secText = Math.round((minRemaining - minText) * 60);
  
  const pad = (val) => String(val).padStart(2, '0');
  DOM.statTime.textContent = `${pad(minText)}:${pad(secText)}`;
}

// ================= MOTOR DE RECONHECIMENTO DE VOZ (SPEECH-TO-SCROLL) =================
function initSpeechRecognition() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  
  if (!SpeechRecognition) {
    // Browser não suporta Speech Recognition API
    DOM.speechControlWrapper.classList.add('hidden');
    return;
  }
  
  state.recognition = new SpeechRecognition();
  state.recognition.continuous = true;
  state.recognition.interimResults = true;
  state.recognition.lang = 'pt-BR';
  
  state.recognition.onstart = () => {
    DOM.voiceIndicator.classList.remove('hidden');
    DOM.voiceStatLabel.textContent = "Ouvindo Voz...";
    DOM.voiceIndicator.style.borderColor = 'rgba(16, 185, 129, 0.4)';
  };
  
  state.recognition.onerror = (e) => {
    console.warn("Erro no Speech Recognition:", e.error);
    if (e.error === 'not-allowed') {
      DOM.voiceStatLabel.textContent = "Sem Acesso Mic";
      DOM.voiceIndicator.style.borderColor = 'rgba(239, 68, 68, 0.4)';
    }
  };
  
  state.recognition.onend = () => {
    if (state.isPlaying && state.voiceScrollEnabled) {
      // Se parou de forma inesperada mas o prompter ainda está tocando, reinicia
      try {
        state.recognition.start();
      } catch (err) {
        console.warn("Erro ao reiniciar voz:", err);
      }
    } else {
      DOM.voiceIndicator.classList.add('hidden');
    }
  };
  
  state.recognition.onresult = (event) => {
    if (!state.voiceScrollEnabled) return;
    
    // Obtém o último resultado falado
    let transcript = '';
    for (let i = event.resultIndex; i < event.results.length; ++i) {
      transcript += event.results[i][0].transcript;
    }
    
    processSpeechInput(transcript);
  };
}

function startSpeechRecognition() {
  if (!state.recognition) return;
  try {
    state.recognition.start();
  } catch (err) {
    // Já estava rodando
  }
}

function stopSpeechRecognition() {
  if (!state.recognition) return;
  try {
    state.recognition.stop();
  } catch (err) {
    // Não estava rodando
  }
}

/**
 * Processa a fala do narrador para rolar o teleprompter de forma inteligente.
 * Procuramos palavras-chave faladas à frente da posição de palavra atual.
 */
function processSpeechInput(transcript) {
  const spokenText = transcript.toLowerCase().trim();
  const spokenWords = spokenText.split(/\s+/).filter(w => w.length > 0);
  
  if (spokenWords.length === 0) return;
  
  state.lastSpeechTime = performance.now();
  
  // Pegamos as últimas palavras faladas (janela deslizante) para buscar no texto
  const maxSearchWords = 3;
  const recentSpoken = spokenWords.slice(-maxSearchWords);
  
  // Seleciona todos os spans de palavras
  const wordSpans = DOM.prompterContent.querySelectorAll('.prompter-word');
  if (wordSpans.length === 0) return;
  
  // Procuramos na frente da palavra atual (janela de busca de 25 palavras)
  const searchStartIndex = state.currentWordIdx;
  const searchEndIndex = Math.min(wordSpans.length, searchStartIndex + 25);
  
  let matchFound = false;
  let matchedIndex = -1;
  
  // Loop para tentar casar as últimas palavras ditas
  for (let matchLen = recentSpoken.length; matchLen > 0; matchLen--) {
    const speechSegment = recentSpoken.slice(-matchLen).join(' ');
    
    for (let i = searchStartIndex; i < searchEndIndex; i++) {
      // Monta um segmento do texto original para comparar
      const originalSegmentWords = [];
      for (let j = 0; j < matchLen; j++) {
        if (i + j < wordSpans.length) {
          originalSegmentWords.push(wordSpans[i + j].getAttribute('data-clean'));
        }
      }
      const originalSegment = originalSegmentWords.join(' ');
      
      // Se as palavras faladas casarem com as palavras do texto
      if (originalSegment === speechSegment || originalSegment.includes(speechSegment) || speechSegment.includes(originalSegment)) {
        matchedIndex = i + matchLen - 1;
        matchFound = true;
        break;
      }
    }
    if (matchFound) break;
  }
  
  // Se encontrou a palavra sendo falada
  if (matchFound && matchedIndex > state.currentWordIdx) {
    state.currentWordIdx = matchedIndex;
    
    // Destaca a palavra falada
    wordSpans.forEach(span => span.classList.remove('word-highlight'));
    
    const matchedSpan = wordSpans[matchedIndex];
    matchedSpan.classList.add('word-highlight');
    
    // Faz a linha inteira da palavra ter maior opacidade
    const parentParagraph = matchedSpan.closest('.prompter-para');
    if (parentParagraph) {
      DOM.prompterContent.querySelectorAll('.prompter-para').forEach(p => p.classList.remove('active-line'));
      parentParagraph.classList.add('active-line');
    }
    
    // Calcula o scroll alvo para colocar essa palavra exatamente no centro da guia visual
    const wordRectTop = matchedSpan.offsetTop;
    const viewportHeight = DOM.prompterViewport.offsetHeight;
    
    // Alinha a palavra a aproximadamente 40% da altura da tela (onde fica a guia visual)
    const targetScroll = wordRectTop - (viewportHeight * 0.4);
    
    // Define a posição alvo (o loop de animação fará a transição suave até aqui)
    state.targetScrollPos = Math.max(0, targetScroll);
  }
}

// ================= ATALHOS DE TECLADO HANDLERS =================
function handleGlobalKeydown(e) {
  // Teclas com foco no textarea não devem disparar atalhos globais de controle
  if (document.activeElement === DOM.textInput) {
    return;
  }
  
  const key = e.key;
  
  // Se está na tela do Prompter
  if (!DOM.prompterScreen.classList.contains('hidden')) {
    switch (key) {
      case ' ': // Espaço: Play/Pause
        e.preventDefault();
        togglePlayPause();
        break;
        
      case 'ArrowUp': // Seta Cima: Aumentar Velocidade
        e.preventDefault();
        adjustSpeed(5);
        break;
        
      case 'ArrowDown': // Seta Baixo: Diminuir Velocidade
        e.preventDefault();
        adjustSpeed(-5);
        break;
        
      case 'ArrowLeft': // Seta Esquerda: Diminuir Fonte
        e.preventDefault();
        adjustFontSize(-0.2);
        break;
        
      case 'ArrowRight': // Seta Direita: Aumentar Fonte
        e.preventDefault();
        adjustFontSize(0.2);
        break;
        
      case 'Escape': // Esc: Sair
        e.preventDefault();
        stopPrompter();
        break;
    }
  }
}
