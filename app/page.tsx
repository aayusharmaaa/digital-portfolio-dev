'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import dynamic from 'next/dynamic';
import ProjectGrid from '@/components/ProjectGrid';
import ExperienceTimeline from '@/components/ExperienceTimeline';
import AchievementsMarquee from '@/components/AchievementsMarquee';
import CustomCursor from '@/components/CustomCursor';
import VoiceVisualizer from '@/components/VoiceVisualizer';
import { useAudioAmplitude } from '@/lib/useAudioAmplitude';
import { useSoundEffects } from '@/lib/useSoundEffects';

const AsciiModelAvatar = dynamic(() => import('@/components/AsciiModelAvatar'), { ssr: false });

const PROMPTS = [
  "↳ What's the AI Cloud Resource Optimizer?",
  "↳ Introduce yourself",
  "↳ How was Airtel?",
];

const CURRENTLY: {
  icon: string;
  label: string;
  value: string;
  logo?: string;
  /** If set, clicking the value asks the clone this question (first three items only) */
  promptQuestion?: string;
}[] = [
  {
    icon: '►',
    label: 'engineering @',
    value: 'Manipal University Jaipur',
    logo: '/logos/manipal.png',
    promptQuestion: 'Tell me about your engineering degree at Manipal University Jaipur — what are you studying and how is it going?',
  },
  {
    icon: '►',
    label: 'capstone project @',
    value: 'Deloitte',
    logo: '/logos/deloitte.png',
    promptQuestion: 'Tell me about your capstone project with Deloitte — what is FairLend and what did you build?',
  },
  {
    icon: '►',
    label: 'swe intern @',
    value: 'Airtel (prev)',
    logo: '/logos/airtel.png',
    promptQuestion: 'How was your software engineering internship at Airtel? What did you work on?',
  },
  { icon: '►', label: '2x ideathon winner ', value: '(pre-incubation secured)' },
  { icon: '►', label: 'seeking', value: 'summer 2026 internships' },
];

const GREETING = "Hey — I'm Aayush. Ask me anything.";
const HUMAN_GREETING = "Hey! Have a conversation with me. Just speak and I'll respond.";

type Message = { id?: string; role: 'user' | 'assistant'; content: string };

export default function Home() {
  const [promptIdx, setPromptIdx] = useState(0);
  const [conversationMode, setConversationMode] = useState(false);
  const [chatHistory, setChatHistory] = useState<Message[]>([]);
  const chatHistoryRef = useRef<Message[]>([]);
  const { playHover, playClick, playToggleOn, playToggleOff, playType } = useSoundEffects();

  // Keep ref in sync
  useEffect(() => {
    chatHistoryRef.current = chatHistory;
  }, [chatHistory]);

  const [loading, setLoading] = useState(false);
  const [input, setInput] = useState('');
  const [mounted, setMounted] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [modelReady, setModelReady] = useState(false);
  const [modelProgress, setModelProgress] = useState(0);
  const [isTalking, setIsTalking] = useState(false);
  const [greetingPlayed, setGreetingPlayed] = useState(false);
  const [showGreetingHint, setShowGreetingHint] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [isListening, setIsListening] = useState(false);
  const [listenAmplitude, setListenAmplitude] = useState(0);
  const [speechSupported, setSpeechSupported] = useState(true);
  /** iOS / many mobile browsers lack Web Speech API — use MediaRecorder + /api/transcribe instead */
  const [mediaRecorderSupported, setMediaRecorderSupported] = useState(false);
  /** Web Speech on iPhone/iPad is unreliable; always use MediaRecorder + server transcribe there */
  const [preferRecorderVoice, setPreferRecorderVoice] = useState(false);

  // Handle Light Mode
  useEffect(() => {
    if (theme === 'light') document.documentElement.classList.add('theme-light');
    else document.documentElement.classList.remove('theme-light');
  }, [theme]);
  const heroRef = useRef<HTMLElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const greetingBlobRef = useRef<Blob | null>(null);
  const greetingFetchedRef = useRef(false);
  /** Prevents overlapping manual greeting plays (e.g. pointerdown + touchstart). */
  const greetingManualLockRef = useRef(false);
  const [greetingAudioReady, setGreetingAudioReady] = useState(false);
  const recognitionRef = useRef<any>(null);
  const listenAnimRef = useRef(0);
  const listenStreamRef = useRef<MediaStream | null>(null);
  const revealAnimRef = useRef(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaChunksRef = useRef<Blob[]>([]);

  const { amplitude, playWithAmplitude, stop } = useAudioAmplitude();

  useEffect(() => { setMounted(true); }, []);
  useEffect(() => {
    return () => cancelAnimationFrame(revealAnimRef.current);
  }, []);
  useEffect(() => {
    const supported = typeof window !== 'undefined' &&
      Boolean((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);
    setSpeechSupported(supported);
    setMediaRecorderSupported(typeof window !== 'undefined' && typeof MediaRecorder !== 'undefined');
    if (typeof navigator !== 'undefined') {
      const ua = navigator.userAgent;
      const touchMac = /Macintosh/i.test(ua) && navigator.maxTouchPoints > 1;
      setPreferRecorderVoice(/iPhone|iPad|iPod/i.test(ua) || touchMac);
    }
  }, []);

  useEffect(() => {
    // Only scroll within the chat container, not the whole page
    const el = chatEndRef.current;
    if (el?.parentElement) {
      el.parentElement.scrollTop = el.parentElement.scrollHeight;
    }
  }, [chatHistory]);

  const handleModelLoaded = useCallback(() => setModelReady(true), []);
  const handleModelProgress = useCallback((pct: number) => setModelProgress(pct), []);

  // Prefetch greeting TTS in parallel with the 3D model so audio is ready when the model appears.
  useEffect(() => {
    if (!mounted || greetingFetchedRef.current) return;
    greetingFetchedRef.current = true;

    fetch('/api/voice', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: GREETING }),
    })
      .then((res) => (res.ok ? res.blob() : null))
      .then((blob) => {
        if (blob) {
          greetingBlobRef.current = blob;
          setGreetingAudioReady(true);
        }
      })
      .catch(() => {});
  }, [mounted]);

  // When both the model and greeting audio are ready, try autoplay (works on many desktops;
  // phones block without a gesture — then we show the hint and use capture-phase listeners).
  useEffect(() => {
    if (!modelReady || !greetingAudioReady || greetingPlayed) return;
    const blob = greetingBlobRef.current;
    if (!blob) return;

    let cancelled = false;

    const run = async () => {
      setIsTalking(true);
      setShowGreetingHint(false);
      try {
        await playWithAmplitude(blob);
        if (!cancelled) {
          setGreetingPlayed(true);
          setShowGreetingHint(false);
        }
      } catch {
        if (!cancelled) setShowGreetingHint(true);
      } finally {
        if (!cancelled) setIsTalking(false);
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [modelReady, greetingAudioReady, greetingPlayed, playWithAmplitude]);

  useEffect(() => {
    if (!showGreetingHint || greetingPlayed) return;

    const playGreeting = async () => {
      if (greetingManualLockRef.current || !greetingBlobRef.current) return;
      greetingManualLockRef.current = true;
      setShowGreetingHint(false);
      setIsTalking(true);
      try {
        await playWithAmplitude(greetingBlobRef.current);
        setGreetingPlayed(true);
      } catch {
        greetingManualLockRef.current = false;
        setShowGreetingHint(true);
      } finally {
        setIsTalking(false);
      }
    };

    const onGesture = () => {
      void playGreeting();
    };
    // Capture phase: touches on the 3D canvas may not bubble to `window`.
    const opts = { capture: true, passive: true } as const;
    document.addEventListener('pointerdown', onGesture, opts);
    document.addEventListener('touchstart', onGesture, opts);
    return () => {
      document.removeEventListener('pointerdown', onGesture, opts);
      document.removeEventListener('touchstart', onGesture, opts);
    };
  }, [showGreetingHint, greetingPlayed, playWithAmplitude]);

  const ask = async (text: string) => {
    if (!text.trim() || loading) return;
    const userMsg = { id: crypto.randomUUID(), role: 'user' as const, content: text };
    const updated = [...chatHistory, userMsg];
    setChatHistory(updated);
    setInput('');
    setLoading(true);
    stop();

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: updated }),
      });
      const data = await res.json();
      const reply: string = data.reply || data.error || 'Error getting response.';

      const assistantId = crypto.randomUUID();
      setChatHistory(prev => [...prev, { id: assistantId, role: 'assistant', content: '' }]);

      const setAssistantContent = (content: string) => {
        setChatHistory(prev => prev.map(m => (m.id === assistantId ? { ...m, content } : m)));
      };
      const getBlobDurationMs = (blob: Blob) =>
        new Promise<number>((resolve) => {
          const url = URL.createObjectURL(blob);
          const audio = new Audio(url);
          audio.preload = 'metadata';
          audio.onloadedmetadata = () => {
            const ms = Number.isFinite(audio.duration) ? Math.max(0, audio.duration * 1000) : 0;
            URL.revokeObjectURL(url);
            resolve(ms);
          };
          audio.onerror = () => {
            URL.revokeObjectURL(url);
            resolve(0);
          };
        });
      const revealText = (fullText: string, totalMs: number) =>
        new Promise<void>((resolve) => {
          cancelAnimationFrame(revealAnimRef.current);
          const duration = Math.max(900, Math.min(totalMs || fullText.length * 28, 12000));
          const start = performance.now();
          const tick = (now: number) => {
            const p = Math.min(1, (now - start) / duration);
            const count = Math.floor(fullText.length * p);
            setAssistantContent(fullText.slice(0, count));
            if (p < 1) revealAnimRef.current = requestAnimationFrame(tick);
            else resolve();
          };
          revealAnimRef.current = requestAnimationFrame(tick);
        });

      try {
        const voiceRes = await fetch('/api/voice', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: reply }),
        });
        if (voiceRes.ok) {
          const blob = await voiceRes.blob();
          const durationMs = await getBlobDurationMs(blob);
          setIsTalking(true);
          await Promise.all([revealText(reply, durationMs), playWithAmplitude(blob)]);
          setIsTalking(false);
        } else {
          await revealText(reply, 0);
        }
      } catch {
        await revealText(reply, 0);
        setIsTalking(false);
      }
      setAssistantContent(reply);
    } catch {
      setChatHistory(prev => [...prev, { role: 'assistant', content: 'Error — check your API keys.' }]);
    } finally {
      setLoading(false);
    }
  };

  // Voice-only ask for Human Mode: sends text, speaks the reply, then auto-listens again
  const askVoice = async (text: string) => {
    if (!text.trim() || loading) return;
    const userMsg = { id: crypto.randomUUID(), role: 'user' as const, content: text };
    
    // Always use the latest history from ref to avoid stale closures in setTimeout/callbacks
    const updated = [...chatHistoryRef.current, userMsg];
    setChatHistory(updated);
    setLoading(true);
    stop();

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: updated }),
      });
      const data = await res.json();
      const reply: string = data.reply || data.error || 'Error getting response.';
      const assistantId = crypto.randomUUID();
      setChatHistory(prev => [...prev, { id: assistantId, role: 'assistant', content: '' }]);

      const setAssistantContent = (content: string) => {
        setChatHistory(prev => prev.map(m => (m.id === assistantId ? { ...m, content } : m)));
      };
      const getBlobDurationMs = (blob: Blob) =>
        new Promise<number>((resolve) => {
          const url = URL.createObjectURL(blob);
          const audio = new Audio(url);
          audio.preload = 'metadata';
          audio.onloadedmetadata = () => {
            const ms = Number.isFinite(audio.duration) ? Math.max(0, audio.duration * 1000) : 0;
            URL.revokeObjectURL(url);
            resolve(ms);
          };
          audio.onerror = () => {
            URL.revokeObjectURL(url);
            resolve(0);
          };
        });
      const revealText = (fullText: string, totalMs: number) =>
        new Promise<void>((resolve) => {
          cancelAnimationFrame(revealAnimRef.current);
          const duration = Math.max(900, Math.min(totalMs || fullText.length * 28, 12000));
          const start = performance.now();
          const tick = (now: number) => {
            const p = Math.min(1, (now - start) / duration);
            const count = Math.floor(fullText.length * p);
            setAssistantContent(fullText.slice(0, count));
            if (p < 1) revealAnimRef.current = requestAnimationFrame(tick);
            else resolve();
          };
          revealAnimRef.current = requestAnimationFrame(tick);
        });

      try {
        const voiceRes = await fetch('/api/voice', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: reply }),
        });
        if (voiceRes.ok) {
          const blob = await voiceRes.blob();
          const durationMs = await getBlobDurationMs(blob);
          setIsTalking(true);
          await Promise.all([revealText(reply, durationMs), playWithAmplitude(blob)]);
          setIsTalking(false);
        } else {
          await revealText(reply, 0);
        }
      } catch {
        await revealText(reply, 0);
        setIsTalking(false);
      }
      setAssistantContent(reply);

      // Auto-listen again after speaking reply (gesture-safe contexts only)
      setTimeout(() => startListening(true), 500);
    } catch {
      setChatHistory(prev => [...prev, { role: 'assistant', content: 'Error — check your API keys.' }]);
    } finally {
      setLoading(false);
    }
  };

  const handlePromptClick = (p: string) => {
    playClick();
    ask(p.replace('↳ ', ''));
  };

  const handleCurrentlyClick = (question: string) => {
    playClick();
    heroRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    if (conversationMode) {
      askVoice(question);
    } else {
      ask(question);
    }
  };

  // ── Speech-to-Text via Web Speech API ──────────────────
  const startListening = useCallback(async (fromAuto = false) => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSpeechSupported(false);
      return;
    }
    // Mobile browsers often reject non-user-gesture microphone starts.
    if (fromAuto && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) return;

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      if (transcript.trim()) {
        askVoice(transcript);
      }
    };
    recognition.onerror = (e: any) => { 
      console.warn('SpeechRecognition error:', e.error);
      if (e.error === 'not-allowed' || e.error === 'service-not-allowed') setSpeechSupported(false);
      setIsListening(false); 
      stopListenAmplitude(); 
    };
    recognition.onend = () => { setIsListening(false); stopListenAmplitude(); };

    recognitionRef.current = recognition;
    try {
      // On phones, explicitly requesting mic permission during tap improves reliability.
      if (!fromAuto && navigator.mediaDevices?.getUserMedia) {
        const preflight = await navigator.mediaDevices.getUserMedia({ audio: true });
        preflight.getTracks().forEach((t) => t.stop());
      }
      recognition.start();
      setIsListening(true);
      startListenAmplitude();
    } catch (e) {
      console.warn('SpeechRecognition start failed:', e);
      setIsListening(false);
      stopListenAmplitude();
    }
  }, [conversationMode]);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      return;
    }
    setIsListening(false);
    stopListenAmplitude();
  }, []);

  // Microphone amplitude visualizer for STT (optional stream = reuse same mic as MediaRecorder)
  const startListenAmplitude = useCallback(async (existingStream?: MediaStream) => {
    try {
      const stream = existingStream ?? (await navigator.mediaDevices.getUserMedia({ audio: true }));
      listenStreamRef.current = stream;
      
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const audioCtx = new AudioCtx();
      if (audioCtx.state === 'suspended') {
        await audioCtx.resume();
      }
      
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      const data = new Uint8Array(analyser.frequencyBinCount);

      const poll = () => {
        analyser.getByteFrequencyData(data);
        const avg = data.reduce((a, b) => a + b, 0) / data.length;
        setListenAmplitude(avg / 128);
        listenAnimRef.current = requestAnimationFrame(poll);
      };
      poll();
    } catch {}
  }, []);

  const stopListenAmplitude = useCallback(() => {
    cancelAnimationFrame(listenAnimRef.current);
    setListenAmplitude(0);
    if (listenStreamRef.current) {
      listenStreamRef.current.getTracks().forEach(t => t.stop());
      listenStreamRef.current = null;
    }
  }, []);

  /** Browsers without Web Speech API (and iOS): record a clip, transcribe via /api/transcribe */
  const startFallbackRecording = async () => {
    try {
      if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
        const typed = window.prompt('Voice capture is not available here. Type your message:');
        if (typed?.trim()) askVoice(typed);
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeCandidates = [
        'audio/mp4',
        'audio/webm;codecs=opus',
        'audio/webm',
      ];
      const mimeType = mimeCandidates.find((m) => MediaRecorder.isTypeSupported(m)) ?? '';
      const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);

      mediaRecorderRef.current = recorder;
      mediaChunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) mediaChunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        mediaRecorderRef.current = null;
        try {
          const outType = recorder.mimeType || 'audio/webm';
          const blob = new Blob(mediaChunksRef.current, { type: outType });
          mediaChunksRef.current = [];
          if (blob.size < 200) {
            stopListenAmplitude();
            setIsListening(false);
            return;
          }
          const ext = outType.includes('mp4') ? 'm4a' : 'webm';
          const formData = new FormData();
          formData.append('file', blob, `recording.${ext}`);
          const tr = await fetch('/api/transcribe', { method: 'POST', body: formData });
          const payload = await tr.json().catch(() => ({}));
          const text = typeof payload?.text === 'string' ? payload.text.trim() : '';
          if (text) await askVoice(text);
          else if (!tr.ok) {
            console.warn('[transcribe]', tr.status, payload);
          }
        } finally {
          stopListenAmplitude();
          setIsListening(false);
        }
      };

      await startListenAmplitude(stream);
      // iOS Safari often omits chunks until stop unless a timeslice is set
      recorder.start(200);
      setIsListening(true);
    } catch {
      const typed = window.prompt('Could not access microphone. Type your message:');
      if (typed?.trim()) askVoice(typed);
      setIsListening(false);
      stopListenAmplitude();
    }
  };

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white flex flex-col transition-colors duration-500">
      <CustomCursor />

      {/* ── Top Nav ────────────────────────────────────────────────── */}
      <nav className="absolute top-0 left-0 w-full p-4 md:p-6 lg:px-12 flex justify-between items-center z-50 pointer-events-none">
        <div className="font-mono text-[9px] md:text-[10px] text-white/30 tracking-[0.2em] uppercase select-none">
          Sys_Ready <span className="animate-pulse">_</span>
        </div>
        <a 
          href="/resume.pdf" 
          target="_blank"
          rel="noopener noreferrer"
          className="pointer-events-auto font-mono text-[9px] md:text-[10px] text-white/50 hover:text-white border border-white/10 hover:border-white/30 hover:bg-white/5 px-3 md:px-4 py-1.5 md:py-2 transition-all uppercase tracking-[0.2em] backdrop-blur-sm"
        >
          Resume
        </a>
      </nav>

      {/* ══════════════════════════════════════════════════════════════
          HERO — Name + Avatar + Prompt Bar
          ══════════════════════════════════════════════════════════════ */}
      <section ref={heroRef} className="min-h-screen flex flex-col relative">

        {/* Big Pixel Name — bolder, clearer hierarchy */}
        <div className="text-center pt-12 md:pt-10 pb-3 select-none px-4">
          <h1
            className="font-black text-white/70 leading-none tracking-wide transition-all duration-700 ease-out"
            style={{
              fontFamily: '"Press Start 2P", monospace',
              fontSize: 'clamp(0.8rem, 3.5vw, 2.2rem)',
              opacity: mounted ? 1 : 0,
              transform: mounted ? 'translateY(0)' : 'translateY(12px)',
            }}
          >
            AAYUSH
          </h1>
          <h2
            className="font-black text-white leading-none mt-2 transition-all duration-700 ease-out delay-150"
            style={{
              fontFamily: '"Press Start 2P", monospace',
              fontSize: 'clamp(1.8rem, 10vw, 7.5rem)',
              letterSpacing: '-0.02em',
              opacity: mounted ? 1 : 0,
              transform: mounted ? 'translateY(0)' : 'translateY(16px)',
            }}
          >
            SHARMA
          </h2>
        </div>

        {/* 3D Model */}
        <div className="flex-1 flex items-center justify-center px-3 sm:px-5 md:px-6 relative" style={{ minHeight: '46vh' }}>
          {mounted && (
            <div
              className="w-full max-w-[750px] aspect-[4/3] relative transition-all duration-1000 ease-out"
              style={{
                opacity: modelReady ? 1 : 0,
                transform: modelReady ? 'translateY(0) scale(1)' : 'translateY(20px) scale(0.98)',
              }}
            >
              <AsciiModelAvatar
                amplitude={amplitude}
                modelUrl="/model.glb"
                humanMode={conversationMode}
                onLoaded={handleModelLoaded}
                onProgress={handleModelProgress}
              />

              {/* Interaction hint */}
              <div
                className="absolute -bottom-7 md:-bottom-6 left-1/2 -translate-x-1/2 font-mono text-[8px] sm:text-[9px] md:text-[10px] text-white/15 tracking-wider select-none pointer-events-none transition-opacity duration-700 delay-500 whitespace-nowrap"
                style={{ opacity: modelReady ? 1 : 0 }}
              >
                drag to rotate · scroll to zoom
              </div>
            </div>
          )}

          {/* Loading state */}
          {mounted && !modelReady && (
            <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
              <div className="flex items-center gap-[3px] mb-4">
                {[0, 1, 2, 3, 4].map(i => (
                  <span
                    key={i}
                    className="block w-[3px] bg-white/40 rounded-full"
                    style={{
                      height: '14px',
                      animation: `pulse-bar 1s ease-in-out ${i * 0.12}s infinite`,
                    }}
                  />
                ))}
              </div>
              <div className="w-40 h-[1px] bg-white/10 relative overflow-hidden rounded-full">
                <div
                  className="h-full bg-white/50 transition-all duration-500 rounded-full"
                  style={{ width: `${modelProgress}%` }}
                />
              </div>
              <div className="font-mono text-[10px] text-white/20 mt-2 tracking-widest">
                {modelProgress}%
              </div>
            </div>
          )}

          {/* Greeting hint */}
          {showGreetingHint && !greetingPlayed && (
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 font-mono text-[10px] text-white/30 tracking-wider animate-pulse select-none">
              click anywhere to start
            </div>
          )}

          {/* Talking indicator */}
          {isTalking && (
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-2 font-mono text-[10px] text-white/40">
              <span className="w-1.5 h-1.5 rounded-full bg-white/60 animate-pulse" />
              speaking
            </div>
          )}

        </div>

        {/* ── Prompt Bar ─────────────────────────────────────────────── */}
        <div
          className="w-full max-w-3xl mx-auto px-3 sm:px-5 md:px-6 pb-5 md:pb-6 mt-8 md:mt-12 transition-all duration-700 ease-out delay-300"
          style={{
            opacity: modelReady ? 1 : 0,
            transform: modelReady ? 'translateY(0)' : 'translateY(10px)',
          }}
        >

          {/* Chat conversation panel — text mode only */}
          {!conversationMode && chatHistory.length > 0 && (
            <div className="border border-white/10 mb-3 max-h-[32vh] overflow-y-auto p-3 sm:p-4 md:p-5 space-y-3 text-[13px] sm:text-sm font-mono bg-black/50 backdrop-blur-sm rounded-sm">
              {chatHistory.map((m, i) => (
                <div key={i} className={m.role === 'user' ? 'text-white/50' : 'text-white/90 leading-relaxed'}>
                  <span className="text-white/30 mr-2">{m.role === 'user' ? '>' : '$'}</span>
                  {m.content}
                </div>
              ))}
              {loading && (
                <div className="text-white/40">
                  <span className="mr-2">$</span>
                  <span className="animate-pulse">thinking...</span>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>
          )}

          {/* ── Human Mode: Voice-only UI ─────────────────────── */}
          {conversationMode ? (
            <div className="flex flex-col items-center gap-6 py-4 md:py-8">
              {/* Status text */}
              <div className="font-mono text-[10px] md:text-[11px] tracking-[0.2em] uppercase text-white/40">
                {isTalking
                  ? 'Speaking...'
                  : isListening
                    ? mediaRecorderRef.current?.state === 'recording'
                      ? 'Tap mic to stop & send'
                      : 'Listening...'
                    : loading
                      ? 'Thinking...'
                      : preferRecorderVoice || (!speechSupported && mediaRecorderSupported)
                        ? 'Tap to record · tap again to send'
                        : 'Tap to speak'}
              </div>

              {/* Large mic button */}
              <button
                onClick={() => {
                  playClick();
                  if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
                    mediaRecorderRef.current.stop();
                    return;
                  }
                  if (isListening) {
                    stopListening();
                    return;
                  }
                  const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
                  if (!preferRecorderVoice && SpeechRecognition) {
                    if (!speechSupported) setSpeechSupported(true);
                    void startListening();
                    return;
                  }
                  if (mediaRecorderSupported || preferRecorderVoice) {
                    void startFallbackRecording();
                    return;
                  }
                  const typed = window.prompt('Voice input is not available here. Type your message:');
                  if (typed?.trim()) askVoice(typed);
                }}
                disabled={loading || isTalking}
                className={`w-14 h-14 md:w-16 md:h-16 flex items-center justify-center rounded-full transition-all duration-300 ${
                  isListening
                    ? 'bg-red-500/20 border-2 border-red-400/50 text-red-400 scale-110 animate-pulse'
                    : 'border-2 border-white/20 text-white/40 hover:text-white hover:border-white/50 hover:scale-105'
                } disabled:opacity-20 disabled:scale-100`}
                title={isListening ? 'Stop listening' : 'Start voice input'}
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="md:w-6 md:h-6">
                  <rect x="9" y="1" width="6" height="12" rx="3" />
                  <path d="M5 10a7 7 0 0 0 14 0" />
                  <line x1="12" y1="17" x2="12" y2="21" />
                  <line x1="8" y1="21" x2="16" y2="21" />
                </svg>
              </button>

              {/* Voice visualizer */}
              <div className="w-48 md:w-56 h-10">
                <VoiceVisualizer
                  amplitude={isTalking ? amplitude : isListening ? listenAmplitude : 0}
                  isListening={isListening}
                  isSpeaking={isTalking}
                />
              </div>

            </div>
          ) : (
            /* ── Normal Mode: Text input + prompt chips ─────── */
            <>
              <div className="border border-white/10 bg-black/30 rounded-sm">
                <div className="flex items-center gap-2 px-2.5 sm:px-3 md:px-4 py-2.5 border-b border-white/5 overflow-x-auto">
                  <span className="text-white/20 text-sm shrink-0">⌘</span>
                  {PROMPTS.map((p, i) => (
                    <button
                      key={p}
                      onClick={() => handlePromptClick(p)}
                      onMouseEnter={() => {
                        if (promptIdx !== i) {
                          setPromptIdx(i);
                          playHover();
                        }
                      }}
                      className={`text-[11px] md:text-xs px-2.5 sm:px-3 md:px-3.5 py-1.5 border whitespace-nowrap transition-all duration-150 font-mono shrink-0 rounded-sm
                        ${i === promptIdx
                          ? 'border-white/40 text-white/90 bg-white/5'
                          : 'border-white/10 text-white/35 hover:border-white/30 hover:text-white/60'
                        }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
                <div className="flex items-center px-2.5 sm:px-3 md:px-4 py-3 gap-2.5 md:gap-3">
                  <span className="text-white/15 text-sm">⣿</span>
                  <input
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        playClick();
                        ask(input);
                      } else {
                        playType();
                      }
                    }}
                    placeholder="Ask about Aayush..."
                    className="flex-1 bg-transparent text-sm text-white/85 outline-none placeholder:text-white/20 font-mono"
                  />
                  <button
                    onClick={() => { playClick(); ask(input); }}
                    disabled={loading || !input.trim()}
                    className="text-white/25 hover:text-white/70 transition-colors disabled:opacity-10"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
                    </svg>
                  </button>
                </div>
              </div>
            </>
          )}

          {/* Human Mode toggle */}
          <div className="flex justify-center items-center gap-4 pt-5 pb-2 text-xs font-mono">
            <span className="text-white/35 tracking-[0.2em] uppercase">Human Mode</span>
            <button
              onClick={async () => {
                const next = !conversationMode;
                if (next) playToggleOn(); else playToggleOff();
                
                setConversationMode(next);
                if (next) {
                  // Speak greeting when entering Human Mode
                  try {
                    const voiceRes = await fetch('/api/voice', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ text: HUMAN_GREETING }),
                    });
                    if (voiceRes.ok) {
                      const blob = await voiceRes.blob();
                      setIsTalking(true);
                      await playWithAmplitude(blob);
                      setIsTalking(false);
                    }
                  } catch {
                    setIsTalking(false);
                  }
                  // Auto-start listening after greeting (gesture-safe contexts only)
                  setTimeout(() => startListening(true), 500);
                } else {
                  // Turning off — stop listening
                  stopListening();
                }
              }}
              className={`w-10 h-5 border rounded-full relative transition-colors duration-200 ${
                conversationMode ? 'border-white/60 bg-white/10' : 'border-white/20'
              }`}
            >
              <span className={`absolute top-0.5 w-3.5 h-3.5 rounded-full transition-all duration-200 ${
                conversationMode ? 'left-5 bg-white' : 'left-0.5 bg-white/30'
              }`} />
            </button>
            <span className={`tracking-[0.2em] uppercase ${conversationMode ? 'text-white/80' : 'text-white/30'}`}>
              {conversationMode ? 'ON' : 'OFF'}
            </span>
          </div>
        </div>

        {/* Theme toggle — bottom right */}
        <button 
          onClick={() => { playClick(); setTheme(t => t === 'dark' ? 'light' : 'dark'); }}
          className="fixed bottom-6 right-6 z-50 w-10 h-10 border border-white/10 flex items-center justify-center text-white/40 hover:text-white hover:border-white/40 transition-colors bg-black/50 backdrop-blur-sm rounded-sm outline-none"
          title="Toggle Theme"
        >
          {theme === 'dark' ? '☀' : '☾'}
        </button>
      </section>

      {/* ── Currently Section ────────────────────────────────── */}
      <section className="max-w-4xl mx-auto w-full px-4 sm:px-6 md:px-8 lg:px-16 py-14 md:py-20">
        <div className="flex items-center gap-4 mb-10">
          <h3 className="font-mono text-white/45 tracking-[0.3em] uppercase whitespace-nowrap text-xs md:text-sm">Currently</h3>
          <div className="flex-1 h-px bg-white/10" />
        </div>
        <div className="space-y-4 md:space-y-5">
          {CURRENTLY.map(({ icon, label, value, logo, promptQuestion }) => {
            const valueClass =
              'text-white/85 underline underline-offset-4 decoration-white/15 break-all font-mono text-[14px] sm:text-[15px] md:text-[17px] leading-relaxed';
            const valueNode = promptQuestion ? (
              <button
                type="button"
                onClick={() => handleCurrentlyClick(promptQuestion)}
                className={`text-left ${valueClass} hover:text-white hover:decoration-white/50 cursor-pointer bg-transparent border-0 p-0 transition-colors`}
              >
                {value}
              </button>
            ) : (
              <span className={valueClass}>{value}</span>
            );
            return (
              <div key={`${label}-${value}`} className="flex flex-wrap items-baseline gap-x-2 gap-y-1 text-[14px] sm:text-[15px] md:text-[17px] font-mono leading-relaxed">
                <span className="text-white/25 shrink-0">{icon}</span>
                <span className="text-white/45">{label}</span>
                {logo ? (
                  <>
                    <img
                      src={logo}
                      alt=""
                      width={28}
                      height={28}
                      className="inline-block h-[22px] w-[22px] md:h-7 md:w-7 object-contain shrink-0 align-baseline translate-y-[3px] rounded-[3px] bg-white/[0.06] p-[2px]"
                      aria-hidden
                    />
                    {valueNode}
                  </>
                ) : (
                  valueNode
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* ── Experience Section ──────────────────────────────────── */}
      <ExperienceTimeline />

      {/* ── Achievements Marquee ────────────────────────────────── */}
      <AchievementsMarquee />

      {/* ── Projects Section ──────────────────────────────────── */}
      <ProjectGrid />

      {/* ── Connect Section ───────────────────────────────────── */}
      <footer className="max-w-4xl mx-auto w-full px-4 sm:px-6 md:px-8 lg:px-16 py-12 md:py-16">
        <div className="flex items-center gap-4 mb-10">
          <h3 className="text-xs font-mono text-white/45 tracking-[0.3em] uppercase whitespace-nowrap text-[10px] md:text-xs">Connect</h3>
          <div className="flex-1 h-px bg-white/10" />
        </div>
        <div className="flex flex-wrap gap-6 md:gap-8 text-sm md:text-[15px] font-mono">
          {[
            ['Email', 'mailto:aayusharmaaa.work@gmail.com'],
            ['LinkedIn', 'https://www.linkedin.com/in/aayush-sharma-aiml'],
            ['GitHub', 'https://github.com/aayusharmaaa'],
          ].map(([label, href]) => (
            <a key={label} href={href} className="text-white/55 hover:text-white transition-colors">
              {label}
            </a>
          ))}
        </div>
        <p className="text-white/10 text-[10px] font-mono mt-12">Designed & Built by Aayush Sharma</p>
      </footer>
    </main>
  );
}
