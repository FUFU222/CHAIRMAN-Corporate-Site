# Repository Instructions

- Do not use Playwright or any browser automation for routine UI/CSS checks by default. It interferes with the user's local desktop session.
- For layout and styling work, prefer code inspection, local builds, and the user's own visual confirmation.
- Only use Playwright when the user explicitly asks for browser automation or when no other reasonable verification path exists.
- If Playwright becomes truly necessary, announce that intent before launching it.
