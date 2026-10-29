import React, { useState } from 'react';
import {
  ShoppingBag,
  Coins,
  Check,
  Sparkles,
  Trees,
  MapPin,
  Lock,
  ChevronRight,
  Info,
  Sliders,
} from 'lucide-react';
import { useForestSelector, forestStore } from '../../state/forestStore';
import { TreeSpecies, LandStyle, TreeCategory } from '../../../shared/types';
import { TreeStageSvg } from '../../components/trees/TreeStageSvg';
import { LandPatchSvg } from '../../components/trees/LandPatchSvg';

export const StoreView: React.FC = () => {
  const trees = useForestSelector((s) => s.trees);
  const lands = useForestSelector((s) => s.lands);
  const settings = useForestSelector((s) => s.settings);

  const [activeTab, setActiveTab] = useState<'trees' | 'lands'>('trees');
  const [selectedCategory, setSelectedCategory] = useState<TreeCategory | 'all'>('all');
  const [selectedTreeId, setSelectedTreeId] = useState<string>(settings.selectedTreeId);
  const [selectedLandId, setSelectedLandId] = useState<string>(settings.selectedLandId);
  const [previewStage, setPreviewStage] = useState<number>(5); // 1 to 5 for inspector scrubber
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const activeTree = trees.find((t) => t.id === selectedTreeId) || trees[0];
  const activeLand = lands.find((l) => l.id === selectedLandId) || lands[0];

  // Category counts
  const unlockedTreesCount = trees.filter((t) => t.unlocked).length;
  const unlockedLandsCount = lands.filter((l) => l.unlocked).length;

  const filteredTrees =
    selectedCategory === 'all' ? trees : trees.filter((t) => t.category === selectedCategory);
  const filteredLands =
    selectedCategory === 'all' ? lands : lands.filter((l) => l.category === selectedCategory);

  const handleEquipTree = async (tree: TreeSpecies) => {
    await forestStore.updateSettings({ selectedTreeId: tree.id });
    showToast(`Equipped ${tree.name}! Ready to plant.`);
  };

  const handleEquipLand = async (land: LandStyle) => {
    await forestStore.updateSettings({ selectedLandId: land.id });
    showToast(`Applied ${land.name} theme!`);
  };

  const handleUnlockTree = async (tree: TreeSpecies) => {
    if (settings.coins < tree.price) {
      showToast(`Not enough coins! Need ${tree.price - settings.coins} more.`);
      return;
    }
    const success = await forestStore.unlockItem('tree', tree.id);
    if (success) {
      showToast(`Unlocked ${tree.name}! 🎉`);
      // Auto-equip upon unlock
      await forestStore.updateSettings({ selectedTreeId: tree.id });
    }
  };

  const handleUnlockLand = async (land: LandStyle) => {
    if (settings.coins < land.price) {
      showToast(`Not enough coins! Need ${land.price - settings.coins} more.`);
      return;
    }
    const success = await forestStore.unlockItem('land', land.id);
    if (success) {
      showToast(`Unlocked ${land.name}! 🎉`);
      await forestStore.updateSettings({ selectedLandId: land.id });
    }
  };

  // Convert inspector scrubber stage (1 to 5) to progress fraction
  const stageToProgress = (st: number) => {
    if (st === 1) return 0.1;
    if (st === 2) return 0.3;
    if (st === 3) return 0.55;
    if (st === 4) return 0.85;
    return 1.0;
  };

  return (
    <div
      style={{
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
        overflowY: 'auto',
        userSelect: 'none',
      }}
    >
      {/* Top Header & Coin Counter */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ShoppingBag color="#81C784" size={20} />
          <h2 style={{ fontSize: '17px', fontWeight: 800, color: '#FFFFFF' }}>Store & Nursery</h2>
        </div>

        {/* Coin Badge */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: 'rgba(255, 215, 0, 0.15)',
            border: '1px solid rgba(255, 215, 0, 0.35)',
            padding: '4px 12px',
            borderRadius: '16px',
            color: '#FFD700',
            fontSize: '13px',
            fontWeight: 800,
          }}
        >
          <Coins size={15} />
          <span>{settings.coins}</span>
        </div>
      </div>

      {toastMessage && (
        <div
          style={{
            background: 'rgba(46, 125, 50, 0.35)',
            border: '1px solid rgba(129, 199, 132, 0.45)',
            color: '#A5D6A7',
            padding: '8px 12px',
            borderRadius: '12px',
            fontSize: '12px',
            fontWeight: 700,
            textAlign: 'center',
            boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
          }}
        >
          {toastMessage}
        </div>
      )}

      {/* Primary Tab Switcher (Trees vs Lands) */}
      <div
        style={{
          display: 'flex',
          background: 'rgba(0, 0, 0, 0.3)',
          padding: '4px',
          borderRadius: '14px',
          border: '1px solid rgba(255, 255, 255, 0.08)',
        }}
      >
        <button
          onClick={() => setActiveTab('trees')}
          style={{
            flex: 1,
            padding: '8px',
            border: 'none',
            borderRadius: '10px',
            background: activeTab === 'trees' ? '#2E7D32' : 'transparent',
            color: activeTab === 'trees' ? '#FFFFFF' : '#A5D6A7',
            fontSize: '12px',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            cursor: 'pointer',
          }}
        >
          <Trees size={15} />
          <span>Species ({unlockedTreesCount}/{trees.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('lands')}
          style={{
            flex: 1,
            padding: '8px',
            border: 'none',
            borderRadius: '10px',
            background: activeTab === 'lands' ? '#2E7D32' : 'transparent',
            color: activeTab === 'lands' ? '#FFFFFF' : '#A5D6A7',
            fontSize: '12px',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            cursor: 'pointer',
          }}
        >
          <MapPin size={15} />
          <span>Land Styles ({unlockedLandsCount}/{lands.length})</span>
        </button>
      </div>

      {/* --- HERO SHOWCASE / GROWTH INSPECTOR STAGE --- */}
      <section
        style={{
          background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.08) 0%, rgba(0, 0, 0, 0.25) 100%)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '20px',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '12px',
          position: 'relative',
        }}
      >
        {activeTab === 'trees' ? (
          <>
            {/* Tree Stage Display */}
            <div style={{ position: 'relative', width: '150px', height: '140px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <TreeStageSvg
                species={activeTree}
                land={lands.find((l) => l.id === settings.selectedLandId)}
                progress={stageToProgress(previewStage)}
                status={previewStage === 5 ? 'completed' : 'focusing'}
                size={140}
              />
            </div>

            {/* Growth Stage Scrubber */}
            <div
              style={{
                width: '100%',
                maxWidth: '280px',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
                background: 'rgba(0, 0, 0, 0.25)',
                padding: '8px 12px',
                borderRadius: '12px',
                border: '1px solid rgba(255, 255, 255, 0.06)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '10px', color: '#81C784', fontWeight: 700, textTransform: 'uppercase' }}>
                  Growth Stage Inspector
                </span>
                <span style={{ fontSize: '11px', color: '#FFFFFF', fontWeight: 800 }}>
                  Stage {previewStage} / 5
                </span>
              </div>

              <div style={{ display: 'flex', gap: '6px' }}>
                {[1, 2, 3, 4, 5].map((st) => (
                  <button
                    key={st}
                    onClick={() => setPreviewStage(st)}
                    style={{
                      flex: 1,
                      padding: '4px 0',
                      borderRadius: '6px',
                      border: '1px solid',
                      borderColor: previewStage === st ? '#81C784' : 'rgba(255, 255, 255, 0.1)',
                      background: previewStage === st ? 'rgba(76, 175, 80, 0.4)' : 'rgba(0, 0, 0, 0.2)',
                      color: previewStage === st ? '#FFFFFF' : '#A5D6A7',
                      fontSize: '10px',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    St.{st}
                  </button>
                ))}
              </div>
            </div>

            {/* Tree Info & Details */}
            <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#FFFFFF' }}>{activeTree.name}</h3>
                <span
                  style={{
                    fontSize: '9px',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    color:
                      activeTree.category === 'plus'
                        ? '#CE93D8'
                        : activeTree.category === 'seasonal'
                        ? '#FFB74D'
                        : '#81C784',
                    background: 'rgba(255, 255, 255, 0.08)',
                    padding: '2px 6px',
                    borderRadius: '6px',
                  }}
                >
                  {activeTree.category}
                </span>
              </div>
              <p style={{ fontSize: '11px', color: '#C8E6C9', maxWidth: '280px', lineHeight: 1.4 }}>
                {activeTree.description}
              </p>
            </div>

            {/* Tree Showcase Action Button */}
            <div style={{ width: '100%', maxWidth: '260px', marginTop: '2px' }}>
              {activeTree.unlocked ? (
                settings.selectedTreeId === activeTree.id ? (
                  <div
                    style={{
                      width: '100%',
                      padding: '10px',
                      borderRadius: '20px',
                      background: 'rgba(76, 175, 80, 0.25)',
                      border: '1px solid #81C784',
                      color: '#81C784',
                      fontSize: '12px',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                    }}
                  >
                    <Check size={14} />
                    <span>Currently Active In Garden</span>
                  </div>
                ) : (
                  <button
                    onClick={() => handleEquipTree(activeTree)}
                    style={{
                      width: '100%',
                      padding: '10px',
                      borderRadius: '20px',
                      background: '#2E7D32',
                      border: 'none',
                      color: '#FFFFFF',
                      fontSize: '12px',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    Equip / Plant Now
                  </button>
                )
              ) : (
                <button
                  onClick={() => handleUnlockTree(activeTree)}
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '20px',
                    background: 'linear-gradient(135deg, #F57F17 0%, #E65100 100%)',
                    border: 'none',
                    color: '#FFFFFF',
                    fontSize: '13px',
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    boxShadow: '0 4px 14px rgba(230, 81, 0, 0.4)',
                  }}
                >
                  <Coins size={14} />
                  <span>Unlock for {activeTree.price} Coins</span>
                </button>
              )}
            </div>
          </>
        ) : (
          <>
            {/* Land Preview Stage */}
            <div style={{ width: '180px', height: '110px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="180" height="100" viewBox="0 0 100 100">
                <LandPatchSvg land={activeLand} isWithered={false} />
              </svg>
            </div>

            <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#FFFFFF' }}>{activeLand.name}</h3>
                <span
                  style={{
                    fontSize: '9px',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    color:
                      activeLand.category === 'plus'
                        ? '#CE93D8'
                        : activeLand.category === 'seasonal'
                        ? '#FFB74D'
                        : '#81C784',
                    background: 'rgba(255, 255, 255, 0.08)',
                    padding: '2px 6px',
                    borderRadius: '6px',
                  }}
                >
                  {activeLand.category}
                </span>
              </div>
              <p style={{ fontSize: '11px', color: '#C8E6C9' }}>
                Custom isometric garden turf with dynamic background ambiance.
              </p>
            </div>

            {/* Land Showcase Action Button */}
            <div style={{ width: '100%', maxWidth: '260px', marginTop: '4px' }}>
              {activeLand.unlocked ? (
                settings.selectedLandId === activeLand.id ? (
                  <div
                    style={{
                      width: '100%',
                      padding: '10px',
                      borderRadius: '20px',
                      background: 'rgba(76, 175, 80, 0.25)',
                      border: '1px solid #81C784',
                      color: '#81C784',
                      fontSize: '12px',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                    }}
                  >
                    <Check size={14} />
                    <span>Currently Active Theme</span>
                  </div>
                ) : (
                  <button
                    onClick={() => handleEquipLand(activeLand)}
                    style={{
                      width: '100%',
                      padding: '10px',
                      borderRadius: '20px',
                      background: '#2E7D32',
                      border: 'none',
                      color: '#FFFFFF',
                      fontSize: '12px',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    Apply Theme
                  </button>
                )
              ) : (
                <button
                  onClick={() => handleUnlockLand(activeLand)}
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '20px',
                    background: 'linear-gradient(135deg, #F57F17 0%, #E65100 100%)',
                    border: 'none',
                    color: '#FFFFFF',
                    fontSize: '13px',
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    boxShadow: '0 4px 14px rgba(230, 81, 0, 0.4)',
                  }}
                >
                  <Coins size={14} />
                  <span>Unlock for {activeLand.price} Coins</span>
                </button>
              )}
            </div>
          </>
        )}
      </section>

      {/* Category Filter Pills */}
      <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '2px' }}>
        {(['all', 'classic', 'plus', 'seasonal'] as const).map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            style={{
              padding: '5px 12px',
              borderRadius: '14px',
              border: '1px solid',
              borderColor: selectedCategory === cat ? '#81C784' : 'rgba(255, 255, 255, 0.1)',
              background: selectedCategory === cat ? 'rgba(76, 175, 80, 0.3)' : 'rgba(0, 0, 0, 0.25)',
              color: selectedCategory === cat ? '#FFFFFF' : '#A5D6A7',
              fontSize: '11px',
              fontWeight: 700,
              textTransform: 'capitalize',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            {cat === 'plus' ? 'Plus ✨' : cat === 'seasonal' ? 'Seasonal 🍂' : cat}
          </button>
        ))}
      </div>

      {/* --- 2-COLUMN MOBILE GRID OF CATALOG CARDS --- */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', paddingBottom: '16px' }}>
        {activeTab === 'trees' &&
          filteredTrees.map((tree) => {
            const isInspecting = selectedTreeId === tree.id;
            const isEquipped = settings.selectedTreeId === tree.id;

            return (
              <div
                key={tree.id}
                onClick={() => setSelectedTreeId(tree.id)}
                style={{
                  background: isInspecting ? 'rgba(46, 125, 50, 0.3)' : 'rgba(255, 255, 255, 0.05)',
                  border: isInspecting
                    ? '1.5px solid #81C784'
                    : isEquipped
                    ? '1.5px solid rgba(129, 199, 132, 0.6)'
                    : '1px solid rgba(255, 255, 255, 0.07)',
                  borderRadius: '16px',
                  padding: '12px 10px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                  position: 'relative',
                  transition: 'transform 0.15s ease, background 0.15s ease',
                }}
              >
                {/* Active Equipped Badge */}
                {isEquipped && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '8px',
                      right: '8px',
                      background: '#2E7D32',
                      borderRadius: '50%',
                      width: '18px',
                      height: '18px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Check size={11} color="#FFFFFF" />
                  </div>
                )}

                {/* SVG Thumbnail */}
                <div style={{ width: '60px', height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <TreeStageSvg
                    species={tree}
                    progress={1.0}
                    status="completed"
                    size={60}
                  />
                </div>

                {/* Title & Category */}
                <div style={{ textAlign: 'center', width: '100%' }}>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#FFFFFF', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {tree.name}
                  </div>
                  <span
                    style={{
                      fontSize: '9px',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      color:
                        tree.category === 'plus'
                          ? '#CE93D8'
                          : tree.category === 'seasonal'
                          ? '#FFB74D'
                          : '#81C784',
                    }}
                  >
                    {tree.category}
                  </span>
                </div>

                {/* Price or Unlocked Badge */}
                <div>
                  {tree.unlocked ? (
                    <span style={{ fontSize: '10px', color: '#81C784', fontWeight: 700 }}>Unlocked</span>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '3px', color: '#FFD700', fontSize: '11px', fontWeight: 800 }}>
                      <Coins size={12} />
                      <span>{tree.price}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

        {activeTab === 'lands' &&
          filteredLands.map((land) => {
            const isInspecting = selectedLandId === land.id;
            const isEquipped = settings.selectedLandId === land.id;

            return (
              <div
                key={land.id}
                onClick={() => setSelectedLandId(land.id)}
                style={{
                  background: isInspecting ? 'rgba(46, 125, 50, 0.3)' : 'rgba(255, 255, 255, 0.05)',
                  border: isInspecting
                    ? '1.5px solid #81C784'
                    : isEquipped
                    ? '1.5px solid rgba(129, 199, 132, 0.6)'
                    : '1px solid rgba(255, 255, 255, 0.07)',
                  borderRadius: '16px',
                  padding: '12px 10px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                  position: 'relative',
                  transition: 'transform 0.15s ease, background 0.15s ease',
                }}
              >
                {isEquipped && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '8px',
                      right: '8px',
                      background: '#2E7D32',
                      borderRadius: '50%',
                      width: '18px',
                      height: '18px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Check size={11} color="#FFFFFF" />
                  </div>
                )}

                {/* Turf SVG Thumbnail */}
                <div style={{ width: '70px', height: '50px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="70" height="40" viewBox="0 0 100 100">
                    <LandPatchSvg land={land} isWithered={false} />
                  </svg>
                </div>

                <div style={{ textAlign: 'center', width: '100%' }}>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#FFFFFF', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {land.name}
                  </div>
                  <span
                    style={{
                      fontSize: '9px',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      color:
                        land.category === 'plus'
                          ? '#CE93D8'
                          : land.category === 'seasonal'
                          ? '#FFB74D'
                          : '#81C784',
                    }}
                  >
                    {land.category}
                  </span>
                </div>

                <div>
                  {land.unlocked ? (
                    <span style={{ fontSize: '10px', color: '#81C784', fontWeight: 700 }}>Unlocked</span>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '3px', color: '#FFD700', fontSize: '11px', fontWeight: 800 }}>
                      <Coins size={12} />
                      <span>{land.price}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
};
