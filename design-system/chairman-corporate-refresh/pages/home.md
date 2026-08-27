# Home Page Override

> **この文書は初期デザイン方針案であり、一部は実装と一致しません**（例: 見出しフォントは
> Zen Kaku Gothic Newではなく明朝体系が使われている）。詳細は
> [../../../docs/TRIBAL-KNOWLEDGE.md](../../../docs/TRIBAL-KNOWLEDGE.md) を参照。

## Intent

- Reference mood: calm Japanese corporate site with editorial whitespace and restrained trust signals
- Business translation: CHAIRMAN is shown as a company that connects regional value to markets, not as a pure SNS agency
- Priority audience: municipalities and regional stakeholders

## Home-specific Rules

- Home is image-light and can temporarily run without section imagery
- Hero is text only: mission statement, short lead, two restrained actions
- Avoid dark startup-style fullscreen hero copy or aggressive CTA treatment
- English section labels stay small and quiet
- Japanese headings use `Zen Kaku Gothic New`
- Body copy stays in `Zen Kaku Gothic New`
- Sections must not repeat the same message:
  - Hero = 主語
  - Chairmanについて = 役割
  - 事業紹介 = 3事業の説明
  - 新着情報 = 更新導線
  - 会社概要 = 事実情報
  - note = 思想導線
- News list should read like corporate announcements, with borders instead of raised cards
- Buttons should read like text links or understated outlined actions

## Visual Tokens

- Background base: white
- Surface whites should stay very close to `#ffffff`
- Accent: wine red `#8d0820`
- Secondary accent: muted gold `#b68a3a`
- Primary text: dark gray-brown
- Borders: thin warm burgundy-gray lines
- Shadows: minimal

## Anti-patterns

- No glassmorphism on home
- No oversized gradients
- No floating startup metric cards
- No loud saturated CTA colors
- No duplicate explanation across adjacent sections
