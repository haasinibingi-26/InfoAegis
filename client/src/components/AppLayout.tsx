import React from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import {
  ScanSearch,
  SlidersHorizontal,
  History,
  Activity,
  Layers,
  AlertOctagon,
} from 'lucide-react';
import { fetchHealth } from '../config/api';
import type { EngineMode } from '../types/api';
import { Skeleton } from './Skeleton';

function getPageTitle(pathname: string): string {
  if (pathname === '/') return 'New Scan';
  if (pathname.startsWith('/analyzing')) return 'Analyzing';
  if (pathname.endsWith('/evidence')) return 'Evidence Vault';
  if (pathname.startsWith('/incidents')) return 'Incident Results';
  if (pathname.startsWith('/simulator')) return 'What-if Simulator';
  if (pathname.startsWith('/history')) return 'Audit History';
  if (pathname.startsWith('/status')) return 'System Status';
  if (pathname.startsWith('/dev-components')) return 'Component Review (Stage A)';
  return 'LeakLens AI';
}

function getDotColor(mode: EngineMode): string {
  switch (mode) {
    case 'REAL':
      return 'bg-allow';
    case 'FALLBACK':
    case 'MOCK':
      return 'bg-review';
    case 'UNAVAILABLE':
      return 'bg-block';
    default:
      return 'bg-muted';
  }
}

export const AppLayout: React.FC = () => {
  const location = useLocation();
  const shouldReduceMotion = useReducedMotion();
  const pageTitle = getPageTitle(location.pathname);

  const { data: healthData, isLoading: healthLoading } = useQuery({
    queryKey: ['health'],
    queryFn: fetchHealth,
  });

  // Top-bar shows 4 core engines: Gitleaks, Presidio, SafePatch, CooL
  const topBarEngines = (healthData?.components ?? []).filter((c) =>
    ['gitleaks', 'presidio', 'safepatch', 'cool'].includes(c.id)
  );

  // Check for any UNAVAILABLE components in health data
  const unavailableEngines = (healthData?.components ?? []).filter(
    (c) => c.mode === 'UNAVAILABLE'
  );

  const navItems = [
    { to: '/', label: 'New Scan', icon: ScanSearch, end: true },
    { to: '/simulator', label: 'Simulator', icon: SlidersHorizontal },
    { to: '/history', label: 'Audit History', icon: History },
    { to: '/status', label: 'System Status', icon: Activity },
  ];

  return (
    <div className="min-h-screen flex bg-bg text-ink font-sans">
      {/* Left Sidebar: 232px fixed width, white surface, 1px right border */}
      <aside className="fixed left-0 top-0 bottom-0 w-[232px] bg-surface border-r border-border z-40 flex flex-col justify-between select-none">
        <div className="flex flex-col">
          {/* Brand Header */}
          <div className="h-14 px-space-md border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              {/* Magnifier-with-keyhole SVG icon in Indigo-to-Teal gradient */}
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-teal flex items-center justify-center shadow-sm shrink-0">
                <svg
                  className="w-5 h-5 text-white"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <circle cx="10.5" cy="10.5" r="6.5" />
                  <path d="M15.5 15.5L21 21" />
                  <circle cx="10.5" cy="9.5" r="1.5" fill="currentColor" stroke="none" />
                  <path d="M10.5 11v2.5" strokeWidth="2" />
                </svg>
              </div>
              <span className="text-headline-subsection font-semibold tracking-tight text-ink">
                LeakLens AI
              </span>
            </div>
          </div>

          {/* Primary Navigation */}
          <div className="px-space-md pt-space-md pb-space-xs">
            <span className="text-caption uppercase tracking-wider text-muted font-semibold">
              Security Console
            </span>
          </div>

          <nav className="flex flex-col gap-1 px-space-sm" aria-label="Main Navigation">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    `flex items-center gap-2.5 px-3 py-2 rounded-lg text-body-default transition-colors border-l-4 focus-visible:ring-2 focus-visible:ring-primary ${
                      isActive
                        ? 'bg-primary-tint text-primary border-primary font-medium'
                        : 'text-ink2 hover:bg-raised hover:text-ink border-transparent'
                    }`
                  }
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Bottom Dev Review Link & Policy Tag */}
        <div className="p-space-md border-t border-border flex flex-col gap-2">
          <NavLink
            to="/dev-components"
            className={({ isActive }) =>
              `flex items-center gap-2 px-3 py-2 rounded-lg text-body-sm transition-colors border-l-4 focus-visible:ring-2 focus-visible:ring-primary ${
                isActive
                  ? 'bg-primary-tint text-primary border-primary font-semibold'
                  : 'text-ink2 hover:bg-raised hover:text-ink border-transparent'
              }`
            }
          >
            <Layers className="w-4 h-4 shrink-0" />
            <span>Stage A Components</span>
          </NavLink>
          <div className="px-2 pt-1 flex items-center justify-between text-caption text-muted">
            <span>Policy</span>
            <span className="font-mono text-code-sm text-ink2">v1.0</span>
          </div>
        </div>
      </aside>

      {/* Main Content Shell */}
      <div className="pl-[232px] flex-1 flex flex-col min-h-screen">
        {/* Minimal White Top Bar with Bottom Border */}
        <header className="sticky top-0 z-30 h-14 bg-surface/95 backdrop-blur-sm border-b border-border px-margin flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-headline-section font-semibold text-ink">
              {pageTitle}
            </span>
          </div>

          {/* Right: 4 Engine Status Dots from GET /api/health */}
          <div
            className="flex items-center gap-space-md px-3 py-1 rounded-full bg-raised border border-border"
            aria-label="System component health status"
          >
            {healthLoading ? (
              <div className="flex items-center gap-3 py-0.5">
                <Skeleton className="w-16 h-3.5" rounded="full" />
                <Skeleton className="w-16 h-3.5" rounded="full" />
                <Skeleton className="w-16 h-3.5" rounded="full" />
                <Skeleton className="w-16 h-3.5" rounded="full" />
              </div>
            ) : (
              topBarEngines.map((engine, idx) => {
                const shortName =
                  engine.id === 'safepatch'
                    ? 'SafePatch'
                    : engine.id === 'cool'
                    ? 'CooL'
                    : engine.name;

                return (
                  <React.Fragment key={engine.id}>
                    {idx > 0 && <span className="w-px h-3 bg-border" />}
                    <div
                      className="flex items-center gap-1.5 cursor-help"
                      title={`${shortName}: ${engine.mode} (${engine.version})`}
                    >
                      <span
                        className={`w-2 h-2 rounded-full ${getDotColor(engine.mode)}`}
                      />
                      <span className="text-caption text-ink2 font-medium">
                        {shortName}
                      </span>
                      <span className="text-[10px] font-mono text-muted uppercase">
                        {engine.mode}
                      </span>
                    </div>
                  </React.Fragment>
                );
              })
            )}
          </div>
        </header>

        {/* Main Viewport Canvas: .page-wash background, max-width 1100px centered, 32px padding */}
        <main className="page-wash flex-1 w-full">
          <div className="max-w-[1100px] mx-auto p-margin">
            {/* Warning Banner when any component is UNAVAILABLE */}
            {unavailableEngines.length > 0 && (
              <div
                role="alert"
                className="mb-6 p-4 rounded-xl bg-block-tint border-2 border-block/40 flex items-start gap-3.5 text-block shadow-sm"
              >
                <AlertOctagon className="w-5 h-5 shrink-0 mt-0.5 text-block" />
                <div className="flex-1">
                  <p className="font-bold text-body-medium">
                    Engine Alert: {unavailableEngines.map((e) => e.name).join(', ')} is currently UNAVAILABLE
                  </p>
                  <p className="text-body-sm text-block/90 mt-0.5">
                    One or more detection or signing services cannot be reached. Security evaluations may be incomplete.
                  </p>
                </div>
                <NavLink
                  to="/status"
                  className="h-8 px-3 rounded-lg bg-block text-white text-body-sm font-semibold flex items-center gap-1 shrink-0 hover:bg-block/90 transition-colors focus-visible:ring-2 focus-visible:ring-primary"
                >
                  <span>View Diagnostics</span>
                </NavLink>
              </div>
            )}

            {/* Page Transition: fade + 8px upward slide in 250ms */}
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                initial={{
                  opacity: 0,
                  y: shouldReduceMotion ? 0 : 8,
                }}
                animate={{ opacity: 1, y: 0 }}
                exit={{
                  opacity: 0,
                  y: shouldReduceMotion ? 0 : -8,
                }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
              >
                <Outlet />
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>
    </div>
  );
};
