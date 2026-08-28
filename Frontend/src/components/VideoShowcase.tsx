'use client';

import { useRef, useState } from 'react';

const SHOWCASE_VIDEOS = [
  {
    title: 'Compilation Showcase',
    category: 'Laptop',
    poster: '/img/video-posters/compilation.svg',
    src: '/videos/Compilation.mp4',
  },
  {
    title: 'Standard Quality Showcase',
    category: 'Laptop',
    poster: '/img/video-posters/standard-quality.svg',
    src: '/videos/Standard%20Quality.mp4',
  },
  {
    title: 'Shiny Surface Quality Showcase',
    category: 'Laptop',
    poster: '/img/video-posters/shiny-surface-quality.svg',
    src: '/videos/Shiny%20Surface%20Quality.mp4',
  },
];

const badgeStyles = 'inline-flex items-center rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-white/90';

export default function VideoShowcase() {
  const videoRefs = useRef<Array<HTMLVideoElement | null>>([]);
  const [playingVideos, setPlayingVideos] = useState<Record<string, boolean>>({});

  const togglePlayback = async (index: number, title: string) => {
    const video = videoRefs.current[index];
    if (!video) {
      return;
    }

    if (video.paused) {
      await video.play();
      setPlayingVideos((current) => ({ ...current, [title]: true }));
      return;
    }

    video.pause();
    setPlayingVideos((current) => ({ ...current, [title]: false }));
  };

  return (
    <section className="sticky top-0 z-20 min-h-screen bg-slate-950 rounded-[2.5rem] border border-slate-800 shadow-[0_-20px_50px_rgba(0,0,0,0.9)]">
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col px-5 py-10 sm:px-6 lg:px-8">
        <div className="mb-10 max-w-3xl text-white">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-300">See Stun-Fi Skins in Action</p>
          <h2 className="mt-4 text-3xl font-black tracking-[-0.04em] sm:text-4xl">Real showcase videos of our custom wraps and installs.</h2>
          <p className="mt-4 text-base leading-7 text-slate-300 sm:text-lg">
            Watch how premium laptop wraps, phone skins, and controller designs come together in real client installs. Each clip highlights fit, finish, and detail work.
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {SHOWCASE_VIDEOS.map((video, index) => (
            <article key={video.title} className="overflow-hidden rounded-[2rem] border border-slate-800 bg-slate-900 shadow-xl">
              <div className="flex items-center justify-between gap-3 border-b border-slate-800 px-4 py-3 text-sm text-slate-300">
                <span className={badgeStyles}>{video.category}</span>
                <span className="font-semibold text-slate-400">Video</span>
              </div>
              <div className="relative overflow-hidden bg-black">
                <video
                  ref={(element) => {
                    videoRefs.current[index] = element;
                  }}
                  className="h-full w-full bg-black object-cover"
                  poster={video.poster}
                  controls={false}
                  loop
                  muted
                  playsInline
                  preload="metadata"
                  src={video.src}
                  onClick={() => togglePlayback(index, video.title)}
                />
                <button
                  type="button"
                  onClick={() => togglePlayback(index, video.title)}
                  className="absolute bottom-4 right-4 inline-flex h-11 w-11 items-center justify-center rounded-full bg-black/70 text-base text-white shadow-lg backdrop-blur-sm transition hover:bg-black/90"
                  aria-label={playingVideos[video.title] ? 'Pause video' : 'Play video'}
                >
                  <i className={`bx ${playingVideos[video.title] ? 'bx-pause-circle' : 'bx-play-circle'} text-lg`} />
                </button>
              </div>
              <div className="px-4 py-4 sm:px-5">
                <h3 className="text-base font-semibold text-white">{video.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-400">
                  See the fit, finish, and detail that goes into every STUN-FI wrap.
                </p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
