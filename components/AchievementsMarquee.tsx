'use client';

export default function AchievementsMarquee() {
  const ACHIEVEMENTS = [
    "Won Techno-Entrepreneurial Ideathon ’25",
    "Filed patent for Cloud Resource Optimizer",
    "Secured 3rd place at Project Expo ’25",
    "Received Student Excellence Award by MUJ",
    "Secured pre-incubation for startup prototype by E-Cell",
    "Led AI adoption for 200+ students as Campus Partner at Perplexity"
  ];

  // Duplicate for seamless infinite scrolling
  const items = [...ACHIEVEMENTS, ...ACHIEVEMENTS];

  return (
    <section className="w-full py-16 my-8">
      {/* ── Standard Section Heading ── */}
      <div className="max-w-4xl mx-auto w-full px-6 md:px-8 lg:px-16 mb-12">
        <div className="flex items-center gap-4">
          <h3 className="font-mono text-white/45 tracking-[0.3em] uppercase whitespace-nowrap text-xs md:text-sm">
            Achievements
          </h3>
          <div className="flex-1 h-px bg-white/10" />
        </div>
      </div>

      {/* ── Marquee Container ── */}
      <div className="relative w-full overflow-hidden flex">
        
        {/* Cinematic Gradient Mask for the edges */}
        <div className="absolute inset-y-0 left-0 w-16 md:w-32 z-10 pointer-events-none bg-gradient-to-r from-black to-transparent" />
        <div className="absolute inset-y-0 right-0 w-16 md:w-32 z-10 pointer-events-none bg-gradient-to-l from-black to-transparent" />

        {/* The scrolling track */}
        <div className="flex w-max whitespace-nowrap animate-marquee hover:[animation-play-state:paused] py-4">
          {items.map((item, idx) => (
            <div
              key={idx}
              className="flex items-center gap-3 px-5 py-3 mx-3 md:mx-4 group cursor-default transition-all duration-300
                         border border-white/10 bg-white/[0.02] hover:bg-white/[0.08] hover:border-white/30 rounded-sm"
            >
              {/* Geometric Icon */}
              <span className="text-white/30 text-xs md:text-sm transition-transform duration-500 group-hover:rotate-90 group-hover:text-white">
                ✦
              </span>
              
              {/* The Text */}
              <span className="font-mono text-xs md:text-sm text-white/60 tracking-wide group-hover:text-white transition-colors duration-300">
                {item}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
