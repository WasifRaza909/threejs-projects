'use client';

import { useRef } from 'react';
import { useHeroAnimation } from './useHeroAnimation';

/**
 * Premium animated hero: layered Three.js particle field + GSAP character reveal
 * + magnetic CTAs. All Three.js / GSAP lifecycle lives in useHeroAnimation, so
 * this file is pure presentation.
 *
 * Layout: Swiss / brutalist editorial — uppercase display type that breaks
 * across lines, an oversized index block, hard hairline rules, monospace
 * labels and sharp-cornered bracketed CTAs. Type is the design.
 *
 * @param {Object} props
 * @param {string} [props.headline]
 * @param {string} [props.subheadline]
 * @param {{ label: string, href: string }} [props.ctaPrimary]
 * @param {{ label: string, href: string }} [props.ctaSecondary]
 * @param {string} [props.particleColor] - hex colour for the medium-blue particles
 * @param {string} [props.accentColor] - hex colour for eyebrow, glow + primary button
 * @param {boolean} [props.darkMode]
 */
export default function HeroSection({
  headline = 'Build something beautiful',
  subheadline = 'Production-ready components for modern web applications',
  ctaPrimary = { label: 'Get started', href: '#' },
  ctaSecondary = { label: 'View demo', href: '#' },
  particleColor = '#7eb8f7',
  accentColor = '#6366f1',
  darkMode = true,
}) {
  const sectionRef = useRef(null);
  const canvasRef = useRef(null);
  const headlineRef = useRef(null);
  const eyebrowRef = useRef(null);
  const subRef = useRef(null);
  const ctaRef = useRef(null);
  const scrollRef = useRef(null);
  const primaryBtnRef = useRef(null);
  const secondaryBtnRef = useRef(null);

  useHeroAnimation({
    sectionRef,
    canvasRef,
    headlineRef,
    eyebrowRef,
    subRef,
    ctaRef,
    scrollRef,
    primaryBtnRef,
    secondaryBtnRef,
    particleColor,
    accentColor,
  });

  const bg = darkMode ? '#03050f' : '#ffffff';
  const mono = '"SF Mono", "JetBrains Mono", "Roboto Mono", ui-monospace, monospace';
  const line = 'rgba(255,255,255,0.12)';

  // Vibrancy: an electric multi-hue gradient (indigo → violet → fuchsia → cyan)
  // reused across the headline, index plate and primary CTA so the colour reads
  // as a deliberate system, not a single flat accent.
  const accent2 = '#ec4899'; // fuchsia
  const gradient = `linear-gradient(110deg, ${accentColor} 0%, #a855f7 38%, ${accent2} 70%, #22d3ee 100%)`;
  const textGradient = {
    backgroundImage: gradient,
    WebkitBackgroundClip: 'text',
    backgroundClip: 'text',
    color: 'transparent',
    WebkitTextFillColor: 'transparent',
  };

  // Split into WORDS first (each word is a nowrap unit so it never breaks
  // mid-word), then into characters for the GSAP `.char-animate` cascade.
  const words = headline.split(' ');

  return (
    <section
      ref={sectionRef}
      className="relative w-full h-screen overflow-hidden"
      style={{ backgroundColor: bg, opacity: 0 }} // GSAP animates opacity to 1 on mount
    >
      {/* Three.js canvas mount point */}
      <div ref={canvasRef} className="absolute inset-0 z-0 pointer-events-none" />

      {/* Ambient glow wash — two coloured pools (indigo lower-left, fuchsia
          right) light the scene from opposite sides for a vibrant gradient sky */}
      <div
        className="absolute pointer-events-none z-[1]"
        style={{
          width: '760px',
          height: '460px',
          maxWidth: '95vw',
          top: '56%',
          left: '30%',
          transform: 'translate(-50%, -50%)',
          background: `radial-gradient(ellipse, ${accentColor}3a 0%, transparent 70%)`,
          filter: 'blur(60px)',
        }}
      />
      <div
        className="absolute pointer-events-none z-[1]"
        style={{
          width: '620px',
          height: '520px',
          maxWidth: '85vw',
          top: '34%',
          right: '4%',
          transform: 'translate(0, -50%)',
          background: `radial-gradient(ellipse, ${accent2}30 0%, transparent 72%)`,
          filter: 'blur(70px)',
        }}
      />
      <div
        className="absolute pointer-events-none z-[1]"
        style={{
          width: '420px',
          height: '420px',
          bottom: '-8%',
          left: '8%',
          background: `radial-gradient(circle, #22d3ee22 0%, transparent 70%)`,
          filter: 'blur(70px)',
        }}
      />

      {/* Vignette */}
      <div
        className="absolute inset-0 z-[1] pointer-events-none"
        style={{
          background: darkMode
            ? 'radial-gradient(ellipse at center, transparent 55%, rgba(3,5,15,0.6) 100%)'
            : 'radial-gradient(ellipse at center, transparent 45%, rgba(0,0,0,0.06) 100%)',
        }}
      />

      {/* Bottom gradient — fades into the page background */}
      <div
        className="absolute bottom-0 left-0 right-0 h-32 z-[1] pointer-events-none"
        style={{ background: `linear-gradient(to bottom, transparent, ${bg})` }}
      />

      {/* ── Brutalist frame: a hard 1px border inset from every edge ───────── */}
      <div
        className="absolute z-[2] pointer-events-none"
        style={{ inset: 'clamp(14px, 2vw, 26px)', border: `1px solid ${line}` }}
      />

      {/* ── Top bar: wordmark (left) + status (right), divided by a hairline ── */}
      <header
        className="absolute left-0 right-0 z-20 flex items-center justify-between"
        style={{
          top: 'clamp(14px, 2vw, 26px)',
          padding: 'clamp(18px, 2.2vh, 30px) clamp(28px, 5vw, 64px)',
          borderBottom: `1px solid ${line}`,
        }}
      >
        <div className="flex items-baseline gap-1">
          <span
            style={{
              fontSize: 'clamp(15px, 1.4vw, 18px)',
              fontWeight: 700,
              letterSpacing: '0.04em',
              color: '#fff',
            }}
          >
            AETHER
          </span>
          <span style={{ fontSize: '11px', color: accentColor, fontWeight: 700 }}>®</span>
        </div>

        {/* Eyebrow — bracketed monospace status, top-right */}
        <div
          ref={eyebrowRef}
          style={{
            opacity: 0,
            fontFamily: mono,
            fontSize: 'clamp(10px, 1vw, 12px)',
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
            color: 'rgba(255,255,255,0.6)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <span
            style={{
              width: '6px',
              height: '6px',
              background: accentColor,
              boxShadow: `0 0 8px ${accentColor}`,
            }}
          />
          [ New drop · Est. 2026 ]
        </div>
      </header>

      {/* ── Main grid: oversized index block + headline stack ──────────────── */}
      <div
        className="absolute inset-0 z-10 flex items-center"
        style={{ padding: 'clamp(72px, 12vh, 140px) clamp(28px, 5vw, 64px) clamp(72px, 12vh, 120px)' }}
      >
        <div className="flex w-full" style={{ gap: 'clamp(18px, 3vw, 44px)' }}>
          {/* Index block — bordered square, Swiss "plate number" */}
          <div
            className="hidden sm:flex flex-col flex-none"
            style={{
              border: `1px solid ${line}`,
              padding: '14px 16px',
              alignSelf: 'flex-start',
              marginTop: 'clamp(4px, 1vh, 14px)',
            }}
          >
            <span
              style={{
                fontFamily: mono,
                fontSize: '10px',
                letterSpacing: '0.2em',
                color: 'rgba(255,255,255,0.4)',
              }}
            >
              N°
            </span>
            <span
              style={{
                fontFamily: mono,
                fontSize: 'clamp(28px, 3vw, 42px)',
                fontWeight: 700,
                lineHeight: 1,
                ...textGradient,
              }}
            >
              001
            </span>
          </div>

          {/* Headline + supporting content */}
          <div className="min-w-0" style={{ maxWidth: '900px' }}>
            <h1
              ref={headlineRef}
              style={{
                fontSize: 'clamp(46px, 9vw, 124px)',
                lineHeight: 0.92,
                letterSpacing: '-0.04em',
                fontWeight: 800,
                textTransform: 'uppercase',
                opacity: 0,
                textAlign: 'left',
                margin: 0,
                // electric gradient fill across the whole headline
                ...textGradient,
              }}
              aria-label={headline}
            >
              {words.map((word, wi) => (
                <span key={wi}>
                  {/* nowrap word unit — keeps letters together on wrap */}
                  <span style={{ display: 'inline-block', whiteSpace: 'nowrap' }}>
                    {word.split('').map((char, ci) => (
                      <span
                        key={ci}
                        aria-hidden="true"
                        style={{
                          display: 'inline-block',
                          overflow: 'hidden',
                          lineHeight: 1.05,
                          verticalAlign: 'bottom',
                        }}
                      >
                        <span
                          className="char-animate"
                          style={{
                            display: 'inline-block',
                            transform: 'translateY(110%)',
                            // transparent so the h1 gradient fill shows through
                            color: 'transparent',
                            WebkitTextFillColor: 'transparent',
                            willChange: 'transform',
                          }}
                        >
                          {char}
                        </span>
                      </span>
                    ))}
                  </span>
                  {wi < words.length - 1 ? ' ' : null}
                </span>
              ))}
            </h1>

            {/* Hard rule under the headline */}
            <div style={{ height: '1px', background: line, margin: 'clamp(28px, 4vh, 48px) 0' }} />

            {/* Bottom row: subheadline (left) + CTAs (right), baseline-aligned */}
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-8">
              <div className="flex items-start gap-3" style={{ maxWidth: '420px' }}>
                <span
                  style={{
                    fontFamily: mono,
                    fontSize: '11px',
                    color: accentColor,
                    paddingTop: '4px',
                    flex: 'none',
                  }}
                >
                  ↳
                </span>
                <p
                  ref={subRef}
                  style={{
                    opacity: 0,
                    fontSize: 'clamp(14px, 1.2vw, 16px)',
                    fontWeight: 400,
                    color: 'rgba(255,255,255,0.6)',
                    lineHeight: 1.65,
                    textAlign: 'left',
                    margin: 0,
                  }}
                >
                  {subheadline}
                </p>
              </div>

              {/* CTAs — sharp-cornered, bracketed, uppercase mono labels */}
              <div ref={ctaRef} className="flex flex-none gap-0">
                <a
                  ref={primaryBtnRef}
                  href={ctaPrimary.href}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '15px 26px',
                    fontFamily: mono,
                    fontSize: '12px',
                    fontWeight: 600,
                    letterSpacing: '0.14em',
                    textTransform: 'uppercase',
                    color: '#ffffff',
                    background: gradient,
                    textDecoration: 'none',
                    boxShadow: `0 0 40px ${accentColor}66, 0 0 70px ${accent2}33`,
                    position: 'relative',
                    opacity: 0,
                  }}
                >
                  {ctaPrimary.label} <span style={{ fontSize: '15px', lineHeight: 1 }}>→</span>
                </a>
                <a
                  ref={secondaryBtnRef}
                  href={ctaSecondary.href}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    padding: '15px 26px',
                    fontFamily: mono,
                    fontSize: '12px',
                    fontWeight: 500,
                    letterSpacing: '0.14em',
                    textTransform: 'uppercase',
                    color: 'rgba(255,255,255,0.7)',
                    background: 'transparent',
                    border: `1px solid rgba(255,255,255,0.2)`,
                    borderLeft: 'none',
                    textDecoration: 'none',
                    opacity: 0,
                  }}
                >
                  [ {ctaSecondary.label} ]
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Bottom ticker bar: mono stats (left) + scroll cue (right) ───────── */}
      <div
        className="absolute left-0 right-0 z-20 flex items-center justify-between"
        style={{
          bottom: 'clamp(14px, 2vw, 26px)',
          padding: 'clamp(14px, 1.8vh, 24px) clamp(28px, 5vw, 64px)',
          borderTop: `1px solid ${line}`,
        }}
      >
        <div
          className="hidden md:flex items-center"
          style={{
            fontFamily: mono,
            fontSize: '11px',
            letterSpacing: '0.12em',
            color: 'rgba(255,255,255,0.4)',
          }}
        >
          <span style={{ color: accentColor }}>(001)</span>
          <span style={{ margin: '0 14px', color: 'rgba(255,255,255,0.15)' }}>————</span>
          <span>WEBGL</span>
          <span style={{ margin: '0 14px', color: 'rgba(255,255,255,0.15)' }}>————</span>
          <span>4000·PTS</span>
          <span style={{ margin: '0 14px', color: 'rgba(255,255,255,0.15)' }}>————</span>
          <span>GSAP</span>
        </div>

        {/* Scroll indicator */}
        <div
          ref={scrollRef}
          className="flex items-center gap-3"
          style={{ opacity: 0, marginLeft: 'auto' }}
        >
          <span
            style={{
              fontFamily: mono,
              fontSize: '11px',
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
              color: darkMode ? 'rgba(255,255,255,0.45)' : 'rgba(17,24,39,0.45)',
            }}
          >
            [ Scroll
          </span>
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
            <path
              d="M8 3v10M4 9l4 4 4-4"
              stroke={darkMode ? 'rgba(255,255,255,0.45)' : '#9ca3af'}
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span
            style={{
              fontFamily: mono,
              fontSize: '11px',
              letterSpacing: '0.22em',
              color: darkMode ? 'rgba(255,255,255,0.45)' : 'rgba(17,24,39,0.45)',
            }}
          >
            ]
          </span>
        </div>
      </div>
    </section>
  );
}
