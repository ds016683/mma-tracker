import { useState, useRef, useEffect } from 'react';
import type { Priority } from '../../lib/baseball-card/types';

interface CreateProjectFormProps {
  onCreate: (fields: {
    name: string;
    description?: string;
    category: string;
    priority?: Priority;
    target_date?: string | null;
    tags?: string[];
  }) => void;
  onCancel: () => void;
}

export function CreateProjectForm({ onCreate, onCancel }: CreateProjectFormProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [priority, setPriority] = useState<Priority>('medium');
  const [tags, setTags] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    nameRef.current?.focus();
  }, []);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    onCreate({
      name: name.trim(),
      description: description.trim() || undefined,
      category: category.trim() || 'Uncategorized',
      priority,
      target_date: targetDate || null,
      tags: tags ? tags.split(',').map(t => t.trim()).filter(Boolean) : [],
    });
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Escape') onCancel();
  }

  return (
    <form
      onSubmit={handleSubmit}
      onKeyDown={handleKeyDown}
      className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
    >
      <div className="space-y-3">
        <input
          ref={nameRef}
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Task name"
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-gray-400 focus:outline-none"
        />
        <textarea
          value={description}
          onChange={e => setDescription(e.target.value)}
          placeholder="Brief description — what is this task and why does it matter?"
          rows={2}
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-gray-400 focus:outline-none"
        />
        <div className="grid grid-cols-2 gap-3">
          <input
            type="text"
            value={category}
            onChange={e => setCategory(e.target.value)}
            placeholder="Category (e.g. Schedule E - Core)"
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-gray-400 focus:outline-none"
          />
          <select
            value={priority}
            onChange={e => setPriority(e.target.value as Priority)}
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-gray-400 focus:outline-none"
            title="Set the priority level for this task"
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="urgent">Very High</option>
          </select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <input
            type="text"
            value={tags}
            onChange={e => setTags(e.target.value)}
            placeholder="Tags (comma-separated)"
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-gray-400 focus:outline-none"
          />
          <input
            type="date"
            value={targetDate}
            onChange={e => setTargetDate(e.target.value)}
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-gray-400 focus:outline-none"
            title="Optional target date / deadline"
          />
        </div>
      </div>
      <div className="mt-4 flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg px-3 py-1.5 text-sm text-gray-500 hover:text-gray-700"
          title="Cancel creating this card"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!name.trim()}
          className="rounded-lg bg-gray-900 px-4 py-1.5 text-sm text-white hover:bg-gray-700 disabled:opacity-40"
          title="Create this card and add it to your portfolio"
        >
          Add Card
        </button>
      </div>
    </form>
  );
}
