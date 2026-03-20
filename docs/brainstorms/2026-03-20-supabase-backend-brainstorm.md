---
date: 2026-03-20
topic: supabase-backend
---

# Supabase Backend + Auth for MMA Tracker

## What We're Building

Adding a Supabase backend to the mma-tracker so that multiple users can collaborate on the same shared board in real-time. Currently all data lives in localStorage, meaning each user sees only their own state. After this change, project cards, their ordering, statuses, and all metadata will persist in a Supabase Postgres database and sync instantly across all connected clients via Supabase Realtime.

Authentication will use Supabase Auth with email/password open signup. All authenticated users have equal permissions — no roles or access tiers.

## Why This Approach

- **Supabase over custom backend**: Hosted Postgres + Auth + Realtime out of the box. No server to maintain. JS SDK works from a static site.
- **GitHub Pages stays**: Supabase is API-based. The frontend remains a static SPA deployed to GitHub Pages with no changes to the deploy workflow.
- **Shared board, no per-user views**: Simplest model. Everyone sees and edits the same set of projects. Avoids complexity of personal orderings or view layers.
- **Real-time over polling**: Supabase Realtime is built-in and gives instant sync. Better UX for a collaborative tracker.
- **Last write wins**: Small team, real-time updates mean conflicts are rare. No need for optimistic locking complexity.

## Key Decisions

- **Auth model**: Email/password, open signup, all users equal — no roles or invite flow
- **Data model**: Shared board — one set of projects visible to all authenticated users
- **Sync**: Supabase Realtime subscriptions for instant updates across clients
- **Conflict resolution**: Last write wins
- **Hosting**: GitHub Pages unchanged; Supabase is the backend via client SDK
- **Migration surface**: `useBaseballCard.ts` is the only file that touches persistence — swap localStorage for Supabase queries there
- **Component layer**: No changes needed to any UI components

## Open Questions

- Supabase project naming and region selection
- Whether to store Supabase URL/anon key as env vars or hardcode (anon key is safe to expose, but env vars are cleaner)
- Seed data strategy: migrate current `SEED_PROJECTS` into the database once, or let the first user trigger seeding
- Whether the login UI should be a full page or a modal overlay

## Next Steps

→ `/workflows:plan` for implementation details
