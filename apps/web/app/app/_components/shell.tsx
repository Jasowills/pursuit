'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { PursuitMark } from '../../_components/header';
import './workspace.css';

const NAV = [
  ['Overview', '/app', 'overview'],
  ['Career autopilot', '/app/autopilot', 'agent'],
  ['Search workflow', '/app/workflow', 'workflow'],
  ['Opportunities', '/app/jobs', 'jobs'],
  ['Applications', '/app/applications', 'applications'],
  ['Agent activity', '/app/agent', 'agent'],
  ['Outreach', '/app/outreach', 'outreach'],
  ['Watchers', '/app/watchers', 'watchers'],
  ['Resume vault', '/app/vault', 'vault'],
] as const;
const PATHS: Record<string, string> = {
  overview: 'M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h7v7h-7z',
  workflow: 'M4 7h16 M16 3l4 4-4 4 M20 17H4 M8 13l-4 4 4 4',
  jobs: 'M9 6V4h6v2 M3 7h18v13H3z M3 12c5 3 13 3 18 0 M10 13h4',
  applications: 'M8 3h8l4 4v14H4V3z M8 11h8 M8 15h6 M15 3v5h5',
  agent: 'M9 3h6 M12 3v3 M5 7h14v13H5z M8 11h1 M15 11h1 M9 16h6 M2 11v5 M22 11v5',
  outreach: 'M3 5h18v14H3z M3 6l9 7 9-7',
  watchers: 'M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0',
  vault: 'M3 6h7l2 2h9v12H3z M3 6V4h7l2 2',
  settings: 'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8 M9 3h6l1 4 4 1 1 6-4 2-1 4H8l-1-4-4-1V9l4-1z',
  notifications: 'M5 17h14l-2-3V9a5 5 0 0 0-10 0v5z M10 21h4',
  menu: 'M4 6h16 M4 12h16 M4 18h16',
};
export function WorkspaceIcon({ name }: { name: string }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={PATHS[name] ?? PATHS.overview} />
    </svg>
  );
}
export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? '';
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(false), [pathname]);
  if (pathname === '/app/login') return <>{children}</>;
  const title =
    [
      ...NAV,
      ['Settings', '/app/settings', 'settings'],
      ['Notifications', '/app/notifications', 'notifications'],
    ].find(
      ([, href]) => pathname === href || (href !== '/app' && pathname.startsWith(href + '/')),
    )?.[0] ?? 'Workspace';
  return (
    <div className="workspace">
      <aside className={`workspace-sidebar ${open ? 'is-open' : ''}`}>
        <Link href="/app" className="workspace-brand">
          <PursuitMark size={27} />
          <span>
            pursuit<span className="workspace-brand-dot">.</span>
          </span>
        </Link>
        <div className="workspace-switch">
          <span className="workspace-avatar">P</span>
          <span>
            Personal workspace<small>Career workspace</small>
          </span>
        </div>
        <p className="workspace-nav-label">Workspace</p>
        <nav aria-label="Dashboard">
          {NAV.map(([label, href, icon]) => (
            <Link
              key={href}
              href={href}
              aria-current={
                pathname === href || (href !== '/app' && pathname.startsWith(href + '/'))
                  ? 'page'
                  : undefined
              }
            >
              <WorkspaceIcon name={icon} />
              <span>{label}</span>
            </Link>
          ))}
        </nav>
        <div className="workspace-sidebar-bottom">
          <p className="workspace-nav-label">Account</p>
          <nav aria-label="Account">
            <Link
              href="/app/settings"
              aria-current={pathname === '/app/settings' ? 'page' : undefined}
            >
              <WorkspaceIcon name="settings" />
              Settings & connections
            </Link>
            <Link
              href="/app/notifications"
              aria-current={pathname === '/app/notifications' ? 'page' : undefined}
            >
              <WorkspaceIcon name="notifications" />
              Notifications
            </Link>
          </nav>
          <div className="workspace-session">
            <span className="workspace-avatar">D</span>
            <span>
              Development session<small>Local workspace</small>
            </span>
            <Link href="/" aria-label="Back to website">
              ↗
            </Link>
          </div>
        </div>
      </aside>
      <div className="workspace-body">
        <header className="workspace-topbar">
          <button
            className="workspace-menu"
            aria-label="Toggle navigation"
            aria-expanded={open}
            aria-controls="workspace-mobile-nav"
            onClick={() => setOpen(!open)}
          >
            <WorkspaceIcon name="menu" />
          </button>
          <span className="workspace-breadcrumb">
            Workspace <span>/</span> <strong>{title}</strong>
          </span>
          <div className="workspace-topbar-actions">
            <Link href="/app/workflow" className="workspace-quick-action">
              Open workflow <span>↗</span>
            </Link>
            <Link
              href="/app/notifications"
              className="workspace-icon-button"
              aria-label="Notifications"
            >
              <WorkspaceIcon name="notifications" />
            </Link>
            <Link href="/app/settings" className="workspace-avatar" aria-label="Workspace settings">
              P
            </Link>
          </div>
        </header>
        <div id="workspace-mobile-nav" hidden={!open} className="workspace-mobile-nav">
          <nav aria-label="Mobile dashboard">
            {NAV.map(([label, href, icon]) => (
              <Link key={href} href={href}>
                <WorkspaceIcon name={icon} />
                {label}
              </Link>
            ))}
          </nav>
        </div>
        <main className="workspace-content">{children}</main>
      </div>
    </div>
  );
}
