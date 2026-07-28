import { useEffect, useMemo, useRef, useState } from 'react';
import MarkdownRenderer from './MarkdownRenderer';
import { numberMarkdown, type CounterState } from '../numbering/numbering';

interface SectionEditorProps {
  initialContent: string;
  /** Counter state entering this section, so the draft numbers correctly. */
  startCounters: CounterState;
  onSave(content: string): Promise<void>;
  onCancel(): void;
}

/** Draft key so an accidental navigation does not lose work. */
const draftKey = (content: string) => `wf-draft-${hash(content)}`;

/**
 * SectionEditor — plain Markdown source editing for one section.
 *
 * Deliberately not a WYSIWYG: the document's value is that it *is* Markdown, so
 * members edit the source and can flip to a live preview. Drafts are mirrored to
 * `localStorage`, so a dropped connection or a stray click does not lose work.
 *
 * Section numbers are generated, never authored. The source you type contains
 * only `### SDR Basics`; the outline strip above the editor shows the numbers
 * those headings will receive, recomputed on every keystroke, and the preview
 * renders them exactly as the document will. There is nothing to mis-type,
 * because the numbers do not exist in the text being edited.
 *
 * The whole editor is marked `data-wf-ignore` so its chrome never enters the
 * comment-anchoring text index.
 */
export default function SectionEditor({
  initialContent,
  startCounters,
  onSave,
  onCancel,
}: SectionEditorProps) {
  const [value, setValue] = useState(initialContent);
  const [preview, setPreview] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const key = useRef(draftKey(initialContent)).current;

  // Renumbered on every keystroke: insert a heading and everything below it in
  // this section immediately shows its new number.
  const numbered = useMemo(
    () => numberMarkdown(value, startCounters),
    [value, startCounters],
  );
  const labels = useMemo(
    () => numbered.headings.map((heading) => heading.label),
    [numbered],
  );

  // Restore a previous draft for this section, if one survived.
  useEffect(() => {
    const draft = window.localStorage.getItem(key);
    if (draft && draft !== initialContent) setValue(draft);
    textareaRef.current?.focus();
  }, [key, initialContent]);

  useEffect(() => {
    if (value === initialContent) window.localStorage.removeItem(key);
    else window.localStorage.setItem(key, value);
  }, [key, value, initialContent]);

  async function save() {
    if (busy || !value.trim()) return;
    setBusy(true);
    setError(null);
    try {
      await onSave(value);
      window.localStorage.removeItem(key);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save the section.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div data-wf-ignore className="my-4 border border-forge-accent/50 bg-black/20">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-forge-border px-3 py-2">
        <span className="font-mono text-[0.62rem] uppercase tracking-[0.14em] text-forge-accent">
          Editing section · Markdown source
        </span>
        <button
          type="button"
          onClick={() => setPreview((current) => !current)}
          className="font-mono text-[0.62rem] uppercase tracking-[0.12em] text-forge-muted transition-colors hover:text-forge-text"
        >
          {preview ? 'Edit source' : 'Preview'}
        </button>
      </div>

      {numbered.headings.length > 0 && (
        <div className="flex flex-wrap gap-x-4 gap-y-1 border-b border-forge-border/60 bg-black/20 px-4 py-2">
          <span className="font-mono text-[0.55rem] uppercase tracking-[0.14em] text-forge-muted/70">
            Generated numbering
          </span>
          {numbered.headings.map((heading, index) => (
            <span
              key={`${heading.label}-${index}`}
              className="font-mono text-[0.65rem] text-forge-muted"
              style={{ paddingLeft: `${(heading.depth - 2) * 0.75}rem` }}
            >
              <span className="select-none text-forge-accent">[{heading.label}]</span>{' '}
              {heading.text}
            </span>
          ))}
        </div>
      )}

      {preview ? (
        <div className="wf-doc px-4 py-3">
          <MarkdownRenderer content={value} headingLabels={labels} />
        </div>
      ) : (
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Escape') {
              event.preventDefault();
              onCancel();
            }
            if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
              event.preventDefault();
              void save();
            }
          }}
          spellCheck
          className="block max-h-[70vh] min-h-[16rem] w-full resize-y bg-transparent px-4 py-3 font-mono text-[0.82rem] leading-relaxed text-forge-text focus:outline-none"
          style={{ height: `${Math.min(value.split('\n').length + 4, 40) * 1.5}rem` }}
        />
      )}

      {error && <p className="px-4 pb-2 text-xs text-red-400">{error}</p>}

      <div className="flex items-center gap-2 border-t border-forge-border px-3 py-2">
        <button
          type="button"
          disabled={busy || !value.trim()}
          onClick={() => void save()}
          className="border border-forge-accent/60 px-3 py-1.5 font-mono text-[0.65rem] uppercase tracking-[0.12em] text-forge-accent transition-colors hover:bg-forge-accent/10 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {busy ? 'Saving…' : 'Save section'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-2 py-1.5 font-mono text-[0.65rem] uppercase tracking-[0.12em] text-forge-muted transition-colors hover:text-forge-text"
        >
          Cancel
        </button>
        <span className="ml-auto font-mono text-[0.58rem] uppercase tracking-[0.1em] text-forge-muted/70">
          ⌘/Ctrl + Enter to save
        </span>
      </div>
    </div>
  );
}

/** Small stable hash so drafts key off content rather than a volatile id. */
function hash(value: string): string {
  let out = 0x811c9dc5;
  for (let i = 0; i < value.length; i += 1) {
    out ^= value.charCodeAt(i);
    out = Math.imul(out, 0x01000193) >>> 0;
  }
  return out.toString(16);
}
