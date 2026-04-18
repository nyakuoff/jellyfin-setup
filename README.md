# Jellyfin Setup

Custom Jellyfin theme and provider library injections.

## Usage

<details>
<summary><strong>Theme (<code>theme.css</code>)</strong></summary>

In Jellyfin, go to **Dashboard → Branding** and add:

```css
@import url("https://cdn.jsdelivr.net/gh/nyakuoff/jellyfin-setup@fa91667/theme.css");
```

</details>

<details>
<summary><strong>Provider Libraries (<code>provider-libraries.js</code>)</strong></summary>

Install the JS Injector plugin, go to **Dashboard → JS Injector** and add:

```js
(async () => {
  if (window.__nyakuProviderLibrariesLoaded) return;
  window.__nyakuProviderLibrariesLoaded = true;

  const url = "https://cdn.jsdelivr.net/gh/nyakuoff/jellyfin-setup@a49ee4d/provider-libraries.js";
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to load ${url}: ${res.status}`);
  (0, eval)(await res.text());
})();
```

</details>

---

<!-- AGENT_INSTRUCTIONS_START
When the user changes theme.css or provider-libraries.js and pushes a new commit:
1. Get the new short commit hash (first 7 chars of the latest commit on main).
2. Update the @import URL inside the Theme <details> block: replace the hash after `@` in `jellyfin-setup@<hash>/theme.css`.
3. Update the `url` constant inside the Provider Libraries <details> block: replace the hash after `@` in `jellyfin-setup@<hash>/provider-libraries.js`.
4. Both hashes can differ — use the commit that last changed each respective file if the user specifies, otherwise use the same latest commit hash for both.
5. Snippets are wrapped in <details><summary>...</summary>...</details> — collapsed by default. Do not remove or alter that structure.
6. Do not change anything else in this file.
AGENT_INSTRUCTIONS_END -->
