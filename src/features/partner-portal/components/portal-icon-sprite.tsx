/**
 * The v29 icon sprite, lifted verbatim from cong-doi-tac-phan-phoi-hoan-chinh-v29.html.
 *
 * Rendered once per portal page so every icon in the views resolves through
 * <use href="#i-…" />. Injected as raw markup rather than transcribed to JSX so
 * the paths stay identical to the design file.
 */
export const PORTAL_ICON_IDS = [
  'i-grid',
  'i-link',
  'i-cart',
  'i-wallet',
  'i-rocket',
  'i-folder',
  'i-gift',
  'i-chart',
  'i-help',
  'i-user',
  'i-bell',
  'i-copy',
  'i-check',
  'i-x',
  'i-search',
  'i-download',
  'i-plus',
  'i-filter',
  'i-qr',
  'i-ticket',
  'i-shield',
  'i-more',
  'i-eye',
  'i-lock',
  'i-file',
  'i-pencil',
  'i-trophy',
  'i-store',
  'i-code',
  'i-bank',
  'i-package',
  'i-brand'
] as const;

export type PortalIconId = (typeof PORTAL_ICON_IDS)[number];

const SPRITE =
  '<symbol id="i-grid" viewBox="0 0 24 24"><rect height="7" rx="1.5" width="7" x="3" y="3"></rect><rect height="7" rx="1.5" width="7" x="14" y="3"></rect><rect height="7" rx="1.5" width="7" x="3" y="14"></rect><rect height="7" rx="1.5" width="7" x="14" y="14"></rect></symbol>\n<symbol id="i-link" viewBox="0 0 24 24"><path d="M9 15l6-6"></path><path d="M8.5 12.5l-2 2a3.2 3.2 0 004.5 4.5l2.3-2.3"></path><path d="M15.5 11.5l2-2a3.2 3.2 0 00-4.5-4.5L10.7 7.3"></path></symbol>\n<symbol id="i-cart" viewBox="0 0 24 24"><path d="M3 4h2l2.4 11.4a2 2 0 002 1.6h8a2 2 0 002-1.9L21 8H6"></path><circle cx="9.5" cy="20" r="1.3"></circle><circle cx="17" cy="20" r="1.3"></circle></symbol>\n<symbol id="i-wallet" viewBox="0 0 24 24"><rect height="13" rx="2" width="18" x="3" y="6"></rect><path d="M3 10h18"></path><rect height="3" rx=".8" width="4" x="14" y="12.5"></rect></symbol>\n<symbol id="i-rocket" viewBox="0 0 24 24"><path d="M12 3c3 2 4.5 5.5 4 10l-4 4-4-4c-.5-4.5 1-8 4-10z"></path><circle cx="12" cy="9.5" r="1.4"></circle><path d="M8.5 15.5L6 18M15.5 15.5L18 18"></path></symbol>\n<symbol id="i-folder" viewBox="0 0 24 24"><path d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z"></path></symbol>\n<symbol id="i-gift" viewBox="0 0 24 24"><rect height="11" rx="2" width="18" x="3" y="9"></rect><path d="M12 9v11M3 13h18"></path><path d="M12 9H8a2.5 2.5 0 110-5c2.5 0 4 5 4 5zM12 9h4a2.5 2.5 0 100-5c-2.5 0-4 5-4 5z"></path></symbol>\n<symbol id="i-chart" viewBox="0 0 24 24"><path d="M4 20V10M11 20V4M18 20v-7"></path><path d="M3 20h18"></path></symbol>\n<symbol id="i-help" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"></circle><path d="M9.5 9.5a2.5 2.5 0 014.8 1c0 1.7-2.3 1.8-2.3 3.5"></path><circle cx="12" cy="17" r=".6"></circle></symbol>\n<symbol id="i-user" viewBox="0 0 24 24"><circle cx="12" cy="8" r="3.5"></circle><path d="M5 20c0-3.5 3-6 7-6s7 2.5 7 6"></path></symbol>\n<symbol id="i-bell" viewBox="0 0 24 24"><path d="M6 10a6 6 0 0112 0c0 4 1.5 5.5 1.5 5.5H4.5S6 14 6 10z"></path><path d="M10 18a2 2 0 004 0"></path></symbol>\n<symbol id="i-copy" viewBox="0 0 24 24"><rect height="12" rx="2" width="12" x="8" y="8"></rect><path d="M5 15.5A2.5 2.5 0 013 13V6a2.5 2.5 0 012.5-2.5H13A2.5 2.5 0 0115.5 6"></path></symbol>\n<symbol id="i-check" viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7"></path></symbol>\n<symbol id="i-x" viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"></path></symbol>\n<symbol id="i-search" viewBox="0 0 24 24"><circle cx="10" cy="10" r="6"></circle><path d="M15 15l5 5"></path></symbol>\n<symbol id="i-download" viewBox="0 0 24 24"><path d="M12 4v11"></path><path d="M7.5 11l4.5 4.5L16.5 11"></path><path d="M4 18h16"></path></symbol>\n<symbol id="i-plus" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"></path></symbol>\n<symbol id="i-filter" viewBox="0 0 24 24"><path d="M4 6h16M7 12h10M10 18h4"></path></symbol>\n<symbol id="i-qr" viewBox="0 0 24 24"><path d="M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM15 14h2v2h-2zM19 14h2v2h-2zM14 18h2v3h-2zM18 18h3v3h-3z"></path></symbol>\n<symbol id="i-ticket" viewBox="0 0 24 24"><path d="M4 6h16v4a2 2 0 000 4v4H4v-4a2 2 0 000-4V6z"></path><path d="M12 7v10"></path></symbol>\n<symbol id="i-shield" viewBox="0 0 24 24"><path d="M12 3l7 3v6c0 5-3.5 8-7 9-3.5-1-7-4-7-9V6z"></path><path d="M9 12l2 2 4-4"></path></symbol>\n<symbol id="i-more" viewBox="0 0 24 24"><circle cx="5" cy="12" r="1"></circle><circle cx="12" cy="12" r="1"></circle><circle cx="19" cy="12" r="1"></circle></symbol>\n<symbol id="i-eye" viewBox="0 0 24 24"><path d="M3 12s3.5-6 9-6 9 6 9 6-3.5 6-9 6-9-6-9-6z"></path><circle cx="12" cy="12" r="2.5"></circle></symbol>\n<symbol id="i-lock" viewBox="0 0 24 24"><rect height="10" rx="2" width="14" x="5" y="10"></rect><path d="M8 10V7a4 4 0 018 0v3"></path></symbol>\n<symbol id="i-file" viewBox="0 0 24 24"><path d="M7 3h7l4 4v14H7z"></path><path d="M14 3v4h4"></path></symbol>\n<symbol id="i-pencil" viewBox="0 0 24 24"><path d="M4 20l3.5-.7L18 8.8 15.2 6 4.7 16.5 4 20z"></path><path d="M13.8 7.4l2.8 2.8"></path></symbol>\n<symbol id="i-trophy" viewBox="0 0 24 24"><path d="M7 4h10v4a5 5 0 01-10 0V4z"></path><path d="M7 5H4a3 3 0 003 3M17 5h3a3 3 0 01-3 3"></path><path d="M12 13v4M9 20h6M10 17h4v3h-4z"></path></symbol>\n<symbol id="i-store" viewBox="0 0 24 24"><path d="M4 9h16l-1-5H5L4 9z"></path><path d="M5 9v11h14V9M9 20v-6h6v6"></path><path d="M4 9a3 3 0 006 0 3 3 0 006 0 3 3 0 004 0"></path></symbol>\n<symbol id="i-code" viewBox="0 0 24 24"><path d="M8 7l-5 5 5 5M16 7l5 5-5 5M14 4l-4 16"></path></symbol>\n<symbol id="i-bank" viewBox="0 0 24 24"><path d="M3 9h18L12 4 3 9zM5 10v7M9 10v7M15 10v7M19 10v7M3 20h18"></path></symbol>\n<symbol id="i-package" viewBox="0 0 24 24"><path d="M4 7l8-4 8 4-8 4-8-4z"></path><path d="M4 7v10l8 4 8-4V7M12 11v10"></path></symbol>\n<symbol id="i-brand" viewBox="0 0 24 24"><path d="M12 3l7 4v10l-7 4-7-4V7z"></path><path d="M9 8.5h3.5a2.5 2.5 0 010 5H9zM9 13.5h4a2.5 2.5 0 010 5H9z"></path></symbol>';

export function PortalIconSprite() {
  return (
    <svg
      width={0}
      height={0}
      aria-hidden
      focusable='false'
      style={{ position: 'absolute' }}
      dangerouslySetInnerHTML={{ __html: '<defs>' + SPRITE + '</defs>' }}
    />
  );
}

/** One sprite icon, sized by the stylesheet rule for `.icon`. */
export function PortalIcon({ id, className }: { id: PortalIconId; className?: string }) {
  return (
    <svg className={className ?? 'icon'} aria-hidden focusable='false'>
      <use href={'#' + id} />
    </svg>
  );
}
