// ==== TOGGLEABLE SETUPS ====
// Base table is static HTML. JS only toggles visibility.

const optNeutralNull = document.getElementById("optNeutralNull");
const optDark = document.getElementById("optDark");

const nnNodes = () => Array.from(document.querySelectorAll(".nn"));
const darkRows = () => Array.from(document.querySelectorAll("tr.dark"));

function setNeutralNullVisible(isVisible) {
    nnNodes().forEach(el => el.classList.toggle("nn-hidden", !isVisible));
}

function setDarkVisible(isVisible) {
    darkRows().forEach(tr => tr.classList.toggle("dark-hidden", !isVisible));
}

// Defaults: both OFF
setNeutralNullVisible(false);
setDarkVisible(false);

optNeutralNull.addEventListener("change", () => {
    setNeutralNullVisible(optNeutralNull.checked);
    positionInfoPanel();
});

optDark.addEventListener("change", () => {
    setDarkVisible(optDark.checked);
    positionInfoPanel();
});


// ==== SIDEBAR ====
// Info panel bottom: making it sticky

const infoPanel = document.getElementById("infoPanel");
const sideCol = document.querySelector(".side");

function setInfoPad(px) {
    document.documentElement.style.setProperty("--infoPad", `${px}px`);
}

function positionInfoPanel() {
    const isMobile = window.matchMedia("(max-width: 980px)").matches;

    // Mobile: keep the "always reserve space" behaviour (bottom dock)
    if (isMobile) {
        const h = infoPanel.getBoundingClientRect().height;
        setInfoPad(Math.ceil(h + 16));
        infoPanel.style.left = "";
        return;
    }

    // Desktop: align to the left edge of the sidebar column
    const r = sideCol.getBoundingClientRect();
    infoPanel.style.left = `${Math.round(r.left)}px`;

    // Desktop: reserve space ONLY if the fixed panel overlaps the legend/options stack
    const panelRect = infoPanel.getBoundingClientRect();
    const infoTop = panelRect.top;

    const stack = sideCol.querySelectorAll(".legend, .options");
    const last = stack[stack.length - 1];
    const lastRect = last.getBoundingClientRect();

    const overlap = Math.max(0, lastRect.bottom - infoTop);
    setInfoPad(overlap ? Math.ceil(overlap + 16) : 0);
}

// initial
positionInfoPanel();

// keep aligned on resize/scroll
window.addEventListener("resize", positionInfoPanel);
window.addEventListener("scroll", positionInfoPanel, {
    passive: true
});

// ALSO keep aligned when layout changes without scrolling (toggle on/off changes widths)
const ro = new ResizeObserver(positionInfoPanel);
ro.observe(sideCol);
ro.observe(infoPanel);

// ==== SIDEBAR ====
// Info panel bottom: making text shows up

const infoElement = document.getElementById("infoElement");
const infoResists = document.getElementById("infoResists");
const infoWeak = document.getElementById("infoWeak");
const infoLearnLink = document.getElementById("infoLearnLink");

const ELEMENT_KEYS = ["earth", "fire", "wind", "water", "ice", "electric", "native", "machine", "neutral", "null"];

function getElementKeyFromTH(th) {
    // returns first matching element class
    for (const k of ELEMENT_KEYS) {
        if (th.classList.contains(k)) return k;
    }
    return null;
}

function niceLabelFromKey(key) {
    if (!key) return "—";
    return key.charAt(0).toUpperCase() + key.slice(1);
}

function updateInfoDefault() {
    infoElement.className = "el";
    infoElement.textContent = "-";
    infoResists.textContent = "-";
    infoWeak.textContent = "-";
}

// Header row defines attacker columns
function getAttackerHeaders() {
    const headerRow = document.querySelector("#matrix tr:first-child");
    // includes earth..machine and also neutral/null (even if hidden)
    return Array.from(headerRow.querySelectorAll("th")).slice(1); // skip corner
}

function isHeaderVisible(th) {
    // if neutral/null are hidden, their header has nn-hidden
    if (th.classList.contains("nn-hidden")) return false;
    return true;
}

function updateInfoFromRow(row) {
    const rowHead = row.querySelector("th.h");
    if (!rowHead) return;

    const isDark = rowHead.classList.contains("dark");
    const baseKey = getElementKeyFromTH(rowHead);
    const title = rowHead.getAttribute("title") || niceLabelFromKey(baseKey);

    // colour span based on base element class (earth/fire/etc)
    infoElement.className = "el" + (baseKey ? " " + baseKey : "");
    infoElement.textContent = title;

    const attackers = getAttackerHeaders(); // th list aligned with td indices
    const cells = Array.from(row.querySelectorAll("td"));

    const resists = [];
    const weak = [];

    for (let i = 0; i < cells.length && i < attackers.length; i++) {
        const attackerTH = attackers[i];
        if (!isHeaderVisible(attackerTH)) continue;

        const attackerKey = getElementKeyFromTH(attackerTH);
        if (!attackerKey) continue;

        const cell = cells[i];

        // resist: circle (0.5x) OR tri (0.25x)
        if (cell.querySelector(".circle") || cell.querySelector(".tri")) {
            resists.push(attackerKey);
        }

        // weak: cross (2x) OR diamond (3x)
        if (cell.querySelector(".cross") || cell.querySelector(".diamond")) {
            weak.push(attackerKey);
        }
    }

    function renderKeyList(keys) {
        if (!keys.length) return "-";
        return keys
            .map(k => `<span class="el ${k}">${niceLabelFromKey(k)}</span>`)
            .join(", ");
    }

    infoResists.innerHTML = renderKeyList(resists);
    infoWeak.innerHTML = renderKeyList(weak);

    // learning matrix link placeholder (fill later, or just use HTML)
    infoLearnLink.href = "#";
}

function bindRowInteractions() {
    // all defender rows: any <tr> with a row header <th class="h ..."> except the top header row
    const rows = Array.from(document.querySelectorAll("#matrix tr"))
        .filter((tr, idx) => idx !== 0 && tr.querySelector("th.h"));

    for (const tr of rows) {
        // Desktop hover
        tr.addEventListener("pointerenter", () => updateInfoFromRow(tr));

        // Mobile + click
        tr.addEventListener("click", () => updateInfoFromRow(tr));
    }
}

updateInfoDefault();
bindRowInteractions();