import { useEffect, useRef, useState } from 'react';

interface CommentComposerProps {
  submitLabel: string;
  placeholder: string;
  initialValue?: string;
  autoFocus?: boolean;
  onSubmit(body: string): Promise<void> | void;
  onCancel(): void;
}

/**
 * CommentComposer — plain-text authoring box shared by new threads, replies and
 * edits.
 *
 * Comment bodies are stored and rendered as plain text (never as Markdown/HTML)
 * because they are the only user-submitted content on the page; that removes an
 * entire class of injection risk.
 *
 * Cmd/Ctrl+Enter submits, Escape cancels.
 */
export default function CommentComposer({
  submitLabel,
  placeholder,
  initialValue = '',
  autoFocus = false,
  onSubmit,
  onCancel,
}: CommentComposerProps) {
  const [value, setValue] = useState(initialValue);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (autoFocus) textareaRef.current?.focus();
  }, [autoFocus]);

  async function submit() {
    const body = value.trim();
    if (!body || busy) return;

    setBusy(true);
    setError(null);
    try {
      await onSubmit(body);
      setValue('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save the comment.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <textarea
        ref={textareaRef}
        rows={3}
        value={value}
        placeholder={placeholder}
        onChange={(event) => setValue(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Escape') {
            event.preventDefault();
            onCancel();
          }
          if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
            event.preventDefault();
            void submit();
          }
        }}
        className="w-full resize-y border border-forge-border bg-black/30 px-2.5 py-2 text-sm leading-relaxed text-forge-text placeholder:text-forge-muted/60 focus:border-forge-accent/60 focus:outline-none"
      />

      {error && <p className="text-xs text-red-400">{error}</p>}

      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={busy || value.trim().length === 0}
          onClick={() => void submit()}
          className="border border-forge-accent/60 px-3 py-1.5 font-mono text-[0.65rem] uppercase tracking-[0.12em] text-forge-accent transition-colors hover:bg-forge-accent/10 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {busy ? 'Saving…' : submitLabel}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-2 py-1.5 font-mono text-[0.65rem] uppercase tracking-[0.12em] text-forge-muted transition-colors hover:text-forge-text"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
