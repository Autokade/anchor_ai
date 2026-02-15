const scriptInput = document.getElementById('scriptInput');
const speakBtn = document.getElementById('speakBtn');
const stopBtn = document.getElementById('stopBtn');
const voiceSelect = document.getElementById('voiceSelect');
const rateInput = document.getElementById('rateInput');
const pitchInput = document.getElementById('pitchInput');
const mouth = document.getElementById('mouth');
const anchorFace = document.getElementById('anchorFace');
const tickerText = document.getElementById('tickerText');

let voices = [];
let animationFrame = null;
let boundaryFallbackInterval = null;
let blinkTimeout = null;
let targetOpen = 0;
let currentOpen = 0;

function loadVoices() {
  voices = window.speechSynthesis.getVoices();
  voiceSelect.innerHTML = '';

  voices.forEach((voice, index) => {
    const option = document.createElement('option');
    option.value = index;
    option.textContent = `${voice.name} (${voice.lang})`;
    voiceSelect.append(option);
  });
}

function animateMouth() {
  currentOpen += (targetOpen - currentOpen) * 0.28;
  const openPx = 8 + currentOpen * 24;
  const scaleX = 1 + currentOpen * 0.2;
  mouth.style.height = `${openPx}px`;
  mouth.style.transform = `scaleX(${scaleX})`;
  anchorFace.style.setProperty('--talk-shift', `${-currentOpen * 2.4}px`);

  animationFrame = requestAnimationFrame(animateMouth);
}

function setMouthByChunk(chunk) {
  const trimmed = chunk.trim();

  if (!trimmed) {
    targetOpen = 0;
    return;
  }

  const vowelCount = (trimmed.match(/[aeiou]/gi) || []).length;
  const hardConsonants = (trimmed.match(/[bmp]/gi) || []).length;
  const softConsonants = (trimmed.match(/[fvsz]/gi) || []).length;
  const punctuationBoost = /[!?]/.test(trimmed) ? 0.2 : 0;

  const openness =
    Math.min(trimmed.length / 8, 1) * 0.45 +
    Math.min(vowelCount / 4, 1) * 0.45 +
    Math.min(softConsonants / 3, 1) * 0.2 -
    Math.min(hardConsonants / 3, 1) * 0.16 +
    punctuationBoost;

  targetOpen = Math.max(0, Math.min(1, openness));
}

function pulseFallbackBoundaries(text, utterance) {
  let charIndex = 0;
  boundaryFallbackInterval = setInterval(() => {
    if (!window.speechSynthesis.speaking || utterance !== window.currentUtterance) {
      clearInterval(boundaryFallbackInterval);
      boundaryFallbackInterval = null;
      return;
    }

    const chunk = text.slice(charIndex, charIndex + 8);
    setMouthByChunk(chunk);
    charIndex = (charIndex + 4) % Math.max(text.length, 1);
  }, 110);
}

function scheduleBlink() {
  const nextBlinkInMs = 1800 + Math.random() * 2600;
  blinkTimeout = setTimeout(() => {
    anchorFace.classList.add('blink');
    setTimeout(() => anchorFace.classList.remove('blink'), 120);
    scheduleBlink();
  }, nextBlinkInMs);
}

function startSpeaking() {
  const text = scriptInput.value.trim();
  if (!text) return;

  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  window.currentUtterance = utterance;

  const selectedIndex = Number(voiceSelect.value);
  utterance.voice = voices[selectedIndex] || null;
  utterance.rate = Number(rateInput.value);
  utterance.pitch = Number(pitchInput.value);

  anchorFace.classList.remove('idle');
  tickerText.textContent = 'Broadcasting live...';

  utterance.onboundary = (event) => {
    const chunk = text.slice(event.charIndex, event.charIndex + 8);
    setMouthByChunk(chunk);
  };

  utterance.onstart = () => {
    if (!animationFrame) animateMouth();

    setTimeout(() => {
      if (boundaryEventsSeen === 0 && window.speechSynthesis.speaking) {
        pulseFallbackBoundaries(text, utterance);
      }
    }, 450);
  };

  utterance.onend = () => stopSpeaking('Broadcast complete.');
  utterance.onerror = () => stopSpeaking('Speech engine error. Try another voice.');

  window.speechSynthesis.speak(utterance);
}

function stopSpeaking(message = 'Ready to broadcast...') {
  window.speechSynthesis.cancel();
  window.currentUtterance = null;
  targetOpen = 0;
  tickerText.textContent = message;
  anchorFace.classList.add('idle');

  if (boundaryFallbackInterval) {
    clearInterval(boundaryFallbackInterval);
    boundaryFallbackInterval = null;
  }

  if (animationFrame) {
    cancelAnimationFrame(animationFrame);
    animationFrame = null;
  }

  mouth.style.height = '8px';
  mouth.style.transform = 'scaleX(1)';
  anchorFace.style.setProperty('--talk-shift', '0px');
}

speakBtn.addEventListener('click', startSpeaking);
stopBtn.addEventListener('click', () => stopSpeaking('Broadcast stopped.'));

if ('speechSynthesis' in window) {
  loadVoices();
  scheduleBlink();
  window.speechSynthesis.onvoiceschanged = loadVoices;
} else {
  speakBtn.disabled = true;
  tickerText.textContent = 'Speech Synthesis is not supported in this browser.';
}

window.addEventListener('beforeunload', () => {
  if (blinkTimeout) clearTimeout(blinkTimeout);
});
