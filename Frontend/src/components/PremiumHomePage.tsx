'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import { useReducedMotion } from 'framer-motion';
import BrandedLogo from './BrandedLogo';

const HERO_IMAGES = [
  { src: '/img/ggg.jpg', alt: 'Custom graphic skins across several laptops' },
  { src: '/img/Keyboard.jpg', alt: 'Custom skin fitted across a laptop keyboard deck' },
  { src: '/img/Stripes.jpg', alt: 'Black and white striped laptop skin' },
  { src: '/img/uuuu.jpg', alt: 'Black and white custom laptop skin' },
  { src: '/img/Bottom.jpg', alt: 'Custom finish fitted to a laptop base' },
];

export default function PremiumHomePage() {
  const prefersReducedMotion = useReducedMotion();
  const [activeImage, setActiveImage] = useState(0);
  const [isScrolled, setIsScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 8);
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (prefersReducedMotion) return;
    const timer = window.setInterval(() => {
      setActiveImage((current) => (current + 1) % HERO_IMAGES.length);
    }, 5000);
    return () => window.clearInterval(timer);
  }, [prefersReducedMotion]);

  const closeMenu = () => setMenuOpen(false);

  return (
    <main className="min-h-screen bg-white text-black">
      <header
        className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${
          isScrolled ? 'border-b border-black/10 bg-white/95 text-black shadow-[0_10px_24px_rgba(0,0,0,0.12)] backdrop-blur-xl' : 'bg-transparent text-white'
        }`}
      >
        <div className="mx-auto flex min-h-20 max-w-[1400px] items-center justify-between gap-5 px-5 sm:px-8 lg:px-12">
          <a href="#hero" className="flex items-center gap-3" aria-label="STUN-FI Skins home" onClick={closeMenu}>
            <Image
              src={isScrolled ? '/img/stunfi-logo-black.png' : '/img/stunfi-logo-white.png'}
              alt="STUN-FI logo"
              width={42}
              height={42}
              className="h-9 w-9 object-contain sm:h-10 sm:w-10"
              priority
            />
            <span className="flex items-center gap-2 text-sm font-black sm:text-base">
              <span className="whitespace-nowrap tracking-[0.2em]">STUN-FI</span>
              <span
                className="whitespace-nowrap text-[0.9em] uppercase tracking-[0.18em]"
                style={{
                  fontFamily: 'Brush Script MT, Courier New, cursive',
                  transform: 'skewX(-12deg)',
                  textShadow: isScrolled ? '2px 2px 0 rgba(0,0,0,0.14)' : '2px 2px 0 rgba(0,0,0,0.3)',
                }}
              >
                SKINS
              </span>
            </span>
          </a>

          <nav className="hidden items-center gap-8 text-xs font-bold uppercase tracking-[0.16em] lg:flex" aria-label="Primary navigation">
            <a href="/customize" className="transition-opacity hover:opacity-60">Customize</a>
            <a href="#gallery" className="transition-opacity hover:opacity-60">Gallery</a>
            <a href="#how-it-works" className="transition-opacity hover:opacity-60">How It Works</a>
          </nav>

          <div className="flex items-center gap-3">
            <a
              href="/customize"
              className={`hidden min-h-11 items-center justify-center px-5 text-xs font-black uppercase tracking-[0.14em] transition sm:inline-flex ${
                isScrolled ? 'bg-black text-white hover:bg-neutral-800' : 'border border-white/60 bg-white text-black hover:bg-white/85'
              }`}
            >
              Design Your Skin
            </a>
            <button
              type="button"
              aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((open) => !open)}
              className={`inline-flex h-11 w-11 items-center justify-center border transition lg:hidden ${isScrolled ? 'border-black/15' : 'border-white/50'}`}
            >
              <i className={`bx ${menuOpen ? 'bx-x' : 'bx-menu'} text-xl`} aria-hidden="true" />
            </button>
          </div>
        </div>

        {menuOpen ? (
          <nav className="border-t border-black/10 bg-white px-5 py-4 text-black shadow-xl lg:hidden" aria-label="Mobile navigation">
            <a href="/customize" onClick={closeMenu} className="block border-b border-black/10 py-3 text-xs font-bold uppercase tracking-[0.16em]">Customize</a>
            <a href="#gallery" onClick={closeMenu} className="block border-b border-black/10 py-3 text-xs font-bold uppercase tracking-[0.16em]">Gallery</a>
            <a href="#how-it-works" onClick={closeMenu} className="block py-3 text-xs font-bold uppercase tracking-[0.16em]">How It Works</a>
          </nav>
        ) : null}
      </header>

      <section id="hero" className="relative isolate flex min-h-[100svh] items-end overflow-hidden bg-black text-white">
        {HERO_IMAGES.map((image, index) => (
          <Image
            key={image.src}
            src={image.src}
            alt={image.alt}
            fill
            priority={index === 0}
            sizes="100vw"
            className={`absolute inset-0 -z-20 object-cover object-center transition-opacity duration-[1400ms] ease-in-out ${index === activeImage ? 'opacity-100' : 'opacity-0'}`}
          />
        ))}
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-black/75 via-black/30 to-black/10" />
        <div className="absolute inset-x-0 bottom-0 -z-10 h-2/3 bg-gradient-to-t from-black/65 to-transparent" />

        <div className="mx-auto w-full max-w-[1400px] px-5 pb-16 pt-32 sm:px-8 sm:pb-20 lg:px-12 lg:pb-24">
          <div className="max-w-3xl">
            <p className="mb-6 text-xs font-bold uppercase tracking-[0.28em] text-white/70">STUN-FI SKINS / CUSTOM DEVICE WRAPS</p>
            <h1 className="max-w-2xl text-[clamp(3.75rem,9vw,8rem)] font-black uppercase leading-[0.82] tracking-[-0.07em]">Make it<br />yours.</h1>
            <p className="mt-8 max-w-sm text-sm font-medium leading-6 text-white/75 sm:text-base">Custom skins for laptops and devices.</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a href="/customize" className="inline-flex min-h-14 items-center justify-center bg-white px-9 text-sm font-black uppercase tracking-[0.14em] text-black transition hover:bg-neutral-200">Design Your Skin</a>
              <a href="#gallery" className="inline-flex min-h-14 items-center justify-center border border-white/50 px-9 text-sm font-black uppercase tracking-[0.14em] text-white transition hover:border-white hover:bg-white/10">Explore The Gallery</a>
            </div>
          </div>

          <div className="mt-14 flex items-end justify-between gap-5 border-t border-white/25 pt-5 text-[10px] font-bold uppercase tracking-[0.2em] text-white/55">
            <span>Designed in Nigeria</span>
            <span className="flex items-center gap-3"><span className="hidden sm:inline">Scroll</span><span className="inline-block h-10 w-px animate-pulse bg-white/70" /></span>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-[1400px] px-5 sm:px-8 lg:px-12">
        <section id="gallery" className="scroll-mt-24 border-b border-black/10 py-16 sm:py-24">
          <div className="grid gap-8 lg:grid-cols-[0.35fr_0.65fr] lg:gap-16">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-black/45">06 / Lookbook</p>
            <div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {HERO_IMAGES.slice(0, 4).map((image) => (
                  <div key={image.src} className="relative aspect-[4/5] overflow-hidden bg-black">
                    <Image src={image.src} alt={image.alt} fill sizes="(max-width: 640px) 50vw, 20vw" className="object-cover transition duration-700 hover:scale-105" />
                  </div>
                ))}
              </div>
              <a href="/customize" className="mt-6 inline-flex items-center text-xs font-black uppercase tracking-[0.16em] transition-opacity hover:opacity-60">Explore the gallery <i className="bx bx-right-arrow-alt ml-2 text-lg" aria-hidden="true" /></a>
            </div>
          </div>
        </section>

        <section id="why-stunfi" className="scroll-mt-24 border-y border-black/10 py-16 sm:py-20">
          <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-black/55">Why STUN-FI</p>
              <h2 className="mt-3 max-w-sm text-3xl font-black leading-tight tracking-[-0.04em] sm:text-4xl">Made to look right. Made to fit right.</h2>
            </div>
            <div className="grid gap-x-8 gap-y-8 sm:grid-cols-2">
              {[
                ['01', 'Precision fit', 'Exact cutouts for ports, cameras, buttons, and edges.', 'bx-target-lock'],
                ['02', 'Premium materials', 'A considered finish that protects without adding bulk.', 'bx-layer'],
                ['03', 'Custom artwork', 'Choose from the catalog or bring a design that is yours.', 'bx-palette'],
                ['04', 'Professional fitting', 'Get a clean, bubble-free finish with on-site installation.', 'bx-check-shield'],
              ].map(([number, title, description, icon]) => (
                <div key={number} className="border-t border-black/15 pt-4">
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-xs font-bold tracking-[0.2em] text-black/45">{number}</span>
                    <i className={`bx ${icon} text-2xl text-black/55`} aria-hidden="true" />
                  </div>
                  <h3 className="mt-3 text-lg font-black">{title}</h3>
                  <p className="mt-2 max-w-xs text-sm leading-6 text-black/62">{description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="finishes" className="relative left-1/2 w-screen -translate-x-1/2 overflow-hidden scroll-mt-24 border-b border-black/10 bg-[#e3e6e3]">
          <div className="grid lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div className="p-7 sm:p-10 lg:p-14">
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-black/55">Choose your finish</p>
              <h2 className="mt-3 text-3xl font-black tracking-[-0.04em] sm:text-4xl">The final detail changes everything.</h2>
              <p className="mt-5 max-w-md text-sm leading-7 text-black/65 sm:text-base">Keep it clean with Standard, or catch the light with our Shiny Stones premium finish.</p>
              <a href="/customize" className="mt-7 inline-flex min-h-11 items-center bg-black px-5 text-sm font-semibold text-white transition hover:bg-neutral-800">Choose a finish</a>
            </div>
            <div className="grid min-h-[18rem] grid-cols-2">
              <div className="flex flex-col justify-end rounded-2xl border border-black/10 bg-[#f5f5f3] p-6 sm:p-8">
                <div className="relative h-44 w-full overflow-hidden rounded-xl border border-black/15 bg-white shadow-[inset_12px_12px_28px_rgba(0,0,0,0.12)] sm:h-56">
                  <Image src="/img/Standard%20(1).png" alt="Standard finish texture" fill sizes="(max-width: 1024px) 50vw, 25vw" className="object-cover transition duration-700 hover:scale-105" />
                </div>
                <p className="mt-5 text-[10px] font-bold uppercase tracking-[0.2em] text-black/45">Matte finish</p>
                <p className="mt-1 text-sm font-bold uppercase tracking-[0.18em]">Standard</p>
                <p className="mt-2 text-sm text-black/60">Clean, understated, everyday.</p>
              </div>
              <div className="flex flex-col justify-end rounded-2xl border border-black/10 bg-[#f5f5f3] p-6 text-black sm:p-8">
                <div className="relative h-44 w-full overflow-hidden rounded-xl border border-black/15 bg-white shadow-[inset_12px_12px_28px_rgba(0,0,0,0.12)] sm:h-56">
                  <Image src="/img/Shiny.png" alt="Shiny Stones finish texture" fill sizes="(max-width: 1024px) 50vw, 25vw" className="object-cover transition duration-700 hover:scale-105" />
                </div>
                <p className="mt-5 text-[10px] font-bold uppercase tracking-[0.2em] text-black/45">Reflective finish</p>
                <p className="mt-1 text-sm font-bold uppercase tracking-[0.18em]">Shiny Stones</p>
                <p className="mt-2 text-sm text-black/60">Light-catching, unmistakably yours.</p>
              </div>
            </div>
          </div>
        </section>

        <section id="customization" className="grid scroll-mt-24 gap-8 border-b border-black/10 py-16 sm:py-24 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:gap-16">
          <div className="relative min-h-[20rem] overflow-hidden bg-black sm:min-h-[28rem]">
            <Image src="/img/Stripes.jpg" alt="STUN-FI skin applied across a laptop keyboard area" fill sizes="(max-width: 1024px) 100vw, 55vw" className="object-cover" />
            <div className="absolute bottom-5 left-5 bg-white px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-black">Preview before you order</div>
          </div>
          <div className="lg:pl-6">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-black/55">Make it personal</p>
            <h2 className="mt-3 text-3xl font-black tracking-[-0.04em] sm:text-4xl">Start with a design. Finish with your signature.</h2>
            <p className="mt-5 text-base leading-7 text-black/65">Pick a catalog artwork, upload your own image, or add custom text. Your choices stay visible as you build, so the finished skin never feels like a guess.</p>
            <div className="mt-7 flex flex-wrap gap-2 text-xs font-bold uppercase tracking-[0.14em] text-black/60">
              <span className="rounded-full border border-black/15 px-3 py-2">Catalog artwork</span>
              <span className="rounded-full border border-black/15 px-3 py-2">Your upload</span>
              <span className="rounded-full border border-black/15 px-3 py-2">Custom text</span>
            </div>
          </div>
        </section>

        <section id="how-it-works" className="relative left-1/2 w-screen -translate-x-1/2 scroll-mt-24 border-b border-black/10 bg-black px-6 py-12 text-white sm:px-10 sm:py-16 lg:px-14 lg:py-20">
          <div className="grid gap-10 lg:grid-cols-[0.3fr_0.7fr] lg:gap-16">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/50">08 / The process</p>
              <h2 className="mt-4 max-w-xs text-3xl font-black uppercase leading-[0.94] tracking-[-0.055em] sm:text-5xl">How It Works</h2>
              <p className="mt-4 text-base font-medium text-white/60 sm:text-lg">From idea to fitted.</p>
            </div>
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-5 lg:gap-4">
              {[
                ['Choose your device', 'bx-laptop'],
                ['Choose your surfaces', 'bx-grid-alt'],
                ['Create your design', 'bx-palette'],
                ['Choose your finish', 'bx-adjust'],
                ['Get it fitted', 'bx-check-shield'],
              ].map(([step, icon], index) => (
                <div key={step} className="relative border-t border-white/25 pt-4 lg:pr-5">
                  <div className="flex h-12 w-12 items-center justify-center border border-white/30 text-2xl text-white">
                    <i className={`bx ${icon}`} aria-hidden="true" />
                  </div>
                  <span className="mt-5 block text-xs font-bold tracking-[0.2em] text-white/45">0{index + 1}</span>
                  <p className="mt-3 text-lg font-black leading-tight text-white">{step}</p>
                  {index < 4 ? <i className="bx bx-right-arrow-alt absolute -bottom-7 right-0 hidden text-2xl text-white/45 lg:block" aria-hidden="true" /> : null}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="final-cta" className="flex min-h-[55vh] scroll-mt-24 flex-col items-start justify-center border-b border-black/10 py-20 sm:py-28">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-black/45">09 / Start here</p>
          <h2 className="mt-5 max-w-4xl text-3xl font-black uppercase leading-[0.94] tracking-[-0.055em] sm:text-6xl">Your device<br />is waiting.</h2>
          <a href="/customize" className="mt-9 inline-flex min-h-14 items-center bg-black px-9 text-sm font-black uppercase tracking-[0.14em] text-white transition hover:bg-neutral-800">Design Your Skin</a>
        </section>

        <footer className="mt-16 border border-black/10 bg-white p-8 text-black/70 sm:p-10">
          <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
            <div>
              <div className="text-sm font-semibold uppercase tracking-[0.25em] text-black/60">STUN-FI Hub</div>
              <div className="mt-3">
                <BrandedLogo />
              </div>
              <p className="mt-3 max-w-xl text-sm leading-7 text-black/70">
                Campus-first device protection with a focus on premium fit, high-shine finishes, and fast on-site fitting for students and retailers.
              </p>
            </div>
            <div className="space-y-4 border border-black/10 bg-[#f7f7f5] p-6">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-black/70">Contact</p>
                <a href="https://wa.me/2349064234807" target="_blank" rel="noreferrer" className="mt-2 block text-lg font-semibold text-black">
                  WhatsApp: +234 906 423 4807
                </a>
              </div>
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-black/70">Follow us</p>
                <div className="mt-3 flex items-center gap-3">
                  <a href="https://www.tiktok.com/@stunfihub?_r=1&_t=ZS-98vB2MbyYWS" target="_blank" rel="noreferrer" aria-label="TikTok" className="flex h-11 w-11 items-center justify-center border border-black/10 bg-white text-black transition hover:border-black hover:bg-black hover:text-white">
                    <i className="bx bxl-tiktok text-xl" />
                  </a>
                  <a href="https://www.instagram.com/stunfihub?igsh=MWdwanc4cGJsZzFibw==&igsi=MWdwanc4cGJsZzFibw==" target="_blank" rel="noreferrer" aria-label="Instagram" className="flex h-11 w-11 items-center justify-center border border-black/10 bg-white text-black transition hover:border-black hover:bg-black hover:text-white">
                    <i className="bx bxl-instagram-alt text-xl" />
                  </a>
                  <a href="https://x.com/Favor_2da_wrld" target="_blank" rel="noreferrer" aria-label="X" className="flex h-11 w-11 items-center justify-center border border-black/10 bg-white text-black transition hover:border-black hover:bg-black hover:text-white">
                    <i className="bx bxl-twitter text-xl" />
                  </a>
                </div>
              </div>
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-black/70">Location</p>
                <p className="mt-2 text-sm text-black/70">Enugu State, Nigeria</p>
              </div>
            </div>
          </div>
          <div className="mt-10 border-t border-black/10 pt-6 text-sm text-black/50">
            © {new Date().getFullYear()} STUN-FI HUB. All rights reserved.
          </div>
        </footer>
      </div>
    </main>
  );
}