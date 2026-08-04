'use client';

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
  return (
    <section className="sticky top-0 z-20 min-h-screen bg-slate-950 rounded-t-[2.5rem] border-t border-slate-800 shadow-[0_-20px_50px_rgba(0,0,0,0.9)]">
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col px-5 py-10 sm:px-6 lg:px-8">
        <div className="mb-10 max-w-3xl text-white">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-300">See Stun-Fi Skins in Action</p>
          <h2 className="mt-4 text-3xl font-black tracking-[-0.04em] sm:text-4xl">Real showcase videos of our custom wraps and installs.</h2>
          <p className="mt-4 text-base leading-7 text-slate-300 sm:text-lg">
            Watch how premium laptop wraps, phone skins, and controller designs come together in real client installs. Each clip highlights fit, finish, and detail work.
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {SHOWCASE_VIDEOS.map((video) => (
            <article key={video.title} className="overflow-hidden rounded-[2rem] border border-slate-800 bg-slate-900 shadow-xl">
              <div className="flex items-center justify-between gap-3 border-b border-slate-800 px-4 py-3 text-sm text-slate-300">
                <span className={badgeStyles}>{video.category}</span>
                <span className="font-semibold text-slate-400">Video</span>
              </div>
              <div className="relative overflow-hidden bg-black">
                <video
                  className="h-full w-full bg-black object-cover"
                  poster={video.poster}
                  controls
                  loop
                  muted
                  playsInline
                  preload="metadata"
                  src={video.src}
                />
              </div>
              <div className="px-4 py-4 sm:px-5">
                <h3 className="text-base font-semibold text-white">{video.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-400">
                  Smooth playback, crisp detail, and a clean preview of how Stun-Fi finished the wrap.
                </p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
