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

// --- PART PAGE RENDER ---
function renderPartPage() {
    const HPMS_HEADER = document.createElement("header");
    const HPMS_MAIN = document.createElement("main");
    const HPMS_FOOTER = document.createElement("footer");

    document.body.prepend(HPMS_HEADER);
    document.body.appendChild(HPMS_MAIN);
    document.body.appendChild(HPMS_FOOTER);

    if (partPageConfig.header.title) {
        const h1 = document.createElement("h1");
        h1.textContent = partPageConfig.header.title;
        HPMS_HEADER.appendChild(h1);
    }

    if (partPageConfig.footer.content) {
        const p = document.createElement("p");
        p.textContent = partPageConfig.footer.content;
        HPMS_FOOTER.appendChild(p);
    }

    HPMS_MAIN.appendChild(safeOutput);
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

        // NAME
        if (line.startsWith("name(")) {
            const title = line.match(/name\("(.*)"\)/i)[1];
            document.title = title;
            continue;
        }

        // LANG
        if (line.startsWith("lang:")) {
            const lang = line.split(":")[1].replace(";", "").trim();
            document.documentElement.lang = lang;
            continue;
        }

        // PRINT
        if (/Write\s*=\s*print\(".*"\)/i.test(line)) {
            const text = line.match(/Write\s*=\s*print\("(.+)"\)/i)[1];
            printP(text);
            continue;
        }

        // VARIABLES
        if (/^var\s+/i.test(line)) {
            const parts = line.replace(/^var\s+/i, "").split("=");
            variables[parts[0].trim()] = Number(parts[1]);
            continue;
        }

        // MATH
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
            continue;
        }

        // MORSE
        if (morseEnabled && /^morse\(".*"\s*::\s*morse\(\)\)/i.test(line)) {
            const text = line.match(/^morse\("(.*)"\s*::\s*morse\(\)\)/i)[1];

            const div = document.createElement("div");
            div.textContent = toMorse(text);
            div.style.background = "#222";
            div.style.color = "#0f0";
            div.style.padding = "10px";
            div.style.borderRadius = "8px";

            safeOutput.appendChild(div);
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

    renderPartPage();
}
