'use client';

import { useRef, useState } from 'react';

export function RealProductShowcase() {
  const dialog = useRef<HTMLDialogElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const [failed, setFailed] = useState(false);

  function close() {
    video.current?.pause();
    dialog.current?.close();
    trigger.current?.focus();
  }

  return (
    <figure className="product-film">
      <div className="product-film-window">
        <div className="product-film-chrome" aria-hidden="true">
          <span className="product-film-dots">
            <i />
            <i />
            <i />
          </span>
          <span>Pursuit / Workspace</span>
          <span className="product-film-window-mark">↗</span>
        </div>
        <div className="product-film-screen">
          <img
            src="/product/hero-workspace.png"
            alt="The real Pursuit overview with application pipeline, recent applications, and workspace navigation. Fictional demo records."
            width={1280}
            height={720}
            fetchPriority="high"
          />
          <button
            ref={trigger}
            type="button"
            className="product-film-play"
            onClick={() => {
              setFailed(false);
              dialog.current?.showModal();
              if (video.current) {
                video.current.currentTime = 0;
                void video.current.play().catch(() => {});
              }
            }}
          >
            <span className="product-film-play-icon" aria-hidden="true">
              <svg width="15" height="15" viewBox="0 0 20 20" fill="currentColor">
                <path d="M6 3.5v13l10-6.5z" />
              </svg>
            </span>
            Watch walkthrough
          </button>
        </div>
      </div>
      <figcaption className="product-film-note">
        Real workspace. Fictional records. You stay in control.
      </figcaption>
      <dialog
        ref={dialog}
        className="product-film-dialog"
        aria-label="Pursuit product walkthrough"
        onCancel={close}
        onClose={() => {
          video.current?.pause();
          trigger.current?.focus();
        }}
        onClick={(event) => {
          if (event.target === event.currentTarget) close();
        }}
      >
        <div className="product-film-dialog-head">
          <span>Inside Pursuit</span>
          <button type="button" onClick={close} aria-label="Close walkthrough">
            Close <span aria-hidden="true">×</span>
          </button>
        </div>
        <video
          ref={video}
          controls
          playsInline
          preload="none"
          poster="/product/hero-workspace.png"
          aria-label="Guided screenshot tour of the real Pursuit application"
          onError={() => setFailed(true)}
        >
          <source src="/product/workflow.mp4" type="video/mp4" />
        </video>
        <p className="product-film-dialog-note">
          Guided tour captured from the redesigned local app with fictional records. Shows the
          overview, opportunities, workflow, and connection settings. Live AI generation and email
          delivery are not demonstrated.
        </p>
        {failed && (
          <p role="status" className="product-film-dialog-note">
            The video could not load.{' '}
            <a href="/product/hero-workspace.png" target="_blank" rel="noreferrer">
              View the workspace screenshot
            </a>
            .
          </p>
        )}
      </dialog>
    </figure>
  );
}
