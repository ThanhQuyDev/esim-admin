'use client';

/**
 * The partner portal chrome: dark sidebar, sticky topbar, phone bottom bar and
 * the "Thêm" sheet — the shell from cong-doi-tac-phan-phoi-hoan-chinh-v29.html.
 *
 * The mockup swaps views by toggling `.view.active` inside one document; here
 * each view is a route, so the same nav markup renders `<Link>`s and the active
 * item is derived from the pathname. Class names are unchanged so
 * `partner-portal.css` styles this tree exactly as it styles the mockup.
 */

import { Fragment, useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import '@/styles/partner-portal.css';
import '@/styles/partner-portal-extras.css';

import { logout } from '@/features/auth/api/service';

import { myProfileQueryOptions } from '../api/queries';
import {
  MOBILE_PRIMARY,
  MOBILE_SHEET,
  NAV_GROUPS,
  ROLE_CONFIGS,
  ROUTE_VIEWS,
  VIEW_ICONS,
  VIEW_ROUTES,
  roleFromPartnerType,
  type PortalViewId
} from '../lib/portal-nav';
import { PortalIcon, PortalIconSprite, type PortalIconId } from './portal-icon-sprite';
import { PortalToastProvider } from './portal-toast';

/** Initials for the sidebar avatar, as the mockup's hard-coded "MT". */
function initialsOf(name: string | undefined): string {
  const parts = (name ?? '').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'ĐT';
  const last = parts[parts.length - 1]!;
  const first = parts[0]!;
  return (first[0]! + (parts.length > 1 ? last[0]! : '')).toUpperCase();
}

export function PortalShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: me } = useQuery(myProfileQueryOptions());
  const [sheetOpen, setSheetOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  /**
   * Sign out. The cached partner data is cleared as well, so the next account
   * to sign in on this browser never sees the previous partner's figures while
   * their own are still loading.
   */
  const signOut = async () => {
    setSigningOut(true);
    try {
      await logout();
      queryClient.clear();
      router.push('/auth/sign-in');
      router.refresh();
    } finally {
      setSigningOut(false);
    }
  };

  const role = roleFromPartnerType(me?.partnerType);
  const config = ROLE_CONFIGS[role];

  // `/dashboard/portal/orders/123` still belongs to the orders view.
  const activeView: PortalViewId =
    ROUTE_VIEWS[pathname] ??
    (Object.entries(VIEW_ROUTES).find(([, route]) =>
      pathname.startsWith(`${route}/`)
    )?.[0] as PortalViewId) ??
    'dashboard';

  const [title, subtitle] = config.titles[activeView];

  // A route change must not leave the sheet covering the page it opened.
  useEffect(() => {
    setSheetOpen(false);
  }, [pathname]);

  const accountRole = me?.tierCode
    ? `${config.accountRole} · Hạng ${me.tierCode}`
    : config.accountRole;

  const navItem = (view: PortalViewId) => {
    const label = config.nav[view];
    if (!label || config.hide.includes(view)) return null;
    return (
      <Link
        key={view}
        href={VIEW_ROUTES[view]}
        className={`nav-btn${activeView === view ? ' active' : ''}`}
        aria-current={activeView === view ? 'page' : undefined}
      >
        <PortalIcon id={VIEW_ICONS[view] as PortalIconId} />
        <span>{label}</span>
      </Link>
    );
  };

  return (
    <div className='pp-app'>
      <PortalToastProvider>
        <PortalIconSprite />

        <div className='app'>
          <aside aria-label='Điều hướng đối tác' className='sidebar'>
            <div className='brand'>
              <div className='brand-mark'>e</div>
              <div>
                <div className='brand-name'>esim.vn</div>
                <div className='brand-sub'>{config.brandSub}</div>
              </div>
            </div>

            <nav className='nav'>
              {NAV_GROUPS.map((group) => {
                const items = group.views.map(navItem).filter(Boolean);
                if (items.length === 0) return null;
                return (
                  <Fragment key={group.label}>
                    <div className='nav-group'>{group.label}</div>
                    {items}
                  </Fragment>
                );
              })}
            </nav>

            <div className='sidebar-foot'>
              <div className='account'>
                <div className='avatar'>{initialsOf(me?.contactName)}</div>
                <div>
                  <div className='who'>{me?.contactName ?? 'Đối tác'}</div>
                  <div className='role'>{accountRole}</div>
                </div>
                <button
                  className='account-signout'
                  type='button'
                  title='Đăng xuất'
                  aria-label='Đăng xuất'
                  disabled={signingOut}
                  onClick={signOut}
                >
                  <PortalIcon id='i-lock' />
                </button>
              </div>
            </div>
          </aside>

          <main className='main'>
            <header className='topbar'>
              <div>
                <h1 className='page-title'>{title}</h1>
                <div className='page-sub'>{subtitle}</div>
              </div>
              <div className='top-actions'>
                <span className='top-select role-select' aria-label='Loại đối tác'>
                  {config.name}
                </span>
                <button aria-label='Thông báo' className='icon-btn' type='button'>
                  <PortalIcon id='i-bell' />
                  <span className='notice-dot' />
                </button>
              </div>
            </header>

            <div className='content'>{children}</div>
          </main>
        </div>

        <nav aria-label='Điều hướng di động' className='mobile-more'>
          {MOBILE_PRIMARY.filter((view) => !config.hide.includes(view)).map((view) => (
            <Link
              key={view}
              href={VIEW_ROUTES[view]}
              className={`mobile-nav-btn${activeView === view ? ' active' : ''}`}
            >
              <PortalIcon id={VIEW_ICONS[view] as PortalIconId} />
              {config.nav[view]}
            </Link>
          ))}
          <button className='mobile-nav-btn' type='button' onClick={() => setSheetOpen(true)}>
            <PortalIcon id='i-more' />
            Thêm
          </button>
        </nav>

        <div
          className={`mobile-drawer${sheetOpen ? ' open' : ''}`}
          onClick={(event) => {
            if (event.target === event.currentTarget) setSheetOpen(false);
          }}
        >
          <div className='mobile-sheet'>
            <div className='toolbar'>
              <strong>Chức năng khác</strong>
              <button className='btn btn-icon' type='button' onClick={() => setSheetOpen(false)}>
                <PortalIcon id='i-x' />
              </button>
            </div>
            <div className='mobile-sheet-grid'>
              {MOBILE_SHEET.filter((view) => !config.hide.includes(view)).map((view) => (
                <Link key={view} href={VIEW_ROUTES[view]} className='sheet-link'>
                  <PortalIcon id={VIEW_ICONS[view] as PortalIconId} />
                  {config.nav[view]}
                </Link>
              ))}
              <button
                className='sheet-link sheet-signout'
                type='button'
                disabled={signingOut}
                onClick={signOut}
              >
                <PortalIcon id='i-lock' />
                Đăng xuất
              </button>
            </div>
          </div>
        </div>
      </PortalToastProvider>
    </div>
  );
}
