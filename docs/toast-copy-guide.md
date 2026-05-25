# Toast & Dialog Copy Guide

Quick reference for the writing rules behind every toast, banner, and confirmation dialog. Pair this with `docs/Toast Messages Guide.html` (visual spec) and the brand voice rules in `CLAUDE.md`.

When generating system text for a toast, banner, or dialog, read this file first.

---

## Tone, at a glance

Pick the tone that matches the moment. If everything looks urgent, nothing is.

| Tone | When to use | Dismiss |
|---|---|---|
| **Success** (bay teal) | Booking confirmed, payment received, audit closed, item saved | Auto 4s |
| **Info** (mist) | Auto-save, sync complete, neutral system status | Auto 4s |
| **Warning** (apricot) | Stock low, late arrival, pending action, soft urgency | Sticky if action present, else 6s |
| **Error** (terracotta) | Sync failed, payment declined, overdue invoice, action could not complete | Sticky until dismissed |
| **Neutral** (driftwood) | Archived, deleted with undo, routine reversible action | Auto 6s |
| **Inverted** | Same tones, but on dark surfaces (modals, photo overlays) | Inherit per tone |

Save **error** tone for things that actually need attention. A failed save is an error; a slow save is info.

---

## Copy rules

### Title

- **Verb + subject.** "Booking confirmed", "Payment received", "Stock low", "User deleted".
- **Six words max.** The detail belongs in the message.
- **Specific, not apologetic.** Never "Sorry, something went wrong" - say what failed.
- **No trailing period.** Titles are labels, not sentences.
- **No em-dashes.** Use a hyphen, a comma, or split the sentence (project-wide rule from `CLAUDE.md`).

### Message

- One or two short sentences.
- State the fact, then any consequence the user needs to know.
- For errors: include what failed and what happens next ("We've saved your data and will retry in a minute.").
- For success: include the concrete identifier or amount where useful ("A$840 - Liliana D. - #R-5453").
- Avoid the banned words from `CLAUDE.md`: no *leverage / robust / seamless / synergy / streamline / unlock*.
- Plain English, present tense, second person. No machine cadence.

### Actions

- **One primary action max.** "Retry now" / "Open log" / "Undo". One emphasized button, one optional ghost secondary.
- Anything beyond two actions belongs in a **dialog**, not a toast.
- Action labels are also verb + subject: "Reorder now", "Open report", "Send reminder".
- Warning toasts with an action become sticky automatically (so the user can act).

### Confirmation dialogs

- Reserve for **destructive or one-way actions**: disable user, decline booking, cancel reservation, push to Xero.
- Title is a **question**: "Disable Renato?", "Decline Liliana's booking?", "Push 12 timesheets to Xero?".
- Message states the consequence in one sentence, plus the reversal path if any ("You can re-enable this user at any time from the Users page.").
- Two buttons: ghost cancel ("Cancel", "Keep") + primary or danger confirm ("Disable user", "Decline booking").
- Danger tone for actions that destroy data. Warn for actions with consequences but recoverable. Info for significant-but-routine.

### Banners (inline, persistent)

- For state the user needs to see every time they visit the screen: "5 invoices overdue", "Booking pending guest confirmation".
- **Never auto-dismiss.** If the state goes away, remove the banner.
- Same title/message rules as toasts. Actions are optional.

---

## Do & Don't

### Do

- **Short, factual title.** "Booking confirmed", "Stock low", "User deleted". Verb + subject.
- **One primary action max.** One emphasized, one ghost secondary. More belongs in a dialog.
- **Auto-dismiss the calm tones.** Success and Info disappear in 4s. Warning lingers if there's an action. Error stays until acknowledged.
- **Name the thing.** "Xero push failed", not "Sync failed". "Liliana's booking declined", not "Booking declined".
- **State the next step on errors.** "Connection timed out. We've saved your data and will retry in a minute."

### Don't

- **Don't be vague or apologetic.** "Sorry, something went wrong" tells the user nothing. Be specific: "Xero push failed - connection timed out."
- **Don't stack tones randomly.** Avoid showing three different tones at once. If everything looks urgent, nothing is.
- **Don't block the canvas with a toast.** A toast should never cover what the user is doing. Use a dialog for blocking decisions, a banner for persistent state.
- **Don't use error tone for warnings.** A low stock count is a warning, not an error. Save red for things that actually failed.
- **Don't use em-dashes** (`—`). Use a hyphen, a comma, or split the sentence.
- **Don't echo the button.** If the user clicks "Delete user", don't toast "Delete user successful". Toast "User deleted".

---

## Examples (use as templates)

### Success

```
Title:   Booking confirmed
Message: Liliana Djokic - Away 03 - 22 Nov. Confirmation email queued.
```

```
Title:   Payment received
Message: A$840 - Liliana D. - #R-5453
```

```
Title:   User deleted
Message: Renato Manager has been removed.
```

### Info

```
Title:   Auto-saved - 2 min ago
Message: Draft reservation #R-5453 is safe. Continue when you're ready.
```

### Warning (with action)

```
Title:   Linen stock low
Message: Queen fitted sheets dropped below reorder threshold (9 of 12).
Action:  Reorder now
```

### Error (sticky)

```
Title:   Xero push failed
Message: Connection timed out. We've saved your data and will retry in a minute.
Actions: Retry now (primary) · Open log (ghost)
```

### Neutral (with undo)

```
Title:   Maintenance ticket archived
Message: M-0119 moved to the archive.
Action:  Undo
```

### Confirmation dialog (danger)

```
Title:   Disable Renato Manager?
Message: They will no longer be able to sign in. You can re-enable this
         user at any time from the Users page.
Buttons: Cancel · Disable user
```

### Confirmation dialog (warn)

```
Title:   Decline Liliana's booking?
Message: The guest will be notified by email. The room will return to
         Booking.com inventory immediately.
Buttons: Keep · Decline booking
```

---

## Placement

- Toasts: bottom-right of the canvas, 24px inset. Newest on top. Max 3 visible.
- Top-right alternate when the screen has a sticky bottom CTA (e.g. Booking detail).
- Banners: above the affected content in the page flow.
- Dialogs: centred over an ink-78% blurred backdrop.

---

## Quick checklist before shipping a toast

1. Is the tone the right one? (Don't reach for error when warn fits.)
2. Title is verb + subject, six words or fewer, no trailing period?
3. Message is one or two sentences, specific, plain English, no banned words?
4. If there's an action, is there only one primary?
5. If error or warn-with-action, is the dismiss behaviour sticky?
6. No em-dashes anywhere in the copy?
