'use client';

import { useRef, useState } from 'react';

const STEPS = [
  {
    number: 1,
    title: 'Clean Surface',
    description: 'Wipe the device surface with a soft, lint-free cloth. Use rubbing alcohol for stubborn residue.',
  },
  {
    number: 2,
    title: 'Peel & Align',
    description: 'Carefully peel back a corner and align the design. Use light pressure to position correctly.',
  },
  {
    number: 3,
    title: 'Smooth Down',
    description: 'Gently press down from center outward, removing air bubbles. Use a cloth to smooth edges.',
  },
  {
    number: 4,
    title: 'Set with Heat',
    description: 'Optional: Use a heat gun or hairdryer on low to set edges. Let cool for 1-2 minutes.',
  },
];

const VIDEOS = [
  {
    id: 'main',
    title: 'Full Application Guide',
    src: '/videos/application_process.mp4',
  },
];

export default function ApplicationGuideSection() {
  const [selectedVideo] = useState(VIDEOS[0]);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(true);

  const togglePlayback = async () => {
    const video = videoRef.current;
    if (!video) {
      return;
    }

    if (video.paused) {
      await video.play();
      setIsPlaying(true);
      return;
    }

    video.pause();
    setIsPlaying(false);
  };

  return (
    <section className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 rounded-[2.5rem] border border-slate-800 shadow-[0_-20px_50px_rgba(0,0,0,0.9)] px-5 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-16 text-center sm:mb-20">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-400">Application Guide</p>
          <h2 className="mt-4 text-4xl font-black tracking-[-0.02em] text-white sm:text-5xl">
            Easy Application Guide
          </h2>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-slate-300">
            Follow these simple steps to apply your custom skin perfectly. Watch our video guide and refer to the step-by-step instructions below.
          </p>
        </div>

        {/* Video Container */}
        <div className="mb-16 overflow-hidden rounded-[2.5rem] border border-slate-700 bg-black shadow-2xl sm:mb-20">
          <div className="relative aspect-video bg-black">
            <video
              ref={videoRef}
              key={selectedVideo.id}
              className="h-full w-full bg-black object-cover"
              muted
              autoPlay
              loop
              playsInline
              preload="metadata"
              controls={false}
              src={selectedVideo.src}
              onClick={togglePlayback}
            >
              Your browser does not support the video tag.
            </video>

            <button
              type="button"
              onClick={togglePlayback}
              className="absolute bottom-4 right-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-black/70 text-lg text-white shadow-lg backdrop-blur-sm transition hover:bg-black/90"
              aria-label={isPlaying ? 'Pause video' : 'Play video'}
            >
              <i className={`bx ${isPlaying ? 'bx-pause-circle' : 'bx-play-circle'} text-xl`} />
            </button>
          </div>
        </div>

        {/* Steps Grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step) => (
            <div
              key={step.number}
              className="group relative overflow-hidden rounded-[1.75rem] border border-slate-700 bg-gradient-to-br from-slate-800 to-slate-900 p-8 transition-all duration-300 hover:border-slate-600 hover:shadow-xl hover:shadow-slate-900/50"
            >
              {/* Background accent */}
              <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-gradient-to-br from-slate-700/20 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

              {/* Content */}
              <div className="relative z-10">
                {/* Step Number Circle */}
                <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-slate-600 to-slate-700 shadow-lg">
                  <span className="text-xl font-bold text-white">{step.number}</span>
                </div>

                {/* Step Title */}
                <h3 className="mb-3 text-xl font-bold text-white">{step.title}</h3>

                {/* Step Description */}
                <p className="leading-6 text-slate-300">{step.description}</p>
              </div>

              {/* Bottom accent line */}
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-slate-600/0 via-slate-600/50 to-slate-600/0 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
            </div>
          ))}
        </div>

        {/* Tips Section */}
        <div className="mt-16 rounded-[2rem] border border-slate-700 bg-gradient-to-r from-slate-800/50 to-slate-900/50 p-8 backdrop-blur-sm sm:mt-20 sm:p-10">
          <div className="flex gap-4 sm:gap-6">
            <div className="flex-shrink-0">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-700 text-white">
                <i className="bx bx-bulb text-lg" />
              </div>
            </div>
            <div>
              <h3 className="mb-3 text-lg font-bold text-white">Pro Tips</h3>
              <ul className="space-y-2 text-slate-300">
                <li className="flex gap-3">
                  <span className="flex-shrink-0">•</span>
                  <span>Work in a dust-free, well-lit environment for best results</span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0">•</span>
                  <span>Have a squeegee or credit card handy to smooth out bubbles</span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0">•</span>
                  <span>If you make a mistake, carefully peel back and realign—the material is forgiving</span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0">•</span>
                  <span>For best adhesion, allow 24 hours before using your device</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
