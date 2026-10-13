const errorMessage = (error) => {
  if (error === 'not-allowed' || error === 'service-not-allowed') {
    return 'Microphone permission was denied. Allow microphone access or type your message.';
  }
  if (error === 'no-speech') return 'No speech was detected. Try again or type your message.';
  if (error === 'audio-capture') return 'No microphone is available. Connect one or type your message.';
  return 'Voice typing stopped because of a recognition error. Try again or type your message.';
};

export function setupDictation({
  button,
  input,
  status,
  Recognition = globalThis.SpeechRecognition || globalThis.webkitSpeechRecognition,
  getLanguage = () => 'en',
}) {
  if (!button || !input || !status) throw new TypeError('Dictation needs a button, input, and status element.');

  const setListening = (listening) => {
    button.setAttribute('aria-pressed', String(listening));
    button.setAttribute('aria-label', listening ? 'Stop voice typing' : 'Start voice typing');
    button.title = listening ? 'Stop voice typing' : 'Dictate a message';
  };

  setListening(false);
  if (typeof Recognition !== 'function') {
    button.disabled = true;
    status.textContent = 'Voice typing is not supported in this browser. You can type your message.';
    return { supported: false, stop() {} };
  }

  let recognition = null;
  let listening = false;
  let failed = false;
  let receivedFinalText = false;

  const stop = () => {
    if (recognition && listening) recognition.stop();
  };

  button.disabled = false;
  button.addEventListener('click', () => {
    if (listening) {
      stop();
      return;
    }

    try {
      recognition = new Recognition();
      listening = false;
      failed = false;
      receivedFinalText = false;
      recognition.lang = getLanguage() || 'en';
      recognition.interimResults = true;
      recognition.continuous = false;
      recognition.onstart = () => {
        listening = true;
        setListening(true);
        status.textContent = 'Listening. Speak your message, then review it before pressing Send.';
      };
      recognition.onresult = (event) => {
        const startAt = Number.isInteger(event.resultIndex) ? event.resultIndex : 0;
        const finalText = [];
        for (let index = startAt; index < event.results.length; index += 1) {
          const result = event.results[index];
          if (result.isFinal && result[0]?.transcript) finalText.push(result[0].transcript.trim());
        }
        const text = finalText.filter(Boolean).join(' ').trim();
        if (!text) return;
        input.value = `${input.value.trimEnd()}${input.value.trim() ? ' ' : ''}${text}`;
        input.dispatchEvent?.(new Event('input', { bubbles: true }));
        receivedFinalText = true;
        status.textContent = 'Text added. Review it, then press Send when ready.';
      };
      recognition.onerror = (event) => {
        failed = true;
        listening = false;
        setListening(false);
        status.textContent = errorMessage(event?.error);
      };
      recognition.onend = () => {
        listening = false;
        setListening(false);
        if (!failed && !receivedFinalText) status.textContent = 'Voice typing stopped. You can try again or type your message.';
      };
      status.textContent = 'Starting voice typing…';
      recognition.start();
    } catch {
      listening = false;
      failed = true;
      setListening(false);
      status.textContent = 'Voice typing could not start. Check microphone permission or type your message.';
    }
  });

  return { supported: true, stop };
}
