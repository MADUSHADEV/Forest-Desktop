import React from 'react';
import { TreeSpecies, LandStyle, TimerState } from '../../../shared/types';
import { LandPatchSvg } from './LandPatchSvg';

interface TreeStageSvgProps {
  species?: TreeSpecies;
  land?: LandStyle;
  progress: number; // 0 to 1
  status: TimerState;
  size?: number;
}

export const TreeStageSvg: React.FC<TreeStageSvgProps> = ({
  species,
  land,
  progress,
  status,
  size = 160,
}) => {
  const primaryColor = species?.colors.primary || '#2E7D32';
  const secondaryColor = species?.colors.secondary || '#4CAF50';
  const accentColor = species?.colors.accent || '#5D4037';
  const variant = species?.svgVariant || 'conifer';

  // Determine Growth Stage
  const isWithered = status === 'withered';
  const isCompleted = status === 'completed' || progress >= 1.0;
  const isBreathing = status === 'focusing' || status === 'paused';

  let stage = 1;
  if (isCompleted) {
    stage = 5;
  } else if (progress >= 0.7) {
    stage = 4;
  } else if (progress >= 0.4) {
    stage = 3;
  } else if (progress >= 0.2) {
    stage = 2;
  } else {
    stage = 1;
  }

  return (
    <div
      style={{
        width: `${size}px`,
        height: `${size}px`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        userSelect: 'none',
      }}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        style={{
          filter: isWithered
            ? 'grayscale(85%) drop-shadow(0 4px 10px rgba(0,0,0,0.5))'
            : 'drop-shadow(0 8px 18px rgba(0,0,0,0.3))',
          transformOrigin: '50% 85%',
          animation:
            isBreathing && !isWithered
              ? 'forestBreath 3.5s ease-in-out infinite'
              : 'none',
          transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        <defs>
          <style>{`
            @keyframes forestBreath {
              0%, 100% { transform: scale(1); }
              50% { transform: scale(1.025); }
            }
            @keyframes swaySoft {
              0%, 100% { transform: rotate(0deg); }
              50% { transform: rotate(1.4deg); }
            }
            @keyframes sparkleGlow {
              0%, 100% { opacity: 0.35; transform: scale(0.85); }
              50% { opacity: 1; transform: scale(1.15); }
            }
          `}</style>
        </defs>

        {/* 1. Underlying Land Turf Patch (Lush Meadow, Zen Sand, Snowy, etc.) */}
        <LandPatchSvg land={land} isWithered={isWithered} />

        {/* --- WITHERED STATE --- */}
        {isWithered && (
          <g transform="translate(0, 0)">
            {/* Drooping Bare Trunk */}
            <path
              d="M48 85 L49 68 Q50 56 46 45 Q44 38 41 32"
              stroke="#5D4037"
              strokeWidth="5"
              strokeLinecap="round"
              fill="none"
            />
            {/* Bare Withered Branches */}
            <path
              d="M48 62 Q42 58 35 60"
              stroke="#5D4037"
              strokeWidth="3"
              strokeLinecap="round"
              fill="none"
            />
            <path
              d="M49 52 Q56 48 64 54"
              stroke="#5D4037"
              strokeWidth="3"
              strokeLinecap="round"
              fill="none"
            />
            <path
              d="M45 42 Q38 38 34 43"
              stroke="#5D4037"
              strokeWidth="2.5"
              strokeLinecap="round"
              fill="none"
            />
            {/* Fallen Dry Leaves */}
            <ellipse cx="32" cy="84" rx="4" ry="1.5" fill="#8D6E63" transform="rotate(-15 32 84)" />
            <ellipse cx="66" cy="85" rx="3.5" ry="1.5" fill="#795548" transform="rotate(20 66 85)" />
            <ellipse cx="44" cy="86" rx="4" ry="1.5" fill="#6D4C41" transform="rotate(5 44 86)" />
          </g>
        )}

        {/* --- STAGE 1: Seed & Tiny Shoot (0.00 - 0.19) --- */}
        {!isWithered && stage === 1 && (
          <g>
            <ellipse
              cx="50"
              cy="81"
              rx="5"
              ry="3"
              fill="#FFD54F"
              opacity="0.9"
              filter="drop-shadow(0 0 3px #FFD54F)"
            />
            <path
              d="M50 81 Q52 76 54 74"
              stroke="#81C784"
              strokeWidth="2.2"
              strokeLinecap="round"
              fill="none"
            />
            <circle cx="54" cy="74" r="1.8" fill="#81C784" />
          </g>
        )}

        {/* --- STAGE 2: Young Sprout (0.20 - 0.39) --- */}
        {!isWithered && stage === 2 && (
          <g>
            <path
              d="M50 84 Q50 72 49 64"
              stroke="#4CAF50"
              strokeWidth="3.5"
              strokeLinecap="round"
              fill="none"
            />
            <path d="M49 66 Q40 60 41 68 Q46 72 49 68" fill="#81C784" />
            <path d="M49 64 Q58 56 60 64 Q56 69 49 66" fill="#A5D6A7" />
          </g>
        )}

        {/* --- STAGE 3: Growing Sapling (0.40 - 0.69) --- */}
        {!isWithered && stage === 3 && (
          <g>
            <path d="M48 85 L48 55 Q50 52 52 55 L52 85 Z" fill={accentColor} />
            <circle cx="50" cy="46" r="14" fill={primaryColor} />
            <circle cx="43" cy="50" r="10" fill={secondaryColor} opacity="0.9" />
            <circle cx="57" cy="49" r="10" fill={primaryColor} />
            <circle cx="50" cy="38" r="9" fill={secondaryColor} />
          </g>
        )}

        {/* --- STAGE 4 & 5: Mature Tree & Full Bloom (0.70 - 1.00) --- */}
        {!isWithered && (stage === 4 || stage === 5) && (
          <g style={{ animation: stage === 5 ? 'swaySoft 4s ease-in-out infinite' : 'none', transformOrigin: '50% 85%' }}>
            {/* Trunk */}
            {variant !== 'bamboo' && variant !== 'palm' && (
              <path
                d={
                  variant === 'baobab'
                    ? 'M42 85 L43 50 Q50 48 57 50 L58 85 Z' // Wide iconic baobab trunk
                    : 'M46 85 L47 52 Q50 50 53 52 L54 85 Z'
                }
                fill={accentColor}
              />
            )}

            {/* VARIANT SILHOUETTES: */}

            {/* 1. Conifer / Cedar */}
            {variant === 'conifer' && (
              <g>
                <path d="M50 40 L26 72 Q50 75 74 72 Z" fill={primaryColor} />
                <path d="M50 28 L30 54 Q50 57 70 54 Z" fill={secondaryColor} />
                <path d="M50 16 L36 38 Q50 40 64 38 Z" fill={primaryColor} />
                <circle cx="50" cy="15" r="3" fill={secondaryColor} />
              </g>
            )}

            {/* 2. Pine */}
            {variant === 'pine' && (
              <g>
                <path d="M50 36 L22 68 Q50 72 78 68 Z" fill={primaryColor} />
                <path d="M50 24 L28 50 Q50 53 72 50 Z" fill={secondaryColor} />
                <path d="M50 14 L34 34 Q50 36 66 34 Z" fill={primaryColor} />
                <circle cx="50" cy="13" r="2.5" fill={secondaryColor} />
              </g>
            )}

            {/* 3. Frost Pine */}
            {variant === 'frost' && (
              <g>
                <path d="M50 36 L24 68 Q50 72 76 68 Z" fill={primaryColor} />
                <path d="M50 24 L28 50 Q50 53 72 50 Z" fill={secondaryColor} />
                <path d="M50 14 L34 34 Q50 36 66 34 Z" fill={primaryColor} />
                {/* Silvery Snow Trim */}
                <path d="M24 68 Q50 63 76 68" stroke="#ECEFF1" strokeWidth="2.5" fill="none" />
                <path d="M28 50 Q50 46 72 50" stroke="#ECEFF1" strokeWidth="2" fill="none" />
                <polygon points="50,11 52,14 50,16 48,14" fill="#E0F7FA" />
              </g>
            )}

            {/* 4. Festive Starlight Fir */}
            {variant === 'festive' && (
              <g>
                <path d="M50 38 L24 70 Q50 73 76 70 Z" fill={primaryColor} />
                <path d="M50 26 L28 52 Q50 55 72 52 Z" fill={secondaryColor} />
                <path d="M50 16 L34 36 Q50 38 66 36 Z" fill={primaryColor} />
                {/* Colorful Baubles */}
                <circle cx="34" cy="62" r="2.5" fill="#E53935" />
                <circle cx="66" cy="62" r="2.5" fill="#FDD835" />
                <circle cx="44" cy="46" r="2.5" fill="#00BCD4" />
                <circle cx="56" cy="46" r="2.5" fill="#E53935" />
                {/* Golden Tree Topper Star */}
                <polygon points="50,9 52,14 57,14 53,17 55,22 50,19 45,22 47,17 43,14 48,14" fill="#FFD700" />
              </g>
            )}

            {/* 5. Emerald Bamboo */}
            {variant === 'bamboo' && (
              <g>
                {/* Stalk 1 */}
                <rect x="42" y="30" width="4" height="55" rx="1.5" fill={primaryColor} />
                <line x1="42" y1="46" x2="46" y2="46" stroke="#1B5E20" strokeWidth="1" />
                <line x1="42" y1="62" x2="46" y2="62" stroke="#1B5E20" strokeWidth="1" />
                {/* Stalk 2 */}
                <rect x="52" y="24" width="4.5" height="61" rx="1.5" fill={secondaryColor} />
                <line x1="52" y1="42" x2="56.5" y2="42" stroke="#004D40" strokeWidth="1" />
                <line x1="52" y1="60" x2="56.5" y2="60" stroke="#004D40" strokeWidth="1" />
                {/* Slender Bamboo Leaves */}
                <ellipse cx="38" cy="38" rx="7" ry="2" fill={secondaryColor} transform="rotate(-30 38 38)" />
                <ellipse cx="48" cy="32" rx="8" ry="2" fill={primaryColor} transform="rotate(-20 48 32)" />
                <ellipse cx="62" cy="28" rx="8" ry="2" fill={secondaryColor} transform="rotate(25 62 28)" />
                <ellipse cx="60" cy="46" rx="7" ry="2" fill={primaryColor} transform="rotate(15 60 46)" />
              </g>
            )}

            {/* 6. Oak Bush */}
            {variant === 'bush' && (
              <g>
                <circle cx="50" cy="48" r="22" fill={primaryColor} />
                <circle cx="36" cy="52" r="16" fill={secondaryColor} opacity="0.95" />
                <circle cx="64" cy="52" r="16" fill={primaryColor} />
                <circle cx="42" cy="36" r="15" fill={secondaryColor} />
                <circle cx="58" cy="36" r="15" fill={primaryColor} />
                <circle cx="50" cy="28" r="13" fill={secondaryColor} />
              </g>
            )}

            {/* 7. Sunflower */}
            {variant === 'flower' && (
              <g>
                {/* Tall green stalk */}
                <rect x="48" y="44" width="4" height="41" fill="#43A047" />
                {/* Golden Radial Petals */}
                <circle cx="50" cy="36" r="18" fill={primaryColor} />
                <circle cx="50" cy="36" r="15" fill={secondaryColor} />
                {/* Seeds Core */}
                <circle cx="50" cy="36" r="8" fill="#3E2723" />
                <circle cx="50" cy="36" r="5" fill="#5D4037" />
              </g>
            )}

            {/* 8. Lemon Tree */}
            {variant === 'fruit' && (
              <g>
                <circle cx="50" cy="44" r="22" fill={primaryColor} />
                <circle cx="36" cy="48" r="16" fill={secondaryColor} opacity="0.95" />
                <circle cx="64" cy="48" r="16" fill={primaryColor} />
                <circle cx="42" cy="32" r="15" fill={secondaryColor} />
                <circle cx="58" cy="32" r="15" fill={primaryColor} />
                <circle cx="50" cy="24" r="12" fill={secondaryColor} />
                {/* Yellow Lemons */}
                <circle cx="38" cy="46" r="3.5" fill="#FDD835" />
                <circle cx="62" cy="44" r="3.5" fill="#FDD835" />
                <circle cx="48" cy="36" r="3.5" fill="#FDD835" />
                <circle cx="54" cy="52" r="3" fill="#FDD835" />
              </g>
            )}

            {/* 9. Cherry Blossom (Sakura) */}
            {variant === 'sakura' && (
              <g>
                <circle cx="50" cy="42" r="22" fill={primaryColor} />
                <circle cx="35" cy="47" r="15" fill={secondaryColor} />
                <circle cx="65" cy="47" r="15" fill={primaryColor} />
                <circle cx="43" cy="30" r="14" fill={secondaryColor} />
                <circle cx="57" cy="30" r="14" fill={primaryColor} />
                <circle cx="50" cy="22" r="12" fill={secondaryColor} />
                {/* Blossoms */}
                <circle cx="48" cy="26" r="4" fill="#FFFFFF" opacity="0.75" />
                <circle cx="38" cy="42" r="3" fill="#FFFFFF" opacity="0.75" />
                <circle cx="62" cy="40" r="3.5" fill="#FFFFFF" opacity="0.75" />
              </g>
            )}

            {/* 10. Weeping Wisteria */}
            {variant === 'wisteria' && (
              <g>
                <ellipse cx="50" cy="34" rx="24" ry="14" fill={primaryColor} />
                {/* Hanging Floral Racemes */}
                <path d="M34 36 Q33 52 35 60 Q34 62 33 60" stroke={secondaryColor} strokeWidth="3" fill="none" strokeLinecap="round" />
                <path d="M42 38 Q41 54 43 64 Q42 66 41 64" stroke={primaryColor} strokeWidth="3.5" fill="none" strokeLinecap="round" />
                <path d="M50 38 Q49 56 51 68 Q50 70 49 68" stroke={secondaryColor} strokeWidth="4" fill="none" strokeLinecap="round" />
                <path d="M58 38 Q57 54 59 64 Q58 66 57 64" stroke={primaryColor} strokeWidth="3.5" fill="none" strokeLinecap="round" />
                <path d="M66 36 Q65 52 67 60 Q66 62 65 60" stroke={secondaryColor} strokeWidth="3" fill="none" strokeLinecap="round" />
              </g>
            )}

            {/* 11. Mystic Crystal Tree */}
            {variant === 'crystal' && (
              <g>
                <polygon points="50,10 64,36 50,44 36,36" fill={secondaryColor} />
                <polygon points="36,36 50,44 42,66 24,50" fill={primaryColor} />
                <polygon points="64,36 76,50 58,66 50,44" fill={primaryColor} />
                <polygon points="50,44 58,66 42,66" fill={secondaryColor} opacity="0.9" />
                <polygon points="50,10 54,26 50,30 46,26" fill="#E0F7FA" />
              </g>
            )}

            {/* 12. Golden Ginkgo */}
            {variant === 'ginkgo' && (
              <g>
                <circle cx="50" cy="42" r="22" fill={primaryColor} />
                <circle cx="36" cy="47" r="16" fill={secondaryColor} />
                <circle cx="64" cy="47" r="16" fill={primaryColor} />
                <circle cx="43" cy="30" r="14" fill={secondaryColor} />
                <circle cx="57" cy="30" r="14" fill={primaryColor} />
                {/* Fan Leaves Accent */}
                <ellipse cx="48" cy="26" rx="4" ry="2.5" fill="#FFF8E1" opacity="0.8" />
                <ellipse cx="60" cy="38" rx="4" ry="2.5" fill="#FFF8E1" opacity="0.8" />
              </g>
            )}

            {/* 13. Ancient Baobab */}
            {variant === 'baobab' && (
              <g>
                {/* Compact Rounded Crown */}
                <ellipse cx="50" cy="44" rx="26" ry="12" fill={primaryColor} />
                <circle cx="36" cy="42" r="12" fill={secondaryColor} />
                <circle cx="64" cy="42" r="12" fill={primaryColor} />
                <circle cx="50" cy="38" r="11" fill={secondaryColor} />
              </g>
            )}

            {/* 14. Celestial Starlight Banyan */}
            {variant === 'banyan' && (
              <g>
                {/* Sprawling Aerial Vines */}
                <path d="M40 50 Q36 68 34 85" stroke={accentColor} strokeWidth="2" fill="none" />
                <path d="M60 50 Q64 68 66 85" stroke={accentColor} strokeWidth="2" fill="none" />
                {/* Deep Indigo/Cyan Canopy */}
                <circle cx="50" cy="38" r="24" fill={primaryColor} />
                <circle cx="34" cy="44" r="16" fill={secondaryColor} opacity="0.9" />
                <circle cx="66" cy="44" r="16" fill={primaryColor} />
                <circle cx="50" cy="24" r="14" fill={secondaryColor} />
                {/* Glowing celestial filaments */}
                <circle cx="44" cy="32" r="2" fill="#E8EAF6" />
                <circle cx="56" cy="32" r="2" fill="#E8EAF6" />
                <circle cx="50" cy="42" r="2" fill="#E8EAF6" />
              </g>
            )}

            {/* 15. Autumn Crimson Maple */}
            {variant === 'maple' && (
              <g>
                <circle cx="50" cy="42" r="22" fill={primaryColor} />
                <circle cx="35" cy="46" r="15" fill={secondaryColor} />
                <circle cx="65" cy="46" r="15" fill={primaryColor} />
                <circle cx="43" cy="28" r="14" fill={secondaryColor} />
                <circle cx="57" cy="28" r="14" fill={primaryColor} />
                <polygon points="50,14 54,22 50,26 46,22" fill="#FF7043" />
              </g>
            )}

            {/* 16. Halloween Lantern Tree */}
            {variant === 'pumpkin' && (
              <g>
                <circle cx="50" cy="42" r="20" fill={primaryColor} />
                <circle cx="37" cy="46" r="14" fill={secondaryColor} />
                <circle cx="63" cy="46" r="14" fill={secondaryColor} />
                {/* Glowing Jack-o-lantern */}
                <ellipse cx="50" cy="54" rx="7" ry="5.5" fill="#FF6D00" />
                <circle cx="47" cy="53" r="1" fill="#FFD54F" />
                <circle cx="53" cy="53" r="1" fill="#FFD54F" />
                <polygon points="50,55 51,57 49,57" fill="#212121" />
              </g>
            )}

            {/* 17. Spring Pastel Tulip */}
            {variant === 'tulip' && (
              <g>
                <rect x="48" y="44" width="4" height="41" fill="#43A047" />
                {/* Tulip Cup Petals */}
                <path d="M38 34 Q36 18 50 16 Q64 18 62 34 Q50 42 38 34 Z" fill={primaryColor} />
                <path d="M42 34 Q40 22 50 20 Q60 22 58 34 Q50 40 42 34 Z" fill={secondaryColor} />
              </g>
            )}

            {/* 18. Summer Coconut Palm */}
            {variant === 'palm' && (
              <g>
                {/* Slender Curved Trunk */}
                <path d="M48 85 Q46 60 52 38" stroke={accentColor} strokeWidth="5" fill="none" strokeLinecap="round" />
                {/* Coconuts */}
                <circle cx="50" cy="38" r="3" fill="#4E342E" />
                <circle cx="54" cy="39" r="3" fill="#3E2723" />
                {/* Arching Palm Fronds */}
                <path d="M52 36 Q32 26 22 36" stroke={primaryColor} strokeWidth="3" fill="none" strokeLinecap="round" />
                <path d="M52 36 Q40 16 34 20" stroke={secondaryColor} strokeWidth="3" fill="none" strokeLinecap="round" />
                <path d="M52 36 Q54 12 56 18" stroke={primaryColor} strokeWidth="3" fill="none" strokeLinecap="round" />
                <path d="M52 36 Q68 18 76 26" stroke={secondaryColor} strokeWidth="3" fill="none" strokeLinecap="round" />
                <path d="M52 36 Q74 32 80 44" stroke={primaryColor} strokeWidth="3" fill="none" strokeLinecap="round" />
              </g>
            )}

            {/* Stage 5 Full Bloom Sparkles */}
            {stage === 5 && (
              <g style={{ animation: 'sparkleGlow 2.5s ease-in-out infinite', transformOrigin: '50% 30%' }}>
                <circle cx="28" cy="22" r="2.5" fill="#FFD700" />
                <circle cx="72" cy="20" r="2.5" fill="#FFD700" />
                <circle cx="50" cy="6" r="3" fill="#FFD700" />
                <polygon points="50,2 52,7 57,7 53,10 55,15 50,12 45,15 47,10 43,7 48,7" fill="#FFD700" />
              </g>
            )}
          </g>
        )}
      </svg>
    </div>
  );
};
