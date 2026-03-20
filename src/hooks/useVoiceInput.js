import { useState, useEffect, useRef } from "react";

const isSpeechSupported = () => typeof window !== "undefined" && ("SpeechRecognition" in window || "webkitSpeechRecognition" in window);

export function useVoiceInput({ onResult, onError, lang = "en-IN" } = {}) {
  const [listening, setListening] = useState(false);
  const [supported, setSupported] = useState(false);
  const recognitionRef = useRef(null);

  useEffect(() => {
    setSupported(isSpeechSupported());
  }, []);

  const start = () => {
    if (!isSpeechSupported()) {
      onError?.("Voice input not supported in this browser.");
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    const recognition = new SpeechRecognition();
    recognition.lang = lang;
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setListening(true);

    recognition.onresult = (e) => {
      const transcript = e.results[0][0].transcript;
      onResult?.(transcript);
      setListening(false);
    };

    recognition.onerror = (e) => {
      setListening(false);
      if (e.error === "not-allowed") {
        onError?.("Microphone permission denied. Please allow mic access.");
      } else if (e.error === "no-speech") {
        onError?.("No speech detected. Please try again.");
      } else {
        onError?.("Voice error: " + e.error);
      }
    };

    recognition.onend = () => setListening(false);

    recognitionRef.current = recognition;
    recognition.start();
  };

  const stop = () => {
    recognitionRef.current?.stop();
    setListening(false);
  };

  return { listening, supported, start, stop };
}

// ── Reusable Mic Button component logic ──
// Usage in any component:
// const { listening, supported, start, stop } = useVoiceInput({
//   onResult: (text) => setSearch(text),
//   onError: (msg) => showModal({ type: "error", message: msg }),
// });
