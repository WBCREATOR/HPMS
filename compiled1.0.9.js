const output = document.getElementById("output");
let variables = {};
let morseEnabled = false;
let elements = {};
let insideEventBlock = false;
let currentEventBlock = "";
let insideStyleBlock = false;
let currentStyleBlock = "";
let partPageImport = { header: false, main: false, footer: false };
let insideHeaderBlock = false;
let insideFooterBlock = false;

let headerConfig = {};
let footerConfig = {};

let mainIsNormal = false;

// ===== PARTPAGE SYSTEM =====
let partPageUsed = {
    header: false,
    main: false,
    footer: false
};

let partPageConfig = {
    header: {
        title: null,
        titleColor: null,
        bg: null,
        fixed: false,
        animFade: false
    },
    main: {
        normal: false
    },
    footer: {
        content: null,
        contentColor: null,
        bg: null,
        fixed: false,
        animFade: false
    }
};

// ❌ FIX: wrong line removed
// document.createElement("div#output");

// --- FIX OUTPUT SAFE INIT ---
let safeOutput = document.getElementById("output");

if (!safeOutput) {
    safeOutput = document.createElement("div");
    safeOutput.id = "output";
    document.body.appendChild(safeOutput);
}

// --- Funciones base ---
function printP(text) {
    const p = document.createElement("p");
    p.textContent = text;
    safeOutput.appendChild(p);
}

function printH1(titleH1) {
    const h1 = document.createElement("h1");
    h1.textContent = titleH1;
    safeOutput.appendChild(h1);
}

function printStyled(font, size, style, text) {
    const p = document.createElement("p");
    p.textContent = text;
    p.style.fontFamily = font;
    p.style.fontSize = size + "px";
    p.style.fontWeight = style;
    safeOutput.appendChild(p);
}

function math(value) {
    printP(value);
    return value;
}

// --- MORSE ---
function toMorse(text) {
    const MORSE_CODE = {
        'A': '.-', 'B': '-...', 'C': '-.-.', 'D': '-..', 'E': '.',
        'F': '..-.', 'G': '--.', 'H': '....', 'I': '..', 'J': '.---',
        'K': '-.-', 'L': '.-..', 'M': '--', 'N': '-.', 'Ñ': '--.--',
        'O': '---', 'P': '.--.', 'Q': '--.-', 'R': '.-.', 'S': '...',
        'T': '-', 'U': '..-', 'V': '...-', 'W': '.--', 'X': '-..-',
        'Y': '-.--', 'Z': '--..',
        '0': '-----', '1': '.----', '2': '..---', '3': '...--',
        '4': '....-', '5': '.....', '6': '-....', '7': '--...',
        '8': '---..', '9': '----.',
        ' ': '/'
    };

    return text
        .toUpperCase()
        .split("")
        .map(ch => MORSE_CODE[ch] || ch)
        .join(" ");
}

// --- BLOCK EXTRACTOR ---
function extractBlock(lines, startIndex) {
    const block = [];
    let i = startIndex;

    for (let j = i + 1; j < lines.length; j++) {
        const ln = lines[j].trim();
        if (ln === "}" || ln === "};") {
            return { block, endIndex: j };
        }
        block.push(ln);
    }

    return { block, endIndex: lines.length - 1 };
}

// --- BACKGROUND ---
function convertHPMSBackground(val) {
    if (!val) return null;
    val = val.replace(/;$/, "").trim();

    if (val.includes("gradient(")) {
        const inside = val.substring(val.indexOf("(") + 1, val.lastIndexOf(")"));
        const parts = inside.split(",");

        const angle = Number(parts[0].replace("deg", "")) || 0;
        const colors = parts[1];

        const match = colors.match(/["']([^"']+)["']\s*::\s*["']([^"']+)["']/);

        if (!match) return null;

        return `linear-gradient(${angle}deg, ${match[1]}, ${match[2]})`;
    }

    return val.replace(/["']/g, "");
}

// --- EVENTS ---
function executeEventLine(line) {
    line = line.trim();
    if (!line) return;

    if (/Write\s*=\s*print\("(.+)"\);?/i.test(line)) {
        const text = line.match(/Write\s*=\s*print\("(.+)"\);?/i)[1];
        printP(text);
        return;
    }

    if (/^body\.selector\(color\)\s*=\s*(.*);?$/i.test(line)) {
        document.body.style.backgroundColor =
            line.match(/^body\.selector\(color\)\s*=\s*(.*);?$/i)[1];
        return;
    }

    if (/^text\.selector\(color\)\s*=\s*(.*);?$/i.test(line)) {
        safeOutput.style.color =
            line.match(/^text\.selector\(color\)\s*=\s*(.*);?$/i)[1];
        return;
    }

    if (/^var\s+/i.test(line)) {
        const parts = line.replace(/^var\s+/i, "").split("=");
        variables[parts[0].trim()] = Number(parts[1]);
        return;
    }

    if (/Write\s*=\s*math\((.*)\)/i.test(line)) {
        const expr = line.match(/Write\s*=\s*math\((.*)\)/i)[1];

        const replaced = expr.replace(/\b(\w+)\b/g, v =>
            variables[v] !== undefined ? variables[v] : v
        );

        try {
            math(Function(`return ${replaced}`)());
        } catch (e) {
            console.error("Math error", e);
        }
        return;
    }
}

// --- PART PAGE RENDER ---
function renderPartPage() {
    const HPMS_HEADER = document.createElement("header");
    const HPMS_MAIN = document.createElement("main");
    const HPMS_FOOTER = document.createElement("footer");

    document.body.prepend(HPMS_HEADER);
    document.body.appendChild(HPMS_MAIN);
    document.body.appendChild(HPMS_FOOTER);

    // HEADER
    if (partPageImport.header || partPageUsed.header) {
        if (partPageConfig.header.title) {
            const h1 = document.createElement("h1");
            h1.textContent = partPageConfig.header.title;
            HPMS_HEADER.appendChild(h1);
        }

        if (partPageConfig.header.bg)
            HPMS_HEADER.style.background = partPageConfig.header.bg;

        if (partPageConfig.header.fixed) {
            HPMS_HEADER.style.position = "fixed";
            HPMS_HEADER.style.top = "0";
        }
    }

    // FOOTER
    if (partPageImport.footer || partPageUsed.footer) {
        if (partPageConfig.footer.content) {
            const p = document.createElement("p");
            p.textContent = partPageConfig.footer.content;
            HPMS_FOOTER.appendChild(p);
        }

        if (partPageConfig.footer.bg)
            HPMS_FOOTER.style.background = partPageConfig.footer.bg;

        if (partPageConfig.footer.fixed) {
            HPMS_FOOTER.style.position = "fixed";
            HPMS_FOOTER.style.bottom = "0";
        }
    }

    const headerH = HPMS_HEADER.getBoundingClientRect().height;
    const footerH = HPMS_FOOTER.getBoundingClientRect().height;

    if (partPageConfig.header.fixed)
        HPMS_MAIN.style.paddingTop = headerH + "px";

    if (partPageConfig.footer.fixed)
        HPMS_MAIN.style.paddingBottom = footerH + "px";

    HPMS_MAIN.appendChild(safeOutput);
}

// --- CARD SYSTEM ---
function createCardComponent(params) {
    const card = document.createElement("div");
    card.style.width = params.wh + "px";
    card.style.height = params.ht + "px";

    const inner = document.createElement("div");
    inner.style.width = "100%";
    inner.style.height = "100%";
    inner.style.transition = "0.6s";

    const front = document.createElement("div");
    front.style.background = params.gradient;

    const back = document.createElement("div");
    back.innerHTML = params.hoverText;

    card.appendChild(inner);
    inner.appendChild(front);
    inner.appendChild(back);

    return card;
}

// --- MAIN COMPILER ---
function runHPMS(code) {

    code = code.replace(/^\uFEFF/, "");
    const lines = code.split("\n").map(l => l.trim()).filter(Boolean);

    let insideHTMLBlock = false;
    let htmlBlock = "";

    for (let i = 0; i < lines.length; i++) {

        let line = lines[i];

        // IMPORT MORSE
        if (/@import\s+morse\(\);/i.test(line)) {
            morseEnabled = true;
            continue;
        }

        // HTML BLOCK
        if (line.startsWith("code(--html) = {")) {
            insideHTMLBlock = true;
            htmlBlock = "";
            continue;
        }

        if (insideHTMLBlock && line.startsWith("};")) {
            insideHTMLBlock = false;
            const div = document.createElement("div");
            div.innerHTML = htmlBlock;
            safeOutput.appendChild(div);
            continue;
        }

        if (insideHTMLBlock) {
            htmlBlock += line + "\n";
            continue;
        }
    }

    // ❗ FIX IMPORTANT: render ONCE only
    renderPartPage();
}
