(function () {
    "use strict";

    const route = (location.hash || location.href).toLowerCase();

    const blockedRoutes = [
        "dashboard", "settings", "configuration", "administration",
        "userpage", "wizard", "login", "server", "selectserver"
    ];

    if (blockedRoutes.some(r => route.includes(r))) return;

    /* =========================
       STUDIOS (UNCHANGED)
    ========================= */

    const STUDIOS = [
        {
            name: "Apple TV+",
            tag: "Apple TV,Apple Originals,Apple Stidios LLC",
            gradient: "linear-gradient(135deg,#1a1a2e 0%,#0a0a0a 100%)",
            logo: "https://image.tmdb.org/t/p/w780_filter(duotone,ffffff,bababa)/4KAy34EHvRM25Ih8wb82AuGU7zJ.png"
        },
        {
            name: "Prime Video",
            tag: "Amazon Prime Video,Amazon MGM Studios,AMC",
            gradient: "linear-gradient(135deg,#0d1b2a 0%,#010409 100%)",
            logo: "https://image.tmdb.org/t/p/w780_filter(duotone,ffffff,bababa)/ifhbNuuVnlwYy5oXA5VIb2YR8AZ.png"
        },
        {
            name: "Hulu",
            tag: "Hulu",
            gradient: "linear-gradient(135deg,#0f2e1d 0%,#07150d 100%)",
            logo: "https://image.tmdb.org/t/p/w780_filter(duotone,ffffff,bababa)/pqUTCleNUiTLAVlelGxUgWn1ELh.png"
        },
        {
            name: "Netflix",
            tag: "Netflix",
            gradient: "linear-gradient(135deg,#260a0a 0%,#190000 100%)",
            logo: "https://image.tmdb.org/t/p/w780_filter(duotone,ffffff,bababa)/wwemzKWzjKYJFfCeiB57q3r4Bcm.png"
        },
        {
            name: "HBO Max",
            tag: "HBO Max",
            gradient: "linear-gradient(135deg,#1a0a2e 0%,#0d0018 100%)",
            logo: "https://image.tmdb.org/t/p/w500_filter(duotone,ffffff,bababa)/nmU0UMDJB3dRRQSTUqawzF2Od1a.png"
        },
        {
            name: "Disney+",
            tag: "Disney Plus",
            gradient: "linear-gradient(135deg,#0c1b3a 0%,#050d1a 100%)",
            logo: "https://lumiere-a.akamaihd.net/v1/images/a8e5567d1658de062d95d079ebf536b0_4096x2309_6dedcc02.png",
            invert: true
        },
        {
            name: "Pixar",
            tag: "Pixar",
            gradient: "linear-gradient(135deg,#0a1525 0%,#0d2540 50%,#0a0a12 100%)",
            logo: "https://image.tmdb.org/t/p/w780_filter(duotone,ffffff,bababa)/1TjvGVDMYsj6JBxOAkUHpPEwLf7.png"
        }
    ];

    function injectCSS() {
        if (document.getElementById("jfcr-css")) return;

        const s = document.createElement("style");
        s.id = "jfcr-css";

        s.textContent = `
#custom-rows-wrapper{margin-bottom:20px}
.srow-section{margin:.8em 0 .2em;padding:0 2.5%;width:100%}
.srow-scroll{display:flex;gap:3px;width:100%}
.srow-scroll > .card{margin:0!important;padding:0!important}

.srow-card{flex:1 1 0;min-width:0;max-width:14vw}
.srow-card .cardScalable{position:relative}
.srow-card .cardImageContainer{position:absolute;top:0;left:0;right:0;bottom:0;display:flex;align-items:center;justify-content:center}
.srow-card-logo{height:38px;max-width:65%;object-fit:contain;pointer-events:none}
.srow-card-logo.srow-invert{filter:brightness(0) invert(1);height:52px;max-width:75%}
`;

        document.head.appendChild(s);
    }

    function parseTags(tag) {
        return tag.split(",").map(t => t.trim()).filter(Boolean);
    }

    function gc() {
        try {
            const c = JSON.parse(localStorage.getItem("jellyfin_credentials") || "{}");
            const sv = (c.Servers || [])[0] || {};
            return {
                token: sv.AccessToken,
                userId: sv.UserId,
                serverId: sv.Id || "",
                base: (sv.ManualAddress || sv.LocalAddress || location.origin).replace(/\/+$/, "")
            };
        } catch { return {}; }
    }

    async function countByTag(tag) {
        const { token, userId, base } = gc();
        if (!token || !userId) return 0;
        const tags = parseTags(tag);
        let url = `${base}/Users/${userId}/Items?IncludeItemTypes=Movie,Series&Recursive=true&Limit=0`;
        tags.forEach(t => { url += `&Studios=${encodeURIComponent(t)}`; });
        try {
            const r = await fetch(url, { headers: { Authorization: `MediaBrowser Token="${token}"` } });
            const j = await r.json();
            return j.TotalRecordCount || 0;
        } catch { return 0; }
    }

    async function resolveStudioId(tagString) {
        const { token, userId, base } = gc();
        if (!token || !userId) return null;
        for (const tag of parseTags(tagString)) {
            try {
                const r = await fetch(
                    `${base}/Studios?searchTerm=${encodeURIComponent(tag)}&userId=${userId}&Limit=1`,
                    { headers: { Authorization: `MediaBrowser Token="${token}"` } }
                );
                const j = await r.json();
                const id = j.Items?.[0]?.Id;
                if (id) return id;
            } catch { }
        }
        return null;
    }

    async function openProviderLibrary(studio) {
        const { serverId } = gc();
        const id = await resolveStudioId(studio.tag);
        if (!id) return;

        if (parseTags(studio.tag).length > 1) {
            const tags = parseTags(studio.tag);
            // Intercept fetch: when the native list page queries Items with
            // StudioIds=<singleId>, replace with Studios=tag1&Studios=tag2&…
            // so ALL matching content from every tag appears on the page.
            const origFetch = window.fetch;
            let active = true;

            window.fetch = function (input, init) {
                if (active && typeof input === "string") {
                    try {
                        const url = new URL(input, location.origin);
                        if (url.pathname.endsWith("/Items") && url.searchParams.has("StudioIds")) {
                            url.searchParams.delete("StudioIds");
                            tags.forEach(t => url.searchParams.append("Studios", t));
                            input = url.toString();
                        }
                    } catch { }
                }
                return origFetch.call(this, input, init);
            };

            // Navigate FIRST so the hash is already list.html before rAF checks
            location.hash = `#/list.html?studioId=${id}&serverId=${serverId}`;

            const cleanup = () => {
                active = false;
                window.fetch = origFetch;
                window.removeEventListener("hashchange", cleanup);
                window.removeEventListener("popstate", cleanup);
            };
            setTimeout(() => {
                window.addEventListener("hashchange", cleanup);
                window.addEventListener("popstate", cleanup);
            }, 0);

            return;
        }

        location.hash = `#/list.html?studioId=${id}&serverId=${serverId}`;
    }

    async function buildStudioSection() {
        const section = document.createElement("div");
        section.className = "srow-section";

        const scroll = document.createElement("div");
        scroll.className = "srow-scroll";

        const counts = await Promise.all(STUDIOS.map(s => countByTag(s.tag)));

        STUDIOS.forEach((studio, i) => {
            if (counts[i] === 0) return;

            const card = document.createElement("button");
            card.type = "button";
            card.className = "card overflowBackdropCard card-hoverable srow-card";

            const cardBox = document.createElement("div");
            cardBox.className = "cardBox";

            const cardScalable = document.createElement("div");
            cardScalable.className = "cardScalable";

            // Sets 16:9 aspect ratio the same way Jellyfin library cards do
            const cardPadder = document.createElement("div");
            cardPadder.className = "cardPadder cardPadder-overflowBackdrop";

            const cardImgContainer = document.createElement("div");
            cardImgContainer.className = "cardImageContainer coveredImage";
            cardImgContainer.style.background = studio.gradient;

            const img = new Image();
            img.src = studio.logo;
            img.className = "srow-card-logo";
            if (studio.invert) img.classList.add("srow-invert");

            cardImgContainer.appendChild(img);
            cardScalable.appendChild(cardPadder);
            cardScalable.appendChild(cardImgContainer);
            cardBox.appendChild(cardScalable);
            card.appendChild(cardBox);
            card.onclick = () => openProviderLibrary(studio);
            scroll.appendChild(card);
        });

        if (!scroll.children.length) return null;

        section.appendChild(scroll);
        return section;
    }

    let injecting = false;
    async function injectUI() {
        if (injecting || document.getElementById("custom-rows-wrapper")) return;
        injecting = true;
        try {
            const anchor =
                document.querySelector("iframe.spotlightiframe") ||
                document.querySelector(".spotlightiframe") ||
                document.querySelector(".section0") ||
                document.querySelector(".homeSection:first-child");

            if (!anchor?.parentElement) return;

            injectCSS();

            const section = await buildStudioSection();
            if (!section) return;

            const wrapper = document.createElement("div");
            wrapper.id = "custom-rows-wrapper";
            wrapper.appendChild(section);

            anchor.parentElement.insertBefore(wrapper, anchor.nextSibling);
        } finally {
            injecting = false;
        }
    }

    const observer = new MutationObserver(() => {
        const hash = window.location.hash || window.location.pathname;

        if (hash === "" || hash === "/" || hash.includes("home.html") || hash === "#/home") {
            injectUI();
        }
    });

    observer.observe(document.body, { childList: true, subtree: true });

    // On any navigation: tear down the wrapper so cards are always fresh on return.
    // This also clears stale hover/focus state that persists when Jellyfin keeps the home DOM alive.
    window.addEventListener("hashchange", () => {
        document.getElementById("custom-rows-wrapper")?.remove();
        injecting = false;
    });

    setTimeout(injectUI, 1000);

})();