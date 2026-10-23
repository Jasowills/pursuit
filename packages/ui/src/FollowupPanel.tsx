import React, { useState } from 'react';
import { followup, type Resume } from '@pursuit/tailoring';
import type { Opportunity } from './career-data';
export function FollowupPanel({
  job,
  resume,
  onSave,
}: {
  job: Opportunity;
  resume?: Resume;
  onSave: (contacts: NonNullable<Opportunity['contacts']>) => Promise<boolean>;
}) {
  const [name, setName] = useState(''),
    [role, setRole] = useState(''),
    [source, setSource] = useState(''),
    [channel, setChannel] = useState(''),
    [message, setMessage] = useState(''),
    [notice, setNotice] = useState('');
  async function draft() {
    setNotice('');
    try {
      if (!resume?.reviewedAt) throw new Error('Review your resume in Resumes & letters first.');
      if (!name.trim() || !role.trim())
        throw new Error('Add the person’s published name and role.');
      const origin = new URL(source);
      if (origin.protocol !== 'https:') throw new Error('Use a public source link.');
      if (channel) {
        const target = new URL(channel);
        if (
          target.protocol !== 'https:' ||
          ![
            'linkedin.com',
            'www.linkedin.com',
            'x.com',
            'www.x.com',
            'twitter.com',
            'www.twitter.com',
          ].includes(target.hostname)
        )
          throw new Error('Use a LinkedIn or X profile URL.');
      }
      const result = await followup({
        resume,
        person: { name, role, sourceUrl: source },
        job: { title: job.role, company: job.company },
        appliedReceipt: job.status === 'Applied' ? job.confirmation : undefined,
      });
      setMessage(result.message);
      const saved = await onSave([
        ...(job.contacts ?? []).slice(-19),
        { name, role, sourceUrl: source, channel, message: result.message },
      ]);
      if (!saved) throw new Error('The contact draft could not be saved.');
      setNotice(
        'Draft only. Check that this person still works there and review the message before sending.',
      );
    } catch (e) {
      setNotice(String(e));
    }
  }
  return (
    <section className="cw-tailoring cw-followup" aria-label="People to follow up with">
      <h2>People to follow up with</h2>
      <p>
        Keep a recruiter or team contact beside this application. Use a published profile or company
        source. Pursuit never guesses an email address.
      </p>
      {(job.contacts ?? []).map((contact, index) => (
        <details key={contact.sourceUrl + index}>
          <summary>
            {contact.name} · {contact.role}
          </summary>
          <p>{contact.sourceUrl}</p>
          <textarea readOnly value={contact.message} rows={8} />
          <button
            onClick={() => void navigator.clipboard.writeText(contact.message).catch(() => {})}
          >
            Copy saved draft
          </button>
        </details>
      ))}
      <label>
        Published name
        <input value={name} onChange={(e) => setName(e.target.value)} maxLength={200} />
      </label>
      <label>
        Published role
        <input value={role} onChange={(e) => setRole(e.target.value)} maxLength={300} />
      </label>
      <label>
        Source URL
        <input type="url" value={source} onChange={(e) => setSource(e.target.value)} />
      </label>
      <label>
        LinkedIn or X profile (optional)
        <input type="url" value={channel} onChange={(e) => setChannel(e.target.value)} />
      </label>
      <button onClick={() => void draft()}>Prepare a follow-up</button>
      {notice && <p role="status">{notice}</p>}
      {message && (
        <>
          <textarea
            aria-label="Follow-up draft"
            rows={10}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
          <button
            onClick={() =>
              void navigator.clipboard
                .writeText(message)
                .then(() => setNotice('Copied. No message was sent.'))
                .catch(() => setNotice('Select and copy the draft manually.'))
            }
          >
            Copy for LinkedIn, X or email
          </button>
        </>
      )}
    </section>
  );
}
