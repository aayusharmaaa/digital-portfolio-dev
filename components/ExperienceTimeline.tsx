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
    id: 'deloitte',
    role: 'Capstone Project — FairLend',
    company: 'Deloitte',
    date: '2025 — Present',
    location: 'Remote · Industry Mentored',
    logo: '/logos/deloitte.png',
    description: (
      <>
        Built a <strong>fairness validation</strong> and <strong>audit</strong> platform for{' '}
        <strong>education-loan risk models</strong>, enabling transparent and accountable{' '}
        <strong>AI decision-making</strong>.
      </>
    ),
    highlights: [
      <>
        Designed a <strong>GenAI-powered validation pipeline</strong> to evaluate bias across{' '}
        <strong>3,000+ synthetic user profiles</strong> covering diverse demographic scenarios.
      </>,
      <>
        Identified hidden algorithmic biases across five key dimensions: geographic, income, gender, credit, and edge cases
      </>,
      <>
        Developed <strong>policy-driven mitigation checks</strong> with{' '}
        <strong>before/after score comparisons</strong> to ensure <strong>auditability</strong> and compliance.
      </>,
      <>
        Introduced a <strong>Human-in-the-Loop</strong> feedback system, allowing auditors to iteratively refine{' '}
        <strong>model behavior</strong> and improve <strong>fairness metrics</strong>.
      </>,
      <>
        Delivered a <strong>dashboard</strong> for <strong>non-technical stakeholders</strong>, translating
        complex fairness signals into concise, <strong>actionable insights</strong>.
      </>,
    ],
  },
  {
    id: 'airtel',
    role: 'Software Engineering Intern',
    company: 'Airtel',
    date: 'May — July 2025',
    location: 'India',
    logo: '/logos/airtel.png',
    description: (
      <>
        Worked on <strong>production-grade backend systems</strong> and internal platforms in a high-scale
        telecom environment.
      </>
    ),
    highlights: [
      <>
        Engineered a <strong>Voicebot Onboarding</strong> platform, reducing customer integration time by{' '}
        <strong>27%</strong>.
      </>,
      <>
        Fine-tuned <strong>Speech-to-Text</strong> models for <strong>Indian languages</strong>, improving
        transcription accuracy in real-world scenarios.
      </>,
      <>
        Built scalable architectures (<strong>Next.js</strong>, <strong>Spring Boot</strong>, <strong>MongoDB</strong>)
        supporting <strong>10,000+ concurrent requests</strong> with <strong>sub-200ms latency</strong>.
      </>,
      <>
        Integrated <strong>REST APIs</strong> with <strong>LLM</strong> fallback handling, reducing manual intervention by{' '}
        <strong>40%</strong> and improving intent recognition by <strong>25%</strong>.
      </>,
      <>
        Strengthened system reliability through <strong>robust validation</strong> and{' '}
        <strong>request/response optimization</strong>.
      </>,
    ],
  },
  {
    id: 'turingsapiens',
    role: 'Head of Projects & Treasurer',
    company: 'Turing Sapiens',
    date: '2023 — Present',
    location: 'Manipal University Jaipur',
    description: (
      <>
        Led technical initiatives and operations for a <strong>university-wide AI/tech community</strong>.
      </>
    ),
    highlights: [
      <>
        Mentored student teams on project design, <strong>ML</strong> implementation, and technical storytelling.
      </>,
      <>
        Spearheaded hackathons and workshops, framing problem statements and managing end-to-end execution for{' '}
        <strong>500+ participants</strong>.
      </>,
      <>
        Oversaw budgeting, sponsorships, and financial planning to sustain <strong>large-scale community programs</strong>.
      </>,
      <>
        Conducted core team recruitment, evaluating both <strong>technical</strong> and <strong>leadership</strong> potential.
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
