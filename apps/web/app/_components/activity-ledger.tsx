'use client';
import { useState } from 'react';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  TableCaption,
} from './ui/table';
import { Icon } from './icons';
import { StatusBadge } from '@pursuit/ui/status';
const tasks = [
  {
    time: '09:14',
    name: 'Review target sources',
    detail: '128 roles checked · 4 shortlisted',
    status: 'Complete',
    icon: 'search',
  },
  {
    time: '09:18',
    name: 'Northstar application',
    detail: 'Resume and cover letter prepared',
    status: 'Ready for review',
    icon: 'file',
  },
  {
    time: '09:21',
    name: 'Morrow introduction video',
    detail: '90-second script and checklist',
    status: 'Needs you',
    icon: 'monitor',
  },
  {
    time: '09:26',
    name: 'Bramble application',
    detail: 'Sample confirmation recorded',
    status: 'Complete',
    icon: 'check',
  },
] as const;
export function ActivityLedger() {
  const [filter, setFilter] = useState('All activity');
  const [selected, setSelected] = useState<string | null>(null);
  const visible = filter === 'Needs you' ? tasks.filter((t) => t.status !== 'Complete') : tasks;
  return (
    <div className="activity-ledger">
      <header>
        <div>
          <span className="activity-indicator" />
          <strong>Morning run</strong>
          <span>Sample workspace</span>
        </div>
        <span>09:14 – 09:26</span>
      </header>
      <div className="activity-overview">
        <h3>What happened while you were away</h3>
        <p>Review completed tasks, prepared documents and requests for your input.</p>
      </div>
      <div className="activity-toolbar">
        <div role="group" aria-label="Activity filter">
          {['All activity', 'Needs you'].map((f) => (
            <button aria-pressed={filter === f} onClick={() => setFilter(f)} key={f}>
              {f}
              {f === 'Needs you' && <span>2</span>}
            </button>
          ))}
        </div>
        <span>
          <Icon name="shield" size={13} /> Within your limits
        </span>
      </div>
      <Table>
        <TableCaption className="sr-only">
          Illustrative background activity. No external actions.
        </TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead scope="col">Task</TableHead>
            <TableHead scope="col">Status</TableHead>
            <TableHead scope="col">Time</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {visible.map((t) => (
            <TableRow key={t.name}>
              <TableCell>
                <button
                  className="activity-task"
                  onClick={() => setSelected(selected === t.name ? null : t.name)}
                  aria-expanded={selected === t.name}
                >
                  <span>
                    <Icon name={t.icon as 'search'} size={16} />
                  </span>
                  <span>
                    <strong>{t.name}</strong>
                    <small>{t.detail}</small>
                  </span>
                </button>
              </TableCell>
              <TableCell>
                <StatusBadge tone={t.status === 'Complete' ? 'positive' : 'attention'}>
                  {t.status}
                </StatusBadge>
              </TableCell>
              <TableCell className="activity-time">{t.time}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {selected && (
        <div className="activity-detail" role="status">
          <Icon name="file" size={18} />
          <div>
            <strong>{selected}</strong>
            <p>
              {tasks.find((t) => t.name === selected)?.detail}. Sample activity record; no external
              action was performed.
            </p>
          </div>
          <button aria-label="Close activity detail" onClick={() => setSelected(null)}>
            <Icon name="close" size={14} />
          </button>
        </div>
      )}
      <footer>
        <Icon name="bell" size={16} />
        <span>
          <strong>Two moments need your attention.</strong> Review an application, prepare a video.
        </span>
      </footer>
    </div>
  );
}
