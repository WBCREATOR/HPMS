const output = document.getElementById("output");
let variables = {};
let morseEnabled = false; // STrue con @import morse();
let elements = {}; // HPMS v2.0.1 — nuevos componentes
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

document.createElement("div#output");


// --- Funciones base ---
function printP(text) {
    const p = document.createElement("p");
    p.textContent = text;
    output.appendChild(p);
}

function printH1(titleH1) {
    const h1 = document.createElement("h1");
    h1.textContent = titleH1;
    output.appendChild(h1);
}

function printStyled(font, size, style, text) {
    const p = document.createElement("p");
    p.textContent = text;
    p.style.fontFamily = font;
    p.style.fontSize = size + "px";
    p.style.fontWeight = style;
    output.appendChild(p);
}

function math(value) {
    printP(value);
    return value;
}

// --- Traductor Morse ---
function toMorse(text) {
    const MORSE_CODE = {
        'A': '.-', 'B': '-...', 'C': '-.-.', 'D': '-..', 'E': '.',
        'F': '..-.', 'G': '--.', 'H': '....', 'I': '..', 'J': '.---',
        'K': '-.-', 'L': '.-..', 'M': '--', 'N': '-.', 'Ñ': '--.--',
        'O': '---', 'P': '.--.', 'Q': '--.-', 'R': '.-.', 'S': '...',
        'T': '-', 'U': '..-', 'V': '...-', 'W': '.--', 'X': '-..-',
        'Y': '-.--', 'Z': '--..',

        'Á': '.--.-', 'É': '..-..', 'Í': '--..-', 'Ó': '---.', 'Ú': '..--',
        'Ü': '..--', 'Ä': '.-.-', 'Ö': '---.', 'Ç': '-.-..',

        '0': '-----', '1': '.----', '2': '..---', '3': '...--',
        '4': '....-', '5': '.....', '6': '-....', '7': '--...',
        '8': '---..', '9': '----.',

        ' ': '/',

        '.': '.-.-.-', ',': '--..--', ':': '---...', ';': '-.-.-.',
        '?': '..--..', '!': '-.-.--', '"': '.-..-.', "'": '.----.',
        '-': '-....-', '_': '..--.-', '/': '-..-.', '@': '.--.-.',
        '=': '-...-', '+': '.-.-.',

        '¿': '..-.-', '¡': '---..-',

        '(': '-.--.', ')': '-.--.-', '[': '-.--.', ']': '-.--.-',
        '{': '-.--.', '}': '-.--.-',

        '<': '-.--.-', '>': '.-.-.', '*': '-..-', '^': '..--.',
        '%': '----.-', '#': '......',

        '$': '...-..-', '€': '..-..-', '£': '.-..-', '¥': '-.--',

        '&': '.-...', '|': '--.-.-', '~': '.-.-.-',
        '\\': '-..-.', '`': '.----.',

        '§': '...-.-', '¶': '.-.-..', '©': '.-.-.-',
        '®': '.-.--.', '™': '--.--.',

        '🙂': '...-...', '☹': '---...', '❤': '.-..-.-',
        '★': '--*-*-', '✓': '-.-.-', '✗': '-..-.-',

        '\n': '.-.-', '\t': '----'
    };

    return text
        .toUpperCase()
        .split("")
        .map(ch => MORSE_CODE[ch] || ch)
        .join(" ");
}

function extractBlock(lines, startIndex) {
    const block = [];
    let i = startIndex;
    if (!lines[i].includes("{")) {
        while (i + 1 < lines.length && !lines[i + 1].includes("{")) {
            i++;
        }
        i++;
    }
    for (let j = i + 1; j < lines.length; j++) {
        const ln = lines[j].trim();
        if (ln === "}" || ln === "};" || ln.startsWith("};")) {
            return { block, endIndex: j };
        }
        block.push(ln);
    }
    return { block, endIndex: lines.length - 1 };
}

function convertHPMSBackground(val) {
    if (!val) return null;
    val = val.trim();
    val = val.replace(/;$/, "").trim();
    if (val.startsWith('gradient(') || val.startsWith('gradient (')) {
        const inside = val.substring(val.indexOf("(") + 1, val.lastIndexOf(")"));
        const commaIndex = inside.indexOf(",");
        if (commaIndex === -1) return null;
        const anglePart = inside.substring(0, commaIndex).trim();
        const colorsPart = inside.substring(commaIndex + 1).trim();
        // colorsPart contiene algo como: "color1" :: "color2"
        const colorsMatch = colorsPart.match(/["']([^"']+)["']\s*::\s*["']([^"']+)["']/);
        if (!colorsMatch) return null;
        const c1 = colorsMatch[1].trim();
        const c2 = colorsMatch[2].trim();
        const angleNum = anglePart.replace(/deg|°/g, "").trim();
        const angle = Number(angleNum) || 0;
        return `linear-gradient(${angle}deg, ${c1}, ${c2})`;
    }
    const simple = val.replace(/^["']|["']$/g, "");
    return simple;
}

function executeEventLine(line) {

    line = line.trim();
    if (line.length === 0) return;

    // Write = print("Texto")  -> aceptar ; opcional
    if (/Write\s*=\s*print\("(.+)"\);?/i.test(line)) {
        const text = line.match(/Write\s*=\s*print\("(.+)"\);?/i)[1];
        printP(text);
        return;
    }

    // body.selector(color) = red;
    if (/^body\.selector\(color\)\s*=\s*(.*);?$/i.test(line)) {
        const colorValue = line.match(/^body\.selector\(color\)\s*=\s*(.*);?$/i)[1].trim();
        document.body.style.backgroundColor = colorValue;
        return;
    }

    // text.selector(color) = blue;
    if (/^text\.selector\(color\)\s*=\s*(.*);?$/i.test(line)) {
        const colorValue = line.match(/^text\.selector\(color\)\s*=\s*(.*);?$/i)[1].trim();
        output.style.color = colorValue;
        return;
    }

    // variables numéricas
    if (/^var\s+/i.test(line)) {
        const parts = line.replace(/^var\s+/i, "").split("=");
        const varName = parts[0].trim();
        const value = Number(parts[1].trim());
        variables[varName] = value;
        return;
    }

    // operaciones matemáticas simples
    if (/Write\s*=\s*math\((.*)\)/i.test(line)) {
        const expr = line.match(/Write\s*=\s*math\((.*)\)/i)[1];
        const replaced = expr.replace(/\b(\w+)\b/g, (_, v) => {
            return variables[v] !== undefined ? variables[v] : v;
        });
        math(eval(replaced));
        return;
    }
}

// --- Estructura base para partPage ---
const HPMS_HEADER = document.createElement("header");
const HPMS_MAIN = document.createElement("main");
const HPMS_FOOTER = document.createElement("footer");

HPMS_HEADER.style.width = "100%";
HPMS_MAIN.style.width = "100%";
HPMS_FOOTER.style.width = "100%";

if (!output) {
    const newOut = document.createElement("div");
    newOut.id = "output";
    HPMS_MAIN.appendChild(newOut);
} else {
    if (output.parentElement !== HPMS_MAIN) {
        HPMS_MAIN.appendChild(output);
    }
}

document.body.prepend(HPMS_HEADER);
document.body.appendChild(HPMS_MAIN);
document.body.appendChild(HPMS_FOOTER);

// función que aplica render de header/footer una vez parseado
function renderPartPage() {
    // HEADER
    if (partPageImport.header || partPageUsed.header) {
        HPMS_HEADER.innerHTML = ""; // limpio
        HPMS_HEADER.style.padding = "12px 20px";
        HPMS_HEADER.style.display = "flex";
        HPMS_HEADER.style.justifyContent = "center";
        HPMS_HEADER.style.alignItems = "center";
        HPMS_HEADER.style.zIndex = "9999";
        HPMS_HEADER.style.left = "0";
        HPMS_HEADER.style.right = "0";

        if (partPageConfig.header.title) {
            const h1 = document.createElement("h1");
            h1.textContent = partPageConfig.header.title;
            if (partPageConfig.header.titleColor) h1.style.color = partPageConfig.header.titleColor;
            HPMS_HEADER.appendChild(h1);
        }

        if (partPageConfig.header.bg) {
            HPMS_HEADER.style.background = partPageConfig.header.bg;
        } else {
            HPMS_HEADER.style.background = "transparent";
        }

        if (partPageConfig.header.fixed) {
            HPMS_HEADER.style.position = "fixed";
            HPMS_HEADER.style.top = "0";
        } else {
            HPMS_HEADER.style.position = "absolute";
            HPMS_HEADER.style.top = "0";
        }

        if (partPageConfig.header.animFade) {
            HPMS_HEADER.style.opacity = "0";
            HPMS_HEADER.style.transition = "opacity 0.6s ease, transform 0.4s ease";
            setTimeout(() => {
                HPMS_HEADER.style.opacity = "1";
                HPMS_HEADER.style.transform = "translateY(0)";
            }, 20);
        } else {
            HPMS_HEADER.style.opacity = "1";
        }
    } else {
        HPMS_HEADER.innerHTML = "";
        HPMS_HEADER.style.background = "transparent";
    }

    // FOOTER
    if (partPageImport.footer || partPageUsed.footer) {
        HPMS_FOOTER.innerHTML = "";
        HPMS_FOOTER.style.padding = "12px 20px";
        HPMS_FOOTER.style.display = "flex";
        HPMS_FOOTER.style.justifyContent = "center";
        HPMS_FOOTER.style.alignItems = "center";
        HPMS_FOOTER.style.zIndex = "9999";
        HPMS_FOOTER.style.left = "0";
        HPMS_FOOTER.style.right = "0";

        if (partPageConfig.footer.content) {
            const p = document.createElement("p");
            p.innerHTML = partPageConfig.footer.content;
            if (partPageConfig.footer.contentColor) p.style.color = partPageConfig.footer.contentColor;
            HPMS_FOOTER.appendChild(p);
        }

        if (partPageConfig.footer.bg) {
            HPMS_FOOTER.style.background = partPageConfig.footer.bg;
        } else {
            HPMS_FOOTER.style.background = "transparent";
        }

        if (partPageConfig.footer.fixed) {
            HPMS_FOOTER.style.position = "fixed";
            HPMS_FOOTER.style.bottom = "0";
        } else {
            HPMS_FOOTER.style.position = "absolute";
            HPMS_FOOTER.style.bottom = "0";
        }

        if (partPageConfig.footer.animFade) {
            HPMS_FOOTER.style.opacity = "0";
            HPMS_FOOTER.style.transition = "opacity 0.6s ease, transform 0.4s ease";
            setTimeout(() => {
                HPMS_FOOTER.style.opacity = "1";
                HPMS_FOOTER.style.transform = "translateY(0)";
            }, 20);
        } else {
            HPMS_FOOTER.style.opacity = "1";
        }
    } else {
        HPMS_FOOTER.innerHTML = "";
        HPMS_FOOTER.style.background = "transparent";
    }

    // MAIN: si no hay main importado, no hacemos nada; si main existe, el output ya fue insertado en HPMS_MAIN
    // Ajuste estético para no tapar contenido cuando header es fixed: damos padding-top al main
    const headerHeight = HPMS_HEADER.getBoundingClientRect().height || 0;
    if (partPageConfig.header && partPageConfig.header.fixed) {
        HPMS_MAIN.style.paddingTop = headerHeight + "px";
    }
    const footerHeight = HPMS_FOOTER.getBoundingClientRect().height || 0;
    if (partPageConfig.footer && partPageConfig.footer.fixed) {
        HPMS_MAIN.style.paddingBottom = footerHeight + "px";
    }
}

let blockImportEnabled = false;

// ===== CARDS COMPONENT =====
function createCardComponent(params) {
    const card = document.createElement("div");
    card.className = "hpms-card";
    card.style.width = params.wh + "px";
    card.style.height = params.ht + "px";
    card.style.perspective = "1000px";
    card.style.display = "inline-block";
    card.style.margin = "10px";

    const inner = document.createElement("div");
    inner.className = "hpms-card-inner";
    inner.style.width = "100%";
    inner.style.height = "100%";
    inner.style.position = "relative";
    inner.style.transformStyle = "preserve-3d";
    inner.style.transition = "transform 0.6s ease";

    const front = document.createElement("div");
    front.className = "hpms-card-front";
    front.style.position = "absolute";
    front.style.width = "100%";
    front.style.height = "100%";
    front.style.backfaceVisibility = "hidden";
    front.style.borderRadius = "16px";
    front.style.background = params.gradient;
    front.style.display = "flex";
    front.style.alignItems = "center";
    front.style.justifyContent = "center";

    const back = document.createElement("div");
    back.className = "hpms-card-back";
    back.style.position = "absolute";
    back.style.width = "100%";
    back.style.height = "100%";
    back.style.backfaceVisibility = "hidden";
    back.style.transform = "rotateY(180deg)";
    back.style.borderRadius = "16px";
    back.style.background = "#111";
    back.style.color = "#fff";
    back.style.display = "flex";
    back.style.alignItems = "center";
    back.style.justifyContent = "center";
    back.style.padding = "15px";
    back.style.boxSizing = "border-box";
    back.innerHTML = params.hoverText;

    card.addEventListener("mouseenter", () => {
        inner.style.transform = "rotateY(180deg)";
    });

    card.addEventListener("mouseleave", () => {
        inner.style.transform = "rotateY(0deg)";
    });

    inner.appendChild(front);
    inner.appendChild(back);
    card.appendChild(inner);

    return card;
}

function renderMorse(text, options = {}) {
    const div = document.createElement("div");

    div.textContent = toMorse(text);

    div.style.background = options.Bg || "#222";
    div.style.color = options.Fg || "#0f0";
    div.style.padding = "10px";
    div.style.borderRadius = "8px";
    div.style.fontFamily = "monospace";
    div.style.marginTop = "8px";

    if (options.Wh) div.style.width = options.Wh + "px";
    if (options.Ht) div.style.height = options.Ht + "px";

    if (options.Copy === true) {
        div.style.cursor = "pointer";
        div.title = "Click para copiar";
        div.addEventListener("click", () => {
            navigator.clipboard.writeText(div.textContent);
            div.style.opacity = "0.6";
            setTimeout(() => div.style.opacity = "1", 200);
        });
    }

    return div;
}

// --- Ejecutar HPMS ---
function runHPMS(code) {

    class Block {
        constructor(params) {
            this.bg = params.bg;
            this.fg = params.fg;
            this.wh = params.wh;
            this.html = params.html;
            this.preview = params.preview || false;
        }

        render() {
            const div = document.createElement("div");
            div.className = "plume-block";
            div.style.background = this.bg;
            div.style.color = this.fg;
            div.style.width = this.wh + "px";
            div.style.height = this.wh + "px";

            if (this.preview) {
                const iframe = document.createElement("iframe");
                iframe.className = "plume-preview";

                iframe.onload = () => {
                    iframe.contentDocument.body.innerHTML = this.html;
                };

                div.appendChild(iframe);
            }

            return div;
        }
    }


    // eliminar BOM si existe
    code = code.replace(/^\uFEFF/, "");

    const lines = code.split("\n").map(l => l.trim()).filter(l => l.length > 0);

    let insideHTMLBlock = false;
    let htmlBlock = "";

    // Usamos for para poder mover el índice cuando extraemos bloques
    for (let i = 0; i < lines.length; i++) {
        let line = lines[i];

        // @import block();
        if (/^@import\s+block\(\);?$/i.test(line)) {
            blockImportEnabled = true;
            continue;
        }

        // block( ... );
        if (blockImportEnabled && /^block\s*\(/i.test(line)) {

            let params = {
                bg: null,
                fg: null,
                wh: null,
                html: "",
                preview: false
            };

            // Extraer todo el contenido del block() hasta ");
            let blockLines = [];

            if (!line.includes(");")) {
                // Continuar leyendo líneas hasta cerrar block
                for (let j = i + 1; j < lines.length; j++) {
                    blockLines.push(lines[j]);
                    if (lines[j].includes(");")) {
                        i = j; // mover índice global
                        break;
                    }
                }
            }

            // === PARSEAR PARAMETROS ===
            blockLines.forEach(l => {
                l = l.trim();

                if (/^bg:\s*/i.test(l))
                    params.bg = l.replace(/^bg:\s*/i, "").replace(/;$/, "").replace(/"/g, "");

                else if (/^fg:\s*/i.test(l))
                    params.fg = l.replace(/^fg:\s*/i, "").replace(/;$/, "").replace(/"/g, "");

                else if (/^wh:\s*/i.test(l))
                    params.wh = Number(l.replace(/^wh:\s*/i, "").replace(/;$/, "").trim());

                else if (/^this\.preview\(\);?$/i.test(l))
                    params.preview = true;

                else if (/^Content\s*=\s*code\(\);?$/i.test(l)) {
                    // No hace nada: solo marca que luego viene el code()
                }

                else if (/^code\(\)\s*=\s*"""/i.test(l)) {
                    insideHTMLBlock = true;
                }

                else if (insideHTMLBlock) {
                    if (l.endsWith(`"""`)) {
                        insideHTMLBlock = false;
                        params.html += l.replace(`"""`, "");
                    } else {
                        params.html += l + "\n";
                    }
                }
            });

            // Crear instancia del bloque
            const blockObj = new Block(params);

            // Renderizar
            output.appendChild(blockObj.render());

            continue;
        }


        if (/^@import\s+partPage\((.*)\);?$/i.test(line)) {
            const args = line.match(/^@import\s+partPage\((.*)\);?$/i)[1];
            const parts = args.split(",").map(p => p.trim());

            partPageImport = {
                header: parts.includes("--header"),
                main: parts.includes("--main"),
                footer: parts.includes("--footer")
            };
            // marcar uso también en partPageUsed para compatibilidad
            partPageUsed.header = partPageImport.header || partPageUsed.header;
            partPageUsed.main = partPageImport.main || partPageUsed.main;
            partPageUsed.footer = partPageImport.footer || partPageUsed.footer;
            continue; // IMPORTANTE: no return
        }

        // Detectar inicio de bloque header
        if (/^partPage\(--header\)\s*=\s*{$/i.test(line)) {
            const parsed = extractBlock(lines, i);
            const block = parsed.block;
            i = parsed.endIndex; // avanzar índice a la línea de cierre

            // parsear contenido del bloque
            block.forEach(inner => {
                inner = inner.trim();
                if (inner.startsWith("title(")) {
                    const m = inner.match(/title\(["']?(.*?)["']?\)(?:\.color\(["']?(.*?)["']?\))?;?/i);
                    if (m) {
                        partPageConfig.header.title = m[1] || null;
                        if (m[2]) partPageConfig.header.titleColor = m[2];
                    }
                }
                if (inner.includes(").color(") && inner.startsWith("title(") === false) {
                    // fallback: any .color on following lines (not necessary if title parsed above)
                    const mcol = inner.match(/\.color\(["']?(.*?)["']?\)/i);
                    if (mcol) partPageConfig.header.titleColor = mcol[1];
                }
                if (inner.startsWith("bg:")) {
                    let val = inner.replace("bg:", "").replace(/;$/, "").trim();
                    partPageConfig.header.bg = convertHPMSBackground(val);
                }
                if (inner.startsWith("fixed:")) {
                    partPageConfig.header.fixed = inner.includes("true");
                }
                if (inner.startsWith("animFade:")) {
                    partPageConfig.header.animFade = inner.includes("true");
                }
            });

            continue;
        }

        // Detectar inicio de bloque footer
        if (/^partPage\(--footer\)\s*=\s*{$/i.test(line)) {
            const parsed = extractBlock(lines, i);
            const block = parsed.block;
            i = parsed.endIndex; // avanzar índice a la línea de cierre

            block.forEach(inner => {
                inner = inner.trim();

                if (inner.startsWith("contentText(")) {
                    let text = inner.substring(inner.indexOf("(") + 1, inner.lastIndexOf(")")).replace(/"/g, "");
                    partPageConfig.footer.content = text;
                }

                if (inner.includes(").color(")) {
                    let color = inner.split(".color(")[1].replace(")", "").replace(/"/g, "");
                    partPageConfig.footer.contentColor = color;
                }

                if (inner.startsWith("bg:")) {
                    let val = inner.replace("bg:", "").trim();
                    partPageConfig.footer.bg = convertHPMSBackground(val);
                }

                if (inner.startsWith("fixed:")) {
                    partPageConfig.footer.fixed = inner.includes("true");
                }

                if (inner.startsWith("animFade:")) {
                    partPageConfig.footer.animFade = inner.includes("true");
                }
            });
            continue;
        }

        // --- partPage main.normal ---
        if (line.startsWith("partPage(--main).normal")) {
            partPageConfig.main.normal = true;
            continue;
        }

        // --- <Margin long:X> y <Margin long:X, color:"xxx"> (robusto)
        if (/^<\s*Margin\s+long\s*:\s*(\d+)(?:\s*px)?(?:\s*,\s*color\s*:\s*["']([^"']+)["'])?\s*>$/i.test(line)) {
            const match = line.match(/^<\s*Margin\s+long\s*:\s*(\d+)(?:\s*px)?(?:\s*,\s*color\s*:\s*["']([^"']+)["'])?\s*>$/i);
            const height = Number(match[1]);
            const color = match[2] ? match[2] : "transparent";

            const spacer = document.createElement("div");
            spacer.style.height = height + "px";
            spacer.style.width = "100%";
            spacer.style.backgroundColor = color;
            // Evitar colapsos si color es transparent (aun así ok)
            if (color === "transparent" || color === "rgba(0,0,0,0)") {
                spacer.style.pointerEvents = "none";
            }

            output.appendChild(spacer);
            continue;
        }

        // --- <margin long:X, gradient(angle, "c1" :: "c2")> (robusto)
        if (/^<\s*margin\s+long\s*:\s*(\d+)(?:\s*px)?\s*,\s*gradient\(\s*(\d+)\s*,\s*["']([^"']+)["']\s*::\s*["']([^"']+)["']\s*\)\s*>$/i.test(line)) {

            const match = line.match(
                /^<\s*margin\s+long\s*:\s*(\d+)(?:\s*px)?\s*,\s*gradient\(\s*(\d+)\s*,\s*["']([^"']+)["']\s*::\s*["']([^"']+)["']\s*\)\s*>$/i
            );

            const height = Number(match[1]);
            const angle = Number(match[2]);
            const color1 = match[3];
            const color2 = match[4];

            const spacer = document.createElement("div");
            spacer.style.height = height + "px";
            spacer.style.width = "100%";
            spacer.style.background = `linear-gradient(${angle}deg, ${color1}, ${color2})`;

            output.appendChild(spacer);
            continue;
        }

        // --- <Cards gradient(...), Hover(contain(...)), wh:X ht:Y>
        if (/^<\s*Cards\s+/i.test(line)) {

            const params = {
                gradient: "#333",
                hoverText: "",
                wh: 200,
                ht: 200
            };

            const content = line.replace(/^<\s*Cards\s*/i, "").replace(/>$/, "");

            // gradient(angle, "c1" :: "c2")
            const g = content.match(/gradient\(\s*(\d+)\s*,\s*["']([^"']+)["']\s*::\s*["']([^"']+)["']\s*\)/i);
            if (g) {
                params.gradient = `linear-gradient(${g[1]}deg, ${g[2]}, ${g[3]})`;
            }

            // Hover(contain("text"))
            const h = content.match(/Hover\s*\(\s*contain\s*\(\s*["']([^"']+)["']\s*\)\s*\)/i);
            if (h) {
                params.hoverText = h[1];
            }

            // wh:X
            const w = content.match(/wh\s*:\s*(\d+)/i);
            if (w) params.wh = Number(w[1]);

            // ht:Y
            const ht = content.match(/ht\s*:\s*(\d+)/i);
            if (ht) params.ht = Number(ht[1]);

            const card = createCardComponent(params);
            output.appendChild(card);
            continue;
        }


        // --- Icon = img("URL");
        if (/^Icon\s*=\s*img\("(.+)"\);?$/i.test(line)) {
            const iconURL = line.match(/^Icon\s*=\s*img\("(.+)"\);?$/i)[1].trim();

            // Borrar favicon previo si existe
            let old = document.querySelector("link[rel='icon']");
            if (old) old.remove();

            const link = document.createElement("link");
            link.rel = "icon";
            link.href = iconURL;

            document.head.appendChild(link);
            continue;
        }


        // --- Create = Button("Texto") & var a;
        if (/^Create\s*=\s*Button\("(.+)"\)\s*&\s*var\s+(\w+);$/i.test(line)) {

            const [, btnText, varName] = line.match(/^Create\s*=\s*Button\("(.+)"\)\s*&\s*var\s+(\w+);$/i);

            const btn = document.createElement("button");
            btn.textContent = btnText;
            btn.style.padding = "8px 14px";
            btn.style.borderRadius = "6px";
            btn.style.cursor = "pointer";

            output.appendChild(btn);

            // Guardamos el elemento asociado al nombre de variable
            elements[varName] = btn;
            continue;
        }

        // --- a.selector(styles) = { ... }
        if (/^(\w+)\.selector\(styles\)\s*=\s*\{/.test(line)) {
            const varName = line.match(/^(\w+)\.selector\(styles\)/)[1];

            insideStyleBlock = varName;
            currentStyleBlock = "";
            continue;
        }

        if (insideStyleBlock && line === "}") {
            const el = elements[insideStyleBlock];

            currentStyleBlock.split("\n").forEach(styleLine => {
                if (!styleLine.includes(":")) return;
                let [prop, val] = styleLine.split(":");
                prop = prop.trim();
                val = val.replace(";", "").trim();
                // convertir prop de css-like a camelCase si hace falta
                // permitir propiedades con guión (background-color)
                if (prop.includes("-")) {
                    // setear directamente la propiedad CSS
                    el.style.setProperty(prop, val);
                } else {
                    el.style[prop] = val;
                }
            });

            insideStyleBlock = false;
            currentStyleBlock = "";
            continue;
        }

        if (insideStyleBlock) {
            currentStyleBlock += line + "\n";
            continue;
        }

        // --- a.event() = { ... }
        if (/^(\w+)\.event\(\)\s*=\s*\{/.test(line)) {
            const varName = line.match(/^(\w+)\.event\(\)/)[1];

            insideEventBlock = varName;
            currentEventBlock = "";
            continue;
        }

        // ----------------------------------------------------
        if (insideEventBlock && line === "}") {

            const el = elements[insideEventBlock];

            // clonamos el código antes de limpiar
            const eventCode = currentEventBlock;

            el.addEventListener("click", () => {
                eventCode.split("\n").forEach(evLine => {
                    // ignorar líneas vacías
                    if (evLine.trim().length === 0) return;
                    executeEventLine(evLine);
                });
            });

            insideEventBlock = false;
            currentEventBlock = ""; // ← Ahora sí lo borramos sin afectar al listener
            continue;
        }
        // ----------------------------------------------------

        if (insideEventBlock) {
            currentEventBlock += line + "\n";
            continue;
        }

        // Ignorar comentarios
        if (line.startsWith("//")) continue;

        if (/@import\s+morse\(\);/i.test(line)) {
            console.log("Módulo Morse importado correctamente.");
            morseEnabled = true;
            continue;
        }

        if (/@import\s+code\s*\(html\);/i.test(line) || /@import\s+code\s+from\s+html;/i.test(line)) {
            console.log("Importando módulo Code from HTML...");
            continue;
        }

        // --- BLOQUE HTML ---
        if (line.startsWith("code(--html) = {")) {
            insideHTMLBlock = true;
            htmlBlock = "";
            continue;
        }

        if (insideHTMLBlock && line.startsWith("};")) {
            insideHTMLBlock = false;
            const container = document.createElement("div");
            container.innerHTML = htmlBlock.trim();
            output.appendChild(container);
            continue;
        }

        if (insideHTMLBlock) {
            htmlBlock += line.replace(/```/g, "") + "\n";
            continue;
        }

        // --- MORSE ---
        if (morseEnabled) {
            // morse("Texto literal" :: morse());
            if (/^morse\(".*"\s*::\s*morse\(\)\)/i.test(line)) {
                const text = line.match(/^morse\("(.*)"\s*::\s*morse\(\)\)/i)[1];
                const morseText = toMorse(text);
                const div = document.createElement("div");
                div.style.background = "#222";
                div.style.color = "#0f0";
                div.style.padding = "10px";
                div.style.borderRadius = "8px";
                div.style.marginTop = "8px";
                div.textContent = morseText;
                output.appendChild(div);
                continue;
            }

            // morse(Entry("texto") :: morse());
            if (/^morse\(Entry\(["'](.+)["']\)\s*::\s*morse\(\)\)/i.test(line)) {

                const wrapper = document.createElement("div");
                wrapper.style.marginTop = "10px";
                wrapper.style.display = "flex";
                wrapper.style.flexDirection = "column";
                wrapper.style.gap = "5px";

                const input = document.createElement("input");
                input.type = "text";
                input.placeholder = "Escribe texto para traducir a Morse...";
                input.style.padding = "8px";
                input.style.border = "1px solid #0f0";
                input.style.background = "#111";
                input.style.color = "#0f0";
                input.style.borderRadius = "6px";
                input.style.width = "300px";

                const result = document.createElement("div");
                result.style.fontFamily = "monospace";
                result.style.background = "#222";
                result.style.color = "#0f0";
                result.style.padding = "8px";
                result.style.borderRadius = "8px";
                result.style.minHeight = "20px";

                input.addEventListener("keydown", e => {
                    if (e.key === "Enter") {
                        result.textContent = toMorse(input.value);
                    }
                });

                wrapper.appendChild(input);
                wrapper.appendChild(result);
                output.appendChild(wrapper);
                continue;
            }

            if (morseEnabled) {

                // 🟢 MORSE CON OPCIONES (PRIMERO)
                if (/^morse\(".*"\s*::\s*morse\(\)\s*,/i.test(line)) {

                    const text = line.match(/^morse\("(.+?)"\s*::\s*morse\(\)/i)[1];
                    const options = {};

                    const bg = line.match(/Bg\s*=\s*["']([^"']+)["']/i);
                    if (bg) options.Bg = bg[1];

                    const fg = line.match(/Fg\s*=\s*["']([^"']+)["']/i);
                    if (fg) options.Fg = fg[1];

                    const wh = line.match(/Wh\s*=\s*(\d+)/i);
                    if (wh) options.Wh = Number(wh[1]);

                    const ht = line.match(/Ht\s*=\s*(\d+)/i);
                    if (ht) options.Ht = Number(ht[1]);

                    const copy = line.match(/Copy\s*=\s*(true|false)/i);
                    if (copy) options.Copy = copy[1] === "true";

                    output.appendChild(renderMorse(text, options));
                    continue;
                }

                // 🔵 MORSE SIMPLE (DESPUÉS)
                if (/^morse\(".*"\s*::\s*morse\(\)\);?$/i.test(line)) {

                    const text = line.match(/^morse\("(.*)"\s*::\s*morse\(\)\)/i)[1];
                    output.appendChild(renderMorse(text));
                    continue;
                }
            }


            // --- TITULO DEL DOCUMENTO ---
            if (line.startsWith("name(")) {
                const title = line.match(/name\("(.*)"\)/i)[1];
                document.title = title;
                continue;
            }

            // --- IDIOMA ---
            if (line.startsWith("lang:")) {
                const lang = line.split(":")[1].replace(";", "").trim();
                document.documentElement.lang = lang;
                continue;
            }

            // --- Write title("Texto") ---
            if (line.startsWith("Write title(")) {
                const titleH1 = line.match(/Write title\("(.*)"\)/i)[1];
                printH1(titleH1);
                continue;
            }

            // --- Write = print("Texto") ---
            if (/Write\s*=\s*print\(".*"\)/i.test(line)) {
                const text = line.match(/Write\s*=\s*print\("(.+)"\)/i)[1];
                printP(text);
                continue;
            }

            // --- Write = print(fuente, size, estilo, "texto") ---
            if (/Write\s*=\s*print\((.*)\)/i.test(line)) {
                const params = line.match(/Write\s*=\s*print\((.*)\)/i)[1];
                const parts = params.split(",").map(p => p.trim());
                if (parts.length === 4) {
                    const font = parts[0];
                    const size = Number(parts[1]);
                    const style = parts[2];
                    const text = parts[3].replace(/^"(.*)"$/, '$1');
                    printStyled(font, size, style, text);
                }
                continue;
            }

            // --- VARIABLES ---
            if (/^var\s+/i.test(line)) {
                const parts = line.replace(/^var\s+/i, "").split("=");
                const varName = parts[0].trim();
                const value = Number(parts[1].trim());
                variables[varName] = value;
                continue;
            }

            // --- Write = math(...) ---
            if (/Write\s*=\s*math\((.*)\)/i.test(line)) {
                const expr = line.match(/Write\s*=\s*math\((.*)\)/i)[1];
                const replaced = expr.replace(/\b(\w+)\b/g, (_, v) => {
                    return variables[v] !== undefined ? variables[v] : v;
                });
                math(eval(replaced));
                continue;
            }

            // --- Cambiar color de fondo ---
            if (/^body\.selector\(color\)\s*=\s*(.*);$/i.test(line)) {
                const colorValue = line.match(/^body\.selector\(color\)\s*=\s*(.*);$/i)[1].trim();
                document.body.style.backgroundColor = colorValue;
                continue;
            }

            // --- Cambiar color de texto ---
            if (/^text\.selector\(color\)\s*=\s*(.*);$/i.test(line)) {
                const colorValue = line.match(/^text\.selector\(color\)\s*=\s*(.*);$/i)[1].trim();
                output.style.color = colorValue;
                continue;
            }


            // Si no coincide nada: continuar
        }

        // Al final del parse, renderizamos header/footer según configuración
        renderPartPage();
    }
}
