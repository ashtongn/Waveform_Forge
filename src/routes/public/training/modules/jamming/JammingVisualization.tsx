import { useState } from 'react';
import { JAM_TYPES } from './jamTypes';
import JamTypeTabs from './JamTypeTabs';
import SpectrumCanvas from './SpectrumCanvas';

/**
 * Interactive educational trainer: tab bar + abstract spectrum canvas + a
 * "jamming active" toggle + a side panel explaining the selected category.
 * All content is conceptual and non-operational.
 */
export default function JammingVisualization() {
  const [selectedId, setSelectedId] = useState(JAM_TYPES[0].id);
  const [jammingActive, setJammingActive] = useState(false);

  const selected =
    JAM_TYPES.find((type) => type.id === selectedId) ?? JAM_TYPES[0];

  return (
    <section
      aria-label="Jamming type trainer"
      className="overflow-hidden border border-forge-border bg-forge-panel/80 shadow-2xl"
    >
      <JamTypeTabs selectedId={selectedId} onSelect={setSelectedId} />

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_330px]">
        {/* Visualization panel */}
        <div className="min-w-0 border-b border-forge-border p-4 sm:p-5 lg:border-b-0 lg:border-r">
          <div className="mb-3.5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-2 border border-forge-border bg-white/[0.025] px-2.5 py-1.5 font-mono text-[0.68rem] uppercase tracking-[0.09em] text-forge-muted">
                <span className="inline-block h-2 w-2 bg-[#3bb5ff] shadow-[0_0_16px_rgba(59,181,255,0.72)]" />
                Training signal
              </span>
              <span className="inline-flex items-center gap-2 border border-forge-border bg-white/[0.025] px-2.5 py-1.5 font-mono text-[0.68rem] uppercase tracking-[0.09em] text-forge-muted">
                <span className="inline-block h-2 w-2 bg-[#ff445f] shadow-[0_0_16px_rgba(255,68,95,0.72)]" />
                Jamming overlay
              </span>
              <span className="inline-flex items-center gap-2 border border-forge-border bg-white/[0.025] px-2.5 py-1.5 font-mono text-[0.68rem] uppercase tracking-[0.09em] text-forge-muted">
                {jammingActive ? 'Overlay active' : 'Overlay inactive'}
              </span>
            </div>

            <label className="inline-flex cursor-pointer select-none items-center gap-2.5 font-mono text-[0.75rem] uppercase tracking-[0.08em] text-forge-text">
              <input
                type="checkbox"
                className="peer sr-only"
                checked={jammingActive}
                onChange={(e) => setJammingActive(e.target.checked)}
              />
              <span
                aria-hidden="true"
                className="relative h-6 w-11 border border-forge-border bg-white/[0.045] transition peer-checked:border-[#ff445f]/85 peer-checked:bg-[#ff445f]/[0.16] peer-checked:shadow-[0_0_24px_rgba(255,68,95,0.16)] after:absolute after:left-1 after:top-1 after:h-3.5 after:w-3.5 after:bg-forge-muted after:transition after:content-[''] peer-checked:after:translate-x-5 peer-checked:after:bg-[#ff445f] peer-checked:after:shadow-[0_0_16px_rgba(255,68,95,0.8)]"
              />
              Jamming active
            </label>
          </div>

          <SpectrumCanvas typeId={selectedId} jammingActive={jammingActive} />
        </div>

        {/* Side panel */}
        <aside className="grid gap-3.5 p-4 sm:p-5">
          <div className="border border-forge-border bg-white/[0.025] p-3.5">
            <div className="mb-2.5 font-mono text-[0.72rem] uppercase tracking-[0.13em] text-forge-signal">
              Selected type
            </div>
            <h2 className="text-xl font-semibold uppercase leading-none tracking-tight">
              {selected.label}
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-forge-muted">
              {selected.description}
            </p>
          </div>

          <div className="border border-forge-border bg-white/[0.025] p-3.5">
            <div className="mb-2.5 font-mono text-[0.72rem] uppercase tracking-[0.13em] text-forge-signal">
              Legend
            </div>
            <div className="grid gap-2.5 text-sm leading-snug text-forge-muted">
              <div className="grid grid-cols-[12px_1fr] items-start gap-2.5">
                <span className="mt-0.5 h-3 w-3 bg-[#3bb5ff] shadow-[0_0_18px_rgba(59,181,255,0.4)]" />
                <span>
                  Blue represents the notional training signal learners are
                  trying to observe.
                </span>
              </div>
              <div className="grid grid-cols-[12px_1fr] items-start gap-2.5">
                <span className="mt-0.5 h-3 w-3 bg-[#ff445f] shadow-[0_0_18px_rgba(255,68,95,0.4)]" />
                <span>
                  Red represents the selected jamming pattern after the
                  educational overlay is enabled.
                </span>
              </div>
              <div className="grid grid-cols-[12px_1fr] items-start gap-2.5">
                <span
                  className="mt-0.5 h-3 w-3 opacity-55"
                  style={{
                    backgroundImage:
                      'linear-gradient(rgba(255,255,255,0.45) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.45) 1px, transparent 1px)',
                    backgroundSize: '6px 6px',
                  }}
                />
                <span>
                  The grid and bins are fictional and exist only to show relative
                  behavior.
                </span>
              </div>
            </div>
          </div>

          <div className="border border-forge-border bg-white/[0.025] p-3.5 text-sm leading-relaxed text-forge-muted">
            <div className="mb-2.5 font-mono text-[0.72rem] uppercase tracking-[0.13em] text-forge-signal">
              Instructor note
            </div>
            <strong className="font-semibold text-forge-text">
              Visual-only reference:
            </strong>{' '}
            every category here is a simplified classroom model. There are no
            real-world parameters, no signal generation, and nothing that can be
            used operationally.
          </div>
        </aside>
      </div>
    </section>
  );
}
