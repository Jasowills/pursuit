'use client';

import { useState } from 'react';
import { Icon } from './icons';

type DemoState = 'idle' | 'approved' | 'rejected';

export function ApprovalDemo() {
  const [state, setState] = useState<DemoState>('idle');

  return (
    <div className="approval-demo" id="approval-demo">
      <div className="approval-demo-top">
        <div>
          <div className="approval-demo-label">Single-use approval · demo</div>
          <h3>Submit application</h3>
        </div>
        <span className="approval-demo-tag">No external action</span>
      </div>

      <div className="approval-card-destination">
        <div className="approval-card-destination-label">Destination</div>
        <div className="approval-card-destination-value">
          jobs.exampleco.example/listings/1001
        </div>
      </div>

      <div className="approval-card-grid">
        <div className="approval-field">
          <div className="approval-field-label">Action</div>
          <div className="approval-field-value">Submit application</div>
        </div>
        <div className="approval-field">
          <div className="approval-field-label">Attachment</div>
          <div className="approval-field-value">demo-master-resume.pdf</div>
        </div>
        <div className="approval-field">
          <div className="approval-field-label">Profile fields</div>
          <div className="approval-field-value">Name · email · US work authorization</div>
        </div>
        <div className="approval-field">
          <div className="approval-field-label">Consent</div>
          <div className="approval-field-value">Hash-bound · consumed once</div>
        </div>
      </div>

      <div className="approval-hash-row">
        <span className="approval-hash">
          sha256 <strong>9f3a…c21e</strong>
        </span>
        <span className="approval-single-use">
          <Icon name="lock" size={9} /> Single use
        </span>
      </div>

      {state === 'idle' ? (
        <div className="approval-actions">
          <button
            type="button"
            className="btn btn-outline"
            onClick={() => setState('rejected')}
          >
            Reject
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setState('approved')}
            aria-describedby="approval-demo-note"
          >
            Approve exact payload
            <span className="btn-glyph" aria-hidden>
              <Icon name="check" size={11} strokeWidth={2.2} />
            </span>
          </button>
        </div>
      ) : (
        <div className="approval-actions">
          <button
            type="button"
            className="btn btn-outline"
            onClick={() => setState('idle')}
          >
            Reset demo
          </button>
          <button type="button" className="btn btn-primary" disabled>
            {state === 'approved' ? 'Approved in demo' : 'Rejected in demo'}
            <span className="btn-glyph" aria-hidden>
              <Icon name={state === 'approved' ? 'check' : 'close'} size={11} strokeWidth={2.2} />
            </span>
          </button>
        </div>
      )}

      <p
        className="approval-note"
        id="approval-demo-note"
        data-state={state === 'approved' ? 'approved' : state === 'rejected' ? 'rejected' : undefined}
        role="status"
        aria-live="polite"
      >
        {state === 'approved' &&
          'Approved locally. This demo performed no submission and made no network request.'}
        {state === 'rejected' &&
          'Rejected locally. This demo performed no submission and made no network request.'}
        {state === 'idle' &&
          'This preview is interactive, but it performs no external action.'}
      </p>

      <div className="approval-policy">
        <Icon name="shield" size={12} />
        Policy gateway: <strong>submit_application</strong> is gated. In the product,
        approval locks the hash; it does not bypass the gateway.
      </div>
    </div>
  );
}
