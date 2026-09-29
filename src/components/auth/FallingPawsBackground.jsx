import React, { useMemo } from 'react';

/**
 * FallingPawsBackground
 * Renders gently falling translucent pet paw prints and forest leaves
 * with smooth GPU-accelerated drift and rotation.
 */
export function FallingPawsBackground() {
  // Precompute 22 staggered particles to avoid recalculating on re-render
  const particles = useMemo(() => {
    return Array.from({ length: 22 }).map((_, index) => {
      const isPaw = index % 2 === 0;
      const left = ((index * 4.6 + (index % 5) * 3.2) % 94) + 3; // 3% to 97% width
      const size = 16 + (index % 4) * 6; // 16px to 34px
      const duration = 12 + (index % 6) * 2.5; // 12s to 24.5s
      const delay = -((index * 1.8) % duration); // Negative delay ensures already mid-air
      const drift = (index % 2 === 0 ? 1 : -1) * (30 + (index % 4) * 20); // -90px to +90px drift
      const rotation = (index % 2 === 0 ? 1 : -1) * (120 + (index % 5) * 45); // rotation angle
      const opacity = 0.18 + (index % 5) * 0.05; // 0.18 to 0.38
      const colorType = index % 3; // 0: White-milk, 1: Soft Mint, 2: Emerald Sage
      
      let colorClass = 'text-white/35';
      if (colorType === 1) colorClass = 'text-emerald-200/40';
      if (colorType === 2) colorClass = 'text-teal-100/35';

      return {
        id: index,
        isPaw,
        left: `${left}%`,
        size,
        duration: `${duration}s`,
        delay: `${delay}s`,
        drift: `${drift}px`,
        rotation: `${rotation}deg`,
        opacity,
        colorClass
      };
    });
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0" aria-hidden="true">
      {particles.map((p) => (
        <div
          key={p.id}
          className={`absolute top-0 ${p.colorClass}`}
          style={{
            left: p.left,
            width: `${p.size}px`,
            height: `${p.size}px`,
            opacity: p.opacity,
            animation: `fallingParticle ${p.duration} linear infinite`,
            animationDelay: p.delay,
            '--drift': p.drift,
            '--rotation': p.rotation
          }}
        >
          {p.isPaw ? (
            /* Pet Paw Print Icon */
            <svg
              viewBox="0 0 24 24"
              className="w-full h-full fill-current drop-shadow-xs"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Main Pad */}
              <path d="M12 11c-1.8 0-3.3 1.4-3.3 3.3 0 2.2 1.8 3.7 3.3 3.7s3.3-1.5 3.3-3.7c0-1.9-1.5-3.3-3.3-3.3z" />
              {/* Four Toe Pads */}
              <circle cx="7" cy="10" r="1.6" />
              <circle cx="10.2" cy="7.2" r="1.7" />
              <circle cx="13.8" cy="7.2" r="1.7" />
              <circle cx="17" cy="10" r="1.6" />
            </svg>
          ) : (
            /* Forest Leaf Icon */
            <svg
              viewBox="0 0 24 24"
              className="w-full h-full fill-current drop-shadow-xs"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M17.5 3.2c-5.8 0-10.5 4.7-10.5 10.5 0 3.8 2.2 7 5.4 8.5-.2-2.8 1.1-5.5 3.3-7 2.2-1.5 3.4-4.2 3.4-7.2-.6.4-1.2.7-1.8.9.9-2.3.8-3.9.2-5.7z" />
            </svg>
          )}
        </div>
      ))}
    </div>
  );
}

export default FallingPawsBackground;
