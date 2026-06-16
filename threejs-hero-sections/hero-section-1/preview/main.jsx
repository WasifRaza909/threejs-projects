import React from 'react';
import ReactDOM from 'react-dom/client';
import HeroSection from '../HeroSection.jsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <HeroSection />
    {/* Extra space so scroll parallax + indicator fade are visible in preview */}
    <div className="h-screen bg-[#03050f] flex items-center justify-center">
      <p className="text-white/30 text-sm tracking-widest uppercase">
        Scroll content below the hero
      </p>
    </div>
  </React.StrictMode>
);
