# HeroSection Component

Animated hero section for React and Next.js. Three.js particle field + GSAP entrance animations + magnetic buttons. All lifecycle cleanup handled — no memory leaks.

## Requirements

- React 18+
- Next.js 14+ (optional, also works with Vite + React)
- `three` (`npm install three`)
- `gsap` (`npm install gsap`)
- Tailwind CSS configured in your project

## Installation

Copy `HeroSection.jsx` and `useHeroAnimation.js` into your components folder.

```bash
# Install dependencies if not already installed
npm install three gsap
```

## Usage

### Basic

```jsx
import HeroSection from '@/components/HeroSection';

export default function HomePage() {
  return <HeroSection />;
}
```

### With custom content

```jsx
<HeroSection
  headline="Ship faster with better components"
  subheadline="Drop-in React components that actually work in production."
  ctaPrimary={{ label: "Buy now", href: "https://gumroad.com/..." }}
  ctaSecondary={{ label: "See live demo", href: "#" }}
  particleColor="#a78bfa"
  accentColor="#8b5cf6"
  darkMode={true}
/>
```

## Props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `headline` | string | `"Build something beautiful"` | Main headline text |
| `subheadline` | string | `"Production-ready..."` | Subtitle text |
| `ctaPrimary` | `{ label, href }` | `"Get started"` | Primary CTA button |
| `ctaSecondary` | `{ label, href }` | `"View demo"` | Secondary CTA button |
| `particleColor` | string (hex) | `"#7eb8f7"` | Three.js particle colour |
| `accentColor` | string (hex) | `"#6366f1"` | Eyebrow + primary button colour |
| `darkMode` | boolean | `true` | Dark or light background |

## Next.js App Router

The component uses browser APIs (WebGL, requestAnimationFrame). Add `'use client'` at the top of any file that imports it:

```jsx
'use client';
import HeroSection from '@/components/HeroSection';
```

## Why the lifecycle is handled correctly

All Three.js objects (geometry, material, texture, renderer) are tracked in a disposables array and `.dispose()` is called on unmount. GSAP animations are wrapped in `gsap.context()` which calls `.revert()` on unmount — this kills all tweens and ScrollTriggers created inside it. The animation loop uses `cancelAnimationFrame`. Mouse and resize listeners are removed. The WebGL context is explicitly lost with `renderer.forceContextLoss()` to free GPU memory immediately.

## Customising the particle effect

Open `useHeroAnimation.js`. At the top of the hook you will find the `CONFIG` object:

```js
const CONFIG = {
  particleCount: 5000,
  repulsionRadius: 1.6,
  repulsionForce: 0.04,
  returnSpeed: 0.035,
  rotationSpeed: 0.0002,
  particleSize: 0.018,
};
```

Change values here only.

## Support

Purchased on Gumroad? Open a support request via your purchase confirmation email.
