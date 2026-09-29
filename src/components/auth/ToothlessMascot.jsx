import React, { useState, useEffect } from 'react';

/**
 * ToothlessMascot (Răng Sún Chibi) - Interactive Animated Vector Mascot
 * 
 * Inspired by the adorable baby Toothless (Night Fury) reference image:
 * - Beautiful deep ocean blue to cyan dragon gradient (#1e3a8a, #0284c7, #38bdf8)
 * - Signature Night Fury ear-horns, crown frills, and cheek nubs
 * - Giant sparkling lime-green eyes (#a3e635, #84cc16) with natural blinking and pupil tracking
 * - Playful pink tongue sticking out with blush cheeks
 * - Cute chibi dragon wings spread softly on the sides
 * - Front dragon paws perched on the card rim, covering eyes on password focus,
 *   peeking when password visibility is toggled on!
 */
export function ToothlessMascot({
  isPasswordFocused = false,
  showPassword = false,
  isUsernameFocused = false,
  usernameLength = 0,
  isSubmitting = false,
  className = ''
}) {
  const [isBlinking, setIsBlinking] = useState(false);

  // Natural periodic blink animation every ~3.6s when not hiding eyes
  useEffect(() => {
    if (isPasswordFocused) return;

    const blinkInterval = setInterval(() => {
      setIsBlinking(true);
      const timeout = setTimeout(() => {
        setIsBlinking(false);
      }, 180);
      return () => clearTimeout(timeout);
    }, 3600);

    return () => clearInterval(blinkInterval);
  }, [isPasswordFocused]);

  // Calculate eye pupil offset based on username input length
  // Clamped between -4px and +4px horizontally, and looking slightly down when focused
  const pupilX = isUsernameFocused
    ? Math.min(Math.max((usernameLength - 8) * 0.42, -4), 4)
    : 0;
  const pupilY = isUsernameFocused ? 2.2 : 0;

  // Paw and Eye states
  const isCoveringEyes = isPasswordFocused && !showPassword;
  const isPeeking = isPasswordFocused && showPassword;

  return (
    <div className={`relative flex items-center justify-center select-none pointer-events-none ${className}`}>
      {/* Ambient Forest / Dragon Aura glow behind Toothless */}
      <div 
        className="absolute -top-6 w-44 h-44 bg-gradient-to-r from-cyan-400/25 via-emerald-400/20 to-blue-600/25 rounded-full blur-2xl pointer-events-none animate-pulse" 
        style={{ animationDuration: '4s' }} 
      />

      <svg
        viewBox="0 0 160 145"
        className="w-40 h-40 sm:w-44 sm:h-44 overflow-visible transition-transform duration-300 drop-shadow-[0_12px_24px_rgba(0,0,0,0.55)]"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Dragon Body Gradient: Deep Navy to Royal/Sky Blue */}
          <linearGradient id="dragonSkin" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#38BDF8" />
            <stop offset="40%" stopColor="#0284C7" />
            <stop offset="100%" stopColor="#1E3A8A" />
          </linearGradient>

          {/* Dragon Back / Dark Shadow Skin */}
          <linearGradient id="dragonSkinDark" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#1E40AF" />
            <stop offset="100%" stopColor="#0F172A" />
          </linearGradient>

          {/* Dragon Belly / Chest Gradient */}
          <linearGradient id="dragonBelly" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#7DD3FC" />
            <stop offset="100%" stopColor="#38BDF8" />
          </linearGradient>

          {/* Dragon Wing Membrane Gradient */}
          <linearGradient id="dragonWing" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#7DD3FC" stopOpacity="0.9" />
            <stop offset="60%" stopColor="#0284C7" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#1E3A8A" stopOpacity="0.95" />
          </linearGradient>

          {/* Eye Iris Gradient: Luminous Lime Green to Rich Forest Emerald */}
          <radialGradient id="dragonEyeIris" cx="45%" cy="40%" r="55%">
            <stop offset="0%" stopColor="#BEF264" />
            <stop offset="55%" stopColor="#84CC16" />
            <stop offset="90%" stopColor="#4D7C0F" />
            <stop offset="100%" stopColor="#14532D" />
          </radialGradient>

          {/* Paw Fur Gradient */}
          <linearGradient id="pawSkinGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#38BDF8" />
            <stop offset="60%" stopColor="#0284C7" />
            <stop offset="100%" stopColor="#1E3A8A" />
          </linearGradient>

          {/* Paw Pad Gradient (Light Cyan) */}
          <linearGradient id="pawPadGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#BAE6FD" />
            <stop offset="100%" stopColor="#38BDF8" />
          </linearGradient>

          {/* Tongue Gradient */}
          <linearGradient id="tongueGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FDA4AF" />
            <stop offset="50%" stopColor="#FB7185" />
            <stop offset="100%" stopColor="#E11D48" />
          </linearGradient>

          {/* Paw Drop Shadow Filter */}
          <filter id="dragonPawShadow" x="-25%" y="-25%" width="150%" height="150%">
            <feDropShadow dx="0" dy="3" stdDeviation="3" floodColor="#000000" floodOpacity="0.55" />
          </filter>

          {/* Eye Clip Paths for smooth pupil tracking */}
          <clipPath id="leftEyeClip">
            <ellipse cx="58" cy="58" rx="12" ry="14" transform="rotate(-6 58 58)" />
          </clipPath>
          <clipPath id="rightEyeClip">
            <ellipse cx="102" cy="58" rx="12" ry="14" transform="rotate(6 102 58)" />
          </clipPath>
        </defs>

        {/* ============================================================ */}
        {/* 1. DRAGON WINGS (Spreading out to the sides)                 */}
        {/* ============================================================ */}
        {/* Left Wing */}
        <g className="origin-[50px_90px] transition-transform duration-500 ease-out">
          <path
            d="M 50 90 Q 20 72 8 76 Q 16 90 22 102 Q 35 96 42 102 Q 46 95 50 90 Z"
            fill="url(#dragonWing)"
            stroke="#0F172A"
            strokeWidth="1.2"
          />
          {/* Left Wing Finger Bones */}
          <path d="M 50 90 Q 22 74 8 76" stroke="#1E3A8A" strokeWidth="1.8" fill="none" />
          <path d="M 38 84 Q 28 92 22 102" stroke="#1E3A8A" strokeWidth="1.2" fill="none" />
          <path d="M 44 87 Q 40 95 42 102" stroke="#1E3A8A" strokeWidth="1.2" fill="none" />
        </g>

        {/* Right Wing */}
        <g className="origin-[110px_90px] transition-transform duration-500 ease-out">
          <path
            d="M 110 90 Q 140 72 152 76 Q 144 90 138 102 Q 125 96 118 102 Q 114 95 110 90 Z"
            fill="url(#dragonWing)"
            stroke="#0F172A"
            strokeWidth="1.2"
          />
          {/* Right Wing Finger Bones */}
          <path d="M 110 90 Q 138 74 152 76" stroke="#1E3A8A" strokeWidth="1.8" fill="none" />
          <path d="M 122 84 Q 132 92 138 102" stroke="#1E3A8A" strokeWidth="1.2" fill="none" />
          <path d="M 116 87 Q 120 95 118 102" stroke="#1E3A8A" strokeWidth="1.2" fill="none" />
        </g>

        {/* ============================================================ */}
        {/* 2. DRAGON BODY & BELLY (Behind front paws)                   */}
        {/* ============================================================ */}
        {/* Main Body */}
        <path
          d="M 48 85 Q 80 82 112 85 L 120 125 Q 80 132 40 125 Z"
          fill="url(#dragonSkinDark)"
          stroke="#0F172A"
          strokeWidth="1.2"
        />

        {/* Light Belly Plate */}
        <path
          d="M 60 88 Q 80 86 100 88 L 95 124 Q 80 128 65 124 Z"
          fill="url(#dragonBelly)"
          stroke="#0284C7"
          strokeWidth="1"
          opacity="0.9"
        />

        {/* Belly Scales Accents */}
        <path d="M 72 98 Q 80 101 88 98" stroke="#0284C7" strokeWidth="1.2" fill="none" opacity="0.6" />
        <path d="M 70 108 Q 80 111 90 108" stroke="#0284C7" strokeWidth="1.2" fill="none" opacity="0.6" />
        <path d="M 73 118 Q 80 120 87 118" stroke="#0284C7" strokeWidth="1.2" fill="none" opacity="0.6" />

        {/* ============================================================ */}
        {/* 3. TOOTHLESS HEAD HORNS & FRILLS (Night Fury Crest)          */}
        {/* ============================================================ */}
        {/* Large Primary Left Horn */}
        <path
          d="M 52 44 C 44 32, 34 16, 26 10 C 24 16, 26 28, 30 36 C 24 38, 20 44, 24 50 C 30 52, 38 52, 46 50 Z"
          fill="url(#dragonSkinDark)"
          stroke="#0F172A"
          strokeWidth="1.4"
          strokeLinejoin="round"
        />
        {/* Inner Left Horn Highlight */}
        <path
          d="M 48 42 C 40 32, 34 20, 29 14 C 28 20, 30 30, 34 38 Z"
          fill="#38BDF8"
          opacity="0.3"
        />

        {/* Large Primary Right Horn */}
        <path
          d="M 108 44 C 116 32, 126 16, 134 10 C 136 16, 134 28, 130 36 C 136 38, 140 44, 136 50 C 130 52, 122 52, 114 50 Z"
          fill="url(#dragonSkinDark)"
          stroke="#0F172A"
          strokeWidth="1.4"
          strokeLinejoin="round"
        />
        {/* Inner Right Horn Highlight */}
        <path
          d="M 112 42 C 120 32, 126 20, 131 14 C 132 20, 130 30, 126 38 Z"
          fill="#38BDF8"
          opacity="0.3"
        />

        {/* Crown Horn Nubs (Center Top Frills) */}
        <path d="M 66 36 Q 63 24 69 22 Q 74 27 72 35 Z" fill="url(#dragonSkinDark)" stroke="#0F172A" strokeWidth="1" />
        <path d="M 76 34 Q 80 20 84 20 Q 85 27 83 34 Z" fill="url(#dragonSkinDark)" stroke="#0F172A" strokeWidth="1" />
        <path d="M 88 35 Q 86 27 91 22 Q 97 24 94 36 Z" fill="url(#dragonSkinDark)" stroke="#0F172A" strokeWidth="1" />

        {/* Cheek Frills (Side nubs) */}
        <path d="M 38 64 C 30 62, 28 70, 34 74 C 38 72, 40 68, 38 64 Z" fill="url(#dragonSkinDark)" stroke="#0F172A" strokeWidth="1" />
        <path d="M 38 76 C 30 76, 30 84, 36 86 C 40 84, 40 80, 38 76 Z" fill="url(#dragonSkinDark)" stroke="#0F172A" strokeWidth="1" />

        <path d="M 122 64 C 130 62, 132 70, 126 74 C 122 72, 120 68, 122 64 Z" fill="url(#dragonSkinDark)" stroke="#0F172A" strokeWidth="1" />
        <path d="M 122 76 C 130 76, 130 84, 124 86 C 120 84, 120 80, 122 76 Z" fill="url(#dragonSkinDark)" stroke="#0F172A" strokeWidth="1" />

        {/* ============================================================ */}
        {/* 4. MAIN HEAD BASE & SCALES                                   */}
        {/* ============================================================ */}
        <ellipse
          cx="80"
          cy="62"
          rx="44"
          ry="34"
          fill="url(#dragonSkin)"
          stroke="#0F172A"
          strokeWidth="1.5"
        />

        {/* Head Top Shadow Contour */}
        <path
          d="M 44 46 Q 80 32 116 46 Q 112 36 80 34 Q 48 36 44 46 Z"
          fill="#0F172A"
          opacity="0.3"
        />

        {/* Dappled Dragon Scales Pattern on Forehead (Signature Toothless spots!) */}
        <g fill="#1E3A8A" opacity="0.65">
          <circle cx="80" cy="40" r="2.2" />
          <circle cx="74" cy="42" r="1.8" />
          <circle cx="86" cy="42" r="1.8" />
          <circle cx="70" cy="45" r="1.5" />
          <circle cx="90" cy="45" r="1.5" />
          <circle cx="78" cy="46" r="2" />
          <circle cx="83" cy="46" r="2" />
          <circle cx="75" cy="50" r="1.6" />
          <circle cx="85" cy="50" r="1.6" />
          <circle cx="80" cy="52" r="1.8" />
        </g>

        {/* Cute Pink Blushing Cheeks */}
        <circle cx="46" cy="74" r="7" fill="#FB7185" opacity="0.55" filter="blur(1.5px)" />
        <circle cx="114" cy="74" r="7" fill="#FB7185" opacity="0.55" filter="blur(1.5px)" />

        {/* ============================================================ */}
        {/* 5. BIG EXPRESSIVE LIME GREEN EYES                            */}
        {/* ============================================================ */}
        {isCoveringEyes ? (
          /* Shy / Happy Closed Curved Eyelashes when covering eyes */
          <g className="transition-opacity duration-200">
            <path
              d="M 48 62 Q 58 52 68 62"
              fill="none"
              stroke="#0F172A"
              strokeWidth="3.2"
              strokeLinecap="round"
            />
            <path
              d="M 92 62 Q 102 52 112 62"
              fill="none"
              stroke="#0F172A"
              strokeWidth="3.2"
              strokeLinecap="round"
            />
          </g>
        ) : isPeeking ? (
          /* Peeking Mode: Left Eye closed winking, Right Eye wide open curious! */
          <g className="transition-opacity duration-200">
            {/* Left Eye: Closed Winking Curve */}
            <path
              d="M 48 62 Q 58 54 68 62"
              fill="none"
              stroke="#0F172A"
              strokeWidth="3.2"
              strokeLinecap="round"
            />

            {/* Right Eye: Wide Open Luminous Lime Green Eye */}
            <ellipse
              cx="102"
              cy="58"
              rx="12"
              ry="14"
              transform="rotate(6 102 58)"
              fill="url(#dragonEyeIris)"
              stroke="#0F172A"
              strokeWidth="1.6"
            />
            <g clipPath="url(#rightEyeClip)">
              {/* Large Glossy Black Pupil looking down/right */}
              <circle
                cx={103 + pupilX}
                cy={60 + pupilY}
                r="7.5"
                fill="#0A0F1D"
              />
              {/* Eye Sparkle Catchlights */}
              <circle cx={100 + pupilX} cy={55 + pupilY} r="2.8" fill="#FFFFFF" />
              <circle cx={105 + pupilX} cy={63 + pupilY} r="1.4" fill="#FFFFFF" />
              <circle cx={102 + pupilX} cy={65 + pupilY} r="0.8" fill="#FFFFFF" />
            </g>
          </g>
        ) : isBlinking ? (
          /* Quick Eyelid Blink */
          <g>
            <path
              d="M 48 60 Q 58 66 68 60"
              fill="none"
              stroke="#0F172A"
              strokeWidth="3.2"
              strokeLinecap="round"
            />
            <path
              d="M 92 60 Q 102 66 112 60"
              fill="none"
              stroke="#0F172A"
              strokeWidth="3.2"
              strokeLinecap="round"
            />
          </g>
        ) : (
          /* Normal Big Cute Lime Green Eyes with Cursor Pupil Tracking */
          <g>
            {/* Left Eye Base */}
            <ellipse
              cx="58"
              cy="58"
              rx="12"
              ry="14"
              transform="rotate(-6 58 58)"
              fill="url(#dragonEyeIris)"
              stroke="#0F172A"
              strokeWidth="1.6"
            />
            <g clipPath="url(#leftEyeClip)">
              {/* Giant Glossy Black Pupil */}
              <circle
                cx={58 + pupilX}
                cy={59 + pupilY}
                r="7.5"
                fill="#0A0F1D"
                className="transition-transform duration-100 ease-out"
              />
              {/* Eye Sparkle Catchlights */}
              <circle cx={55 + pupilX} cy={54 + pupilY} r="2.8" fill="#FFFFFF" />
              <circle cx={60 + pupilX} cy={62 + pupilY} r="1.4" fill="#FFFFFF" />
              <circle cx={57 + pupilX} cy={64 + pupilY} r="0.8" fill="#FFFFFF" />
            </g>

            {/* Right Eye Base */}
            <ellipse
              cx="102"
              cy="58"
              rx="12"
              ry="14"
              transform="rotate(6 102 58)"
              fill="url(#dragonEyeIris)"
              stroke="#0F172A"
              strokeWidth="1.6"
            />
            <g clipPath="url(#rightEyeClip)">
              {/* Giant Glossy Black Pupil */}
              <circle
                cx={102 + pupilX}
                cy={59 + pupilY}
                r="7.5"
                fill="#0A0F1D"
                className="transition-transform duration-100 ease-out"
              />
              {/* Eye Sparkle Catchlights */}
              <circle cx={99 + pupilX} cy={54 + pupilY} r="2.8" fill="#FFFFFF" />
              <circle cx={104 + pupilX} cy={62 + pupilY} r="1.4" fill="#FFFFFF" />
              <circle cx={101 + pupilX} cy={64 + pupilY} r="0.8" fill="#FFFFFF" />
            </g>

            {/* Cute Soft Dragon Brow Ridges */}
            <path d="M 50 46 Q 58 43 66 46" stroke="#0F172A" strokeWidth="1.6" strokeLinecap="round" fill="none" opacity="0.6" />
            <path d="M 94 46 Q 102 43 110 46" stroke="#0F172A" strokeWidth="1.6" strokeLinecap="round" fill="none" opacity="0.6" />
          </g>
        )}

        {/* ============================================================ */}
        {/* 6. SNOUT, NOSTRILS & PLAYFUL TONGUE OUT                      */}
        {/* ============================================================ */}
        {/* Snout Bridge Contour */}
        <path
          d="M 73 68 Q 80 65 87 68"
          stroke="#0F172A"
          strokeWidth="1.2"
          strokeLinecap="round"
          fill="none"
          opacity="0.4"
        />

        {/* Dragon Nostril Slits */}
        <ellipse cx="76" cy="72" rx="1.6" ry="1" transform="rotate(-15 76 72)" fill="#0F172A" />
        <ellipse cx="84" cy="72" rx="1.6" ry="1" transform="rotate(15 84 72)" fill="#0F172A" />

        {/* Happy Smiling Open Mouth */}
        <path
          d="M 68 76 Q 80 73 92 76 Q 88 88 80 89 Q 72 88 68 76 Z"
          fill="#0F172A"
        />

        {/* Playful Pink Tongue Out (Thè lưỡi tinh nghịch như ảnh mẫu!) */}
        <g>
          <path
            d="M 73 78 C 72 86, 74 93, 80 94 C 86 93, 88 86, 87 78 Z"
            fill="url(#tongueGrad)"
            stroke="#9F1239"
            strokeWidth="0.8"
          />
          {/* Tongue Center Crease */}
          <path d="M 80 80 L 80 90" stroke="#BE123C" strokeWidth="1" strokeLinecap="round" />
          {/* Tongue Highlight / Drool Shine */}
          <ellipse cx="77" cy="85" rx="1.5" ry="3" fill="#FFFFFF" opacity="0.55" />
          {/* Little Cute Saliva Droplet like reference picture! */}
          <circle cx="83" cy="94" r="1.2" fill="#FFFFFF" opacity="0.8" />
        </g>

        {/* ============================================================ */}
        {/* 7. FRONT DRAGON PAWS (Claws resting on the card edge)        */}
        {/* ============================================================ */}
        {/*
          Resting position: cx=56 and cx=104 at cy=112 (overlapping card top border)
          Password Focus: translateY(-54px) to cover eyes at (58, 58) and (102, 58)
          Peek Mode: Left paw stays covering eye, Right paw lowers with tilt to reveal eye
        */}
        
        {/* LEFT DRAGON PAW */}
        <g
          filter="url(#dragonPawShadow)"
          style={{
            transformOrigin: '56px 112px',
            transform: isCoveringEyes
              ? 'translate(2px, -54px) rotate(-8deg)'
              : isPeeking
              ? 'translate(0px, -52px) rotate(-10deg)'
              : 'translate(0px, 0px) rotate(0deg)',
            transition: 'transform 0.45s cubic-bezier(0.34, 1.56, 0.64, 1)'
          }}
        >
          {/* Paw Base Shape */}
          <ellipse cx="56" cy="112" rx="15" ry="13" fill="url(#pawSkinGrad)" stroke="#0F172A" strokeWidth="1.2" />
          
          {/* Main Large Center Pad (Cyan) */}
          <ellipse cx="56" cy="115" rx="7" ry="5.5" fill="url(#pawPadGrad)" stroke="#0284C7" strokeWidth="0.6" />
          
          {/* 3 Cute Baby Dragon Toe Pads with tiny claws */}
          {/* Toe 1 */}
          <ellipse cx="48" cy="107" rx="3.5" ry="4" fill="url(#pawPadGrad)" stroke="#0284C7" strokeWidth="0.5" />
          <path d="M 47 103 Q 48 100 49 103" stroke="#0F172A" strokeWidth="1" fill="none" />

          {/* Toe 2 */}
          <ellipse cx="56" cy="104" rx="3.6" ry="4.2" fill="url(#pawPadGrad)" stroke="#0284C7" strokeWidth="0.5" />
          <path d="M 55 100 Q 56 97 57 100" stroke="#0F172A" strokeWidth="1" fill="none" />

          {/* Toe 3 */}
          <ellipse cx="64" cy="107" rx="3.5" ry="4" fill="url(#pawPadGrad)" stroke="#0284C7" strokeWidth="0.5" />
          <path d="M 63 103 Q 64 100 65 103" stroke="#0F172A" strokeWidth="1" fill="none" />
        </g>

        {/* RIGHT DRAGON PAW */}
        <g
          filter="url(#dragonPawShadow)"
          style={{
            transformOrigin: '104px 112px',
            transform: isCoveringEyes
              ? 'translate(-2px, -54px) rotate(8deg)'
              : isPeeking
              ? 'translate(16px, -22px) rotate(24deg)'
              : 'translate(0px, 0px) rotate(0deg)',
            transition: 'transform 0.45s cubic-bezier(0.34, 1.56, 0.64, 1)'
          }}
        >
          {/* Paw Base Shape */}
          <ellipse cx="104" cy="112" rx="15" ry="13" fill="url(#pawSkinGrad)" stroke="#0F172A" strokeWidth="1.2" />
          
          {/* Main Large Center Pad (Cyan) */}
          <ellipse cx="104" cy="115" rx="7" ry="5.5" fill="url(#pawPadGrad)" stroke="#0284C7" strokeWidth="0.6" />
          
          {/* 3 Cute Baby Dragon Toe Pads with tiny claws */}
          {/* Toe 1 */}
          <ellipse cx="96" cy="107" rx="3.5" ry="4" fill="url(#pawPadGrad)" stroke="#0284C7" strokeWidth="0.5" />
          <path d="M 95 103 Q 96 100 97 103" stroke="#0F172A" strokeWidth="1" fill="none" />

          {/* Toe 2 */}
          <ellipse cx="104" cy="104" rx="3.6" ry="4.2" fill="url(#pawPadGrad)" stroke="#0284C7" strokeWidth="0.5" />
          <path d="M 103 100 Q 104 97 105 100" stroke="#0F172A" strokeWidth="1" fill="none" />

          {/* Toe 3 */}
          <ellipse cx="112" cy="107" rx="3.5" ry="4" fill="url(#pawPadGrad)" stroke="#0284C7" strokeWidth="0.5" />
          <path d="M 111 103 Q 112 100 113 103" stroke="#0F172A" strokeWidth="1" fill="none" />
        </g>

      </svg>
    </div>
  );
}

export default ToothlessMascot;
