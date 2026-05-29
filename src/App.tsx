import { useState } from 'react';
import { useConfig } from './state/ConfigContext';
import { useMasterSvg } from './components/useMasterSvg';
import { Preview } from './components/Preview';
import { ExportBar } from './components/ExportBar';
import { ContentPanel } from './components/panels/ContentPanel';
import { ShapesPanel } from './components/panels/ShapesPanel';
import { FramesPanel } from './components/panels/FramesPanel';
import { LogoPanel } from './components/panels/LogoPanel';
import { AdditionalTextPanel } from './components/panels/AdditionalTextPanel';

type Tab = 'shapes' | 'frames' | 'logo' | 'text';

const TABS: { id: Tab; label: string; ico: string }[] = [
  { id: 'shapes', label: 'Shapes', ico: '◧' },
  { id: 'frames', label: 'Frames', ico: '▣' },
  { id: 'logo', label: 'Logo', ico: '★' },
  { id: 'text', label: 'Text', ico: 'T' },
];

export function App() {
  const config = useConfig();
  const { master, error } = useMasterSvg(config);
  const [tab, setTab] = useState<Tab>('shapes');

  return (
    <div className="app">
      <header className="app-header">
        <div className="brand">
          <img className="brand-logo" src={`${import.meta.env.BASE_URL}quar_logo.png`} alt="QuaR" />
          <div>
            <h1 className="visually-hidden">QuaR</h1>
            <div className="tagline">Design beautiful QR codes - private, in your browser</div>
          </div>
        </div>
        <div className="header-links">
          <span className="chip" title="Nothing is uploaded">100% client-side</span>
        </div>
      </header>

      <div className="workspace">
        <div className="controls-col">
          <ContentPanel />

          <div className="card tabbar" role="tablist" aria-label="Design tools" style={{ marginTop: 16 }}>
            {TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={tab === t.id}
                className={tab === t.id ? 'active' : ''}
                data-testid={`tab-${t.id}`}
                onClick={() => setTab(t.id)}
              >
                <span className="ico" aria-hidden="true">
                  {t.ico}
                </span>
                {t.label}
              </button>
            ))}
          </div>

          {tab === 'shapes' && <ShapesPanel />}
          {tab === 'frames' && <FramesPanel />}
          {tab === 'logo' && <LogoPanel />}
          {tab === 'text' && <AdditionalTextPanel />}
        </div>

        <div className="preview-col">
          <div className="card preview-card">
            <Preview master={master} error={error} />
            <div className="status">Live preview · scan to test before you download</div>
          </div>
          <div style={{ height: 16 }} />
          <ExportBar master={master} />
        </div>
      </div>

      <footer className="app-footer">
        <div>
          QuaR · free &amp; open source · no tracking, no accounts, no uploads.
        </div>
        <div>
          Your content, logo and design never leave your device.
        </div>
      </footer>
    </div>
  );
}
