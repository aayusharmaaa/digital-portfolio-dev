'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const SUGGESTED_PROMPTS = [
  "Tell me about your projects",
  "What's your tech stack?",
  "Airtel internship experience?",
  "What are you building now?",
];

export default function ChatInterface({ onClose }: { onClose: () => void }) {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: "Hey! I'm Aayush's AI clone. What do you want to know?" }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading) return;
    const userMsg: Message = { role: 'user', content: text };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [...messages, userMsg] }),
      });
      const data = await res.json();
      const reply = data.reply || 'Error getting response.';
      const assistantMsg: Message = { role: 'assistant', content: reply };
      setMessages(prev => [...prev, assistantMsg]);

      // If voice enabled, play audio through speaker
      if (voiceEnabled) {
        try {
          const voiceRes = await fetch('/api/voice', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: reply }),
          });
          if (voiceRes.ok) {
            const audioBlob = await voiceRes.blob();
            const url = URL.createObjectURL(audioBlob);
            const audio = new Audio(url);
            audio.onended = () => URL.revokeObjectURL(url);
            await audio.play();
          }
        } catch {
          // Voice failed silently — text still shows
        }
      }
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Connection error — check your GOOGLE_GEMINI_API_KEY in .env.local'
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-40 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', damping: 25 }}
        className="w-full max-w-2xl h-[75vh] bg-black border border-white/10 flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
          <div className="flex items-center gap-3">
            <span className="font-mono text-sm text-white">aayush_clone</span>
            <span className="font-mono text-xs text-white/30">gemini + rag + elevenlabs</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setVoiceEnabled(v => !v)}
              className={`text-xs font-mono px-2 py-1 border transition-colors ${
                voiceEnabled ? 'border-white text-white' : 'border-white/20 text-white/30'
              }`}
            >
              {voiceEnabled ? 'voice on' : 'voice off'}
            </button>
            <button onClick={onClose} className="text-white/40 hover:text-white text-xl leading-none">×</button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 font-mono text-sm">
          <AnimatePresence initial={false}>
            {messages.map((msg, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role === 'assistant' && (
                  <span className="text-white/40 shrink-0 mt-0.5">$</span>
                )}
                <div className={`max-w-[80%] leading-relaxed ${
                  msg.role === 'user'
                    ? 'text-white/70 bg-white/5 px-3 py-2'
                    : 'text-white/90'
                }`}>
                  {msg.content}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          {loading && (
            <div className="flex gap-2 items-center text-white/40">
              <span>$</span>
              <span className="animate-pulse">thinking</span>
              <span className="animate-[blink_1s_step-end_infinite]">█</span>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Suggested prompts */}
        {messages.length === 1 && (
          <div className="px-4 pb-2 flex flex-wrap gap-2">
            {SUGGESTED_PROMPTS.map(p => (
              <button
                key={p}
                onClick={() => sendMessage(p)}
                className="text-xs font-mono text-white/40 border border-white/10 px-2 py-1 hover:text-white hover:border-white/30 transition-colors"
              >
                {p}
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        <div className="border-t border-white/10 px-4 py-3 flex items-center gap-3">
          <span className="text-white/40 font-mono text-sm shrink-0">›</span>
          <input
            autoFocus
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && sendMessage(input)}
            placeholder="ask me anything..."
            className="flex-1 bg-transparent font-mono text-sm text-white outline-none placeholder:text-white/20"
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={loading || !input.trim()}
            className="text-xs font-mono text-white border border-white/20 px-3 py-1 hover:border-white transition-colors disabled:opacity-20"
          >
            send
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
