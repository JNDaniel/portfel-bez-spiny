---
change_id: dashboard-review-followups
title: Fix the minor dashboard findings from the S-02 implementation review
status: implementing
created: 2026-10-06
updated: 2026-10-06
archived_at: null
---

## Notes

Follow-ups from `context/changes/canonical-expense-classification/reviews/impl-review.md` (findings 1–4). All four are in scope:

1. Chart y-axis labels repeat (`0.0k` six times on an empty month) because the old thousands formatter is applied to small real amounts.
2. Dates are not reactive: computed signals read `clock.now()` only on recomputation, so "today" and the current period go stale past midnight or a month boundary.
3. On a past (closed) month the hero still says "Bezpiecznie na dziś". It should show a month summary instead: "Zostało z limitu: X zł" or "Przekroczono o X zł".
4. Classification card percentages are rounded per row and can sum to 99 or 101; make them sum to 100.

Decisions (2026-10-06):
- S-02 is held locally and not pushed; S-02 and this change are pushed to `master` together after this change is implemented and reviewed.
- Implementation goes to Sonnet, as with S-02.
