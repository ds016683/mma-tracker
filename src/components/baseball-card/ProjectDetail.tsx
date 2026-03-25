import { useState, useRef, useEffect } from 'react';
import {
  ArrowLeft, Pin, PinOff, Pencil, Plus, X, Trash2,
  Users, CheckSquare, Link as LinkIcon, FileText, MessageSquare, Calendar,
} from 'lucide-react';
import type { BaseballCardProject, Task, Note, ProjectLink, Person, Priority, ProjectStatus, MMATaskStatus } from '../../lib/baseball-card/types';
import { FreshnessDot } from './FreshnessDot';
import { PriorityBadge } from './PriorityBadge';
import { MMAStatusBadge, VersionBadge, ContractBadge } from './MMABadges';

interface ProjectDetailProps {
  project: BaseballCardProject;
  onUpdate: (id: string, updates: Partial<BaseballCardProject>) => void;
  onPin: (id: string) => void;
  onDelete: (id: string) => void;
  onBack: () => void;
}

export function ProjectDetail({ project, onUpdate, onPin, onDelete, onBack }: ProjectDetailProps) {
  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState(project.name);
  const [editingDesc, setEditingDesc] = useState(false);
  const [descValue, setDescValue] = useState(project.description);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const descRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (editingName) nameInputRef.current?.focus();
  }, [editingName]);

  useEffect(() => {
    if (editingDesc) descRef.current?.focus();
  }, [editingDesc]);

  function saveName() {
    const trimmed = nameValue.trim();
    if (trimmed && trimmed !== project.name) {
      onUpdate(project.id, { name: trimmed });
    }
    setEditingName(false);
  }

  function saveDesc() {
    if (descValue !== project.description) {
      onUpdate(project.id, { description: descValue });
    }
    setEditingDesc(false);
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-6">
      {/* Back + Header */}
      <div>
        <button
          onClick={onBack}
          className="mb-4 flex items-center gap-1 text-sm text-gray-400 transition-colors hover:text-gray-600"
          title="Go back to the card grid view"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>

        <div className="flex items-start justify-between gap-3">
          <div className="group/name flex items-center gap-2">
            <FreshnessDot lastActivityAt={project.last_activity_at} />
            {editingName ? (
              <input
                ref={nameInputRef}
                value={nameValue}
                onChange={e => setNameValue(e.target.value)}
                onBlur={saveName}
                onKeyDown={e => { if (e.key === 'Enter') saveName(); if (e.key === 'Escape') { setNameValue(project.name); setEditingName(false); } }}
                className="border-b border-mma-blue bg-transparent text-xl font-bold text-mma-dark-blue focus:border-mma-dark-blue focus:outline-none"
              />
            ) : (
              <h1
                onClick={() => setEditingName(true)}
                className="cursor-pointer text-xl font-bold text-mma-dark-blue"
              >
                {project.name}
                <Pencil className="ml-1.5 inline h-3.5 w-3.5 text-gray-300 opacity-0 group-hover/name:opacity-100" />
              </h1>
            )}
          </div>
          <button
            onClick={() => onPin(project.id)}
            className="shrink-0 rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-amber-500"
            title={project.pinned ? 'Unpin — remove focus pin from this project' : 'Pin to focus — keeps this card at the top of Spotlight'}
          >
            {project.pinned ? <PinOff className="h-4 w-4" /> : <Pin className="h-4 w-4" />}
          </button>
        </div>

        {/* Badges */}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <VersionBadge version={project.mma_version} onChange={(v) => onUpdate(project.id, { mma_version: v })} />
          <MMAStatusBadge status={project.mma_status} onChange={(s: MMATaskStatus) => onUpdate(project.id, { mma_status: s })} />
          <PriorityBadge priority={project.priority} onClick={(p: Priority) => onUpdate(project.id, { priority: p })} />
          <ContractBadge contractRef={project.mma_contract_ref} onChange={(c) => onUpdate(project.id, { mma_contract_ref: c })} />
          <select
            value={project.status}
            onChange={e => onUpdate(project.id, { status: e.target.value as ProjectStatus })}
            className="rounded-full border border-gray-200 px-2 py-0.5 text-xs text-gray-600 focus:outline-none"
            title="Change project status"
          >
            <option value="active">Active</option>
            <option value="pencils_down">Pencils Down</option>
            <option value="on_hold">On Hold</option>
            <option value="archived">Archived</option>
          </select>
        </div>

        {/* Tags */}
        {project.tags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {project.tags.map(tag => (
              <span key={tag} className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">{tag}</span>
            ))}
          </div>
        )}

        {/* Dates */}
        <div className="mt-3 flex gap-4 text-xs text-gray-400">
          <span className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            Added: {formatDate(project.mma_date || project.created_at)}
          </span>
          {project.target_date && (
            <span>Target: {formatDate(project.target_date)}</span>
          )}
          {project.mma_estimated_turn_time && (
            <span>Est. Turn: {project.mma_estimated_turn_time}</span>
          )}
        </div>
      </div>

      {/* Description */}
      <Section icon={<FileText className="h-4 w-4" />} title="Description">
        {editingDesc ? (
          <div>
            <textarea
              ref={descRef}
              value={descValue}
              onChange={e => setDescValue(e.target.value)}
              onKeyDown={e => { if (e.key === 'Escape') { setDescValue(project.description); setEditingDesc(false); } }}
              rows={3}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 focus:border-gray-400 focus:outline-none"
            />
            <div className="mt-1 flex gap-2">
              <button onClick={saveDesc} className="text-xs text-gray-500 hover:text-gray-700">Save</button>
              <button onClick={() => { setDescValue(project.description); setEditingDesc(false); }} className="text-xs text-gray-400 hover:text-gray-600" title="Cancel editing">Cancel</button>
            </div>
          </div>
        ) : (
          <div className="group/desc cursor-pointer" onClick={() => { setDescValue(project.description); setEditingDesc(true); }}>
            {project.description ? (
              <p className="text-sm leading-relaxed text-gray-600">
                {project.description}
                <Pencil className="ml-1 inline h-3 w-3 text-gray-300 opacity-0 group-hover/desc:opacity-100" />
              </p>
            ) : (
              <p className="text-sm italic text-gray-400">Add a description...</p>
            )}
          </div>
        )}
      </Section>

      {/* MMA Comments */}
      {project.mma_comments && (
        <Section icon={<MessageSquare className="h-4 w-4" />} title="Spreadsheet Comments">
          <p className="text-sm leading-relaxed text-gray-600">{project.mma_comments}</p>
        </Section>
      )}

      {/* RACI */}
      <Section icon={<Users className="h-4 w-4" />} title="RACI Assignments">
        <div className="grid grid-cols-2 gap-4">
          <RACIRow label="Accountable" value={project.mma_accountable} color="text-mma-crimson" />
          <RACIRow label="Responsible" value={project.mma_responsible} color="text-mma-blue" />
          <RACIRow label="Contributor" value={project.mma_contributor} color="text-mma-orange" />
          <RACIRow label="Informed" value={project.mma_informed} color="text-mma-turquoise" />
        </div>
      </Section>

      {/* People (editable) */}
      <PeopleSection
        people={project.people}
        onChange={people => onUpdate(project.id, { people })}
      />

      {/* Tasks */}
      <TasksSection
        tasks={project.tasks}
        onChange={tasks => onUpdate(project.id, { tasks })}
      />

      {/* Links */}
      <LinksSection
        links={project.links}
        onChange={links => onUpdate(project.id, { links })}
      />

      {/* Notes */}
      <NotesSection
        notes={project.notes}
        onChange={notes => onUpdate(project.id, { notes })}
      />

      {/* Delete */}
      <div className="border-t border-gray-100 pt-6">
        {confirmDelete ? (
          <div className="flex items-center gap-2">
            <span className="text-sm text-red-600">Are you sure?</span>
            <button
              onClick={() => { onDelete(project.id); onBack(); }}
              className="rounded-lg bg-red-600 px-3 py-1.5 text-sm text-white hover:bg-red-700"
              title="Permanently delete this project and all its data"
            >
              Delete
            </button>
            <button
              onClick={() => setConfirmDelete(false)}
              className="text-sm text-gray-400 hover:text-gray-600"
              title="Cancel deletion"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirmDelete(true)}
            className="flex items-center gap-1 text-sm text-gray-400 hover:text-red-500"
            title="Delete this project permanently"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Delete project
          </button>
        )}
      </div>
    </div>
  );
}

// --- Sub-components ---

function Section({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="mb-3 flex items-center gap-2 text-sm font-medium text-gray-500">
        {icon}
        {title}
      </div>
      {children}
    </div>
  );
}

function RACIRow({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div>
      <span className={`text-xs font-medium ${color}`}>{label}</span>
      <p className="mt-0.5 text-sm text-gray-700">{value || 'TBD'}</p>
    </div>
  );
}

function PeopleSection({ people, onChange }: { people: Person[]; onChange: (p: Person[]) => void }) {
  const [name, setName] = useState('');
  const [role, setRole] = useState('');

  function addPerson() {
    if (!name.trim()) return;
    const person: Person = {
      id: crypto.randomUUID?.() ?? Date.now().toString(36),
      name: name.trim(),
      role: role.trim() || undefined,
    };
    onChange([...people, person]);
    setName('');
    setRole('');
  }

  return (
    <Section icon={<Users className="h-4 w-4" />} title="People">
      <div className="space-y-2">
        {people.map(person => (
          <div key={person.id} className="group/person flex items-center gap-2">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gray-200 text-xs font-medium text-gray-600">
              {person.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
            </span>
            <span className="text-sm text-gray-700">{person.name}</span>
            {person.role && (
              <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">{person.role}</span>
            )}
            <button
              onClick={() => onChange(people.filter(p => p.id !== person.id))}
              className="ml-auto text-gray-300 opacity-0 hover:text-red-400 group-hover/person:opacity-100"
              title="Remove this person from the project"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
        <div className="flex items-center gap-2">
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') addPerson(); }}
            placeholder="Name"
            className="flex-1 rounded-lg border border-gray-200 px-2 py-1 text-sm focus:border-gray-400 focus:outline-none"
          />
          <input
            value={role}
            onChange={e => setRole(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') addPerson(); }}
            placeholder="Role (optional)"
            className="w-32 rounded-lg border border-gray-200 px-2 py-1 text-sm focus:border-gray-400 focus:outline-none"
          />
          <button
            onClick={addPerson}
            className="rounded p-1 text-gray-400 hover:text-gray-600"
            title="Add a person to this project"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>
    </Section>
  );
}

function TasksSection({ tasks, onChange }: { tasks: Task[]; onChange: (t: Task[]) => void }) {
  const [text, setText] = useState('');

  function addTask() {
    if (!text.trim()) return;
    const task: Task = {
      id: crypto.randomUUID?.() ?? Date.now().toString(36),
      text: text.trim(),
      done: false,
      created_at: new Date().toISOString(),
    };
    onChange([...tasks, task]);
    setText('');
  }

  return (
    <Section icon={<CheckSquare className="h-4 w-4" />} title="Tasks">
      <div className="space-y-1.5">
        {tasks.map(task => (
          <div key={task.id} className="group/task flex items-center gap-2">
            <button
              onClick={() => onChange(tasks.map(t => t.id === task.id ? { ...t, done: !t.done } : t))}
              className={`h-4 w-4 shrink-0 rounded border ${task.done ? 'border-mma-turquoise bg-mma-turquoise' : 'border-gray-300'}`}
              title={task.done ? 'Mark as incomplete' : 'Mark as complete'}
            />
            <span className={`flex-1 text-sm ${task.done ? 'text-gray-400 line-through' : 'text-gray-700'}`}>
              {task.text}
            </span>
            <button
              onClick={() => onChange(tasks.filter(t => t.id !== task.id))}
              className="text-gray-300 opacity-0 hover:text-red-400 group-hover/task:opacity-100"
              title="Delete this task"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
        <div className="flex items-center gap-2">
          <input
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') addTask(); }}
            placeholder="Add a task..."
            className="flex-1 rounded-lg border border-gray-200 px-2 py-1 text-sm focus:border-gray-400 focus:outline-none"
          />
          <button onClick={addTask} className="rounded p-1 text-gray-400 hover:text-gray-600" title="Add a new task to this project">
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>
    </Section>
  );
}

function LinksSection({ links, onChange }: { links: ProjectLink[]; onChange: (l: ProjectLink[]) => void }) {
  const [url, setUrl] = useState('');
  const [label, setLabel] = useState('');

  function addLink() {
    if (!url.trim()) return;
    let autoLabel = label.trim();
    if (!autoLabel) {
      try { autoLabel = new URL(url.trim()).hostname; } catch { autoLabel = url.trim(); }
    }
    const link: ProjectLink = {
      id: crypto.randomUUID?.() ?? Date.now().toString(36),
      url: url.trim(),
      label: autoLabel,
      created_at: new Date().toISOString(),
    };
    onChange([...links, link]);
    setUrl('');
    setLabel('');
  }

  return (
    <Section icon={<LinkIcon className="h-4 w-4" />} title="Links">
      <div className="space-y-1.5">
        {links.map(link => (
          <div key={link.id} className="group/link flex items-center gap-2">
            <a
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-mma-blue hover:underline"
              title={`Open ${link.url} in a new tab`}
            >
              {link.label}
            </a>
            <span className="text-xs text-gray-400 truncate">{link.url}</span>
            <button
              onClick={() => onChange(links.filter(l => l.id !== link.id))}
              className="ml-auto text-gray-300 opacity-0 hover:text-red-400 group-hover/link:opacity-100"
              title="Remove this link"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
        <div className="flex items-center gap-2">
          <input
            value={url}
            onChange={e => setUrl(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') addLink(); }}
            placeholder="URL"
            className="flex-1 rounded-lg border border-gray-200 px-2 py-1 text-sm focus:border-gray-400 focus:outline-none"
          />
          <input
            value={label}
            onChange={e => setLabel(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') addLink(); }}
            placeholder="Label (optional)"
            className="w-28 rounded-lg border border-gray-200 px-2 py-1 text-sm focus:border-gray-400 focus:outline-none"
          />
          <button onClick={addLink} className="rounded p-1 text-gray-400 hover:text-gray-600" title="Add a link to this project">
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>
    </Section>
  );
}

function NotesSection({ notes, onChange }: { notes: Note[]; onChange: (n: Note[]) => void }) {
  const [text, setText] = useState('');

  function addNote() {
    if (!text.trim()) return;
    const note: Note = {
      id: crypto.randomUUID?.() ?? Date.now().toString(36),
      text: text.trim(),
      created_at: new Date().toISOString(),
    };
    onChange([note, ...notes]);
    setText('');
  }

  return (
    <Section icon={<MessageSquare className="h-4 w-4" />} title="Notes">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <input
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') addNote(); }}
            placeholder="Add a note..."
            className="flex-1 rounded-lg border border-gray-200 px-2 py-1 text-sm focus:border-gray-400 focus:outline-none"
          />
          <button onClick={addNote} className="rounded p-1 text-gray-400 hover:text-gray-600" title="Add a timestamped note to this project">
            <Plus className="h-4 w-4" />
          </button>
        </div>
        {notes.map(note => (
          <div key={note.id} className="group/note rounded-lg bg-gray-50 px-3 py-2">
            <div className="flex items-start justify-between">
              <p className="text-sm text-gray-700">{note.text}</p>
              <button
                onClick={() => onChange(notes.filter(n => n.id !== note.id))}
                className="ml-2 shrink-0 text-gray-300 opacity-0 hover:text-red-400 group-hover/note:opacity-100"
                title="Delete this note"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
            <span className="mt-1 block text-xs text-gray-400">
              {new Date(note.created_at).toLocaleString()}
            </span>
          </div>
        ))}
      </div>
    </Section>
  );
}

function formatDate(dateStr: string): string {
  if (!dateStr || dateStr === 'TBD') return dateStr || 'TBD';
  if (!/^\d{4}/.test(dateStr)) return dateStr;
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return dateStr;
  }
}
