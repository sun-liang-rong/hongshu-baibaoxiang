# Wechat Mini Program Xiaohongshu Style Design

Goal: refresh the `wechat` mini program with a clean Xiaohongshu-inspired tool aesthetic while keeping existing page behavior and service contracts intact.

Direction: use a bright app background, white content surfaces, Xiaohongshu red accents, soft pink highlight bands, subtle borders, and restrained shadows. The interface should feel like a practical creator tool first, with content-card details on result and generation pages.

Scope:
- Improve shared visual language in `miniprogram/app.less`.
- Polish common components: navigation bar, empty state, and status pill.
- Refresh core pages: watermark, title generation, copywriting generation, watermark result, profile, history, and favorites.
- Avoid changing backend APIs, page data contracts, or business logic.

Design choices:
- Use red only for primary actions, selected states, key chips, and successful-result accents.
- Keep page sections readable and compact for repeated tool use.
- Add card depth with border, subtle shadow, and warm background tints instead of heavy gradients.
- Make generated content and parsed material feel closer to Xiaohongshu note cards through image grids, tags, and layered result panels.

Verification:
- Run TypeScript/build checks available for the mini program project.
- If the local npm shell configuration blocks scripts, report that environment issue explicitly.
