'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  MessageSquare, 
  Package, 
  Truck, 
  User, 
  Plus, 
  Trash2, 
  Loader2,
  Clock,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

export interface OrderNote {
  id: string;
  order_id: string;
  note: string;
  note_type: 'internal' | 'packing' | 'shipping' | 'customer';
  created_by: string | null;
  created_at: string;
  updated_at: string;
  creator_name?: string;
}

interface OrderNotesPanelProps {
  orderId: string;
  compact?: boolean;
  onNotesChange?: (notes: OrderNote[]) => void;
}

const NOTE_TYPES = [
  { value: 'internal', label: 'Internal', icon: MessageSquare, color: 'text-gray-600 bg-gray-100' },
  { value: 'packing', label: 'Packing', icon: Package, color: 'text-blue-600 bg-blue-100' },
  { value: 'shipping', label: 'Shipping', icon: Truck, color: 'text-green-600 bg-green-100' },
  { value: 'customer', label: 'Customer', icon: User, color: 'text-purple-600 bg-purple-100' },
] as const;

const QUICK_TEMPLATES = [
  { label: 'Fragile', text: 'Handle with care - fragile items', type: 'packing' as const },
  { label: 'Gift Wrap', text: 'Customer requested gift wrapping', type: 'packing' as const },
  { label: 'Rush Order', text: 'RUSH ORDER - Priority shipping requested', type: 'shipping' as const },
  { label: 'Hold', text: 'HOLD - Do not ship until further notice', type: 'shipping' as const },
  { label: 'Signature', text: 'Signature required on delivery', type: 'shipping' as const },
  { label: 'Contact First', text: 'Contact customer before shipping', type: 'customer' as const },
  { label: 'Repeat Customer', text: 'Repeat customer - include thank you note', type: 'customer' as const },
];

export default function OrderNotesPanel({ 
  orderId, 
  compact = false,
  onNotesChange 
}: OrderNotesPanelProps) {
  const [notes, setNotes] = useState<OrderNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(!compact);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [newNoteType, setNewNoteType] = useState<OrderNote['note_type']>('internal');
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchNotes = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/admin/orders/${orderId}/notes`, {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch notes');
      }

      const data = await response.json();
      setNotes(data.notes || []);
      onNotesChange?.(data.notes || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load notes');
    } finally {
      setLoading(false);
    }
  }, [orderId, onNotesChange]);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  const handleAddNote = async () => {
    if (!newNote.trim()) return;

    try {
      setSubmitting(true);
      setError(null);

      const response = await fetch(`/api/admin/orders/${orderId}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          note: newNote.trim(),
          note_type: newNoteType,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to add note');
      }

      setNewNote('');
      setShowAddForm(false);
      await fetchNotes();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add note');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    try {
      setDeletingId(noteId);
      setError(null);

      const response = await fetch(`/api/admin/orders/${orderId}/notes`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ note_id: noteId }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete note');
      }

      await fetchNotes();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete note');
    } finally {
      setDeletingId(null);
    }
  };

  const applyTemplate = (template: typeof QUICK_TEMPLATES[0]) => {
    setNewNote(template.text);
    setNewNoteType(template.type);
    setShowAddForm(true);
  };

  const getNoteTypeConfig = (type: OrderNote['note_type']) => {
    return NOTE_TYPES.find(t => t.value === type) || NOTE_TYPES[0];
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  // Compact view - just show latest note and count
  if (compact && !expanded) {
    const latestNote = notes[0];
    return (
      <button
        onClick={() => setExpanded(true)}
        className="flex items-center gap-2 text-xs text-gray-600 hover:text-gray-900 transition-colors"
      >
        <MessageSquare className="w-3.5 h-3.5" />
        {notes.length > 0 ? (
          <>
            <span className="truncate max-w-[150px]">{latestNote.note}</span>
            {notes.length > 1 && (
              <span className="text-gray-400">+{notes.length - 1}</span>
            )}
          </>
        ) : (
          <span className="text-gray-400">Add note</span>
        )}
        <ChevronDown className="w-3 h-3" />
      </button>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-gray-50 border-b">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-gray-600" />
          <span className="font-medium text-sm text-gray-900">
            Notes {notes.length > 0 && `(${notes.length})`}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {!showAddForm && (
            <button
              onClick={() => setShowAddForm(true)}
              className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
              title="Add note"
            >
              <Plus className="w-4 h-4" />
            </button>
          )}
          {compact && (
            <button
              onClick={() => setExpanded(false)}
              className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
            >
              <ChevronUp className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="px-3 py-2 bg-red-50 text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Add Note Form */}
      {showAddForm && (
        <div className="p-3 border-b bg-gray-50 space-y-3">
          {/* Quick Templates */}
          <div className="flex flex-wrap gap-1">
            {QUICK_TEMPLATES.map((template, index) => (
              <button
                key={index}
                onClick={() => applyTemplate(template)}
                className="text-xs px-2 py-1 bg-white border border-gray-200 rounded hover:bg-gray-100 transition-colors"
              >
                {template.label}
              </button>
            ))}
          </div>

          {/* Note Type Selector */}
          <div className="flex gap-1">
            {NOTE_TYPES.map((type) => {
              const Icon = type.icon;
              return (
                <button
                  key={type.value}
                  onClick={() => setNewNoteType(type.value)}
                  className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors ${
                    newNoteType === type.value
                      ? type.color
                      : 'text-gray-500 bg-white border border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="w-3 h-3" />
                  {type.label}
                </button>
              );
            })}
          </div>

          {/* Note Input */}
          <textarea
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            placeholder="Enter note..."
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent resize-none"
            rows={2}
          />

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <button
              onClick={() => {
                setShowAddForm(false);
                setNewNote('');
              }}
              className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleAddNote}
              disabled={!newNote.trim() || submitting}
              className="px-3 py-1.5 text-sm bg-gray-900 text-white rounded hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 transition-colors"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Adding...
                </>
              ) : (
                'Add Note'
              )}
            </button>
          </div>
        </div>
      )}

      {/* Notes List */}
      <div className="max-h-64 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
          </div>
        ) : notes.length === 0 ? (
          <div className="py-6 text-center text-sm text-gray-500">
            No notes yet
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {notes.map((note) => {
              const typeConfig = getNoteTypeConfig(note.note_type);
              const Icon = typeConfig.icon;
              return (
                <div key={note.id} className="p-3 hover:bg-gray-50 group">
                  <div className="flex items-start gap-2">
                    <span className={`p-1 rounded ${typeConfig.color}`}>
                      <Icon className="w-3 h-3" />
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900 whitespace-pre-wrap">
                        {note.note}
                      </p>
                      <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                        <Clock className="w-3 h-3" />
                        <span>{formatDate(note.created_at)}</span>
                        {note.creator_name && (
                          <>
                            <span>•</span>
                            <span>{note.creator_name}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteNote(note.id)}
                      disabled={deletingId === note.id}
                      className="p-1 text-gray-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-all"
                      title="Delete note"
                    >
                      {deletingId === note.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// Compact inline note display
export function OrderNotesBadge({ notes }: { notes: OrderNote[] }) {
  if (notes.length === 0) return null;

  const latestNote = notes[0];
  const typeConfig = NOTE_TYPES.find(t => t.value === latestNote.note_type) || NOTE_TYPES[0];
  const Icon = typeConfig.icon;

  return (
    <div className="flex items-center gap-1.5 text-xs text-gray-600">
      <span className={`p-0.5 rounded ${typeConfig.color}`}>
        <Icon className="w-3 h-3" />
      </span>
      <span className="truncate max-w-[200px]">{latestNote.note}</span>
      {notes.length > 1 && (
        <span className="text-gray-400 flex-shrink-0">+{notes.length - 1}</span>
      )}
    </div>
  );
}
