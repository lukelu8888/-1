import React from 'react';
import { createPortal } from 'react-dom';
import { FileText, X } from 'lucide-react';
import { Button } from '../ui/button';

export type StandardDocumentViewerShellProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: React.ReactNode;
  templateLabel?: string;
  templateVersionPrefix?: string;
  closeLabel?: string;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
  headerBadges?: React.ReactNode;
  headerFooter?: React.ReactNode;
  children: React.ReactNode;
  bodyClassName?: string;
  innerClassName?: string;
};

const normalizeHeaderMeta = (value: React.ReactNode) => {
  if (
    value == null ||
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean'
  ) {
    return value;
  }

  if (React.isValidElement(value)) {
    return value;
  }

  if (typeof value === 'object') {
    const candidate = value as Record<string, unknown>;
    const normalized =
      candidate.version_label ||
      candidate.version_no ||
      candidate.version ||
      candidate.label ||
      candidate.name ||
      candidate.id;

    if (
      normalized != null &&
      (typeof normalized === 'string' || typeof normalized === 'number')
    ) {
      return String(normalized);
    }
  }

  return String(value);
};

export const StandardDocumentViewerShell: React.FC<StandardDocumentViewerShellProps> = ({
  open,
  onClose,
  title,
  subtitle,
  templateLabel,
  templateVersionPrefix = '模板版本',
  closeLabel = '关闭',
  icon,
  actions,
  headerBadges,
  headerFooter,
  children,
  bodyClassName = 'min-h-0 flex-1 overflow-y-auto overscroll-contain bg-gray-100 p-6',
  innerClassName = 'mx-auto max-w-[210mm]',
}) => {
  const resolvedTemplateLabel = normalizeHeaderMeta(templateLabel);
  const resolvedSubtitle = normalizeHeaderMeta(subtitle);

  React.useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', handleEsc);
    return () => {
      window.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose, open]);

  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center pointer-events-auto"
      role="dialog"
      aria-modal="true"
      onWheel={(event) => event.stopPropagation()}
      onTouchMove={(event) => event.stopPropagation()}
    >
      <div className="absolute inset-0 z-0 bg-black/60" onClick={onClose} />

      <div className="relative z-10 flex h-[95vh] w-[min(96vw,calc(210mm+140px))] flex-col overflow-hidden rounded-lg bg-white shadow-2xl pointer-events-auto">
        <div className="relative z-20 shrink-0 border-b border-gray-200 bg-gray-50 px-6 py-4">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-3">
                <div className="shrink-0 text-[#F96302]">{icon || <FileText className="h-6 w-6" />}</div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-lg font-bold text-gray-900">{title}</h2>
                    {resolvedTemplateLabel ? (
                      <span className="rounded-full border border-orange-200 bg-orange-50 px-2 py-0.5 text-xs font-semibold text-orange-700">
                        {templateVersionPrefix}: {resolvedTemplateLabel}
                      </span>
                    ) : null}
                    {headerBadges}
                  </div>
                  {resolvedSubtitle ? <div className="mt-1 text-sm text-gray-500">{resolvedSubtitle}</div> : null}
                </div>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-2 pointer-events-auto">
              {actions}
              <Button
                variant="ghost"
                size="sm"
                onClick={(event) => {
                  event.stopPropagation();
                  onClose();
                }}
                className="gap-2"
              >
                <X className="h-4 w-4" />
                {closeLabel}
              </Button>
            </div>
          </div>

          {headerFooter ? <div className="mt-3">{headerFooter}</div> : null}
        </div>

        <div className={bodyClassName} onClick={(event) => event.stopPropagation()}>
          <div className={innerClassName}>{children}</div>
        </div>
      </div>
    </div>,
    document.body,
  );
};

export default StandardDocumentViewerShell;
