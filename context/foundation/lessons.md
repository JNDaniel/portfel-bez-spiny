# Lessons Learned

> Append-only register of recurring rules and patterns. Re-read at start by /10x-frame, /10x-research, /10x-plan, /10x-plan-review, /10x-implement, /10x-impl-review.

## Per-tab auth state vs cross-tab Supabase events

- **Context**: src/app/core/auth/auth.service.ts:107-116 (email-password-sign-in, full review F5)
- **Problem**: The `signingOut` flag is per tab, but auth-js broadcasts `SIGNED_OUT` to every tab. After a deliberate "Wyloguj" in one tab, the other tabs treat it as an unrequested sign-out and show "Sesja wygasła".
- **Rule**: Auth state that tells events apart (e.g. a deliberate logout vs expiry) is per tab. Supabase broadcasts events to all tabs, so an event-driven UI message must make sense in a tab that did not trigger it.
- **Applies to**: AuthService and any future handlers of `onAuthStateChange` (S-04+, S-07).
