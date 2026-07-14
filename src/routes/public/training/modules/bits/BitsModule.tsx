import { useCallback, useEffect, useState } from 'react';
import { SEGMENTS } from './bitsData';
import BitstreamVisualization from './BitstreamVisualization';
import SegmentDetails from './SegmentDetails';
import ReceiveFlow from './ReceiveFlow';
import FieldLegend from './FieldLegend';

/** Milliseconds each field is highlighted during the guided receive scan. */
const SCAN_STEP_MS = 800;

/**
 * "Signal Bits Lab" training module. Walks learners through how a receiver
 * turns a raw bitstream into structured information, one field at a time.
 * Hover previews a field, click pins it, and the guided scan steps through the
 * whole frame. All content is an illustrative, non-operational teaching model.
 */
export default function BitsModule() {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [pinnedId, setPinnedId] = useState<string | null>(null);
  const [scanIndex, setScanIndex] = useState<number | null>(null);

  const isPlaying = scanIndex !== null && scanIndex < SEGMENTS.length;
  const scanSegment = isPlaying ? SEGMENTS[scanIndex] : null;
  const activeId = scanSegment ? scanSegment.id : pinnedId ?? hoveredId;
  const activeSegment = SEGMENTS.find((segment) => segment.id === activeId) ?? null;
  const pinnedActive = !isPlaying && pinnedId !== null && activeId === pinnedId;

  // Advance the guided scan one field at a time, then stop at the end.
  useEffect(() => {
    if (scanIndex === null) return;
    if (scanIndex >= SEGMENTS.length) {
      setScanIndex(null);
      return;
    }
    const timer = setTimeout(
      () => setScanIndex((index) => (index === null ? null : index + 1)),
      SCAN_STEP_MS,
    );
    return () => clearTimeout(timer);
  }, [scanIndex]);

  const handleHover = useCallback(
    (id: string | null) => {
      if (scanIndex !== null) return;
      setHoveredId(id);
    },
    [scanIndex],
  );

  const handleBitSelect = useCallback((id: string) => {
    setScanIndex(null);
    setPinnedId((current) => (current === id ? null : id));
  }, []);

  const handleLegendSelect = useCallback((id: string) => {
    setScanIndex(null);
    setPinnedId(id);
  }, []);

  const handlePlayToggle = useCallback(() => {
    setScanIndex((current) => {
      if (current !== null) return null;
      return 0;
    });
    setPinnedId(null);
    setHoveredId(null);
  }, []);

  const handleReset = useCallback(() => {
    setScanIndex(null);
    setPinnedId(null);
    setHoveredId(null);
  }, []);

  return (
    <div className="space-y-6">
      {/* Hero + interactive bitstream */}
      <section className="relative overflow-hidden border border-forge-border bg-forge-panel/80 px-5 py-10 text-center shadow-2xl sm:px-8">
        <p className="font-mono text-xs uppercase tracking-[0.18em] text-forge-accent">
          How a receiver interprets a digital frame
        </p>
        <h2 className="mx-auto mt-3 max-w-3xl text-3xl font-semibold tracking-tight sm:text-4xl">
          From raw bits to useful information
        </h2>
        <p className="mx-auto mt-4 max-w-2xl leading-relaxed text-forge-muted">
          A receiver does not see a message all at once. It detects timing, finds
          a known synchronization pattern, reads addressing and control
          information, extracts the payload, verifies integrity, and recognizes
          the end of the frame.
        </p>
        <p className="mt-5 text-sm text-[#d8e9ff]">
          Hover over a bit to identify its field. Click any bit or legend item to
          pin its explanation.
        </p>

        <p className="mt-6 font-mono text-[0.72rem] font-extrabold uppercase tracking-[0.12em] text-[#9fc8ff]">
          Select a digit to inspect its field
        </p>

        <div className="mt-3.5">
          <BitstreamVisualization
            segments={SEGMENTS}
            activeId={activeId}
            pinnedId={pinnedActive ? pinnedId : null}
            isPlaying={isPlaying}
            onHover={handleHover}
            onSelect={handleBitSelect}
          />
        </div>
      </section>

      {/* Details + receive flow */}
      <section className="grid grid-cols-1 gap-5 lg:grid-cols-[1.08fr_0.92fr]">
        <SegmentDetails segment={activeSegment} pinned={pinnedActive} />
        <ReceiveFlow
          activeFlow={activeSegment ? activeSegment.flow : null}
          isPlaying={isPlaying}
          onPlayToggle={handlePlayToggle}
          onReset={handleReset}
        />
      </section>

      {/* Field guide */}
      <FieldLegend
        segments={SEGMENTS}
        activeId={activeId}
        onSelect={handleLegendSelect}
      />

      <p className="mx-auto max-w-3xl text-center font-mono text-[0.72rem] leading-relaxed tracking-[0.04em] text-forge-muted/80">
        Training note: this is an illustrative packet layout. Exact field names,
        order, lengths, and behavior vary by waveform and protocol. Some protocols
        omit fields shown here, combine them, or define additional control and
        error-correction data.
      </p>
    </div>
  );
}
