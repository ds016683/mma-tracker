import { useState, useEffect, useRef } from 'react';
import { Download, Upload, FileText, Plus, ChevronDown, ChevronRight, X, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase/client';
import { useAuth } from '../../contexts/AuthContext';

const UPLOAD_ALLOWED_EMAILS = ['tanner@thirdhorizon.com', 'bobby@thirdhorizon.com'];

interface ReleaseDocument {
  id: string;
  version_number: number;
  file_name: string;
  storage_path: string;
  public_url: string;
  uploaded_by: string;
  uploaded_at: string;
  description: string | null;
  file_size: number | null;
  mime_type: string | null;
}

function formatBytes(bytes: number | null): string {
  if (!bytes) return '';
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
  });
}

export function ReportsAndReleaseNotesView() {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<ReleaseDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedVersions, setExpandedVersions] = useState<Set<number>>(new Set());
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [versions, setVersions] = useState<number[]>([]);

  const canUpload = UPLOAD_ALLOWED_EMAILS.includes(user?.email?.toLowerCase() ?? '');

  const fetchDocuments = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('release_documents')
      .select('*')
      .order('version_number', { ascending: false })
      .order('uploaded_at', { ascending: false });
    if (!error && data) {
      setDocuments(data);
      const vNums = [...new Set(data.map((d: ReleaseDocument) => d.version_number))].sort((a, b) => b - a);
      setVersions(vNums);
      // Auto-expand all versions on first load
      setExpandedVersions(new Set(vNums));
    }
    setLoading(false);
  };

  useEffect(() => { fetchDocuments(); }, []);

  const toggleVersion = (v: number) => {
    setExpandedVersions(prev => {
      const next = new Set(prev);
      next.has(v) ? next.delete(v) : next.add(v);
      return next;
    });
  };

  const docsForVersion = (v: number) => documents.filter(d => d.version_number === v);

  return (
    <div className="min-h-screen p-4 sm:p-6" style={{ background: '#f0f4f8' }}>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#001A41]">Reports & Release Notes</h1>
          <p className="mt-1 text-sm text-gray-500">
            Starset Analytics — versioned data release notes and reports
          </p>
        </div>
        {canUpload && (
          <button
            onClick={() => setShowUploadModal(true)}
            className="flex items-center gap-2 rounded-lg bg-[#001A41] px-4 py-2.5 text-sm font-semibold text-white shadow transition hover:bg-[#003366]"
          >
            <Upload className="h-4 w-4" />
            Upload Document
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-[#009DE0]" />
        </div>
      ) : versions.length === 0 ? (
        <div className="rounded-xl bg-white p-12 text-center shadow">
          <FileText className="mx-auto mb-3 h-10 w-10 text-gray-300" />
          <p className="text-gray-500">No documents uploaded yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {versions.map(v => (
            <div key={v} className="overflow-hidden rounded-xl bg-white shadow">
              {/* Version header */}
              <button
                onClick={() => toggleVersion(v)}
                className="flex w-full items-center justify-between px-5 py-4 text-left transition hover:bg-gray-50"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#001A41] text-xs font-bold text-white">
                    v{v}
                  </span>
                  <div>
                    <span className="font-semibold text-[#001A41]">
                      Starset Analytics — Version {v}
                    </span>
                    <span className="ml-3 text-xs text-gray-400">
                      {docsForVersion(v).length} file{docsForVersion(v).length !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
                {expandedVersions.has(v)
                  ? <ChevronDown className="h-4 w-4 text-gray-400" />
                  : <ChevronRight className="h-4 w-4 text-gray-400" />}
              </button>

              {/* File list */}
              {expandedVersions.has(v) && (
                <div className="border-t border-gray-100">
                  {docsForVersion(v).map((doc, i) => (
                    <div
                      key={doc.id}
                      className={`flex items-center justify-between gap-4 px-5 py-3.5 ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/60'}`}
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <FileText className="h-5 w-5 flex-shrink-0 text-[#009DE0]" />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-gray-800">
                            {doc.file_name.replace(/_/g, ' ').replace(/\.docx$/i, '')}
                          </p>
                          <p className="text-xs text-gray-400">
                            {doc.uploaded_by} · {formatDate(doc.uploaded_at)}
                            {doc.file_size ? ` · ${formatBytes(doc.file_size)}` : ''}
                          </p>
                          {doc.description && (
                            <p className="mt-0.5 text-xs text-gray-500">{doc.description}</p>
                          )}
                        </div>
                      </div>
                      <a
                        href={doc.public_url}
                        download={doc.file_name}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex flex-shrink-0 items-center gap-1.5 rounded-lg border border-[#009DE0] px-3 py-1.5 text-xs font-semibold text-[#009DE0] transition hover:bg-[#009DE0] hover:text-white"
                      >
                        <Download className="h-3.5 w-3.5" />
                        Download
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && canUpload && (
        <UploadModal
          existingVersions={versions}
          onClose={() => setShowUploadModal(false)}
          onUploaded={() => { setShowUploadModal(false); fetchDocuments(); }}
          uploaderEmail={user?.email ?? ''}
        />
      )}
    </div>
  );
}

function UploadModal({
  existingVersions,
  onClose,
  onUploaded,
  uploaderEmail,
}: {
  existingVersions: number[];
  onClose: () => void;
  onUploaded: () => void;
  uploaderEmail: string;
}) {
  const [selectedVersion, setSelectedVersion] = useState<number | ''>('');
  const [newVersion, setNewVersion] = useState('');
  const [addingNew, setAddingNew] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [description, setDescription] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const versionToUse = addingNew ? (parseInt(newVersion) || '') : selectedVersion;

  const handleUpload = async () => {
    if (!file || versionToUse === '') {
      setError('Please select a version and a file.');
      return;
    }
    const vNum = versionToUse as number;
    if (isNaN(vNum) || vNum < 1) {
      setError('Version must be a positive number.');
      return;
    }
    setUploading(true);
    setError('');
    try {
      const safeName = file.name.replace(/\s+/g, '_');
      const storagePath = `v${vNum}/${Date.now()}_${safeName}`;
      const { error: uploadErr } = await supabase.storage
        .from('release-documents')
        .upload(storagePath, file, { contentType: file.type, upsert: false });
      if (uploadErr) throw uploadErr;

      const { data: urlData } = supabase.storage
        .from('release-documents')
        .getPublicUrl(storagePath);

      const { error: dbErr } = await supabase.from('release_documents').insert({
        version_number: vNum,
        file_name: safeName,
        storage_path: storagePath,
        public_url: urlData.publicUrl,
        uploaded_by: uploaderEmail,
        description: description || null,
        file_size: file.size,
        mime_type: file.type,
      });
      if (dbErr) throw dbErr;
      onUploaded();
    } catch (e: unknown) {
      setError((e as Error)?.message ?? 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  // Sort existing versions descending
  const sortedVersions = [...existingVersions].sort((a, b) => b - a);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">
        {/* Modal header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <h2 className="font-bold text-[#001A41]">Upload Document</h2>
          <button onClick={onClose} className="rounded-md p-1 text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4 px-6 py-5">
          {/* Version selector */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500">
              Version
            </label>
            {!addingNew ? (
              <div className="flex gap-2">
                <select
                  value={selectedVersion}
                  onChange={e => setSelectedVersion(e.target.value === '' ? '' : parseInt(e.target.value))}
                  className="flex-1 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm focus:border-[#009DE0] focus:outline-none"
                >
                  <option value="">Select version…</option>
                  {sortedVersions.map(v => (
                    <option key={v} value={v}>Version {v}</option>
                  ))}
                </select>
                <button
                  onClick={() => setAddingNew(true)}
                  className="flex items-center gap-1 rounded-lg border border-dashed border-gray-300 px-3 py-2 text-xs text-gray-500 hover:border-[#009DE0] hover:text-[#009DE0]"
                >
                  <Plus className="h-3.5 w-3.5" />
                  New version
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <input
                  type="number"
                  min={1}
                  placeholder="e.g. 9"
                  value={newVersion}
                  onChange={e => setNewVersion(e.target.value)}
                  className="flex-1 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm focus:border-[#009DE0] focus:outline-none"
                />
                <button
                  onClick={() => { setAddingNew(false); setNewVersion(''); }}
                  className="rounded-lg border border-gray-200 px-3 py-2 text-xs text-gray-400 hover:text-gray-600"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>

          {/* File picker */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500">
              File
            </label>
            <div
              onClick={() => fileRef.current?.click()}
              className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-200 py-6 transition hover:border-[#009DE0] hover:bg-blue-50/30"
            >
              {file ? (
                <div className="text-center">
                  <FileText className="mx-auto mb-1 h-6 w-6 text-[#009DE0]" />
                  <p className="text-sm font-medium text-gray-700">{file.name}</p>
                  <p className="text-xs text-gray-400">{formatBytes(file.size)}</p>
                </div>
              ) : (
                <div className="text-center">
                  <Upload className="mx-auto mb-1 h-6 w-6 text-gray-300" />
                  <p className="text-sm text-gray-400">Click to select a file</p>
                </div>
              )}
              <input
                ref={fileRef}
                type="file"
                className="hidden"
                onChange={e => setFile(e.target.files?.[0] ?? null)}
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500">
              Description <span className="font-normal normal-case text-gray-400">(optional)</span>
            </label>
            <input
              type="text"
              placeholder="Brief note about this document…"
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm focus:border-[#009DE0] focus:outline-none"
            />
          </div>

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 border-t border-gray-100 px-6 py-4">
          <button
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm text-gray-500 hover:text-gray-700"
          >
            Cancel
          </button>
          <button
            onClick={handleUpload}
            disabled={uploading}
            className="flex items-center gap-2 rounded-lg bg-[#001A41] px-5 py-2 text-sm font-semibold text-white disabled:opacity-50 hover:bg-[#003366]"
          >
            {uploading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {uploading ? 'Uploading…' : 'Upload'}
          </button>
        </div>
      </div>
    </div>
  );
}
