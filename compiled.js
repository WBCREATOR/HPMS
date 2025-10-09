const outputDiv = document.getElementById("output");
let variables = {};
let morseEnabled = false; // Se activa con @import morse();

// --- Funciones base ---
function printP(text) {
    const p = document.createElement("p");
    p.textContent = text;
    outputDiv.appendChild(p);
}

function printH1(titleH1) {
    const h1 = document.createElement("h1");
    h1.textContent = titleH1;
    outputDiv.appendChild(h1);
}

function printStyled(font, size, style, text) {
    const p = document.createElement("p");
    p.textContent = text;
    p.style.fontFamily = font;
    p.style.fontSize = size + "px";
    p.style.fontWeight = style;
    outputDiv.appendChild(p);
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
        'K': '-.-', 'L': '.-..', 'M': '--', 'N': '-.', 'O': '---',
        'P': '.--.', 'Q': '--.-', 'R': '.-.', 'S': '...', 'T': '-',
        'U': '..-', 'V': '...-', 'W': '.--', 'X': '-..-', 'Y': '-.--',
        'Z': '--..', '0': '-----', '1': '.----', '2': '..---',
        '3': '...--', '4': '....-', '5': '.....', '6': '-....',
        '7': '--...', '8': '---..', '9': '----.'
    };
    return text
        .toUpperCase()
        .split("")
        .map(ch => MORSE_CODE[ch] || ch)
        .join(" ");
}

// --- Ejecutar HPMS ---
function runHPMS(code) {
    const lines = code.split("\n").map(l => l.trim()).filter(l => l.length > 0);

    let insideHTMLBlock = false;
    let htmlBlock = "";

    lines.forEach(line => {
        // Ignorar comentarios
        if (line.startsWith("//")) return;

        // --- IMPORTS ---
        if (/@import\s+morse\(\);/i.test(line)) {
            console.log("Módulo Morse importado correctamente.");
            morseEnabled = true;
            return;
        }

        if (/@import\s+code\s*\(html\);/i.test(line) || /@import\s+code\s+from\s+html;/i.test(line)) {
            console.log("Importando módulo Code from HTML...");
            return;
        }

        // --- BLOQUE HTML ---
        if (line.startsWith("code(--html) = {")) {
            insideHTMLBlock = true;
            htmlBlock = "";
            return;
        }

        if (insideHTMLBlock && line.startsWith("};")) {
            insideHTMLBlock = false;
            const container = document.createElement("div");
            container.innerHTML = htmlBlock.trim();
            outputDiv.appendChild(container);
            return;
        }

        if (insideHTMLBlock) {
            htmlBlock += line.replace(/```/g, "") + "\n";
            return;
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
                outputDiv.appendChild(div);
                return;
            }

            // morse(Entry(text) :: morse());
            if (/^morse\(Entry\(text\)\s*::\s*morse\(\)\)/i.test(line)) {
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
                outputDiv.appendChild(wrapper);
                return;
            }
        }

        // --- TITULO DEL DOCUMENTO ---
        if (line.startsWith("name(")) {
            const title = line.match(/name\("(.*)"\)/i)[1];
            document.title = title;
        }

        // --- IDIOMA ---
        else if (line.startsWith("lang:")) {
            const lang = line.split(":")[1].replace(";", "").trim();
            document.documentElement.lang = lang;
        }

        // --- Write title("Texto") ---
        else if (line.startsWith("Write title(")) {
            const titleH1 = line.match(/Write title\("(.*)"\)/i)[1];
            printH1(titleH1);
        }

        // --- Write = print("Texto") ---
        else if (/Write\s*=\s*print\(".*"\)/i.test(line)) {
            const text = line.match(/Write\s*=\s*print\("(.+)"\)/i)[1];
            printP(text);
        }

        // --- Write = print(fuente, size, estilo, "texto") ---
        else if (/Write\s*=\s*print\((.*)\)/i.test(line)) {
            const params = line.match(/Write\s*=\s*print\((.*)\)/i)[1];
            const parts = params.split(",").map(p => p.trim());
            if (parts.length === 4) {
                const font = parts[0];
                const size = Number(parts[1]);
                const style = parts[2];
                const text = parts[3].replace(/^"(.*)"$/, '$1');
                printStyled(font, size, style, text);
            }
        }

        // --- VARIABLES ---
        else if (/^var\s+/i.test(line)) {
            const parts = line.replace(/^var\s+/i, "").split("=");
            const varName = parts[0].trim();
            const value = Number(parts[1].trim());
            variables[varName] = value;
        }

        // --- Write = math(...) ---
        else if (/Write\s*=\s*math\((.*)\)/i.test(line)) {
            const expr = line.match(/Write\s*=\s*math\((.*)\)/i)[1];
            const replaced = expr.replace(/\b(\w+)\b/g, (_, v) => {
                return variables[v] !== undefined ? variables[v] : v;
            });
            math(eval(replaced));
        }

        // --- Cambiar color de fondo ---
        else if (/^body\.selector\(color\)\s*=\s*(.*);$/i.test(line)) {
            const colorValue = line.match(/^body\.selector\(color\)\s*=\s*(.*);$/i)[1].trim();
            document.body.style.backgroundColor = colorValue;
        }

        // --- Cambiar color de texto ---
        else if (/^text\.selector\(color\)\s*=\s*(.*);$/i.test(line)) {
            const colorValue = line.match(/^text\.selector\(color\)\s*=\s*(.*);$/i)[1].trim();
            outputDiv.style.color = colorValue;
        }
    });
}
        // Cargar archivo .hpms
fetch("first-project.hpms")
    .then(response => response.text())
    .then(text => runHPMS(text))
    .catch(err => console.error("Error cargando HPMS:", err));