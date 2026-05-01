// ─────────────────────────────────────────────────────────────────────────────
// SVG cursor data-URIs
// ─────────────────────────────────────────────────────────────────────────────

/** Delete-mode idle cursor: dashed red circle + faint ✕. Hotspot centred at 12,12. */
export const DELETE_IDLE_CURSOR =
  `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24'%3E` +
  `%3Ccircle cx='12' cy='12' r='10' fill='rgba(239%2C68%2C68%2C0.1)' stroke='%23ef4444' stroke-width='1.5' stroke-dasharray='3 2'/%3E` +
  `%3Cline x1='8' y1='8' x2='16' y2='16' stroke='%23ef4444' stroke-width='1.8' stroke-linecap='round'/%3E` +
  `%3Cline x1='16' y1='8' x2='8' y2='16' stroke='%23ef4444' stroke-width='1.8' stroke-linecap='round'/%3E` +
  `%3C/svg%3E") 12 12, not-allowed`;

/** Delete-mode hover cursor: solid red circle + bold white ✕. */
export const DELETE_HOVER_CURSOR =
  `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24'%3E` +
  `%3Ccircle cx='12' cy='12' r='10' fill='rgba(239%2C68%2C68%2C0.35)' stroke='%23ef4444' stroke-width='2'/%3E` +
  `%3Cline x1='7.5' y1='7.5' x2='16.5' y2='16.5' stroke='%23ffffff' stroke-width='2.5' stroke-linecap='round'/%3E` +
  `%3Cline x1='16.5' y1='7.5' x2='7.5' y2='16.5' stroke='%23ffffff' stroke-width='2.5' stroke-linecap='round'/%3E` +
  `%3C/svg%3E") 12 12, not-allowed`;
