---
change_id: email-password-sign-in
title: Email and password sign-in with protected routes
status: archived
created: 2026-10-14
updated: 2026-10-14
archived_at: 2026-10-14T18:19:16Z
---

## Notes

Roadmap S-03: niezalogowana osoba może założyć konto, zalogować się, wrócić do zalogowanej sesji i wylogować się; próba wejścia do chronionej części kończy się przekierowaniem do logowania (FR-001, FR-002). Auth działa tylko przy `DATA_BACKEND=supabase`; dane pozostają lokalne do S-04. Implementację wykona tańszy model (Sonnet, niskie rozumowanie), więc plan ma być maksymalnie konkretny.
