'use client';

import { motion } from 'framer-motion';

import type { ReactNode } from 'react';

type Experience = {
  id: string;
  role: string;
  company: string;
  date: string;
  location: string;
  logo?: string;
  description: ReactNode;
  highlights: ReactNode[];
};

const EXPERIENCES: Experience[] = [
  {
    id: 'coforge',
    role: 'GenAI Intern',
    company: 'Coforge',
    date: 'May — Jul 2026',
    location: 'Noida, Uttar Pradesh',
    description: (
      <>
        Delivered <strong>cloud-native Generative AI</strong> solutions for Fortune 500 clients across
        design, implementation, deployment, and production reliability.
      </>
    ),
    highlights: [
      <>
        Engineered an end-to-end <strong>AI Interview Avatar</strong> platform integrating real-time speech
        processing, <strong>LLM inference</strong>, APIs, and conversational workflows — processed{' '}
        <strong>250+ technical assessments</strong>.
      </>,
      <>
        Achieved <strong>94% question-relevance accuracy</strong> and{' '}
        <strong>sub-500 ms</strong> end-to-end speech-to-LLM-to-speech latency while reducing operational
        costs by <strong>35%</strong>.
      </>,
    ],
  },
  {
    id: 'deloitte',
    role: 'Tech Lead — Deloitte Capstone',
    company: 'Deloitte',
    date: 'Oct 2025 — Jan 2026',
    location: 'Remote',
    logo: '/logos/deloitte.png',
    description: (
      <>
        Built <strong>FairLend</strong>, a GenAI-powered fair-lending validation workbench for banks and
        NBFCs.
      </>
    ),
    highlights: [
      <>
        Built FairLend with <strong>FastAPI</strong>, <strong>Next.js</strong>,{' '}
        <strong>PostgreSQL</strong>, and <strong>Google Gemini</strong> — cutting audit time from{' '}
        <strong>4–6 weeks</strong> to <strong>2–3 days</strong> per model run across{' '}
        <strong>3,100+ synthetic profiles</strong> and <strong>5 fairness dimensions</strong>.
      </>,
      <>
        Partnered with a <strong>4-member team</strong> and Deloitte mentors to align fairness KPIs with
        RBI-style governance standards, producing audit-grade evidence packs for banks and NBFCs.
      </>,
    ],
  },
  {
    id: 'airtel',
    role: 'Software Engineer Intern',
    company: 'Airtel',
    date: 'May — Jul 2025',
    location: 'Gurugram, Haryana',
    logo: '/logos/airtel.png',
    description: (
      <>
        Built production voice-AI and backend systems in a high-scale telecom environment.
      </>
    ),
    highlights: [
      <>
        Built a <strong>Voicebot Onboarding</strong> platform that reduced enterprise-customer integration
        time by <strong>27%</strong>.
      </>,
      <>
        Developed and scaled backend microservices with <strong>Spring Boot</strong>,{' '}
        <strong>Next.js</strong>, and <strong>MongoDB</strong>, supporting{' '}
        <strong>10,000+ concurrent requests</strong> at <strong>sub-200 ms latency</strong>.
      </>,
      <>
        Fine-tuned <strong>Speech-to-Text</strong> models for Indian languages, improving production
        transcription accuracy and enabling multilingual voice-AI workflows.
      </>,
    ],
  },
];

export default function ExperienceTimeline() {
  return (
    <section id="experience" className="max-w-4xl mx-auto w-full px-4 sm:px-6 md:px-8 lg:px-16 py-14 md:py-20">
      {/* Section heading with line */}
      <div className="flex items-center gap-3 md:gap-4 mb-10 md:mb-16">
        <h3 className="font-mono text-white/45 tracking-[0.3em] uppercase whitespace-nowrap text-xs md:text-sm">
          Experience
        </h3>
        <div className="flex-1 h-px bg-white/10" />
      </div>

      <div className="relative border-l border-white/10 ml-2.5 sm:ml-3 md:ml-4 space-y-8 md:space-y-12">
        {EXPERIENCES.map((exp, i) => (
          <motion.div
            key={exp.id}
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.5, delay: i * 0.15 }}
            className="relative pl-6 sm:pl-8 md:pl-12 pr-4 sm:pr-5 md:pr-6 py-4 bg-white/[0.03] border border-white/10 rounded-sm group"
          >
            {/* Glowing timeline dot */}
            <div className="absolute left-[-5px] top-1.5 w-2 h-2 rounded-full bg-white/20 border border-white/40 group-hover:bg-white/80 group-hover:scale-150 group-hover:shadow-[0_0_10px_rgba(255,255,255,0.8)] transition-all duration-300 z-10" />

            {/* Content branch line */}
            <div className="absolute left-0 top-[9px] w-5 sm:w-6 md:w-8 h-px bg-white/10 group-hover:bg-white/30 transition-colors duration-300" />

            <div className="flex flex-col md:flex-row md:items-baseline md:justify-between gap-1 md:gap-4 mb-3">
              <h4 className="font-mono text-[15px] sm:text-base md:text-lg font-bold text-white/90 group-hover:text-white transition-colors">
                {exp.role}
              </h4>
              <div className="font-mono text-[10px] md:text-xs tracking-widest text-white/30 uppercase shrink-0">
                {exp.date}
              </div>
            </div>
            
            <div className="flex items-center gap-2 font-mono text-[11px] md:text-sm text-white/70 mb-1.5 tracking-wide">
              {exp.logo ? (
                <img
                  src={exp.logo}
                  alt=""
                  aria-hidden
                  className="h-[18px] w-[18px] md:h-[20px] md:w-[20px] object-contain rounded-[3px] bg-white/[0.06] p-[2px] border border-white/10"
                />
              ) : (
                <span className="inline-flex items-center justify-center h-[18px] w-[18px] md:h-[20px] md:w-[20px] rounded-[3px] bg-white/[0.06] border border-white/10 text-white/60 text-[10px]">
                  {exp.company
                    .split(' ')
                    .map((s) => s[0])
                    .join('')
                    .slice(0, 2)
                    .toUpperCase()}
                </span>
              )}
              <span>@ {exp.company}</span>
            </div>
            <div className="font-mono text-[10px] md:text-xs text-white/45 mb-3 uppercase tracking-[0.16em]">
              {exp.location}
            </div>

            <p className="font-mono text-[13px] md:text-sm leading-relaxed text-white/60 group-hover:text-white/80 transition-colors">
              {exp.description}
            </p>
            <ul className="mt-4 space-y-2">
              {exp.highlights.map((item, idx) => (
                <li
                  key={`${exp.id}-${idx}`}
                  className="font-mono text-[12px] md:text-[13px] leading-relaxed text-white/55 group-hover:text-white/75 transition-colors"
                >
                  <span className="text-white/25 mr-2">•</span>
                  {item}
                </li>
              ))}
            </ul>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
