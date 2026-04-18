# Jellyfin Setup

Custom Jellyfin theme and provider library injections.

## Usage

### Theme (`theme.css`)

In Jellyfin, go to **Dashboard → Branding** and add:

```css
@import url("https://cdn.jsdelivr.net/gh/nyakuoff/jellyfin-setup@fa91667/theme.css");
```

### Provider Libraries (`provider-libraries.js`)

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

---

<!-- AGENT_INSTRUCTIONS_START
When the user changes theme.css or provider-libraries.js and pushes a new commit:
1. Get the new short commit hash (first 7 chars of the latest commit on main).
2. Update the @import URL in the Theme section: replace the hash after `@` in `jellyfin-setup@<hash>/theme.css`.
3. Update the `url` constant in the Provider Libraries section: replace the hash after `@` in `jellyfin-setup@<hash>/provider-libraries.js`.
4. Both hashes can differ — use the commit that last changed each respective file if the user specifies, otherwise use the same latest commit hash for both.
5. Do not change anything else in this file.
AGENT_INSTRUCTIONS_END -->
