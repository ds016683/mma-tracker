import { useState, useEffect } from 'react';
import { Radio, ExternalLink, CalendarDays, Archive, ChevronDown, ChevronRight, Loader2, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase/client';

export interface HorizonArticleLink {
  title: string;
  outlet: string;
  url: string;
  date: string;
}

export interface HorizonDigest {
  id: string;
  published_at: string;
  body: string[];
  articles: HorizonArticleLink[];
  is_current: boolean;
}

// ─── Data fetch ───────────────────────────────────────────────────────────────

async function fetchDigests(): Promise<HorizonDigest[]> {
  const { data, error } = await supabase
    .from('horizon_signal_digests')
    .select('*')
    .order('published_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as HorizonDigest[];
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  const d = new Date(iso + 'T12:00:00Z');
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

function daysSince(iso: string) {
  return Math.floor((Date.now() - new Date(iso + 'T12:00:00Z').getTime()) / 86400000);
}

// ─── View ─────────────────────────────────────────────────────────────────────

export function HorizonSignalView() {
  const [digests, setDigests] = useState<HorizonDigest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState<string | null>(null);

  useEffect(() => {
    fetchDigests()
      .then(setDigests)
      .catch(e => setError(e.message ?? 'Failed to load digests'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingState />;
  if (error)   return <ErrorState message={error} />;

  const current = digests.find(d => d.is_current) ?? digests[0] ?? null;
  const archive = digests.filter(d => !d.is_current);

  if (!current) return <EmptyState />;

  const age = daysSince(current.published_at);
  const sorted = [...current.articles].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return (
    <div className="min-h-screen bg-mma-light-bg p-4 sm:p-8">
      {/* Header */}
      <div className="mb-8 border-b border-[#001A41]/10 pb-6">
        <div className="flex items-center gap-3 mb-1">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#001A41]">
            <Radio className="h-5 w-5 text-[#009DE0]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#001A41] tracking-tight">The Horizon Signal</h1>
            <p className="text-xs text-mma-blue-gray uppercase tracking-widest font-medium">
              US Healthcare Market Intelligence · Region Engagement
            </p>
          </div>
        </div>
        <p className="mt-3 text-sm text-mma-blue-gray max-w-2xl">
          A weekly digest of US healthcare market developments relevant to employer plan design, payer-provider dynamics, network intelligence, and price transparency regulation.
        </p>
      </div>

      {/* Current digest card */}
      <div className="mb-8 rounded-2xl border border-[#001A41]/10 bg-white shadow-sm overflow-hidden max-w-4xl">
        {/* Card header */}
        <div className="flex items-center justify-between border-b border-[#001A41]/8 bg-[#001A41]/[0.03] px-6 py-4">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-[#009DE0]" />
            <span className="text-sm font-semibold text-[#001A41]">
              Week of {formatDate(current.published_at)}
            </span>
            <span className={`ml-2 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
              age <= 7  ? 'bg-green-50 text-green-700' :
              age <= 14 ? 'bg-amber-50 text-amber-700' :
                          'bg-gray-100 text-gray-500'
            }`}>
              {age === 0 ? 'Today' : age === 1 ? '1 day ago' : `${age} days ago`}
            </span>
          </div>
          <span className="rounded-full bg-[#009DE0]/10 px-3 py-1 text-xs font-semibold text-[#009DE0]">
            Current Edition
          </span>
        </div>

        {/* Body */}
        <div className="px-6 py-6 space-y-4">
          {current.body.map((para, i) => (
            <p key={i} className={`text-sm leading-relaxed ${
              i === 0 ? 'text-[#001A41] font-medium' : 'text-[#3a4a5c]'
            }`}>
              {para}
            </p>
          ))}
        </div>

        {/* Source articles */}
        <div className="border-t border-[#001A41]/8 px-6 py-5">
          <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-mma-blue-gray">
            Source Articles · {sorted.length}
          </p>
          <div className="space-y-2">
            {sorted.map((art, i) => (
              <a
                key={i}
                href={art.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-start justify-between gap-3 rounded-lg border border-[#001A41]/6 bg-[#001A41]/[0.02] px-4 py-3 hover:border-[#009DE0]/40 hover:bg-white transition-all"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-[#001A41] group-hover:text-[#009DE0] transition-colors leading-snug">
                    {art.title}
                  </p>
                  <p className="mt-0.5 text-xs text-mma-blue-gray">
                    {art.outlet} · {formatDate(art.date)}
                  </p>
                </div>
                <ExternalLink className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-mma-blue-gray/40 group-hover:text-[#009DE0] transition-colors" />
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* Cadence note */}
      <p className="max-w-4xl mb-10 text-xs text-mma-blue-gray/60">
        Published weekly every Monday. Content is AI-researched and auto-published by Mr. MMA on cadence.
      </p>

      {/* Archive */}
      <div className="max-w-4xl mt-4">
        <div className="flex items-center gap-2 mb-5 border-t border-[#001A41]/10 pt-8">
          <Archive className="h-4 w-4 text-mma-blue-gray" />
          <h2 className="text-xs font-bold uppercase tracking-widest text-mma-blue-gray">
            Past Editions · {archive.length} {archive.length === 1 ? 'entry' : 'entries'}
          </h2>
        </div>

        {archive.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[#001A41]/15 bg-white/50 px-6 py-8 text-center">
            <p className="text-sm text-mma-blue-gray/60">Past editions will appear here after each published cycle.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {archive.map(entry => (
              <ArchiveEntry key={entry.id} digest={entry} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Archive entry ────────────────────────────────────────────────────────────

function ArchiveEntry({ digest }: { digest: HorizonDigest }) {
  const [open, setOpen] = useState(false);
  const sorted = [...digest.articles].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return (
    <div className={`rounded-xl border bg-white shadow-sm overflow-hidden transition-all ${
      open ? 'border-[#009DE0]/30' : 'border-[#001A41]/8'
    }`}>
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between px-5 py-4 text-left hover:bg-[#001A41]/[0.02] transition-colors"
      >
        <div className="flex items-center gap-3">
          {open
            ? <ChevronDown className="h-4 w-4 text-[#009DE0] flex-shrink-0" />
            : <ChevronRight className="h-4 w-4 text-mma-blue-gray/50 flex-shrink-0" />}
          <div>
            <span className="text-sm font-semibold text-[#001A41]">
              Week of {formatDate(digest.published_at)}
            </span>
            <span className="ml-3 text-xs text-mma-blue-gray/60">
              {digest.articles.length} sources
            </span>
          </div>
        </div>
        <span className="text-xs text-mma-blue-gray/50 hidden sm:block">
          {open ? 'Collapse' : 'Expand'}
        </span>
      </button>

      {open && (
        <div className="border-t border-[#001A41]/8 px-5 py-5">
          <div className="space-y-3 mb-6">
            {digest.body.map((para, i) => (
              <p key={i} className={`text-sm leading-relaxed ${
                i === 0 ? 'text-[#001A41] font-medium' : 'text-[#3a4a5c]'
              }`}>
                {para}
              </p>
            ))}
          </div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-mma-blue-gray mb-2">
            Source Articles
          </p>
          <div className="space-y-1.5">
            {sorted.map((art, i) => (
              <a
                key={i}
                href={art.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-start justify-between gap-3 rounded-lg border border-[#001A41]/6 bg-[#001A41]/[0.02] px-4 py-3 hover:border-[#009DE0]/40 hover:bg-white transition-all"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-[#001A41] group-hover:text-[#009DE0] transition-colors leading-snug">
                    {art.title}
                  </p>
                  <p className="mt-0.5 text-xs text-mma-blue-gray">
                    {art.outlet} · {formatDate(art.date)}
                  </p>
                </div>
                <ExternalLink className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-mma-blue-gray/40 group-hover:text-[#009DE0] transition-colors" />
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Loading / error / empty states ──────────────────────────────────────────

function LoadingState() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="flex flex-col items-center gap-3 text-mma-blue-gray">
        <Loader2 className="h-6 w-6 animate-spin text-[#009DE0]" />
        <p className="text-sm">Loading Horizon Signal…</p>
      </div>
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center p-8">
      <div className="max-w-md text-center">
        <div className="mb-3 flex justify-center">
          <AlertCircle className="h-8 w-8 text-red-400" />
        </div>
        <p className="text-sm font-medium text-[#001A41]">Failed to load digest</p>
        <p className="mt-1 text-xs text-mma-blue-gray">{message}</p>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="text-center">
        <Radio className="mx-auto mb-3 h-8 w-8 text-mma-blue-gray/30" />
        <p className="text-sm text-mma-blue-gray">No digest published yet.</p>
      </div>
    </div>
  );
}
