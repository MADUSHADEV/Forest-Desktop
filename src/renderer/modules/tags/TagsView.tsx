import React, { useState } from 'react';
import {
  Tag as TagIcon,
  Plus,
  Trash2,
  Check,
  Edit2,
  Clock,
  Trees,
  X,
  AlertTriangle,
} from 'lucide-react';
import { useForestSelector, forestStore } from '../../state/forestStore';
import { FocusTag } from '../../../shared/types';

const FOREST_COLOR_PALETTE = [
  { name: 'Emerald', hex: '#2E7D32' },
  { name: 'Sage', hex: '#689F38' },
  { name: 'Amber', hex: '#F57F17' },
  { name: 'Terracotta', hex: '#D84315' },
  { name: 'Coral', hex: '#E64A19' },
  { name: 'Sky', hex: '#0288D1' },
  { name: 'Indigo', hex: '#3949AB' },
  { name: 'Lavender', hex: '#8E24AA' },
  { name: 'Rose', hex: '#D81B60' },
  { name: 'Teal', hex: '#00897B' },
];

export const TagsView: React.FC = () => {
  const tags = useForestSelector((s) => s.tags);
  const sessions = useForestSelector((s) => s.sessions);
  const selectedTagId = useForestSelector((s) => s.settings.selectedTagId);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<FocusTag | null>(null);
  const [tagName, setTagName] = useState('');
  const [tagColor, setTagColor] = useState(FOREST_COLOR_PALETTE[0].hex);
  const [deletingTagId, setDeletingTagId] = useState<string | null>(null);

  const openCreateForm = () => {
    setEditingTag(null);
    setTagName('');
    setTagColor(FOREST_COLOR_PALETTE[0].hex);
    setIsFormOpen(true);
  };

  const openEditForm = (tag: FocusTag) => {
    setEditingTag(tag);
    setTagName(tag.name);
    setTagColor(tag.color);
    setIsFormOpen(true);
  };

  const handleSaveTag = async () => {
    const trimmed = tagName.trim();
    if (!trimmed) return;

    if (editingTag) {
      await forestStore.updateTag(editingTag.id, trimmed, tagColor);
    } else {
      await forestStore.createTag(trimmed, tagColor);
    }

    setIsFormOpen(false);
    setEditingTag(null);
    setTagName('');
  };

  const handleConfirmDelete = async () => {
    if (!deletingTagId) return;
    await forestStore.deleteTag(deletingTagId);
    setDeletingTagId(null);
  };

  const handleSetActiveTag = async (tagId: string) => {
    await forestStore.updateSettings({ selectedTagId: tagId });
  };

  // Helper to compute stats for each tag
  const getTagStats = (tagId: string) => {
    const tagSessions = sessions.filter((s) => s.tagId === tagId && s.status === 'completed');
    const totalSecs = tagSessions.reduce((acc, s) => acc + s.durationSeconds, 0);
    const hours = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const timeStr = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
    return { count: tagSessions.length, timeStr };
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
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <TagIcon color="#81C784" size={20} />
          <h2 style={{ fontSize: '17px', fontWeight: 800, color: '#FFFFFF' }}>Focus Tags Manager</h2>
        </div>

        <button
          onClick={openCreateForm}
          style={{
            background: 'linear-gradient(135deg, #4CAF50 0%, #2E7D32 100%)',
            border: 'none',
            borderRadius: '12px',
            padding: '6px 12px',
            color: '#FFFFFF',
            fontSize: '12px',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(46, 125, 50, 0.4)',
          }}
        >
          <Plus size={14} />
          <span>New Tag</span>
        </button>
      </div>

      {/* --- CREATE / EDIT FORM CARD --- */}
      {isFormOpen && (
        <div
          style={{
            background: 'rgba(255, 255, 255, 0.06)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: '16px',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '13px', fontWeight: 800, color: '#FFFFFF' }}>
              {editingTag ? 'Edit Tag' : 'Create New Tag'}
            </span>
            <button
              onClick={() => setIsFormOpen(false)}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#A5D6A7',
                cursor: 'pointer',
              }}
            >
              <X size={16} />
            </button>
          </div>

          <input
            type="text"
            placeholder="Tag Name (e.g., Coding, Client Project)"
            maxLength={24}
            value={tagName}
            onChange={(e) => setTagName(e.target.value)}
            style={{
              background: 'rgba(0, 0, 0, 0.3)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '10px',
              padding: '10px 14px',
              color: '#FFFFFF',
              fontSize: '13px',
              outline: 'none',
            }}
          />

          {/* 10-Color Palette Grid */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <span style={{ fontSize: '10px', color: '#81C784', fontWeight: 700, textTransform: 'uppercase' }}>
              Palette Color
            </span>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px' }}>
              {FOREST_COLOR_PALETTE.map((c) => (
                <button
                  key={c.hex}
                  onClick={() => setTagColor(c.hex)}
                  title={c.name}
                  style={{
                    height: '28px',
                    borderRadius: '8px',
                    background: c.hex,
                    border: tagColor === c.hex ? '2.5px solid #FFFFFF' : 'none',
                    cursor: 'pointer',
                    boxShadow: tagColor === c.hex ? `0 0 10px ${c.hex}` : 'none',
                    transition: 'transform 0.1s ease',
                  }}
                />
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '4px' }}>
            <button
              onClick={() => setIsFormOpen(false)}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#A5D6A7',
                fontSize: '12px',
                padding: '6px 12px',
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleSaveTag}
              disabled={!tagName.trim()}
              style={{
                background: '#2E7D32',
                border: 'none',
                borderRadius: '8px',
                color: '#FFFFFF',
                fontSize: '12px',
                fontWeight: 700,
                padding: '8px 16px',
                cursor: tagName.trim() ? 'pointer' : 'not-allowed',
                opacity: tagName.trim() ? 1 : 0.5,
              }}
            >
              {editingTag ? 'Save Changes' : 'Create Tag'}
            </button>
          </div>
        </div>
      )}

      {/* --- TAG LIST WITH STATS --- */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {tags.map((tag) => {
          const isSelected = selectedTagId === tag.id;
          const { count, timeStr } = getTagStats(tag.id);

          return (
            <div
              key={tag.id}
              onClick={() => handleSetActiveTag(tag.id)}
              style={{
                background: isSelected ? 'rgba(46, 125, 50, 0.35)' : 'rgba(255, 255, 255, 0.05)',
                border: isSelected ? '1px solid #81C784' : '1px solid rgba(255, 255, 255, 0.07)',
                borderRadius: '14px',
                padding: '12px 14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer',
                transition: 'background 0.15s ease',
              }}
            >
              {/* Left: Color dot & Name */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div
                  style={{
                    width: '14px',
                    height: '14px',
                    borderRadius: '50%',
                    background: tag.color,
                    boxShadow: `0 0 10px ${tag.color}`,
                    flexShrink: 0,
                  }}
                />
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '14px', fontWeight: isSelected ? 800 : 700, color: '#FFFFFF' }}>
                      {tag.name}
                    </span>
                    {tag.isDefault && (
                      <span
                        style={{
                          fontSize: '9px',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          background: 'rgba(255, 255, 255, 0.08)',
                          color: '#C8E6C9',
                          padding: '1px 5px',
                          borderRadius: '4px',
                        }}
                      >
                        Default
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
                    <span style={{ fontSize: '11px', color: '#A5D6A7', display: 'flex', alignItems: 'center', gap: '3px' }}>
                      <Clock size={11} /> {timeStr}
                    </span>
                    <span style={{ fontSize: '11px', color: '#A5D6A7', display: 'flex', alignItems: 'center', gap: '3px' }}>
                      <Trees size={11} /> {count} trees
                    </span>
                  </div>
                </div>
              </div>

              {/* Right: Actions */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                {isSelected && (
                  <div
                    style={{
                      background: 'rgba(129, 199, 132, 0.2)',
                      padding: '3px 8px',
                      borderRadius: '10px',
                      color: '#81C784',
                      fontSize: '11px',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      marginRight: '4px',
                    }}
                  >
                    <Check size={12} />
                    <span>Active</span>
                  </div>
                )}

                {/* Edit (available for custom tags) */}
                {!tag.isDefault && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      openEditForm(tag);
                    }}
                    title="Edit Tag"
                    style={{
                      background: 'rgba(255, 255, 255, 0.06)',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '6px',
                      color: '#C8E6C9',
                      cursor: 'pointer',
                    }}
                  >
                    <Edit2 size={13} />
                  </button>
                )}

                {/* Delete (available for custom tags) */}
                {!tag.isDefault && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeletingTagId(tag.id);
                    }}
                    title="Delete Tag"
                    style={{
                      background: 'rgba(239, 83, 80, 0.15)',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '6px',
                      color: '#EF5350',
                      cursor: 'pointer',
                    }}
                  >
                    <Trash2 size={13} />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* --- DELETE CONFIRMATION MODAL --- */}
      {deletingTagId && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(5px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: '20px',
          }}
        >
          <div
            style={{
              background: '#182E21',
              border: '1px solid rgba(239, 83, 80, 0.3)',
              borderRadius: '20px',
              padding: '20px',
              maxWidth: '320px',
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              textAlign: 'center',
              boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
            }}
          >
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '50%',
                background: 'rgba(239, 83, 80, 0.15)',
                color: '#EF5350',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto',
              }}
            >
              <AlertTriangle size={22} />
            </div>

            <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#FFFFFF' }}>Delete Tag?</h3>
            <p style={{ fontSize: '12px', color: '#C8E6C9', lineHeight: 1.4 }}>
              Deleting this tag will safely reassign all historical sessions and your timer to the default Work tag.
            </p>

            <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
              <button
                onClick={() => setDeletingTagId(null)}
                style={{
                  flex: 1,
                  padding: '10px',
                  borderRadius: '10px',
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: 'none',
                  color: '#FFFFFF',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>

              <button
                onClick={handleConfirmDelete}
                style={{
                  flex: 1,
                  padding: '10px',
                  borderRadius: '10px',
                  background: '#D32F2F',
                  border: 'none',
                  color: '#FFFFFF',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
