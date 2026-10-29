import React, { useState } from 'react';
import { FocusSession, LandStyle, TreeSpecies, FocusTag } from '../../../shared/types';
import { Clock, Calendar, X, Sparkles } from 'lucide-react';

interface IsometricForestGridProps {
  sessions: FocusSession[];
  land: LandStyle;
  trees: TreeSpecies[];
  tags: FocusTag[];
  size?: { width: number; height: number };
}

interface PlacedTree {
  session: FocusSession;
  species: TreeSpecies;
  tag?: FocusTag;
  row: number;
  col: number;
  depth: number;
  x: number;
  y: number;
}

export const IsometricForestGrid: React.FC<IsometricForestGridProps> = ({
  sessions,
  land,
  trees,
  tags,
  size = { width: 360, height: 260 },
}) => {
  const [selectedTree, setSelectedTree] = useState<PlacedTree | null>(null);

  // Determine grid size (4x4, 5x5, or 6x6)
  const totalCount = sessions.length;
  let gridSize = 4;
  if (totalCount > 25) {
    gridSize = 6;
  } else if (totalCount > 16) {
    gridSize = 5;
  }

  const maxTiles = gridSize * gridSize;
  const visibleSessions = sessions.slice(0, maxTiles);
  const overflowCount = Math.max(0, sessions.length - maxTiles);

  // Isometric projection constants
  const centerOffsetX = size.width / 2;
  const topOffsetY = 55;
  const tileWidth = 44;
  const tileHeight = 22;

  // Map sessions onto grid coordinates and calculate painter's algorithm depth
  const placedTrees: PlacedTree[] = visibleSessions.map((session, idx) => {
    const row = Math.floor(idx / gridSize);
    const col = idx % gridSize;
    const depth = row + col;

    const x = centerOffsetX + (col - row) * (tileWidth / 2);
    const y = topOffsetY + (col + row) * (tileHeight / 2);

    const species = trees.find((t) => t.id === session.treeSpeciesId) || trees[0];
    const tag = tags.find((t) => t.id === session.tagId);

    return {
      session,
      species,
      tag,
      row,
      col,
      depth,
      x,
      y,
    };
  });

  // Painter's algorithm: sort ascending by depth (row + col)
  placedTrees.sort((a, b) => a.depth - b.depth);

  // Island base geometry
  const halfGrid = (gridSize - 1) / 2;
  const apexTopY = topOffsetY - 12;
  const apexRightX = centerOffsetX + (gridSize * tileWidth) / 2;
  const apexRightY = topOffsetY + (gridSize * tileHeight) / 2 - 12;
  const apexBottomY = topOffsetY + gridSize * tileHeight - 12;
  const apexLeftX = centerOffsetX - (gridSize * tileWidth) / 2;
  const apexLeftY = apexRightY;

  return (
    <div
      style={{
        position: 'relative',
        width: `${size.width}px`,
        height: `${size.height}px`,
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <svg
        width={size.width}
        height={size.height}
        viewBox={`0 0 ${size.width} ${size.height}`}
        style={{ overflow: 'visible', userSelect: 'none' }}
      >
        <defs>
          <filter id="tileDropShadow" x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="0" dy="8" stdDeviation="6" floodColor="#000000" floodOpacity="0.4" />
          </filter>
        </defs>

        {/* 1. Isometric Island Extruded Base Platform */}
        <g filter="url(#tileDropShadow)">
          {/* Left Extrusion Wall */}
          <polygon
            points={`${apexLeftX},${apexLeftY} ${centerOffsetX},${apexBottomY} ${centerOffsetX},${apexBottomY + 22} ${apexLeftX},${apexLeftY + 22}`}
            fill={land.borderColor}
            opacity="0.85"
          />
          {/* Right Extrusion Wall */}
          <polygon
            points={`${centerOffsetX},${apexBottomY} ${apexRightX},${apexRightY} ${apexRightX},${apexRightY + 22} ${centerOffsetX},${apexBottomY + 22}`}
            fill={land.borderColor}
            opacity="0.95"
          />
          {/* Top Diamond Island Surface */}
          <polygon
            points={`${centerOffsetX},${apexTopY} ${apexRightX},${apexRightY} ${centerOffsetX},${apexBottomY} ${apexLeftX},${apexLeftY}`}
            fill={land.groundColor}
            stroke={land.borderColor}
            strokeWidth="2"
          />
        </g>

        {/* 2. Grid Tile Grid Lines */}
        <g opacity="0.18">
          {Array.from({ length: gridSize }).map((_, r) =>
            Array.from({ length: gridSize }).map((_, c) => {
              const tx = centerOffsetX + (c - r) * (tileWidth / 2);
              const ty = topOffsetY + (c + r) * (tileHeight / 2);
              return (
                <polygon
                  key={`tile-${r}-${c}`}
                  points={`${tx},${ty - tileHeight / 2} ${tx + tileWidth / 2},${ty} ${tx},${ty + tileHeight / 2} ${tx - tileWidth / 2},${ty}`}
                  fill="none"
                  stroke="#FFFFFF"
                  strokeWidth="0.8"
                />
              );
            }),
          )}
        </g>

        {/* 3. Empty Soil Mound when no trees planted in period */}
        {placedTrees.length === 0 && (
          <g>
            <ellipse cx={centerOffsetX} cy={apexRightY - 5} rx="24" ry="10" fill="#5D4037" opacity="0.6" />
            <text
              x={centerOffsetX}
              y={apexRightY}
              textAnchor="middle"
              fill="#FFFFFF"
              fontSize="11"
              fontWeight="700"
              opacity="0.8"
            >
              Quiet Garden
            </text>
          </g>
        )}

        {/* 4. Planted Trees (Sorted top-to-bottom for correct depth overlap) */}
        {placedTrees.map((item) => {
          const isSelected = selectedTree?.session.id === item.session.id;
          const isWithered = item.session.status === 'withered';
          const primaryColor = item.species.colors.primary;
          const secondaryColor = item.species.colors.secondary;
          const accentColor = item.species.colors.accent;

          return (
            <g
              key={item.session.id}
              onClick={() => setSelectedTree(item)}
              style={{ cursor: 'pointer' }}
              transform={`translate(${item.x}, ${item.y})`}
            >
              {/* Highlight Ring on Click */}
              {isSelected && (
                <ellipse cx="0" cy="0" rx="16" ry="8" fill="none" stroke="#FFD700" strokeWidth="2" />
              )}

              {/* Tree Base Shadow */}
              <ellipse cx="0" cy="1" rx="8" ry="3.5" fill="#000000" opacity="0.3" />

              {/* Tree Sprite SVG */}
              {isWithered ? (
                // Withered Tree Sprite
                <g transform="translate(0, -18)">
                  <path d="M-1 18 L-1 6 Q0 1 -3 -6" stroke="#4E342E" strokeWidth="2.5" fill="none" strokeLinecap="round" />
                  <path d="M-1 9 Q-6 6 -8 8" stroke="#4E342E" strokeWidth="1.5" fill="none" strokeLinecap="round" />
                  <path d="M-1 4 Q4 1 7 4" stroke="#4E342E" strokeWidth="1.5" fill="none" strokeLinecap="round" />
                </g>
              ) : (
                // Healthy Bloomed Tree Sprite
                <g transform="translate(0, -22)">
                  {/* Trunk */}
                  <rect x="-1.5" y="14" width="3" height="8" rx="1" fill={accentColor} />

                  {/* Foliage Silhouette based on category/variant */}
                  {item.species.svgVariant === 'conifer' ||
                  item.species.svgVariant === 'pine' ||
                  item.species.svgVariant === 'frost' ||
                  item.species.svgVariant === 'festive' ? (
                    <g>
                      <polygon points="0,0 -9,12 9,12" fill={primaryColor} />
                      <polygon points="0,6 -11,16 11,16" fill={secondaryColor} />
                    </g>
                  ) : item.species.svgVariant === 'crystal' ? (
                    <polygon points="0,-2 7,12 0,16 -7,12" fill={secondaryColor} stroke={primaryColor} strokeWidth="1" />
                  ) : (
                    <g>
                      <circle cx="0" cy="6" r="9" fill={primaryColor} />
                      <circle cx="-4" cy="8" r="6" fill={secondaryColor} />
                      <circle cx="4" cy="8" r="6" fill={primaryColor} />
                      <circle cx="0" cy="1" r="5" fill={secondaryColor} />
                    </g>
                  )}
                </g>
              )}
            </g>
          );
        })}
      </svg>

      {/* Overflow Indicator Badge */}
      {overflowCount > 0 && (
        <div
          style={{
            position: 'absolute',
            bottom: '6px',
            right: '12px',
            background: 'rgba(0, 0, 0, 0.65)',
            backdropFilter: 'blur(4px)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            borderRadius: '12px',
            padding: '3px 8px',
            color: '#A5D6A7',
            fontSize: '10px',
            fontWeight: 800,
          }}
        >
          +{overflowCount} more trees in period
        </div>
      )}

      {/* Floating Selected Tree Details Pill */}
      {selectedTree && (
        <div
          style={{
            position: 'absolute',
            bottom: '6px',
            left: '12px',
            background: 'rgba(15, 30, 20, 0.9)',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(129, 199, 132, 0.4)',
            borderRadius: '14px',
            padding: '8px 12px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
            zIndex: 30,
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '12px', fontWeight: 800, color: '#FFFFFF' }}>
                {selectedTree.species.name}
              </span>
              <span
                style={{
                  fontSize: '9px',
                  fontWeight: 700,
                  color: selectedTree.tag?.color || '#81C784',
                  background: 'rgba(255, 255, 255, 0.08)',
                  padding: '1px 6px',
                  borderRadius: '6px',
                }}
              >
                {selectedTree.tag?.name || 'Focus'}
              </span>
            </div>
            <div style={{ fontSize: '10px', color: '#C8E6C9', marginTop: '2px', display: 'flex', gap: '8px' }}>
              <span>{Math.floor(selectedTree.session.durationSeconds / 60)}m focused</span>
              <span>&bull;</span>
              <span>{new Date(selectedTree.session.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
          </div>

          <button
            onClick={() => setSelectedTree(null)}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#A5D6A7',
              cursor: 'pointer',
              padding: '2px',
            }}
          >
            <X size={14} />
          </button>
        </div>
      )}
    </div>
  );
};
