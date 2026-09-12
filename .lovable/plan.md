# Fix appearance, home listing batches, and live chat

## Changes
- Make accent choices update the dashboard’s primary icon color immediately, with the saved choice persisting in both themes.
- Limit Active & Upcoming listings on Home to five initially, then reveal five more per “Show more” click.
- Harden live-session chat so messages send only after the room is connected, show sending failures, avoid duplicate messages, and keep the newest message visible.

## Validation
- Verify accent changes and persistence in light and dark modes.
- Verify listing batches increase 5 → 10 → 15 without hiding existing actions.
- Verify live chat connection, sending, Enter-key submission, and error states on phone and desktop layouts.
