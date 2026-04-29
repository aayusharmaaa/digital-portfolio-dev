'use client';

import { motion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';

const PROJECTS = [
  {
    id: 'cloud-optimizer',
    title: 'AI Cloud Resource Optimizer',
    description: 'Real-time ML-driven cloud resource prediction & auto-scaling. Reduces infra costs by 40%.',
    video: '/projects/cloud-optimizer.mp4', 
    image: '/projects/cloud-optimizer.png', 
    link: 'https://github.com/aayusharmaaa/cloud-computing-resource-optimizer',
  },
  {
    id: 'fair-lending',
    title: 'FairLend (Fair Lending AI Workbench)',
    description: 'Capstone project. GenAI pipeline to test & mitigate bias in education loan approval models using explainability techniques.',
    video: '/projects/fair-lending.mp4',
    image: '/projects/fair-lending.png',
    link: 'https://github.com/aayusharmaaa/Fairlend',
  },
  {
    id: 'voicebot-onboarding',
    title: 'Voicebot Onboarding Platform',
    description:
      'Voicebot onboarding platform that reduced customer integration time by 27%. Built scalable workflows with STT optimization and automated API-driven setup.',
    image: '/projects/voicebot-onboarding.png',
    link: '#',
  },
  {
    id: 'thoughtspace',
    title: 'ThoughtSpace',
    description: 'Spatial canvas app for rediscovering saved notes across Health, Wealth, and Wisdom. Uses GPT-4 to auto-categorize content and surface meaningful connections.',
    image: '/projects/thoughtbasic.png',
    link: 'https://github.com/aayusharmaaa/spatial-knowledge-board',
  },
];

function ProjectCard({
  project,
  index,
  isActive,
  anyActive,
  onActivate,
  onDeactivate,
}: {
  project: typeof PROJECTS[0];
  index: number;
  isActive: boolean;
  anyActive: boolean;
  onActivate: () => void;
  onDeactivate: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const isPlaceholderLink = !project.link || project.link === '#';

  useEffect(() => {
    if (!videoRef.current || !project.video) return;
    if (isActive) {
      videoRef.current.play().catch(() => {});
    } else {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  }, [isActive, project.video]);

  return (
    <motion.a
      href={isPlaceholderLink ? undefined : project.link}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1, duration: 0.4 }}
      whileHover={{ y: -12, scale: 1.06 }}
      onClick={(e) => {
        if (isPlaceholderLink) e.preventDefault();
      }}
      onMouseEnter={onActivate}
      onMouseLeave={onDeactivate}
      onTouchStart={onActivate}
      className="group block relative hover:z-20 outline-none touch-manipulation transition-colors"
    >
      {/* Media Box */}
      <div className="aspect-video bg-white/[0.03] border border-white/10 overflow-hidden mb-3 md:mb-5 relative transition-all duration-500 group-hover:border-white/40 group-hover:shadow-[0_10px_50px_rgba(255,255,255,0.1)] rounded-sm group/media">
        
        {/* Fallback/Background placeholder - always visible behind media */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-white/10 font-mono pointer-events-none group-hover:text-white/20 transition-colors">
          <span className="text-3xl mb-1">⌬</span>
          <span className="text-[9px] uppercase tracking-[0.2em]">{project.title}</span>
        </div>
        
        {project.video && (!anyActive || isActive) ? (
          <video
            ref={videoRef}
            src={project.video}
            poster={project.image}
            loop
            muted
            playsInline
            className="w-full h-full object-cover opacity-100 scale-100 group-hover/media:scale-110 transition-transform duration-[800ms] ease-out relative z-10"
          />
        ) : (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={project.image}
            alt={project.title}
            className="w-full h-full object-cover opacity-100 scale-100 group-hover/media:scale-110 transition-transform duration-[800ms] ease-out relative z-10"
            onError={(e) => { (e.target as HTMLImageElement).style.opacity = '0'; }}
          />
        )}
      </div>

      {/* Title */}
      <h4 className="font-mono text-[15px] md:text-base font-bold text-white/80 group-hover:text-white transition-colors mb-1.5 md:mb-2">
        {project.title}
      </h4>

      {/* Description */}
      <p className="font-mono text-[13px] md:text-sm text-white/50 leading-relaxed">
        {project.description}
      </p>
    </motion.a>
  );
}

export default function ProjectGrid() {
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);

  return (
    <section id="projects" className="max-w-4xl mx-auto w-full px-4 sm:px-6 md:px-8 lg:px-16 py-12 md:py-16">
      {/* Section heading with line */}
      <div className="flex items-center gap-3 md:gap-4 mb-8 md:mb-12">
        <h3 className="text-[10px] md:text-xs font-mono text-white/40 tracking-[0.3em] uppercase whitespace-nowrap">
          Projects
        </h3>
        <div className="flex-1 h-px bg-white/10" />
      </div>

      {/* 2-column grid like Matthew's site */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
        {PROJECTS.map((project, i) => (
          <ProjectCard
            key={project.id}
            project={project as any}
            index={i}
            isActive={activeProjectId === project.id}
            anyActive={activeProjectId !== null}
            onActivate={() => setActiveProjectId(project.id)}
            onDeactivate={() => {
              if (activeProjectId === project.id) setActiveProjectId(null);
            }}
          />
        ))}
      </div>
    </section>
  );
}
