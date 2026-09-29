import React, { useState, useEffect, useRef } from 'react';

/**
 * CatDoorSignInButton - Choreographed Animated Sign In Button
 * 
 * 1. Default & Loading:
 *    - Door is COMPLETELY CLOSED (darker blue matching button, small handle, NO light leaking).
 *    - Cat stands waiting beside the door, idling and gently wagging tail.
 *    - In loading: Cat still waits, door stays closed, subtitle: "Đang kiểm tra..."
 * 
 * 2. On Success:
 *    - Phase 1 (0-350ms): Door opens, warm golden light pours out from room.
 *    - Phase 2 (350-850ms): Cat trots into the doorway, fading into the room light.
 *    - Phase 3 (850-1150ms): Door closes tightly behind cat, light turns off.
 * 
 * 3. Success State:
 *    - Phase 4 (1150-1950ms): Button morphs to Emerald (#10B981), centered checkmark ✓ pops in,
 *      subtitle: "Welcome back!", held for 0.8s before completing redirection.
 */
export function CatDoorSignInButton({
  status = 'idle', // 'idle' | 'loading' | 'success'
  onClick,
  onSuccessComplete,
  disabled = false,
  className = ''
}) {
  // sequence phase: 'idle' | 'loading' | 'door_open' | 'cat_walk' | 'door_close' | 'emerald_checkmark'
  const [phase, setPhase] = useState('idle');
  const timeoutRefs = useRef([]);

  const clearAllTimeouts = () => {
    timeoutRefs.current.forEach((t) => clearTimeout(t));
    timeoutRefs.current = [];
  };

  useEffect(() => {
    clearAllTimeouts();

    if (status === 'idle') {
      setPhase('idle');
    } else if (status === 'loading') {
      setPhase('loading');
    } else if (status === 'success') {
      // Step 2.1: Open Door (0ms - 350ms)
      setPhase('door_open');

      // Step 2.2: Cat Trot In (350ms - 850ms)
      const t1 = setTimeout(() => {
        setPhase('cat_walk');
      }, 350);

      // Step 2.3: Door Close (850ms - 1150ms)
      const t2 = setTimeout(() => {
        setPhase('door_close');
      }, 850);

      // Step 3: Emerald Checkmark (1150ms)
      const t3 = setTimeout(() => {
        setPhase('emerald_checkmark');
      }, 1150);

      // Hold for 0.8s (1150ms + 800ms = 1950ms) before triggering redirect
      const t4 = setTimeout(() => {
        if (onSuccessComplete) {
          onSuccessComplete();
        }
      }, 1950);

      timeoutRefs.current = [t1, t2, t3, t4];
    }

    return clearAllTimeouts;
  }, [status, onSuccessComplete]);

  const isEmerald = phase === 'emerald_checkmark';
  const isDoorOpen = phase === 'door_open' || phase === 'cat_walk';
  const isCatWalking = phase === 'cat_walk';
  const isCatInside = phase === 'door_close' || phase === 'emerald_checkmark';
  const isLoading = status === 'loading' && phase === 'loading';

  return (
    <div className="w-full flex flex-col items-center select-none">
      {/* Main Interactive Button Container (Forest Deep Emerald to Mint Green) */}
      <button
        type="submit"
        onClick={onClick}
        disabled={disabled || isLoading || status === 'success'}
        className={`w-full h-13 px-6 rounded-2xl relative overflow-hidden transition-all duration-500 flex items-center justify-between shadow-lg cursor-pointer ${
          isEmerald
            ? 'bg-[#34D399] shadow-[0_0_25px_rgba(52,211,153,0.55)] scale-[1.01]'
            : 'bg-[#1C5840] hover:bg-[#236A4D] border border-emerald-400/25 shadow-[0_8px_25px_-5px_rgba(14,64,44,0.5)] hover:shadow-[0_10px_30px_rgba(16,185,129,0.35)] hover:-translate-y-0.5 active:scale-98'
        } ${className}`}
      >
        {/* Subtle glass reflection highlight on top edge */}
        <div className="absolute top-0 inset-x-0 h-px bg-white/30 pointer-events-none" />

        {/* ============================================================ */}
        {/* STAGE 3: SUCCESS CHECKMARK (Centered Pop-in, Mint Theme)     */}
        {/* ============================================================ */}
        {isEmerald ? (
          <div className="w-full flex items-center justify-center animate-in zoom-in-50 duration-400">
            <svg
              className="w-7 h-7 text-[#072F22] stroke-current"
              viewBox="0 0 24 24"
              fill="none"
              strokeWidth="3.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="20 6 9 17 4 12" className="animate-draw-check" />
            </svg>
          </div>
        ) : (
          /* ========================================================== */
          /* STAGES 1 & 2: SIGN IN TEXT + CAT & DOOR ANIMATION           */
          /* ========================================================== */
          <>
            {/* Left: "Sign In" Label */}
            <span
              className={`text-base font-bold tracking-wide transition-all duration-300 ${
                isLoading ? 'text-emerald-100/75 translate-x-1' : 'text-white'
              }`}
            >
              Sign In
            </span>

            {/* Right: Cat & Door Stage */}
            <div className="relative w-20 h-10 flex items-center justify-end">
              
              {/* ====================================================== */}
              {/* THE CAT                                                */}
              {/* ====================================================== */}
              <div
                className="absolute right-9 top-1/2 -translate-y-1/2 transition-all ease-in-out"
                style={{
                  transform: isCatWalking
                    ? 'translate(26px, -50%) scale(0.72)'
                    : isCatInside
                    ? 'translate(30px, -50%) scale(0.6)'
                    : 'translate(0px, -50%) scale(1)',
                  opacity: isCatInside ? 0 : isCatWalking ? 0.3 : 1,
                  transitionDuration: isCatWalking ? '500ms' : '300ms',
                  pointerEvents: 'none'
                }}
              >
                <svg
                  viewBox="0 0 24 26"
                  className={`w-5 h-6 text-[#092218] fill-current drop-shadow-xs ${
                    isCatWalking ? 'animate-cat-walk' : 'animate-cat-idle'
                  }`}
                >
                  {/* Cat Ears */}
                  <polygon points="6,6 9,0 12,6" />
                  <polygon points="12,6 15,0 18,6" />

                  {/* Cat Head */}
                  <circle cx="12" cy="8" r="5" />

                  {/* Cat Body */}
                  <ellipse cx="12" cy="17" rx="4" ry="6" />

                  {/* Cat Legs (Front & Back) */}
                  <rect x="9.5" y="21" width="1.8" height="5" rx="0.9" />
                  <rect x="12.7" y="21" width="1.8" height="5" rx="0.9" />

                  {/* Cat Tail (Wagging tail animation) */}
                  <path
                    d="M 8 20 C 5 21, 3 17, 4 14"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    fill="none"
                    className="animate-cat-tail"
                  />
                </svg>
              </div>

              {/* ====================================================== */}
              {/* THE DOOR                                               */}
              {/* ====================================================== */}
              <div className="relative w-8 h-9.5 rounded-xl bg-[#0D2E21] border border-emerald-400/25 overflow-hidden shadow-inner flex items-center justify-center">
                
                {/* Glowing Interior Warm Golden Room Light (Only visible when door is open!) */}
                <div
                  className={`absolute inset-0 bg-gradient-to-r from-amber-200 via-amber-100 to-yellow-100 shadow-[0_0_16px_rgba(251,191,36,0.95)] transition-opacity duration-300 ${
                    isDoorOpen ? 'opacity-100' : 'opacity-0'
                  }`}
                />

                {/* Door Frame Border */}
                <div className="absolute inset-0 border border-black/30 rounded-xl pointer-events-none" />

                {/* Door Leaf (Closed by default, swings open on success, closes back after cat enters) */}
                <div
                  style={{
                    transformOrigin: 'right center',
                    transform: isDoorOpen
                      ? 'perspective(400px) rotateY(-75deg) scaleX(0.2)'
                      : 'perspective(400px) rotateY(0deg) scaleX(1)',
                    transition: 'transform 0.35s cubic-bezier(0.34, 1.25, 0.64, 1), background-color 0.3s'
                  }}
                  className={`absolute inset-0 rounded-lg flex items-center justify-start ${
                    isDoorOpen
                      ? 'bg-[#24634B] border-r-2 border-emerald-300/40'
                      : 'bg-[#184835] border-r border-emerald-400/25'
                  }`}
                >
                  {/* Small Door Handle / Knob on the left of door (visible only when door is closed) */}
                  {!isDoorOpen && (
                    <div className="w-1 h-3 rounded-full bg-white/75 ml-1.5 shadow-[0_1px_2px_rgba(0,0,0,0.35)]" />
                  )}
                </div>

              </div>

            </div>
          </>
        )}
      </button>

      {/* ============================================================ */}
      {/* SUBTITLE STATUS MESSAGES (Underneath Button)                 */}
      {/* ============================================================ */}
      <div className="h-6 mt-2.5 flex items-center justify-center">
        {isLoading && (
          <p className="text-xs font-medium text-emerald-100/90 animate-in fade-in duration-300 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
            <span>Đang kiểm tra...</span>
          </p>
        )}
        {(phase === 'door_open' || phase === 'cat_walk' || phase === 'door_close') && (
          <p className="text-xs font-medium text-amber-200 animate-in fade-in duration-300 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            <span>Đang đăng nhập...</span>
          </p>
        )}
        {isEmerald && (
          <p className="text-xs font-bold text-white/95 animate-in fade-in zoom-in-90 duration-300 flex items-center gap-1">
            <span>Welcome back!</span>
          </p>
        )}
      </div>

    </div>
  );
}

export default CatDoorSignInButton;
