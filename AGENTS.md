<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Editorial copy (hero, about, seminars) is read only through async getters in src/content/site.ts; products only through src/lib/shopify.ts. Why: swap in an external CMS without touching components.
- When creating Shopify products, do not enable inventory tracking (leave inventory_management unset). Why: a tracked variant with zero quantity shows as "Εξαντλήθηκε" and cannot be bought.
- This project uses Bun exclusively. Use `bun install`, `bun run` and `bunx`; never use `npm` or `npx`.
