# Project Architecture Rules

- Store story media in the existing public `item-images` bucket and keep story metadata and privacy-scoped interactions in public database tables, so Stories reuse existing media delivery and seller ownership rules.
- Keep seller notifications in an owner-scoped database inbox with trusted activity triggers and a shared top-bar inbox control, so sellers can safely see live shop activity from every dashboard page.