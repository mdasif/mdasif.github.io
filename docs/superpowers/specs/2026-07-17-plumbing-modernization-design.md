# Blog Plumbing Modernization — Design

## Context

The blog (started 2014) runs on Jekyll 4.2 with the "Start Bootstrap Clean Blog" theme (Bootstrap 3, jQuery, LESS compiled via Grunt), deployed to GitHub Pages under `mdasif.github.io`. The user is restarting active blogging and wants to fix the underlying plumbing before touching the theme/layout, which they've already customized to their liking and want to keep as-is.

Current known issues:
- Ruby 2.6 (EOL) and Jekyll 4.2 (2021-era) gem versions.
- No `.github/workflows` — GitHub Pages is using its legacy "deploy from branch" builder, which constrains Jekyll/gem versions to the `github-pages` gem's whitelist and may not cleanly support plugins like `jekyll-mentions`.
- `_includes/comments.html` wires up both a Facebook SDK like/comments embed and Disqus (shortname `bawlipoonch`) — likely stale, adds tracking scripts and ads.
- `mail/contact_me.php` backs the contact form but cannot run on GitHub Pages' static hosting — it's dead code today.
- `Gruntfile.js` + Grunt devDependencies compile `less/clean-blog.less` into `css/clean-blog.css` / `.min.css` — an unmaintained build chain.

## Goals

Modernize the plumbing (build/deploy pipeline, dependency versions, comments, contact form) without changing the visual theme or layout.

## Non-goals

- Any changes to the Bootstrap 3 / jQuery / LESS theme visuals, layout, or vendored JS/CSS.
- Adding a new comments system (removing only, for now).
- Migrating off GitHub Pages or off Jekyll.

## Design

### 1. Deploy pipeline

Add `.github/workflows/deploy.yml`:
- Trigger: push to `main`.
- Steps: checkout → `ruby/setup-ruby` (pin current Ruby 3.x, bundler cache enabled) → setup Node → `npm run build` (compiles LESS, see Section 3) → `jekyll build` → upload build artifact → `actions/deploy-pages`.
- Repo Pages source setting switched from "Deploy from a branch" to "GitHub Actions".

This removes the legacy builder's version/plugin whitelist constraint — Jekyll and gem versions become fully controlled by the repo's `Gemfile`.

### 2. Core stack

- `Gemfile`: bump `jekyll` to latest 4.x; bump `jekyll-feed`, `jemoji`, `jekyll-mentions`, `jekyll-include-cache`, `jekyll-paginate` to current versions (swap to `jekyll-paginate-v2` only if the existing gem doesn't work cleanly with the updated Jekyll — decide during implementation).
- Drop the `webrick` pin if no longer required by the updated Jekyll.
- Regenerate `Gemfile.lock` against Ruby 3.x (the version pinned in the Actions workflow).
- No plugin set changes in `_config.yml` beyond version bumps — same plugins, newer versions.

### 3. Build tooling (replace Grunt)

- Remove `Gruntfile.js` and Grunt-related devDependencies from `package.json`.
- Add npm scripts using the `less` npm package to compile `less/clean-blog.less` → `css/clean-blog.css`, and a minifier (e.g. `clean-css-cli`) to produce `css/clean-blog.min.css`. Same output file names/paths, same visual result.
- These scripts run via `npm run build` inside the Actions workflow (Section 1), before `jekyll build`.
- Vendored assets (`bootstrap.css`, `jquery.js`, etc.) are untouched — they're not part of the build, just static files.

### 4. Comments removal

- Remove the Facebook SDK/like-box markup and the Disqus block from `_includes/comments.html` (delete the file and its include call-site in `_layouts/post.html` if nothing else uses it).
- Remove any `comments: true` front-matter usage in posts and the `site.disqusid` reference in `_config.yml` if present.
- No replacement comments system wired in for this pass.

### 5. Contact form removal

- Delete `mail/contact_me.php` and the `<form>` markup in `contact.html`.
- Replace with a simple block listing the email address (`hacker.asif@gmail.com`) and social links (Twitter/GitHub/Facebook usernames, already present in `_config.yml`), styled to fit the existing page layout/theme.

## Testing / Verification

- Build locally (`bundle exec jekyll build`) after each stack/build-tooling change to confirm no breakage.
- Verify the Actions workflow succeeds end-to-end on a test push before relying on it for the real deploy.
- Visually spot-check `css/clean-blog.css` output is unchanged (or acceptably close) after the Grunt → npm-script build swap.
- Confirm `contact.html` and any page that referenced comments still render correctly with the removed sections.

## Out of scope for this pass (explicitly deferred)

- Theme/layout redesign.
- Adding a new comments system.
- Any other feature work.
