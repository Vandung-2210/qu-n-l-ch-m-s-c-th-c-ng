import React from 'react';

/**
 * ForestBackgroundIllustration
 * Vector SVG landscape matching the nature park / forest theme from Reference Image 2:
 * - Pastel mint sky with soft gradient
 * - Distant rolling sage green hills
 * - Stylized park trees with layered circular canopies
 * - Foreground lush rolling grass meadows with grass tufts
 */
export function ForestBackgroundIllustration() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0" aria-hidden="true">
      <svg
        className="w-full h-full object-cover min-w-full min-h-full"
        viewBox="0 0 1440 900"
        preserveAspectRatio="xMidYMid slice"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Sky Gradient: Soft pastel mint-cyan to fresh meadow light */}
          <linearGradient id="skyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#A8DFC9" />
            <stop offset="45%" stopColor="#8FCFB2" />
            <stop offset="100%" stopColor="#C2EAD9" />
          </linearGradient>

          {/* Distant Hills Gradient */}
          <linearGradient id="distantHillGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#75C29F" />
            <stop offset="100%" stopColor="#5CAE89" />
          </linearGradient>

          {/* Midground Hills Gradient */}
          <linearGradient id="midHillGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#4A9C75" />
            <stop offset="100%" stopColor="#3B8461" />
          </linearGradient>

          {/* Foreground Lawn Gradient */}
          <linearGradient id="lawnGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#377F5C" />
            <stop offset="100%" stopColor="#245F42" />
          </linearGradient>

          {/* Canopy Shade 1 (Lighter Leaf Green) */}
          <linearGradient id="canopyLight" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#4FA77D" />
            <stop offset="100%" stopColor="#37845E" />
          </linearGradient>

          {/* Canopy Shade 2 (Deep Forest Green) */}
          <linearGradient id="canopyDark" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#2F7552" />
            <stop offset="100%" stopColor="#1E5439" />
          </linearGradient>

          {/* Tree Trunk Gradient */}
          <linearGradient id="trunkGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#2D684A" />
            <stop offset="50%" stopColor="#3F8561" />
            <stop offset="100%" stopColor="#255A3E" />
          </linearGradient>

          {/* Soft ambient vignette filter */}
          <radialGradient id="vignette" cx="50%" cy="50%" r="70%">
            <stop offset="40%" stopColor="#000000" stopOpacity="0" />
            <stop offset="100%" stopColor="#0E3324" stopOpacity="0.3" />
          </radialGradient>
        </defs>

        {/* 1. Base Pastel Sky */}
        <rect width="1440" height="900" fill="url(#skyGrad)" />

        {/* 2. Soft Distant Rolling Hills */}
        <path
          d="M-50,480 Q250,380 620,440 T1350,400 Q1420,410 1500,430 L1500,950 L-50,950 Z"
          fill="url(#distantHillGrad)"
          opacity="0.8"
        />
        <path
          d="M-50,540 Q380,470 780,520 T1500,480 L1500,950 L-50,950 Z"
          fill="url(#midHillGrad)"
          opacity="0.85"
        />

        {/* 3. Foreground Curved Meadows */}
        <path
          d="M-50,620 Q320,580 720,630 T1500,590 L1500,950 L-50,950 Z"
          fill="url(#lawnGrad)"
        />
        <path
          d="M-50,710 Q400,680 880,730 T1500,700 L1500,950 L-50,950 Z"
          fill="#1C5238"
        />

        {/* 4. Left Forest Tree Canopies (Overhanging branches) */}
        <g id="leftTrees">
          <circle cx="20" cy="40" r="140" fill="url(#canopyDark)" opacity="0.9" />
          <circle cx="90" cy="110" r="110" fill="url(#canopyLight)" />
          <circle cx="-10" cy="200" r="120" fill="url(#canopyDark)" />
          <circle cx="110" cy="260" r="95" fill="url(#canopyLight)" />
          <circle cx="-30" cy="380" r="140" fill="url(#canopyDark)" />
          <circle cx="70" cy="440" r="80" fill="url(#canopyLight)" />
          {/* Small accent leaf cluster */}
          <circle cx="150" cy="190" r="35" fill="#58B88A" opacity="0.75" />
          <circle cx="130" cy="340" r="40" fill="#58B88A" opacity="0.65" />
        </g>

        {/* 5. Right Forest Tree (Trunk & Layered Foliage matching Image 2) */}
        <g id="rightTree">
          {/* Main Tree Trunk */}
          <path
            d="M1280,320 Q1275,500 1260,780 L1340,780 Q1330,520 1350,320 Z"
            fill="url(#trunkGrad)"
          />
          {/* Branches reaching out */}
          <path
            d="M1295,440 Q1240,410 1190,430 Q1230,450 1285,465 Z"
            fill="#2D684A"
          />
          <path
            d="M1330,380 Q1380,340 1430,350 Q1380,370 1335,405 Z"
            fill="#255A3E"
          />

          {/* Layered Canopies on Right Tree */}
          <circle cx="1300" cy="160" r="180" fill="url(#canopyDark)" />
          <circle cx="1220" cy="220" r="150" fill="url(#canopyLight)" />
          <circle cx="1370" cy="200" r="160" fill="url(#canopyDark)" />
          <circle cx="1260" cy="300" r="130" fill="url(#canopyLight)" />
          <circle cx="1390" cy="340" r="120" fill="url(#canopyDark)" />

          {/* Lower bush clusters near tree base */}
          <circle cx="1180" cy="490" r="70" fill="url(#canopyLight)" />
          <circle cx="1360" cy="520" r="85" fill="url(#canopyDark)" />
          <circle cx="1260" cy="550" r="60" fill="#3D8E67" />
          <circle cx="1420" cy="560" r="90" fill="#245F42" />
        </g>

        {/* 6. Stylized Grass Tufts on the Lawn */}
        <g fill="#17452E" opacity="0.65">
          {/* Tufts group 1 (Left lawn) */}
          <path d="M180,680 Q175,665 170,660 Q175,670 178,680 Z" />
          <path d="M182,680 Q185,662 188,658 Q186,670 184,680 Z" />
          <path d="M180,680 Q180,660 182,656 Q182,670 182,680 Z" />

          {/* Tufts group 2 (Center left) */}
          <path d="M380,750 Q375,735 370,730 Q375,740 378,750 Z" />
          <path d="M382,750 Q385,732 388,728 Q386,740 384,750 Z" />

          {/* Tufts group 3 (Center right) */}
          <path d="M1060,740 Q1055,725 1050,720 Q1055,730 1058,740 Z" />
          <path d="M1062,740 Q1065,722 1068,718 Q1066,730 1064,740 Z" />

          {/* Tufts group 4 (Far right) */}
          <path d="M1240,810 Q1235,795 1230,790 Q1235,800 1238,810 Z" />
          <path d="M1242,810 Q1245,792 1248,788 Q1246,800 1244,810 Z" />

          {/* Tufts group 5 (Bottom left) */}
          <path d="M260,820 Q255,805 250,800 Q255,810 258,820 Z" />
          <path d="M262,820 Q265,802 268,798 Q266,810 264,820 Z" />
        </g>

        {/* 7. Ambient Vignette Overlay */}
        <rect width="1440" height="900" fill="url(#vignette)" />
      </svg>
    </div>
  );
}

export default ForestBackgroundIllustration;
