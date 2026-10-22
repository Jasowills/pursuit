'use client';
import { useMemo, useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { CareerWorkspace, sampleBook } from '@pursuit/ui/career-workspace';
import '@pursuit/ui/career-workspace.css';
export default function ProductTour() {
  const book = useMemo(() => sampleBook(), []);
  const [settings, setSettings] = useState('');
  const [request, setRequest] = useState('');
  useEffect(
    () =>
      setRequest(new URLSearchParams(window.location.search).get('request')?.slice(0, 250) ?? ''),
    [],
  );
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    if (settings) dialog.current?.showModal();
  }, [settings]);
  return (
    <>
      <div
        style={{
          background: '#101010',
          color: '#c0c0c0',
          fontSize: 11,
          padding: '8px 20px',
          display: 'flex',
          justifyContent: 'space-between',
          gap: 20,
        }}
      >
        <span>Interactive product tour · fictional sample career · no external actions</span>
        <Link href="/">Back to Pursuit</Link>
      </div>
      <CareerWorkspace
        sample
        initialData={book}
        onSettings={setSettings}
        initialRequest={request}
      />
      {settings && (
        <dialog
          ref={dialog}
          className="tour-settings-dialog"
          aria-label="Sample settings"
          onClose={() => setSettings('')}
        >
          <h2>
            {settings === 'identity'
              ? 'Your career, in context'
              : settings === 'models'
                ? 'Your model. Your choice.'
                : 'Your agent, under your control'}
          </h2>
          <p>
            Exit this sample tour and open the desktop app to manage your actual career facts, model
            connections and runtime sessions.
          </p>
          <button onClick={() => dialog.current?.close()}>Return to the tour</button>
        </dialog>
      )}
      <style>{`.tour-settings-dialog{position:fixed;inset:20%;z-index:80;background:#090909;border:1px solid #3b3b3b;border-radius:12px;color:#eeeeee;padding:35px;box-shadow:0 30px 100px #000b;max-width:600px;height:fit-content}.tour-settings-dialog h2{font-size:26px;color:#eeeeee}.tour-settings-dialog p{font-size:14px;line-height:1.9;color:#b6b6b6;margin:20px 0}.tour-settings-dialog button{border:1px solid #d5f578;background:#d5f578;color:#18220c;padding:12px 18px;border-radius:6px}`}</style>
    </>
  );
}
