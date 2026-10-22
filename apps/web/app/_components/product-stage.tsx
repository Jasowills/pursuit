'use client';

import { useEffect, useRef, useState } from 'react';
import { Icon } from './icons';
import { MobileProductWindow, ProductWindow, type Scene } from './product-preview';

const TABS: Array<{ id: Scene; label: string; short: string }> = [
  { id: 'overview', label: 'Overview', short: 'Home' },
  { id: 'discover', label: 'Discover', short: 'Jobs' },
  { id: 'approve', label: 'Approval', short: 'Approve' },
  { id: 'track', label: 'Record', short: 'Record' },
];

export function ProductStage() {
  const [scene, setScene] = useState<Scene>('overview');
  const [inView, setInView] = useState(false);
  const stageRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);

  useEffect(() => {
    const node = stageRef.current;
    if (!node || typeof IntersectionObserver === 'undefined') {
      setInView(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.12 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  function onTabKeyDown(event: React.KeyboardEvent<HTMLButtonElement>, index: number) {
    let next = index;
    if (event.key === 'ArrowRight') next = (index + 1) % TABS.length;
    else if (event.key === 'ArrowLeft') next = (index - 1 + TABS.length) % TABS.length;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = TABS.length - 1;
    else return;
    event.preventDefault();
    const nextTab = TABS[next];
    if (!nextTab) return;
    setScene(nextTab.id);
    tabRefs.current[next]?.focus();
  }

  return (
    <div className="product-stage" data-inview={inView} ref={stageRef}>
      <div className="stage-head">
        <div className="stage-tabs" role="tablist" aria-label="Product preview">
          {TABS.map((tab, index) => (
            <button
              key={tab.id}
              ref={(node) => {
                tabRefs.current[index] = node;
              }}
              type="button"
              role="tab"
              id={`product-tab-${tab.id}`}
              aria-selected={scene === tab.id}
              aria-controls="product-preview-panel"
              tabIndex={scene === tab.id ? 0 : -1}
              className="stage-tab"
              onClick={() => setScene(tab.id)}
              onKeyDown={(event) => onTabKeyDown(event, index)}
            >
              <span className="stage-tab-index">0{index + 1}</span>
              <span className="hidden sm:inline">{tab.label}</span>
              <span className="sm:hidden">{tab.short}</span>
            </button>
          ))}
        </div>

        <div className="stage-meta">
          <span className="stage-meta-chip">
            <span className="live-dot" />
            Proposal-only
          </span>
          <span>Fictional seed records</span>
        </div>
      </div>

      <div
        className="stage-frame"
        id="product-preview-panel"
        role="tabpanel"
        aria-labelledby={`product-tab-${scene}`}
      >
        <ProductWindow scene={scene} />
        <MobileProductWindow scene={scene} />
      </div>

      <div className="stage-foot">
        <div className="stage-foot-group">
          <span>You approve what gets sent</span>
          <span>No auto-submit</span>
          <span>Dev runtime</span>
        </div>
        <span>
          <Icon name="shield" size={10} /> Evidence attached to every record
        </span>
      </div>
    </div>
  );
}
