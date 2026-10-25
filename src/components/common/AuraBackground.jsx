import React from 'react';
import { useTheme } from '../../context/ThemeContext';

/**
 * AuraBackground
 * Obsidian Spatial Canvas Ambient Lighting Container (Theme-Aware)
 * - Dark Mode: Deep cosmic space (#0B0C10) with royal indigo (#6366F1), violet, and neon cyan ambient glows.
 * - Light Mode: Pristine frosted spatial canvas (#f1f5f9) with fresh aqua, sky cyan, and gentle lavender glows.
 */
export const AuraBackground = ({ children, className = '' }) => {
  const themeContext = useTheme();
  const isDark = themeContext?.isDark ?? true;

  return (
    <div 
      className={`relative min-h-screen overflow-hidden transition-colors duration-500 ${
        isDark ? 'bg-[#0B0C10] text-slate-100' : 'bg-[#f1f5f9] text-slate-800'
      } ${className}`}
    >
      {/* Layer 1: Primary Ambient Glow Hub (Top-Center / Left) */}
      <div
        className="absolute inset-0 pointer-events-none transition-opacity duration-700"
        style={{
          filter: 'blur(120px)',
          background: isDark
            ? 'radial-gradient(circle at 20% 15%, rgba(99, 102, 241, 0.15) 0%, rgba(139, 92, 246, 0.08) 35%, transparent 60%)'
            : 'radial-gradient(circle at 20% 15%, rgba(6, 182, 212, 0.22) 0%, rgba(14, 165, 233, 0.10) 35%, transparent 60%)',
          willChange: 'transform',
          transform: 'translateZ(0)'
        }}
        aria-hidden="true"
      />

      {/* Layer 2: Secondary Atmospheric Glow (Bottom-Right) */}
      <div
        className="absolute inset-0 pointer-events-none transition-opacity duration-700"
        style={{
          filter: 'blur(130px)',
          background: isDark
            ? 'radial-gradient(circle at 80% 85%, rgba(124, 58, 237, 0.12) 0%, rgba(79, 70, 229, 0.06) 40%, transparent 65%)'
            : 'radial-gradient(circle at 80% 85%, rgba(139, 92, 246, 0.12) 0%, rgba(99, 102, 241, 0.05) 40%, transparent 65%)',
          willChange: 'transform',
          transform: 'translateZ(0)'
        }}
        aria-hidden="true"
      />

      {/* Layer 3: Accent Sheen (Center-Right subtle touch) */}
      <div
        className="absolute inset-0 pointer-events-none transition-opacity duration-700"
        style={{
          filter: 'blur(100px)',
          background: isDark
            ? 'radial-gradient(circle at 65% 30%, rgba(6, 182, 212, 0.07) 0%, rgba(16, 185, 129, 0.03) 30%, transparent 55%)'
            : 'radial-gradient(circle at 65% 30%, rgba(245, 158, 11, 0.08) 0%, rgba(251, 191, 36, 0.03) 30%, transparent 55%)',
          willChange: 'transform',
          transform: 'translateZ(0)'
        }}
        aria-hidden="true"
      />

      {/* Children content wrapper */}
      <div className="relative z-10 w-full min-h-screen flex flex-col">
        {children}
      </div>
    </div>
  );
};

export default AuraBackground;
