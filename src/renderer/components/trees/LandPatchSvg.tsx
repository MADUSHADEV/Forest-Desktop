import React from 'react';
import { LandStyle } from '../../../shared/types';

interface LandPatchSvgProps {
  land?: LandStyle;
  isWithered?: boolean;
}

export const LandPatchSvg: React.FC<LandPatchSvgProps> = ({
  land,
  isWithered = false,
}) => {
  const landId = land?.id || 'classic-meadow';
  const groundColor = isWithered ? '#423D3A' : land?.groundColor || '#7CB342';
  const borderColor = isWithered ? '#2D2825' : land?.borderColor || '#558B2F';

  return (
    <g>
      <defs>
        <radialGradient id={`turfGrad-${landId}`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={groundColor} />
          <stop offset="100%" stopColor={borderColor} />
        </radialGradient>
      </defs>

      {/* Base Turf Mound Ellipse */}
      <ellipse
        cx="50"
        cy="85"
        rx="36"
        ry="11"
        fill={`url(#turfGrad-${landId})`}
        stroke={borderColor}
        strokeWidth="1"
      />
      <ellipse
        cx="50"
        cy="83"
        rx="32"
        ry="9"
        fill="#FFFFFF"
        opacity={isWithered ? 0.05 : 0.12}
      />

      {/* Characteristic Land Surface Details (when not withered) */}
      {!isWithered && (
        <>
          {/* 1. Classic Lush Meadow: Organic Grass Tufts */}
          {landId === 'classic-meadow' && (
            <g opacity="0.8">
              <path d="M30 84 Q32 80 34 83 Q36 79 38 84" stroke="#4CAF50" strokeWidth="1.2" fill="none" />
              <path d="M62 85 Q64 81 66 84 Q68 80 70 85" stroke="#4CAF50" strokeWidth="1.2" fill="none" />
              <circle cx="48" cy="86" r="1" fill="#81C784" />
            </g>
          )}

          {/* 2. Woodland Clearing: Moss & Tiny Mushrooms */}
          {landId === 'woodland-clearing' && (
            <g opacity="0.85">
              <ellipse cx="32" cy="84" rx="3.5" ry="1.5" fill="#33691E" />
              <ellipse cx="68" cy="85" rx="3" ry="1.2" fill="#33691E" />
              {/* Tiny Mushroom */}
              <rect x="25" y="81" width="1.5" height="3" fill="#E0E0E0" />
              <path d="M24 81 Q26 78 28 81 Z" fill="#E53935" />
            </g>
          )}

          {/* 3. Zen Sand Garden: Raked Ripples & River Stones */}
          {landId === 'zen-sand-garden' && (
            <g opacity="0.7">
              {/* Concentric Raked Sand Arcs */}
              <ellipse cx="50" cy="85" rx="26" ry="7" fill="none" stroke="#A1887F" strokeWidth="0.8" strokeDasharray="3,2" />
              <ellipse cx="50" cy="85" rx="18" ry="5" fill="none" stroke="#A1887F" strokeWidth="0.8" strokeDasharray="3,2" />
              {/* Smooth River Stones */}
              <ellipse cx="30" cy="84" rx="3.5" ry="2.2" fill="#5D4037" />
              <ellipse cx="68" cy="84" rx="4" ry="2.5" fill="#4E342E" />
              <ellipse cx="71" cy="83" rx="2" ry="1.5" fill="#795548" />
            </g>
          )}

          {/* 4. Midnight Bioluminescence: Glowing Spores & Runes */}
          {landId === 'midnight-bioluminescence' && (
            <g>
              <ellipse cx="50" cy="85" rx="28" ry="7" fill="none" stroke="#00E5FF" strokeWidth="0.8" opacity="0.4" />
              {/* Glowing Spore Dots */}
              <circle cx="30" cy="83" r="1.5" fill="#00E5FF" filter="drop-shadow(0 0 2px #00E5FF)" />
              <circle cx="68" cy="84" r="1.8" fill="#18FFFF" filter="drop-shadow(0 0 2px #18FFFF)" />
              <circle cx="44" cy="87" r="1.2" fill="#76FF03" filter="drop-shadow(0 0 2px #76FF03)" />
              <circle cx="56" cy="86" r="1.4" fill="#00E5FF" filter="drop-shadow(0 0 2px #00E5FF)" />
            </g>
          )}

          {/* 5. Floating Sky Sanctuary: Lilac Rock Crust & Cloud Wisps */}
          {landId === 'sky-sanctuary' && (
            <g opacity="0.85">
              {/* Cloud Wisps under floating island */}
              <ellipse cx="36" cy="89" rx="8" ry="3" fill="#FFFFFF" opacity="0.4" />
              <ellipse cx="62" cy="89" rx="9" ry="3.5" fill="#FFFFFF" opacity="0.4" />
              {/* Golden trim runes */}
              <circle cx="28" cy="84" r="1.5" fill="#FFD700" />
              <circle cx="72" cy="84" r="1.5" fill="#FFD700" />
            </g>
          )}

          {/* 6. Snowy Winter Tundra: Snowdrift & Ice Crystals */}
          {landId === 'snowy-tundra' && (
            <g opacity="0.9">
              {/* Silvery Snow Drift */}
              <path d="M22 85 Q36 80 50 84 Q64 81 78 85 Z" fill="#FFFFFF" opacity="0.6" />
              {/* Ice Glints */}
              <polygon points="32,82 34,84 32,86 30,84" fill="#80DEEA" opacity="0.8" />
              <polygon points="66,82 68,84 66,86 64,84" fill="#80DEEA" opacity="0.8" />
            </g>
          )}

          {/* 7. Autumn Harvest Field: Fallen Crimson Leaves */}
          {landId === 'autumn-harvest' && (
            <g opacity="0.9">
              <ellipse cx="30" cy="84" rx="3.5" ry="1.6" fill="#D84315" transform="rotate(-15 30 84)" />
              <ellipse cx="66" cy="85" rx="3" ry="1.4" fill="#FFA000" transform="rotate(25 66 85)" />
              <ellipse cx="44" cy="86" rx="3" ry="1.5" fill="#FF7043" transform="rotate(5 44 86)" />
              <circle cx="70" cy="83" r="1.2" fill="#E65100" />
            </g>
          )}

          {/* 8. Sakura Petal Grove: Scattered Pink Blossom Petals */}
          {landId === 'sakura-grove' && (
            <g opacity="0.85">
              <ellipse cx="28" cy="84" rx="3.2" ry="1.6" fill="#F48FB1" transform="rotate(-20 28 84)" />
              <ellipse cx="68" cy="85" rx="3.5" ry="1.8" fill="#F8BBD0" transform="rotate(15 68 85)" />
              <ellipse cx="45" cy="86" rx="2.8" ry="1.4" fill="#F48FB1" transform="rotate(-5 45 86)" />
              <ellipse cx="58" cy="84" rx="2.5" ry="1.2" fill="#FF80AB" transform="rotate(30 58 84)" />
            </g>
          )}
        </>
      )}
    </g>
  );
};
