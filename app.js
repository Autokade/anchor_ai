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
  const openPx = 7 + currentOpen * 22;
  const scaleX = 1 + currentOpen * 0.23;
  mouth.style.height = `${openPx}px`;
  mouth.style.transform = `scaleX(${scaleX})`;

  animationFrame = requestAnimationFrame(animateMouth);
}

function setMouthByChunk(chunk) {
  const trimmed = chunk.trim();

  if (!trimmed) {
    targetOpen = 0;
    return;
  }

  const vowelCount = (trimmed.match(/[aeiou]/gi) || []).length;
  const lengthFactor = Math.min(trimmed.length / 8, 1);
  const vowelFactor = Math.min(vowelCount / Math.max(trimmed.length, 1) * 3.2, 1);
  const emphasisBoost = /[!?]/.test(trimmed) ? 0.2 : 0;

  targetOpen = Math.min(1, lengthFactor * 0.65 + vowelFactor * 0.5 + emphasisBoost);
}

function startSpeaking() {
  const text = scriptInput.value.trim();

  if (!text) return;

  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
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
  };

  utterance.onend = () => stopSpeaking('Broadcast complete.');
  utterance.onerror = () => stopSpeaking('Speech engine error. Try another voice.');

  window.speechSynthesis.speak(utterance);
}

function stopSpeaking(message = 'Ready to broadcast...') {
  window.speechSynthesis.cancel();
  targetOpen = 0;
  tickerText.textContent = message;
  anchorFace.classList.add('idle');

  if (animationFrame) {
    cancelAnimationFrame(animationFrame);
    animationFrame = null;
  }

  mouth.style.height = '8px';
  mouth.style.transform = 'scaleX(1)';
}

speakBtn.addEventListener('click', startSpeaking);
stopBtn.addEventListener('click', () => stopSpeaking('Broadcast stopped.'));

if ('speechSynthesis' in window) {
  loadVoices();
  window.speechSynthesis.onvoiceschanged = loadVoices;
} else {
  speakBtn.disabled = true;
  tickerText.textContent = 'Speech Synthesis is not supported in this browser.';
}
