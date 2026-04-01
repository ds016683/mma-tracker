/**
 * CLIENT CONFIGURATION
 *
 * All client-specific branding and config lives here.
 * To deploy for a new client:
 *   1. Fork or clone this repo
 *   2. Update the values below
 *   3. Replace assets/mma-logo.png and assets/ths-logo.png with client logos
 *   4. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in GitHub Secrets
 *   5. Push to main – GitHub Actions will build & deploy
 */

export const CLIENT_CONFIG = {
  /** Short name shown in titles */
  clientName: 'Marsh McLennan Agency',
  /** Partner/vendor name (e.g. your consulting firm) */
  partnerName: 'Third Horizon Strategies',
  /** Top-level app title */
  appTitle: 'Master Tracker',
  /** Subtitle shown under the main header */
  appSubtitle: 'Production tasks as of March 9, 2026',
  /** Primary brand hex (for accents, Gantt bars, etc.) */
  primaryColor: '#002C77',
  /** Secondary/accent brand hex */
  accentColor: '#009DE0',
  /** Positive status color */
  successColor: '#00AC41',
  /** Warning status color */
  warningColor: '#FFBE00',
  /** Danger/overdue color */
  dangerColor: '#EF4E45',
  /** GitHub Pages base path (must match vite.config.ts base) */
  basePath: '/mma-tracker/',
};

export type ClientConfig = typeof CLIENT_CONFIG;
