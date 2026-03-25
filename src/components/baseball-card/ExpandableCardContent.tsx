import { useState, useRef, useEffect } from 'react';
import {
  Pencil, Plus, X, Trash2,
  Users, CheckSquare, Link as LinkIcon, FileText, MessageSquare, Calendar, Tag,
} from 'lucide-react';
import type { BaseballCardProject, Task, Note, ProjectLink, Person, Priority, ProjectStatus, MMATaskStatus } from '../../lib/baseball-card/types';
import { PriorityBadge } from './PriorityBadge';
import { MMAStatusBadge, VersionBadge, ContractBadge } from './MMABadges';

interface ExpandableCardContentProps {
  project: BaseballCardProject;
  onUpdate: (id: string, updates: Partial<BaseballCardProject>) => void;
  onPin: (id: string) => void;
  onDelete: (id: string) => void;
  readOnly?: boolean;
  onRestore?: (id: string) => void;
}

export function ExpandableCardContent({ project, onUpdate, onPin, onDelete, readOnly, onRestore }: ExpandableCardContentProps) {
  const [editingDesc, setEditingDesc] = useState(false);
  const [descValue, setDescValue] = useState(project.description);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const descRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (editingDesc) descRef.current?.focus();
  }, [editingDesc]);

  function saveDesc() {
    if (descValue !== project.description) {
      onUpdate(project.id, { description: descValue });
    }
    setEditingDesc(false);
  }

  if (readOnly) {
    return (
      <div className="space-y-4 border-t border-gray-100 pt-4" onClick={e => e.stopPropagation()}>
        {project.description && (
          <Section icon={<FileText className="h-4 w-4" />} title="Description">
            <p className="text-sm leading-relaxed text-gray-600">{project.description}</p>
          </Section>
        )}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <RACIDisplay label="Accountable" value={project.mma_accountable} color="text-mma-crimson" />
          <RACIDisplay label="Responsible" value={project.mma_responsible} color="text-mma-blue" />
          <RACIDisplay label="Contributor" value={project.mma_contributor} color="text-mma-orange" />
          <RACIDisplay label="Informed" value={project.mma_informed} color="text-mma-turquoise" />
        </div>
        {project.mma_comments && (
          <Section icon={<MessageSquare className="h-4 w-4" />} title="Comments">
            <p className="text-sm leading-relaxed text-gray-600">{project.mma_comments}</p>
          </Section>
        )}
        {onRestore && (
          <button
            onClick={() => onRestore(project.id)}
            className="rounded-md bg-mma-dark-blue px-3 py-1.5 text-sm text-white hover:bg-mma-blue transition-colors"
          >
            Restore to Active
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4 border-t border-gray-100 pt-4" onClick={e => e.stopPropagation()}>
      {/* Badges row */}
      <div className="flex flex-wrap items-center gap-2">
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
              <button onClick={() => { setDescValue(project.description); setEditingDesc(false); }} className="text-xs text-gray-400 hover:text-gray-600">Cancel</button>
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

      {/* RACI + Dates row */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Section icon={<Users className="h-4 w-4" />} title="RACI Assignments">
          <div className="grid grid-cols-2 gap-3">
            <EditableRACIRow label="Accountable" value={project.mma_accountable} color="text-mma-crimson"
              onSave={(v) => onUpdate(project.id, { mma_accountable: v })} />
            <EditableRACIRow label="Responsible" value={project.mma_responsible} color="text-mma-blue"
              onSave={(v) => onUpdate(project.id, { mma_responsible: v })} />
            <EditableRACIRow label="Contributor" value={project.mma_contributor} color="text-mma-orange"
              onSave={(v) => onUpdate(project.id, { mma_contributor: v })} />
            <EditableRACIRow label="Informed" value={project.mma_informed} color="text-mma-turquoise"
              onSave={(v) => onUpdate(project.id, { mma_informed: v })} />
          </div>
        </Section>

        <Section icon={<Calendar className="h-4 w-4" />} title="Dates & Timing">
          <div className="space-y-2">
            <EditableField label="Target Date" value={project.target_date || ''} type="date"
              onSave={(v) => onUpdate(project.id, { target_date: v || null })} />
            <EditableField label="MMA Date" value={project.mma_date} type="date"
              onSave={(v) => onUpdate(project.id, { mma_date: v })} />
            <EditableField label="Est. Turn Time" value={project.mma_estimated_turn_time}
              onSave={(v) => onUpdate(project.id, { mma_estimated_turn_time: v })} />
          </div>
        </Section>

        <Section icon={<Tag className="h-4 w-4" />} title="Tags">
          <TagsEditor tags={project.tags} onChange={(tags) => onUpdate(project.id, { tags })} />
        </Section>
      </div>

      {/* MMA Comments */}
      <EditableCommentsSection comments={project.mma_comments}
        onSave={(v) => onUpdate(project.id, { mma_comments: v })} />

      {/* Tasks, Notes, Links, People */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <TasksSection tasks={project.tasks} onChange={tasks => onUpdate(project.id, { tasks })} />
        <NotesSection notes={project.notes} onChange={notes => onUpdate(project.id, { notes })} />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <LinksSection links={project.links} onChange={links => onUpdate(project.id, { links })} />
        <PeopleSection people={project.people} onChange={people => onUpdate(project.id, { people })} />
      </div>

      {/* Pin + Delete */}
      <div className="flex items-center justify-between border-t border-gray-100 pt-4">
        <button
          onClick={() => onPin(project.id)}
          className="text-sm text-gray-400 hover:text-amber-500"
        >
          {project.pinned ? 'Unpin from Spotlight' : 'Pin to Spotlight'}
        </button>
        {confirmDelete ? (
          <div className="flex items-center gap-2">
            <span className="text-sm text-red-600">Are you sure?</span>
            <button onClick={() => { onDelete(project.id); }} className="rounded-lg bg-red-600 px-3 py-1.5 text-sm text-white hover:bg-red-700">Delete</button>
            <button onClick={() => setConfirmDelete(false)} className="text-sm text-gray-400 hover:text-gray-600">Cancel</button>
          </div>
        ) : (
          <button onClick={() => setConfirmDelete(true)} className="flex items-center gap-1 text-sm text-gray-400 hover:text-red-500">
            <Trash2 className="h-3.5 w-3.5" /> Delete
          </button>
        )}
      </div>
    </div>
  );
}

// --- Sub-components ---

function Section({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="mb-2 flex items-center gap-2 text-xs font-medium text-gray-500">
        {icon}
        {title}
      </div>
      {children}
    </div>
  );
}

function RACIDisplay({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div>
      <span className={`text-xs font-medium ${color}`}>{label}</span>
      <p className="mt-0.5 text-sm text-gray-700">{value || 'TBD'}</p>
    </div>
  );
}

function EditableRACIRow({ label, value, color, onSave }: { label: string; value: string; color: string; onSave: (v: string) => void }) {
  const [editing, setEditing] = useState(false);
  const [inputValue, setInputValue] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { if (editing) inputRef.current?.focus(); }, [editing]);

  function save() {
    const trimmed = inputValue.trim();
    if (trimmed !== value) onSave(trimmed);
    setEditing(false);
  }

  return (
    <div>
      <span className={`text-xs font-medium ${color}`}>{label}</span>
      {editing ? (
        <input
          ref={inputRef}
          value={inputValue}
          onChange={e => setInputValue(e.target.value)}
          onBlur={save}
          onKeyDown={e => { if (e.key === 'Enter') save(); if (e.key === 'Escape') { setInputValue(value); setEditing(false); } }}
          className="mt-0.5 w-full border-b border-mma-blue bg-transparent text-sm text-gray-700 focus:outline-none"
        />
      ) : (
        <p
          className="group/raci mt-0.5 cursor-pointer text-sm text-gray-700"
          onClick={() => { setInputValue(value); setEditing(true); }}
        >
          {value || 'TBD'}
          <Pencil className="ml-1 inline h-3 w-3 text-gray-300 opacity-0 group-hover/raci:opacity-100" />
        </p>
      )}
    </div>
  );
}

function EditableField({ label, value, type = 'text', onSave }: { label: string; value: string; type?: string; onSave: (v: string) => void }) {
  const [editing, setEditing] = useState(false);
  const [inputValue, setInputValue] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { if (editing) inputRef.current?.focus(); }, [editing]);

  function save() {
    if (inputValue !== value) onSave(inputValue);
    setEditing(false);
  }

  // Format date for display
  function formatDisplay(v: string) {
    if (!v) return 'Not set';
    if (type === 'date' && /^\d{4}/.test(v)) {
      try { return new Date(v).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); } catch { return v; }
    }
    return v;
  }

  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-xs text-gray-500">{label}</span>
      {editing ? (
        <input
          ref={inputRef}
          type={type}
          value={inputValue}
          onChange={e => setInputValue(e.target.value)}
          onBlur={save}
          onKeyDown={e => { if (e.key === 'Enter') save(); if (e.key === 'Escape') { setInputValue(value); setEditing(false); } }}
          className="w-32 border-b border-mma-blue bg-transparent text-right text-sm text-gray-700 focus:outline-none"
        />
      ) : (
        <span
          className="group/field cursor-pointer text-sm text-gray-700"
          onClick={() => { setInputValue(value); setEditing(true); }}
        >
          {formatDisplay(value)}
          <Pencil className="ml-1 inline h-3 w-3 text-gray-300 opacity-0 group-hover/field:opacity-100" />
        </span>
      )}
    </div>
  );
}

function TagsEditor({ tags, onChange }: { tags: string[]; onChange: (tags: string[]) => void }) {
  const [newTag, setNewTag] = useState('');

  function addTag() {
    const trimmed = newTag.trim();
    if (trimmed && !tags.includes(trimmed)) {
      onChange([...tags, trimmed]);
    }
    setNewTag('');
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1">
        {tags.map(tag => (
          <span key={tag} className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
            {tag}
            <button onClick={() => onChange(tags.filter(t => t !== tag))} className="text-gray-400 hover:text-red-400">
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <input
          value={newTag}
          onChange={e => setNewTag(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') addTag(); }}
          placeholder="Add tag..."
          className="flex-1 rounded-lg border border-gray-200 px-2 py-1 text-xs focus:border-gray-400 focus:outline-none"
        />
        <button onClick={addTag} className="rounded p-1 text-gray-400 hover:text-gray-600">
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

function EditableCommentsSection({ comments, onSave }: { comments: string; onSave: (v: string) => void }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(comments);
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => { if (editing) ref.current?.focus(); }, [editing]);

  function save() {
    if (value !== comments) onSave(value);
    setEditing(false);
  }

  return (
    <Section icon={<MessageSquare className="h-4 w-4" />} title="MMA Comments">
      {editing ? (
        <div>
          <textarea
            ref={ref}
            value={value}
            onChange={e => setValue(e.target.value)}
            onKeyDown={e => { if (e.key === 'Escape') { setValue(comments); setEditing(false); } }}
            rows={3}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 focus:border-gray-400 focus:outline-none"
          />
          <div className="mt-1 flex gap-2">
            <button onClick={save} className="text-xs text-gray-500 hover:text-gray-700">Save</button>
            <button onClick={() => { setValue(comments); setEditing(false); }} className="text-xs text-gray-400 hover:text-gray-600">Cancel</button>
          </div>
        </div>
      ) : (
        <div className="group/cmt cursor-pointer" onClick={() => { setValue(comments); setEditing(true); }}>
          {comments ? (
            <p className="text-sm leading-relaxed text-gray-600">
              {comments}
              <Pencil className="ml-1 inline h-3 w-3 text-gray-300 opacity-0 group-hover/cmt:opacity-100" />
            </p>
          ) : (
            <p className="text-sm italic text-gray-400">Add comments...</p>
          )}
        </div>
      )}
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
            />
            <span className={`flex-1 text-sm ${task.done ? 'text-gray-400 line-through' : 'text-gray-700'}`}>{task.text}</span>
            <button onClick={() => onChange(tasks.filter(t => t.id !== task.id))} className="text-gray-300 opacity-0 hover:text-red-400 group-hover/task:opacity-100">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
        <div className="flex items-center gap-2">
          <input value={text} onChange={e => setText(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') addTask(); }}
            placeholder="Add a task..." className="flex-1 rounded-lg border border-gray-200 px-2 py-1 text-sm focus:border-gray-400 focus:outline-none" />
          <button onClick={addTask} className="rounded p-1 text-gray-400 hover:text-gray-600"><Plus className="h-4 w-4" /></button>
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
    setUrl(''); setLabel('');
  }

  return (
    <Section icon={<LinkIcon className="h-4 w-4" />} title="Links">
      <div className="space-y-1.5">
        {links.map(link => (
          <div key={link.id} className="group/link flex items-center gap-2">
            <a href={link.url} target="_blank" rel="noopener noreferrer" className="text-sm text-mma-blue hover:underline">{link.label}</a>
            <span className="truncate text-xs text-gray-400">{link.url}</span>
            <button onClick={() => onChange(links.filter(l => l.id !== link.id))} className="ml-auto text-gray-300 opacity-0 hover:text-red-400 group-hover/link:opacity-100">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
        <div className="flex items-center gap-2">
          <input value={url} onChange={e => setUrl(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') addLink(); }}
            placeholder="URL" className="flex-1 rounded-lg border border-gray-200 px-2 py-1 text-sm focus:border-gray-400 focus:outline-none" />
          <input value={label} onChange={e => setLabel(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') addLink(); }}
            placeholder="Label" className="w-24 rounded-lg border border-gray-200 px-2 py-1 text-sm focus:border-gray-400 focus:outline-none" />
          <button onClick={addLink} className="rounded p-1 text-gray-400 hover:text-gray-600"><Plus className="h-4 w-4" /></button>
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
          <input value={text} onChange={e => setText(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') addNote(); }}
            placeholder="Add a note..." className="flex-1 rounded-lg border border-gray-200 px-2 py-1 text-sm focus:border-gray-400 focus:outline-none" />
          <button onClick={addNote} className="rounded p-1 text-gray-400 hover:text-gray-600"><Plus className="h-4 w-4" /></button>
        </div>
        {notes.map(note => (
          <div key={note.id} className="group/note rounded-lg bg-gray-50 px-3 py-2">
            <div className="flex items-start justify-between">
              <p className="text-sm text-gray-700">{note.text}</p>
              <button onClick={() => onChange(notes.filter(n => n.id !== note.id))} className="ml-2 shrink-0 text-gray-300 opacity-0 hover:text-red-400 group-hover/note:opacity-100">
                <X className="h-3 w-3" />
              </button>
            </div>
            <span className="mt-1 block text-xs text-gray-400">{new Date(note.created_at).toLocaleString()}</span>
          </div>
        ))}
      </div>
    </Section>
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
    setName(''); setRole('');
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
            {person.role && <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">{person.role}</span>}
            <button onClick={() => onChange(people.filter(p => p.id !== person.id))} className="ml-auto text-gray-300 opacity-0 hover:text-red-400 group-hover/person:opacity-100">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
        <div className="flex items-center gap-2">
          <input value={name} onChange={e => setName(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') addPerson(); }}
            placeholder="Name" className="flex-1 rounded-lg border border-gray-200 px-2 py-1 text-sm focus:border-gray-400 focus:outline-none" />
          <input value={role} onChange={e => setRole(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') addPerson(); }}
            placeholder="Role" className="w-24 rounded-lg border border-gray-200 px-2 py-1 text-sm focus:border-gray-400 focus:outline-none" />
          <button onClick={addPerson} className="rounded p-1 text-gray-400 hover:text-gray-600"><Plus className="h-4 w-4" /></button>
        </div>
      </div>
    </Section>
  );
}
