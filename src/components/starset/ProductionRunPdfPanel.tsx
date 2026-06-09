import { useState } from 'react';
import { X, Download, FileText, ExternalLink } from 'lucide-react';

interface PdfDoc {
  id: string;
  title: string;
  description: string;
  url: string;
}

const DOCS: PdfDoc[] = [
  {
    id: 'quality-review',
    title: 'v9 Data Quality Review',
    description: 'Pre-production data quality dossier — issue catalog, thresholds, and review playbook.',
    url: '/mma-tracker/data/v9-data-quality-review.pdf',
  },
  {
    id: 'technical',
    title: 'Technical Reference / Data Dictionary',
    description: 'Column-level definitions, derived metrics, and pipeline notes for the comparison table.',
    url: '/mma-tracker/data/v9-technical-reference.pdf',
  },
];

interface Props {
  open: boolean;
  onClose: () => void;
}

export function ProductionRunPdfPanel({ open, onClose }: Props) {
  const [previewId, setPreviewId] = useState<string | null>(null);
  if (!open) return null;
  const previewDoc = DOCS.find((d) => d.id === previewId) ?? null;

  return (
    <aside
      className="fixed right-0 top-0 z-[1080] flex h-screen w-full max-w-[420px] flex-col border-l border-gray-200 bg-white shadow-xl"
      role="dialog"
      aria-label="Reference documents"
    >
      <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-gray-400">Reference</div>
          <div className="mt-1 text-base font-bold text-[#001A41]">Reference Docs</div>
        </div>
        <button
          onClick={onClose}
          className="rounded-md p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
          aria-label="Close reference docs panel"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        <div className="space-y-3">
          {DOCS.map((doc) => {
            const isPreview = previewId === doc.id;
            return (
              <div
                key={doc.id}
                className={`rounded-lg border px-3 py-3 transition-colors ${
                  isPreview ? 'border-[#009DE0] bg-[#009DE0]/5' : 'border-gray-200 bg-white'
                }`}
              >
                <button
                  onClick={() => setPreviewId(isPreview ? null : doc.id)}
                  className="flex w-full items-start gap-2 text-left"
                >
                  <FileText className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#001A41]" />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold text-[#001A41]">{doc.title}</div>
                    <div className="mt-0.5 text-xs text-gray-500">{doc.description}</div>
                  </div>
                </button>
                <div className="mt-2 flex items-center gap-2">
                  <a
                    href={doc.url}
                    download
                    className="inline-flex items-center gap-1 rounded-md border border-gray-200 bg-white px-2.5 py-1 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50"
                  >
                    <Download className="h-3 w-3" />
                    Download
                  </a>
                  <a
                    href={doc.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 rounded-md border border-gray-200 bg-white px-2.5 py-1 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50"
                  >
                    <ExternalLink className="h-3 w-3" />
                    Open
                  </a>
                  <button
                    onClick={() => setPreviewId(isPreview ? null : doc.id)}
                    className="ml-auto text-xs font-medium text-[#009DE0] hover:underline"
                  >
                    {isPreview ? 'Hide preview' : 'Preview'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {previewDoc && (
          <div className="mt-4 overflow-hidden rounded-lg border border-gray-200">
            <iframe
              src={previewDoc.url}
              title={`Preview of ${previewDoc.title}`}
              className="h-[60vh] w-full"
            />
          </div>
        )}
      </div>
    </aside>
  );
}
