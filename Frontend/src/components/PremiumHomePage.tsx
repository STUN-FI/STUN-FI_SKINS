'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import { useReducedMotion } from 'framer-motion';
import BrandedLogo from './BrandedLogo';

const HERO_IMAGES = [
  { src: '/img/lap2.jpg', alt: 'Custom STUN-FI skin applied to a laptop' },
  { src: '/img/lap3.jpg', alt: 'Close-up of a custom laptop skin detail' },
  { src: '/img/lap4.jpg', alt: 'Custom laptop skin from another angle' },
];

export default function PremiumHomePage() {
  const prefersReducedMotion = useReducedMotion();
  const [activeImage, setActiveImage] = useState(0);
  const [isScrolled, setIsScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 8);
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const hasSeenWelcome = window.localStorage.getItem('stunfi-welcome-seen');
    setShowWelcomeModal(!hasSeenWelcome);
  }, []);

  const closeWelcomeModal = () => {
    setShowWelcomeModal(false);
    window.localStorage.setItem('stunfi-welcome-seen', 'true');
  };

  useEffect(() => {
    if (prefersReducedMotion) return;
    const timer = window.setInterval(() => {
      setActiveImage((current) => (current + 1) % HERO_IMAGES.length);
    }, 5000);
    return () => window.clearInterval(timer);
  }, [prefersReducedMotion]);

  useEffect(() => {
    const revealItems = document.querySelectorAll<HTMLElement>('[data-reveal]');

    if (prefersReducedMotion) {
      revealItems.forEach((item) => item.classList.add('is-visible'));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => entries.forEach((entry) => entry.isIntersecting && entry.target.classList.add('is-visible')),
      { threshold: 0.12, rootMargin: '0px 0px -8% 0px' },
    );

    revealItems.forEach((item) => observer.observe(item));
    return () => observer.disconnect();
  }, [prefersReducedMotion]);

  const closeMenu = () => setMenuOpen(false);

  return (
    <main className="min-h-screen overflow-x-hidden bg-white text-black">
      {showWelcomeModal ? (
        <div className="welcome-backdrop fixed inset-0 z-[80] flex items-center justify-center bg-black/55 px-4 backdrop-blur-sm" aria-modal="true" role="dialog">
          <div className="welcome-modal relative w-full max-w-xl overflow-hidden rounded-[2rem] border border-white/10 bg-[#111111] p-6 text-white shadow-[0_30px_80px_rgba(0,0,0,0.45)] sm:p-8">
            <button
              type="button"
              aria-label="Close welcome message"
              onClick={closeWelcomeModal}
              className="absolute right-4 top-4 inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-xl text-white/80 transition hover:border-white/20 hover:bg-white/10"
            >
              <i className="bx bx-x" aria-hidden="true" />
            </button>

            <div className="max-w-md">
              <p className="text-[0.6rem] font-semibold uppercase tracking-[0.24em] text-white/60">Welcome to STUN-FI</p>
              <div className="mt-4">
                <BrandedLogo className="text-white" size="lg" />
              </div>
              <h2 className="mt-5 text-3xl font-black uppercase leading-[0.92] tracking-[-0.05em] sm:text-5xl">Make your device unmistakably yours.</h2>
              <p className="mt-4 text-sm leading-7 text-white/70 sm:text-base">
                Personalize your laptop, phone, or controller with premium finishes and custom artwork designed for your style.
              </p>
            </div>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <a
                href="/customize"
                onClick={closeWelcomeModal}
                className="inline-flex min-h-12 items-center justify-center bg-white px-6 text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-black transition hover:bg-neutral-200"
              >
                Design your skin
              </a>
              <button
                type="button"
                onClick={closeWelcomeModal}
                className="inline-flex min-h-12 items-center justify-center border border-white/15 bg-white/5 px-6 text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-white transition hover:border-white/25 hover:bg-white/10"
              >
                Continue browsing
              </button>
            </div>
          </div>
        </div>
      ) : null}

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

          <nav className="hidden items-center gap-8 text-[0.68rem] font-semibold uppercase tracking-[0.18em] lg:flex" aria-label="Primary navigation">
            <a href="/customize" className="transition-opacity hover:opacity-60">Customize</a>
            <a href="#gallery" className="transition-opacity hover:opacity-60">Gallery</a>
            <a href="#how-it-works" className="transition-opacity hover:opacity-60">How It Works</a>
            <a href="/orders" className="transition-opacity hover:opacity-60">Track Your Order</a>
          </nav>

          <div className="flex items-center gap-3">
            <a
              href="/orders"
              className={`hidden min-h-11 items-center justify-center px-5 text-[0.68rem] font-semibold uppercase tracking-[0.18em] transition sm:inline-flex ${
                isScrolled ? 'border border-black/15 bg-transparent text-black hover:bg-black/5' : 'border border-white/60 bg-transparent text-white hover:bg-white/10'
              }`}
            >
              Track Your Order
            </a>
            <a
              href="/customize"
              className={`hidden min-h-11 items-center justify-center px-5 text-[0.68rem] font-semibold uppercase tracking-[0.18em] transition sm:inline-flex ${
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
            <a href="#how-it-works" onClick={closeMenu} className="block border-b border-black/10 py-3 text-xs font-bold uppercase tracking-[0.16em]">How It Works</a>
            <a href="/orders" onClick={closeMenu} className="block py-3 text-xs font-bold uppercase tracking-[0.16em]">Track Your Order</a>
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
            className={`hero-image absolute inset-0 -z-20 object-cover object-center ${index === activeImage ? 'hero-image-active' : 'hero-image-inactive'}`}
          />
        ))}
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-black/75 via-black/30 to-black/10" />
        <div className="absolute inset-x-0 bottom-0 -z-10 h-2/3 bg-gradient-to-t from-black/65 to-transparent" />

        <div className="mx-auto w-full max-w-[1400px] px-5 pb-16 pt-28 sm:px-8 sm:pb-20 lg:px-12 lg:pb-24">
          <div className="hero-copy max-w-3xl text-justify sm:text-left">
            <p className="mb-6 text-center text-[0.58rem] font-medium uppercase tracking-[0.22em] text-white/70 sm:text-left">STUN-FI SKINS / CUSTOM LAPTOP SKIN & DEVICE WRAPS</p>
            <h1 className="max-w-2xl text-[clamp(2.35rem,12vw,7.8rem)] font-black uppercase leading-[0.86] tracking-[-0.06em] text-white text-justify sm:text-left">Custom laptop skins.<br />Made <span className="whitespace-nowrap">unmistakably</span> yours.</h1>
            <p className="mt-8 max-w-sm text-sm font-medium leading-6 text-white/75 text-justify sm:text-base sm:text-left">Premium custom laptop skin, phone skin, and controller wrap designs with your artwork, your design, and premium finishes.</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a href="/customize" className="inline-flex min-h-14 w-full items-center justify-center bg-white px-9 text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-black transition hover:bg-neutral-200 sm:w-auto">Design Your Skin</a>
              <a href="/orders" className="inline-flex min-h-14 w-full items-center justify-center border border-white/50 px-9 text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-white transition hover:border-white hover:bg-white/10 sm:w-auto">Track Your Order</a>
              <a href="#gallery" className="inline-flex min-h-14 w-full items-center justify-center border border-white/50 px-9 text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-white transition hover:border-white hover:bg-white/10 sm:w-auto">Explore The Gallery</a>
            </div>
          </div>

          <div className="hero-meta mt-14 flex items-end justify-between gap-5 border-t border-white/25 pt-5 text-[10px] font-medium uppercase tracking-[0.18em] text-white/55">
            <span className="text-[0.56rem] sm:text-[0.62rem]">STUN-FI HUB</span>
            <span className="flex items-center gap-3"><span className="hidden sm:inline">Scroll</span><span className="inline-block h-10 w-px animate-pulse bg-white/70" /></span>
          </div>
        </div>
      </section>

      <section id="devices" data-reveal className="reveal-section border-b border-black/10 py-16 sm:py-24">
        <div className="mx-auto grid max-w-[1400px] gap-8 px-5 lg:grid-cols-[0.55fr_1.45fr] lg:items-end lg:gap-16 sm:px-8 lg:px-12">
          <div>
            <p className="text-[0.68rem] font-medium uppercase tracking-[0.18em] text-black/55">Choose your device</p>
            <h2 className="mt-4 max-w-md text-3xl font-black leading-[0.96] tracking-[-0.04em] sm:text-5xl">Custom laptop skins and device wraps for the tech you use every day.</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <article className="border-t border-black/15 pt-4">
              <h3 className="text-lg font-black">Laptop Skin</h3>
              <p className="mt-2 text-sm leading-6 text-black/65">Custom laptop skins precisely fitted to your MacBook, gaming laptop, or work setup.</p>
              <a href="/customize" className="mt-4 inline-flex text-xs font-black uppercase tracking-[0.16em] text-black transition-opacity hover:opacity-60">Customize yours</a>
            </article>
            <article className="border-t border-black/15 pt-4">
              <h3 className="text-lg font-black">Phone Skin</h3>
              <p className="mt-2 text-sm leading-6 text-black/65">Premium custom phone skins for a clean look and protected finish.</p>
              <a href="/customize" className="mt-4 inline-flex text-xs font-black uppercase tracking-[0.16em] text-black transition-opacity hover:opacity-60">Customize yours</a>
            </article>
            <article className="border-t border-black/15 pt-4">
              <h3 className="text-lg font-black">Controller Wrap</h3>
              <p className="mt-2 text-sm leading-6 text-black/65">Custom controller skin wraps and premium finishes for supported devices.</p>
              <a href="/customize" className="mt-4 inline-flex text-xs font-black uppercase tracking-[0.16em] text-black transition-opacity hover:opacity-60">Customize yours</a>
            </article>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-[1400px] px-5 sm:px-8 lg:px-12">
        <section id="gallery" data-reveal className="reveal-section scroll-mt-24 border-b border-black/10 py-16 sm:py-28">
          <div className="grid gap-8 lg:grid-cols-[0.35fr_0.65fr] lg:gap-20">
            <p className="text-center text-[0.68rem] font-medium uppercase tracking-[0.18em] text-black/45 sm:text-left">Lookbook</p>
            <div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-2">
                {HERO_IMAGES.slice(0, 4).map((image, index) => (
                  <div key={image.src} style={{ '--reveal-delay': `${index * 90}ms` } as React.CSSProperties} data-reveal className="reveal-item relative aspect-[4/5] overflow-hidden rounded-[1.3rem] bg-black shadow-[0_18px_35px_rgba(0,0,0,0.08)] sm:rounded-[1.6rem]">
                    <Image src={image.src} alt={image.alt} fill sizes="(max-width: 640px) 50vw, 20vw" className="object-cover transition duration-700 hover:scale-105" />
                  </div>
                ))}
              </div>
              <a href="/customize" className="mt-6 inline-flex items-center text-xs font-black uppercase tracking-[0.16em] transition-opacity hover:opacity-60">Explore the gallery <i className="bx bx-right-arrow-alt ml-2 text-lg" aria-hidden="true" /></a>
            </div>
          </div>
        </section>

        <section id="why-stunfi" data-reveal className="reveal-section scroll-mt-24 border-y border-black/10 py-20 sm:py-28">
          <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-start lg:gap-16">
            <div>
              <p className="text-[0.68rem] font-medium uppercase tracking-[0.18em] text-black/55">Why STUN-FI</p>
              <h2 className="mt-4 max-w-sm text-3xl font-black leading-[0.96] tracking-[-0.04em] sm:text-4xl">Custom skins made to fit your device.</h2>
            </div>
            <div className="grid gap-x-8 gap-y-8 sm:grid-cols-2">
              {[
                ['Precision fit', 'Exact cutouts for ports, cameras, buttons, and edges.', 'bx-target-lock'],
                ['Premium materials', 'A considered finish that protects without adding bulk.', 'bx-layer'],
                ['Custom artwork', 'Choose from the catalog or bring a design that is yours.', 'bx-palette'],
                ['Professional fitting', 'Get a clean, bubble-free finish with on-site installation.', 'bx-check-shield'],
              ].map(([title, description, icon], index) => (
                <div key={title} style={{ '--reveal-delay': `${index * 90}ms` } as React.CSSProperties} data-reveal className="reveal-item border-t border-black/15 pt-5">
                  <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl border border-black/10 bg-[#f3f2ef] shadow-[0_8px_18px_rgba(0,0,0,0.04)]">
                    <i className={`bx ${icon} text-[2.1rem] leading-none text-black`} aria-hidden="true" />
                  </div>
                  <h3 className="text-lg font-black">{title}</h3>
                  <p className="mt-2 max-w-xs text-sm leading-6 text-black/62">{description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="finishes" data-reveal className="full-bleed reveal-section relative overflow-hidden scroll-mt-24 border-b border-black/10 bg-[#e9e5df]">
          <div className="mx-auto max-w-[1400px] px-5 py-16 sm:px-8 sm:py-20 lg:px-12 lg:py-24">
            <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
              <div>
                <p className="text-[0.68rem] font-medium uppercase tracking-[0.18em] text-black/55">Choose your finish</p>
                <h2 className="mt-4 max-w-md text-3xl font-black leading-[0.96] tracking-[-0.04em] sm:text-5xl">The final detail changes everything.</h2>
                <p className="mt-5 max-w-md text-sm leading-7 text-black/65 sm:text-base">Keep it clean with Standard, or catch the light with our Shiny Stones premium finish.</p>
                <a href="/customize" className="mt-9 inline-flex min-h-12 items-center bg-black px-6 text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-white transition hover:bg-neutral-800">Choose a finish</a>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div data-reveal className="reveal-item group flex flex-col justify-between rounded-[1.8rem] border border-black/10 bg-[#f5f4f2] p-4 shadow-[0_18px_35px_rgba(0,0,0,0.07)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_22px_40px_rgba(0,0,0,0.11)] sm:p-6">
                  <div className="relative h-52 w-full overflow-hidden rounded-[1.3rem] border border-black/10 bg-white shadow-[inset_12px_12px_28px_rgba(0,0,0,0.10)] sm:h-64">
                    <Image src="/img/Standard%20(1).png" alt="Standard finish texture" fill sizes="(max-width: 1024px) 50vw, 25vw" className="object-cover transition duration-700 group-hover:scale-105" />
                  </div>
                  <div className="mt-5">
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-black/45">Matte finish</p>
                    <p className="mt-2 text-sm font-black uppercase tracking-[0.18em]">Standard</p>
                    <p className="mt-2 text-sm text-black/60">Clean, understated, everyday.</p>
                  </div>
                </div>

                <div data-reveal className="reveal-item group flex flex-col justify-between rounded-[1.8rem] border border-black/10 bg-[#f5f4f2] p-4 text-black shadow-[0_18px_35px_rgba(0,0,0,0.07)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_22px_40px_rgba(0,0,0,0.11)] sm:p-6">
                  <div className="relative h-52 w-full overflow-hidden rounded-[1.3rem] border border-black/10 bg-white shadow-[inset_12px_12px_28px_rgba(0,0,0,0.10)] sm:h-64">
                    <Image src="/img/Shiny.png" alt="Shiny Stones finish texture" fill sizes="(max-width: 1024px) 50vw, 25vw" className="object-cover transition duration-700 group-hover:scale-105" />
                  </div>
                  <div className="mt-5">
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-black/45">Reflective finish</p>
                    <p className="mt-2 text-sm font-black uppercase tracking-[0.18em]">Shiny Stones</p>
                    <p className="mt-2 text-sm text-black/60">Light-catching, unmistakably yours.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="customization" data-reveal className="reveal-section grid scroll-mt-24 gap-8 border-b border-black/10 py-20 sm:py-28 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:gap-16">
          <div className="image-lift relative min-h-[20rem] overflow-hidden rounded-[1.6rem] bg-black shadow-[0_22px_40px_rgba(0,0,0,0.12)] sm:min-h-[28rem] sm:rounded-[2rem]">
            <Image src="/img/Stripes.jpg" alt="STUN-FI skin applied across a laptop keyboard area" fill sizes="(max-width: 1024px) 100vw, 55vw" className="object-cover" />
            <div className="absolute bottom-5 left-5 bg-white px-4 py-2 text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-black">Preview before you order</div>
          </div>
          <div className="lg:pl-6">
            <p className="text-[0.68rem] font-medium uppercase tracking-[0.18em] text-black/55">Make it personal</p>
            <h2 className="mt-4 text-3xl font-black leading-[0.96] tracking-[-0.04em] sm:text-4xl">Start with a design. Finish with your signature.</h2>
            <p className="mt-5 text-base leading-7 text-black/65">Pick a catalog artwork, upload your own image, or add custom text. Your choices stay visible as you build, so the finished skin never feels like a guess.</p>
            <div className="mt-7 flex flex-wrap gap-2 text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-black/60">
              <span className="rounded-full border border-black/15 px-3 py-2">Catalog artwork</span>
              <span className="rounded-full border border-black/15 px-3 py-2">Your upload</span>
              <span className="rounded-full border border-black/15 px-3 py-2">Custom text</span>
            </div>
          </div>
        </section>

        <section id="how-it-works" data-reveal className="full-bleed reveal-section relative scroll-mt-24 border-b border-white/10 bg-[#111111] px-6 py-16 text-white sm:px-10 sm:py-20 lg:px-14 lg:py-24">
          <div className="mx-auto max-w-[1400px]">
            <div className="mb-10 flex flex-col gap-5 border-b border-white/10 pb-8 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-[0.68rem] font-medium uppercase tracking-[0.18em] text-white/50">The process</p>
                <h2 className="mt-4 max-w-xl text-3xl font-black uppercase leading-[0.96] tracking-[-0.055em] sm:text-5xl">How it works</h2>
              </div>
              <p className="max-w-xl text-sm leading-7 text-white/60 sm:text-base">From first idea to final fit, every step is designed to feel deliberate, premium, and easy to trust.</p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
              {[
                ['Choose your device', 'bx-laptop'],
                ['Choose your surfaces', 'bx-grid-alt'],
                ['Create your design', 'bx-palette'],
                ['Choose your finish', 'bx-adjust'],
                ['Get it fitted', 'bx-check-shield'],
              ].map(([step, icon], index) => (
                <div key={step} style={{ '--reveal-delay': `${index * 90}ms` } as React.CSSProperties} data-reveal className="reveal-item group relative overflow-hidden rounded-[1.6rem] border border-white/10 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.10),_rgba(255,255,255,0.02)_35%,_rgba(17,17,17,1)_70%)] p-5 shadow-[0_18px_35px_rgba(0,0,0,0.18)] transition duration-300 hover:-translate-y-1 hover:border-white/20 hover:bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.16),_rgba(255,255,255,0.04)_35%,_rgba(17,17,17,1)_70%)] sm:p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex h-14 w-14 items-center justify-center rounded-xl border border-white/15 bg-white/5 text-2xl text-white shadow-inner shadow-white/5">
                      <i className={`bx ${icon}`} aria-hidden="true" />
                    </div>
                    <span className="text-[0.58rem] font-semibold uppercase tracking-[0.2em] text-white/35">Step</span>
                  </div>
                  <p className="mt-6 text-lg font-black leading-snug text-white sm:text-xl">{step}</p>
                  <div className="mt-5 h-px w-full bg-gradient-to-r from-white/40 via-white/15 to-transparent" />
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="final-cta" data-reveal className="full-bleed reveal-section relative scroll-mt-24 border-b border-black/10 bg-[#e3e6e3] px-6 py-20 sm:px-10 sm:py-28">
          <div className="mx-auto max-w-[1400px]">
            <p className="text-[0.68rem] font-medium uppercase tracking-[0.18em] text-black/45">Start here</p>
            <h2 className="mt-5 max-w-4xl text-3xl font-black uppercase leading-[0.94] tracking-[-0.055em] sm:text-6xl">Your device<br />is waiting.</h2>
            <p className="mt-5 max-w-xl text-base leading-7 text-black/70 sm:text-lg">
              Build a skin that feels as personal as the device itself. Choose your finish, shape your design, and make every surface feel intentional.
            </p>
            <a href="/customize" className="mt-9 inline-flex min-h-14 items-center bg-black px-9 text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-white transition hover:bg-neutral-800">Design Your Skin</a>
          </div>
        </section>

        <footer data-reveal className="full-bleed reveal-section relative border-t border-white/10 bg-[#111111] p-8 text-white/75 sm:p-10">
          <div className="mx-auto max-w-[1400px]">
            <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
              <div>
                <div className="text-sm font-semibold uppercase tracking-[0.25em] text-white/60">STUN-FI Hub</div>
                <div className="mt-3">
                  <BrandedLogo />
                </div>
                <p className="mt-3 max-w-xl text-sm leading-7 text-white/70">
                  Campus-first device protection with a focus on premium fit, high-shine finishes, and fast on-site fitting for students and retailers.
                </p>
                <p className="mt-4 max-w-xl text-sm leading-6 text-white/60">STUN-FI Skins creates custom laptop, phone, and controller skins for customers in Nigeria, with professional fitting available in Enugu.</p>
              </div>
              <div className="space-y-4 border border-white/10 bg-white/5 p-6">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-white/70">Contact</p>
                  <a href="https://wa.me/2349064234807" target="_blank" rel="noreferrer" className="mt-2 block text-lg font-semibold text-white">
                    WhatsApp: +234 906 423 4807
                  </a>
                </div>
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-white/70">Follow us</p>
                  <div className="mt-3 flex items-center gap-3">
                    <a href="https://www.tiktok.com/@stunfihub?_r=1&_t=ZS-98vB2MbyYWS" target="_blank" rel="noreferrer" aria-label="TikTok" className="flex h-11 w-11 items-center justify-center border border-white/10 bg-white/5 text-white transition hover:border-white/30 hover:bg-white/10">
                      <i className="bx bxl-tiktok text-xl" />
                    </a>
                    <a href="https://www.instagram.com/stunfihub?igsh=MWdwanc4cGJsZzFibw==&igsi=MWdwanc4cGJsZzFibw==" target="_blank" rel="noreferrer" aria-label="Instagram" className="flex h-11 w-11 items-center justify-center border border-white/10 bg-white/5 text-white transition hover:border-white/30 hover:bg-white/10">
                      <i className="bx bxl-instagram-alt text-xl" />
                    </a>
                    <a href="https://x.com/Favor_2da_wrld" target="_blank" rel="noreferrer" aria-label="X" className="flex h-11 w-11 items-center justify-center border border-white/10 bg-white/5 text-white transition hover:border-white/30 hover:bg-white/10">
                      <i className="bx bxl-twitter text-xl" />
                    </a>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-white/70">Location</p>
                  <p className="mt-2 text-sm text-white/70">Enugu State, Nigeria</p>
                </div>
              </div>
            </div>
            <div className="mt-10 border-t border-white/10 pt-6 text-sm text-white/45">
              © {new Date().getFullYear()} STUN-FI HUB. All rights reserved.
            </div>
          </div>
        </footer>
      </div>
    </main>
  );
}