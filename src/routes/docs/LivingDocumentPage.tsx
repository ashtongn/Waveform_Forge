import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Link } from 'react-router-dom';
import LoadingScreen from '../../components/LoadingScreen';
import DocumentBody from './components/DocumentBody';
import DocumentSearch from './components/DocumentSearch';
import DocumentTOC from './components/DocumentTOC';
import CommentSidebar, { type PendingSelection } from './components/CommentSidebar';
import CollaborationStatus from './components/CollaborationStatus';
import SelectionToolbar from './components/SelectionToolbar';
import VersionBanner from './components/VersionBanner';
import { createAnchor, resolveAnchor } from './anchoring/anchor';
import { applyHighlights, clearHighlights } from './anchoring/highlight';
import { buildTextIndex, type TextIndex } from './anchoring/textOffsets';
import type { HighlightRange } from './anchoring/types';
import { useComments } from './comments/commentContext';
import { usePermissions } from './comments/permissions';
import { useDocumentOutline } from './hooks/useDocumentOutline';
import { useDocumentSearch } from './hooks/useDocumentSearch';
import { loadMarkdownDocument, type LoadedDocument } from './markdown/loader';
import { joinSections } from './source/sections';
import { useDocumentSource } from './source/useDocumentSource';
import type { DocumentSourceRepository } from './source/types';
import type { LivingDocumentDefinition } from './registry';

interface LivingDocumentPageProps {
  definition: LivingDocumentDefinition;
  /** Injected storage for the document body — see `DocumentSourceRepository`. */
  sourceRepository: DocumentSourceRepository;
}

/**
 * LivingDocumentPage — orchestrator for the reading, review and editing
 * experience.
 *
 * It is the only component that knows how the pieces fit together:
 *
 *   DocumentSource ──▶ DocumentBody (memoized sections)
 *                          │
 *                          ├─▶ text index ──▶ AnchorResolver ──▶ HighlightOverlay
 *                          ├─▶ outline ─────▶ DocumentTOC
 *                          └─▶ flat text ───▶ DocumentSearch
 *
 * Content, comment data and authorization all arrive through injected
 * repositories or context, so this file contains no storage or policy logic of
 * its own.
 */
export default function LivingDocumentPage({
  definition,
  sourceRepository,
}: LivingDocumentPageProps) {
  const permissions = usePermissions();
  const { threads, loading: commentsLoading, error, createThread } = useComments();

  const containerRef = useRef<HTMLDivElement>(null);
  const textIndexRef = useRef<TextIndex | null>(null);

  const [document_, setDocument] = useState<LoadedDocument | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [documentText, setDocumentText] = useState('');

  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [pendingSelection, setPendingSelection] = useState<PendingSelection | null>(null);
  const [mobilePanel, setMobilePanel] = useState<'none' | 'toc' | 'comments'>('none');

  // ---- Load the Markdown source -------------------------------------------
  useEffect(() => {
    let cancelled = false;
    setDocument(null);
    setLoadError(null);

    loadMarkdownDocument(definition.path, definition.title)
      .then((loaded) => {
        if (!cancelled) setDocument(loaded);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setLoadError(
            err instanceof Error ? err.message : 'Unable to load the document.',
          );
        }
      });

    return () => {
      cancelled = true;
    };
  }, [definition.path, definition.title]);

  const source = useDocumentSource(
    definition.commentNamespace,
    sourceRepository,
    document_?.content ?? null,
  );

  // ---- Index the rendered text once per content change ---------------------
  // `revision` changes whenever a section is added or edited, which is exactly
  // when the flat text — and therefore every anchor offset — must be rebuilt.
  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container || source.sections.length === 0) return;

    clearHighlights(container);
    const index = buildTextIndex(container);
    textIndexRef.current = index;
    setDocumentText(index.text);
  }, [source.revision, source.sections.length, editingSectionId]);

  const search = useDocumentSearch(documentText, threads);
  const outline = useDocumentOutline(containerRef, source.revision);

  // ---- Resolve every anchor against the current text -----------------------
  const resolutions = useMemo(() => {
    const map = new Map<string, { start: number; end: number } | null>();
    if (!documentText) return map;

    for (const thread of threads) {
      const resolved = resolveAnchor(thread.anchor, documentText);
      map.set(
        thread.id,
        resolved.status === 'orphan'
          ? null
          : { start: resolved.start, end: resolved.end },
      );
    }
    return map;
  }, [threads, documentText]);

  const detachedThreadIds = useMemo(
    () =>
      new Set(
        threads.filter((thread) => !resolutions.get(thread.id)).map((thread) => thread.id),
      ),
    [threads, resolutions],
  );

  // ---- Compose the full set of ranges to paint -----------------------------
  const highlightRanges = useMemo<HighlightRange[]>(() => {
    const ranges: HighlightRange[] = [];

    for (const thread of threads) {
      const resolved = resolutions.get(thread.id);
      if (!resolved) continue;
      ranges.push({
        id: thread.id,
        start: resolved.start,
        end: resolved.end,
        kind: thread.status === 'resolved' ? 'resolved' : 'comment',
      });
    }

    search.matches.forEach((match, index) => {
      ranges.push({
        id: `search-${index}`,
        start: match.start,
        end: match.end,
        kind: index === search.activeIndex ? 'search-active' : 'search',
      });
    });

    return ranges;
  }, [threads, resolutions, search.matches, search.activeIndex]);

  // ---- Paint highlights, then honour any pending scroll intent -------------
  const lastScrolledThread = useRef<string | null>(null);
  const lastScrolledMatch = useRef<number>(-1);

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container || !documentText) return;

    textIndexRef.current = applyHighlights(container, highlightRanges);

    if (activeThreadId && activeThreadId !== lastScrolledThread.current) {
      lastScrolledThread.current = activeThreadId;
      scrollTo(container.querySelector(`[data-wf-thread~="${activeThreadId}"]`));
    }

    if (search.activeIndex >= 0 && search.activeIndex !== lastScrolledMatch.current) {
      lastScrolledMatch.current = search.activeIndex;
      scrollTo(container.querySelector('[data-wf-search-active]'));
    }
  }, [highlightRanges, documentText, activeThreadId, search.activeIndex]);

  // Remove DOM mutations on unmount so React's cleanup sees a pristine tree.
  useEffect(
    () => () => {
      if (containerRef.current) clearHighlights(containerRef.current);
    },
    [],
  );

  const getTextIndex = useCallback(() => textIndexRef.current, []);

  // ---- Interactions --------------------------------------------------------
  const handleDocumentClick = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    const target = (event.target as HTMLElement).closest('[data-wf-thread]');
    if (!target) return;
    const [first] = (target.getAttribute('data-wf-thread') ?? '').split(' ');
    if (!first) return;

    setActiveThreadId(first);
    setMobilePanel((current) => (current === 'none' ? current : 'comments'));
    const card = window.document.getElementById(`wf-thread-${first}`);
    card?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, []);

  const handleAddComment = useCallback((selection: PendingSelection) => {
    setPendingSelection(selection);
    if (window.innerWidth < 1280) setMobilePanel('comments');
  }, []);

  const submitPendingComment = useCallback(
    async (body: string) => {
      if (!pendingSelection) return;
      const anchor = createAnchor(documentText, pendingSelection.start, pendingSelection.end);
      const id = await createThread(anchor, body);
      setPendingSelection(null);
      setActiveThreadId(id);
    },
    [pendingSelection, documentText, createThread],
  );

  const navigateToHeading = useCallback((id: string) => {
    window.document.getElementById(id)?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
    setMobilePanel('none');
  }, []);

  // ---- Document editing ----------------------------------------------------
  const requireAuthor = useCallback(() => {
    const { uid, name } = permissions.actor;
    if (!uid) throw new Error('You must be signed in to edit this document.');
    return { uid, name };
  }, [permissions]);

  const saveSection = useCallback(
    async (sectionId: string, content: string) => {
      await source.saveSection(sectionId, content, requireAuthor());
      setEditingSectionId(null);
    },
    [source, requireAuthor],
  );

  const stopEditing = useCallback(() => setEditingSectionId(null), []);

  const importFromRepository = useCallback(() => {
    setActionError(null);
    source.importFromRepository(requireAuthor()).catch((err: unknown) => {
      setActionError(
        err instanceof Error ? err.message : 'Could not import the document.',
      );
    });
  }, [source, requireAuthor]);

  const exportMarkdown = useCallback(() => {
    if (!document_) return;

    const body = joinSections(source.sections.map((section) => section.content));
    const blob = new Blob([`${document_.frontMatter}${body}\n`], {
      type: 'text/markdown;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);

    const link = window.document.createElement('a');
    link.href = url;
    link.download = definition.path.split('/').pop() ?? 'document.md';
    link.click();
    URL.revokeObjectURL(url);
  }, [document_, source.sections, definition.path]);

  const canEditDocument = permissions.can('editDocument') && source.live;

  const openCount = threads.filter((thread) => thread.status === 'open').length;
  const resolvedCount = threads.length - openCount;

  if (loadError) {
    return (
      <div className="border border-red-500/40 bg-red-500/5 p-6">
        <h1 className="text-lg font-semibold text-forge-text">Document unavailable</h1>
        <p className="mt-2 text-sm text-forge-muted">{loadError}</p>
        <Link to="/training" className="mt-4 inline-block text-sm text-forge-accent">
          ← Back to Training Lab
        </Link>
      </div>
    );
  }

  if (!document_) return <LoadingScreen />;

  const sidebar = (
    <CommentSidebar
      threads={threads}
      loading={commentsLoading}
      error={error}
      detachedThreadIds={detachedThreadIds}
      activeThreadId={activeThreadId}
      onSelectThread={setActiveThreadId}
      pendingSelection={pendingSelection}
      onSubmitPending={submitPendingComment}
      onCancelPending={() => setPendingSelection(null)}
      globalMatchIds={
        search.query.trim().length >= 2 ? search.matchingThreadIds : null
      }
    />
  );

  const navigation = (
    <div className="flex flex-col gap-4">
      <DocumentSearch search={search} commentMatchCount={search.matchingThreadIds.size} />
      <DocumentTOC
        headings={outline.headings}
        activeId={outline.activeId}
        onNavigate={navigateToHeading}
      />
    </div>
  );

  return (
    <div className="space-y-4">
      <nav
        aria-label="Breadcrumb"
        className="font-mono text-sm uppercase tracking-widest text-forge-muted"
      >
        <Link to="/training" className="transition-colors hover:text-forge-signal">
          Training Lab
        </Link>
        <span className="mx-2 text-forge-border">/</span>
        <span className="text-forge-text">Training Plan</span>
      </nav>

      <VersionBanner
        metadata={document_.metadata}
        sourcePath={definition.path}
        live={source.live}
        lastUpdatedAt={source.lastUpdatedAt}
        lastEditor={source.lastEditor}
        openThreadCount={openCount}
        resolvedThreadCount={resolvedCount}
        onExport={exportMarkdown}
      />

      <CollaborationStatus />

      {/* One-time promotion of the repository copy into the editable store. */}
      {!source.live && !source.loading && permissions.can('importDocument') && (
        <div className="flex flex-wrap items-center gap-3 border border-forge-accent/40 bg-forge-accent/5 px-4 py-3">
          <p className="flex-1 text-sm leading-relaxed text-forge-muted">
            This document is being served from the repository copy and cannot be
            edited yet. Importing it once makes each section editable by any
            approved member.
          </p>
          <button
            type="button"
            onClick={importFromRepository}
            className="border border-forge-accent/60 px-3 py-2 font-mono text-[0.65rem] uppercase tracking-[0.12em] text-forge-accent transition-colors hover:bg-forge-accent/10"
          >
            Enable editing
          </button>
        </div>
      )}

      {/* Storage problems are only actionable for members who can edit. */}
      {(actionError || (source.error && permissions.can('editDocument'))) && (
        <p className="border border-red-500/40 bg-red-500/5 px-4 py-2.5 text-sm text-red-300">
          {actionError ?? source.error}
        </p>
      )}

      {/* Compact controls for tablet / mobile, where the rails are hidden. */}
      <div className="flex gap-2 xl:hidden">
        <button
          type="button"
          onClick={() => setMobilePanel(mobilePanel === 'toc' ? 'none' : 'toc')}
          className="flex-1 border border-forge-border px-3 py-2 font-mono text-[0.62rem] uppercase tracking-[0.12em] text-forge-muted transition-colors hover:text-forge-accent"
        >
          Contents & search
        </button>
        <button
          type="button"
          onClick={() => setMobilePanel(mobilePanel === 'comments' ? 'none' : 'comments')}
          className="flex-1 border border-forge-border px-3 py-2 font-mono text-[0.62rem] uppercase tracking-[0.12em] text-forge-muted transition-colors hover:text-forge-accent"
        >
          Comments ({openCount})
        </button>
      </div>

      <div className="gap-6 xl:grid xl:grid-cols-[15rem_minmax(0,1fr)_21rem]">
        <div className="hidden xl:block">
          <div className="sticky top-6 max-h-[calc(100vh-3rem)] overflow-y-auto pr-1">
            {navigation}
          </div>
        </div>

        <div
          ref={containerRef}
          onClick={handleDocumentClick}
          className="min-w-0 border border-forge-border bg-forge-panel/40 px-5 py-6 sm:px-8 sm:py-8"
        >
          <DocumentBody
            sections={source.sections}
            canEdit={canEditDocument}
            editingSectionId={editingSectionId}
            onStartEditing={setEditingSectionId}
            onCancelEditing={stopEditing}
            onSaveSection={saveSection}
          />
        </div>

        <div className="hidden xl:block">
          <div className="sticky top-6 h-[calc(100vh-3rem)]">{sidebar}</div>
        </div>
      </div>

      {/* Slide-out panels below the xl breakpoint. */}
      {mobilePanel !== 'none' && (
        <div className="fixed inset-0 z-30 xl:hidden">
          <button
            type="button"
            aria-label="Close panel"
            onClick={() => setMobilePanel('none')}
            className="absolute inset-0 bg-black/60"
          />
          <div className="absolute inset-y-0 right-0 flex w-[min(24rem,92vw)] flex-col border-l border-forge-border bg-forge-bg p-4">
            <button
              type="button"
              onClick={() => setMobilePanel('none')}
              className="mb-3 self-end font-mono text-[0.62rem] uppercase tracking-[0.12em] text-forge-muted hover:text-forge-text"
            >
              Close ✕
            </button>
            <div className="min-h-0 flex-1 overflow-y-auto">
              {mobilePanel === 'toc' ? navigation : sidebar}
            </div>
          </div>
        </div>
      )}

      <SelectionToolbar
        containerRef={containerRef}
        getTextIndex={getTextIndex}
        enabled={permissions.can('highlight')}
        onAddComment={handleAddComment}
      />
    </div>
  );
}

function scrollTo(element: Element | null) {
  element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
}
