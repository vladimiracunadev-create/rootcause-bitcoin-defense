#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Genera la version PDF de docs/system-documentation/ desde los Markdown.

Los Markdown son la FUENTE UNICA. Este script no mantiene una segunda copia del
contenido: lo lee, lo convierte y lo escribe en `pdf/`. Si se edita un `.md`,
basta con volver a ejecutarlo.

    python scripts/build-docs-pdf.py                 # todos los documentos
    python scripts/build-docs-pdf.py --check         # solo comprueba que existan
    python scripts/build-docs-pdf.py --only 03,07    # solo esos prefijos

Requisitos
----------
Este proyecto no tiene dependencias de ejecucion y no va a adquirirlas. Este es
un script de DOCUMENTACION, no de producto: vive fuera de `src/` y no participa
en ningun flujo de la aplicacion. Necesita `xhtml2pdf` instalado en el entorno
Python de quien genera la documentacion:

    pip install xhtml2pdf

Si falta, el script lo dice y sale con codigo 1 en vez de fingir que funciono.

Sobre los diagramas
-------------------
Los bloques ```mermaid se renderizan en GitHub, pero un PDF no ejecuta
JavaScript y renderizarlos exigiria Node, npm y un navegador headless. Aqui se
imprimen como su codigo fuente, etiquetados. Por eso cada diagrama de esta
documentacion va SIEMPRE acompanado de su explicacion en prosa: el PDF sigue
siendo comprensible sin la imagen.

Sobre los emojis
----------------
Las fuentes con las que se compone un PDF no llevan emoji de color. En vez de
dejar cuadros vacios, los del semaforo del proyecto se sustituyen por su
equivalente textual, que dice lo mismo: [OK], [ATENCION], [FALLO], [NO COMPROBADO].
"""

import argparse
import html
import io
import os
import re
import sys
from datetime import date

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DOCS = os.path.join(ROOT, "docs", "system-documentation")
OUT = os.path.join(DOCS, "pdf")

SYSTEM_NAME = "RootCause Bitcoin Defense"


# --------------------------------------------------------------------------
# Sustituciones tipograficas
#
# El semaforo del proyecto (verde/amarillo/rojo/blanco) es informacion, no
# decoracion: si se pierde en el PDF, se pierde el estado de cada fila. Por eso
# se traduce a texto en vez de omitirse.
# --------------------------------------------------------------------------
REPLACEMENTS = [
    ("\U0001F7E2", "[OK]"),
    ("\U0001F7E1", "[ATENCION]"),
    ("\U0001F534", "[FALLO]"),
    ("\U0001F7E0", "[ALTA]"),
    ("\U0001F535", "[INFO]"),
    ("\u26AA", "[NO COMPROBADO]"),
    ("\u26AB", "[DESCONOCIDO]"),
    ("\u26A0\uFE0F", "AVISO:"),
    ("\u26A0", "AVISO:"),
    ("\U0001F6E1\uFE0F", ""),
    ("\uFE0F", ""),
]

# Emojis decorativos de encabezado: se retiran, no aportan al PDF.
EMOJI_RANGES = re.compile(
    "[" "\U0001F300-\U0001FAFF" "\U00002190-\U000021FF" "\U00002600-\U000027BF" "]",
    flags=re.UNICODE,
)
KEEP = {"\u2192", "\u2190", "\u2191", "\u2193", "\u2194"}


def normalize_text(value):
    for source, target in REPLACEMENTS:
        value = value.replace(source, target)
    return "".join("" if (EMOJI_RANGES.match(ch) and ch not in KEEP) else ch for ch in value)


# --------------------------------------------------------------------------
# Conversion Markdown -> HTML
#
# Subconjunto deliberado: exactamente lo que usa esta documentacion. No se
# pretende implementar CommonMark; se pretende no equivocarse en lo que si se
# usa. Cualquier construccion nueva que aparezca en los .md hay que anadirla
# aqui, y el resultado se comprueba abriendo el PDF.
# --------------------------------------------------------------------------
def soften(text, max_token):
    """Inserta saltos en los tokens que no caben en una columna estrecha.

    reportlab solo parte por espacios. Un identificador como
    `compareFirmwareVersions` en una celda de treinta puntos no se parte: se
    derrama sobre la celda vecina y el documento deja de ser legible. Aqui se
    inserta un salto explicito, prefiriendo los separadores naturales del
    propio identificador (`/`, `.`, `-`, `_`) y cortando en seco solo cuando no
    hay ninguno.

    `-pdf-word-wrap: CJK` haria esto mismo, pero combinado con los cambios de
    fuente del codigo en linea degenera a un caracter por linea y reportlab
    aborta la maquetacion. Este camino es mas largo y es predecible.
    """
    if max_token <= 0:
        return text

    def cut(token):
        pieces = []
        while len(token) > max_token:
            window = token[:max_token]
            position = max(window.rfind(c) for c in "/.-_")
            if position < max_token // 3:
                position = max_token - 1
            pieces.append(token[: position + 1])
            token = token[position + 1 :]
        pieces.append(token)
        return "\x01".join(pieces)

    return " ".join(
        cut(token) if len(token) > max_token else token for token in text.split(" ")
    )


def inline(text, max_token=0):
    """Aplica el marcado en linea: codigo, negrita, cursiva y enlaces."""
    placeholders = []

    def stash(match):
        placeholders.append(html.escape(soften(match.group(1), max_token)))
        return "\x00%d\x00" % (len(placeholders) - 1)

    # El codigo se aparta primero: dentro de `...` no se interpreta nada mas.
    text = re.sub(r"`([^`]+)`", stash, text)
    text = soften(text, max_token)
    text = html.escape(text)
    text = re.sub(r"\*\*([^*]+)\*\*", r"<b>\1</b>", text)
    text = re.sub(r"(?<![*\w])\*([^*\n]+)\*(?!\w)", r"<i>\1</i>", text)
    # Los enlaces se muestran como texto: un PDF impreso no se puede pulsar, y
    # el destino ya figura en la version Markdown.
    text = re.sub(r"\[([^\]]+)\]\(([^)\s]+)\)", r"<u>\1</u>", text)

    def restore(match):
        # Con `<font size=...>` xhtml2pdf aplica la escala HTML3 (1-7) y el
        # codigo en linea sale gigante. El tamano se fija por CSS.
        return '<span class="ic">%s</span>' % placeholders[int(match.group(1))]

    text = re.sub(r"\x00(\d+)\x00", restore, text)
    # El marcador de corte se convierte en salto solo al final, para que no
    # interfiera con el escapado ni con las expresiones de marcado.
    return text.replace("\x01", "<br/>")


def table_html(rows):
    """Compone una tabla. La primera fila es cabecera; la separadora se descarta."""
    cells = [[c.strip() for c in row.strip().strip("|").split("|")] for row in rows]
    if len(cells) >= 2 and all(re.fullmatch(r":?-{2,}:?", c) for c in cells[1] if c):
        header, body = cells[0], cells[2:]
    else:
        header, body = cells[0], cells[1:]

    width = max([len(header)] + [len(r) for r in body]) if body else len(header)

    # Una tabla de siete o mas columnas NO cabe en A4 vertical, y no es cuestion
    # de encoger la fuente: por debajo de cierto ancho las celdas se derraman
    # unas sobre otras y el documento deja de decir la verdad sobre si mismo.
    # En vez de forzar un layout imposible, cada fila se convierte en una ficha
    # de campo y valor. No se pierde ni un dato, y se lee. La version Markdown
    # conserva la tabla ancha, que en un navegador si funciona.
    if width >= 7:
        return record_html(header, body, width)

    css_class = "mid" if width >= 6 else "std"
    widths = column_widths(header, body, width)
    # Cuantos caracteres caben de verdad en cada columna: el ancho util del
    # marco A4 con los margenes de @page, por el reparto de la columna, dividido
    # entre el avance medio de un caracter a ese cuerpo. Con menos de ocho no se
    # corta nada: partir palabras cortas empeora la lectura sin ganar nada.
    body_width = 504.0
    advance = {"std": 4.3, "mid": 3.9}[css_class]
    budgets = [
        int((body_width * share / 100.0 - 6) / advance) for share in widths
    ]
    budgets = [value if value >= 8 else 0 for value in budgets]

    out = ['<table repeat="1" class="%s">' % css_class]
    out.append("<tr>")
    for index in range(width):
        value = header[index] if index < len(header) else ""
        out.append(
            '<td class="th" width="%d%%">%s</td>'
            % (widths[index], inline(value, budgets[index]))
        )
    out.append("</tr>")
    for row in body:
        out.append("<tr>")
        for index in range(width):
            value = row[index] if index < len(row) else ""
            out.append("<td>%s</td>" % inline(value, budgets[index]))
        out.append("</tr>")
    out.append("</table>")
    return "\n".join(out)


def record_html(header, body, width):
    """Convierte una tabla ancha en una ficha por fila.

    El titulo de cada ficha es el valor de la primera columna, que en esta
    documentacion es siempre el identificador de la fila: el codigo de regla o
    el nombre de la funcionalidad. El resto se lista como campo y valor, y las
    celdas vacias se omiten en vez de dejar una fila muerta.
    """
    out = []
    for row in body:
        first = row[0] if row else ""
        rows = ['<tr><td class="rec-title" colspan="2" width="100%%">%s</td></tr>'
                % inline(first, 0)]
        for index in range(1, width):
            value = row[index].strip() if index < len(row) else ""
            if not value or value == "—":
                continue
            label = header[index] if index < len(header) else ""
            rows.append(
                '<tr><td class="rec-key" width="22%%">%s</td>'
                '<td class="rec-val" width="78%%">%s</td></tr>'
                % (inline(label, 0), inline(value, 34))
            )
        out.append('<table repeat="0" class="rec">%s</table>' % "".join(rows))
    return "\n".join(out)


def column_widths(header, body, width):
    """Reparte el ancho por columna segun cuanto texto lleva cada una.

    Sin anchos explicitos, xhtml2pdf reparte a su criterio, y en tablas de ocho
    o nueve columnas llega a asignar a una columna menos ancho que el propio
    relleno de la celda: reportlab aborta ahi con un ancho negativo. Aqui se
    fija un reparto proporcional con suelo y techo, de modo que ninguna columna
    baje del 6 % ni pase del 24 % del ancho disponible.
    """
    marks = re.compile(r"[`*\[\]()]")
    lengths = []
    for index in range(width):
        samples = [header[index]] if index < len(header) else [""]
        samples += [row[index] for row in body if index < len(row)]
        sizes = [len(marks.sub("", value)) for value in samples]
        lengths.append(max(6.0, sum(sizes) / float(max(len(sizes), 1))))

    total = sum(lengths)
    shares = [max(6.0, min(24.0, 100.0 * value / total)) for value in lengths]
    # Renormalizar tras aplicar suelo y techo, para que la suma vuelva a 100.
    scale = 100.0 / sum(shares)
    rounded = [int(round(value * scale)) for value in shares]
    rounded[-1] += 100 - sum(rounded)
    return rounded


def markdown_to_html(source):
    lines = source.split("\n")
    out = []
    index = 0
    total = len(lines)

    while index < total:
        line = lines[index]

        # Bloque de codigo
        fence = re.match(r"^\s*(```|~~~)\s*(\S*)\s*$", line)
        if fence:
            marker, language = fence.group(1), fence.group(2)
            index += 1
            block = []
            while index < total and not lines[index].strip().startswith(marker):
                block.append(lines[index])
                index += 1
            index += 1
            body = html.escape("\n".join(block))
            label = ""
            if language == "mermaid":
                label = (
                    '<div class="diagram-label">Diagrama (Mermaid) &mdash; '
                    "se renderiza en la version Markdown; aqui figura su codigo. "
                    "La explicacion en prosa acompana siempre al diagrama.</div>"
                )
            out.append('%s<pre class="code">%s</pre>' % (label, body))
            continue

        # Encabezado
        heading = re.match(r"^(#{1,6})\s+(.*)$", line)
        if heading:
            level = len(heading.group(1))
            out.append("<h%d>%s</h%d>" % (level, inline(heading.group(2)), level))
            index += 1
            continue

        # Regla horizontal
        if re.match(r"^\s*---+\s*$", line):
            out.append('<hr class="rule">')
            index += 1
            continue

        # Tabla
        if line.lstrip().startswith("|"):
            rows = []
            while index < total and lines[index].lstrip().startswith("|"):
                rows.append(lines[index])
                index += 1
            out.append(table_html(rows))
            continue

        # Cita
        if line.lstrip().startswith(">"):
            block = []
            while index < total and lines[index].lstrip().startswith(">"):
                block.append(re.sub(r"^\s*>\s?", "", lines[index]))
                index += 1
            out.append('<div class="quote">%s</div>' % inline(" ".join(block).strip()))
            continue

        # Lista no ordenada
        if re.match(r"^\s*[-*]\s+", line):
            items = []
            while index < total and re.match(r"^\s*[-*]\s+", lines[index]):
                items.append(re.sub(r"^\s*[-*]\s+", "", lines[index]))
                index += 1
            out.append(
                "<ul>%s</ul>" % "".join("<li>%s</li>" % inline(i) for i in items)
            )
            continue

        # Lista ordenada
        if re.match(r"^\s*\d+\.\s+", line):
            items = []
            while index < total and re.match(r"^\s*\d+\.\s+", lines[index]):
                items.append(re.sub(r"^\s*\d+\.\s+", "", lines[index]))
                index += 1
            out.append(
                "<ol>%s</ol>" % "".join("<li>%s</li>" % inline(i) for i in items)
            )
            continue

        # Parrafo
        if line.strip():
            block = []
            while (
                index < total
                and lines[index].strip()
                and not lines[index].lstrip().startswith(("|", ">", "#"))
                and not re.match(r"^\s*(```|~~~)", lines[index])
                and not re.match(r"^\s*[-*]\s+", lines[index])
                and not re.match(r"^\s*\d+\.\s+", lines[index])
                and not re.match(r"^\s*---+\s*$", lines[index])
            ):
                block.append(lines[index].strip())
                index += 1
            out.append("<p>%s</p>" % inline(" ".join(block)))
            continue

        index += 1

    return "\n".join(out)


# --------------------------------------------------------------------------
# Plantilla
# --------------------------------------------------------------------------
CSS = """
@page {
  size: a4 portrait;
  margin: 2.0cm 1.6cm 2.0cm 1.6cm;
  @frame footer { -pdf-frame-content: footer; bottom: 1.0cm; margin-left: 1.6cm;
                  margin-right: 1.6cm; height: 1cm; }
}
body { font-family: main; font-size: 9.5pt; line-height: 1.42; color: #14202c; }
h1 { font-size: 19pt; color: #0d2337; margin: 0 0 4pt 0; }
h2 { font-size: 13pt; color: #0d2337; margin: 16pt 0 5pt 0;
     border-bottom: 1.2pt solid #d3dce4; padding-bottom: 3pt; }
h3 { font-size: 11pt; color: #1d3348; margin: 12pt 0 4pt 0; }
h4 { font-size: 9.8pt; color: #33475c; margin: 9pt 0 3pt 0; }
p  { margin: 0 0 6pt 0; text-align: justify; }
ul, ol { margin: 0 0 6pt 14pt; }
li { margin-bottom: 2pt; }
hr.rule { border: none; border-top: 0.6pt solid #dde4ea; margin: 10pt 0; }
table { width: 100%; border-collapse: collapse; margin: 4pt 0 9pt 0; font-size: 7.8pt; }
td { border: 0.5pt solid #ccd6de; padding: 3pt 4pt; vertical-align: top; }
td.th { background-color: #edf2f6; font-weight: bold; color: #0d2337; }
table.mid { font-size: 7.0pt; }
table.mid td { padding: 2.4pt 3pt; }
table.mid span.ic { font-size: 6.6pt; }
/* Fichas: como se compone en el PDF una tabla demasiado ancha para A4. */
table.rec { width: 100%; border-collapse: collapse; margin: 0 0 6pt 0; font-size: 7.4pt; }
table.rec td { border: none; border-bottom: 0.4pt solid #e6ecf1; padding: 2pt 4pt;
               vertical-align: top; }
table.rec td.rec-title { background-color: #edf2f6; font-weight: bold; color: #0d2337;
                         font-size: 8.2pt; padding: 3.5pt 4pt;
                         border-bottom: 0.7pt solid #c3d0da; }
table.rec td.rec-key { color: #5c6f80; }
table.rec span.ic { font-size: 7.0pt; }
span.ic { font-family: mono; font-size: 8pt; color: #123044; }
pre.code { font-family: mono; font-size: 7.6pt; background-color: #f4f7f9;
           border-left: 2.5pt solid #94a8b8; padding: 5pt 7pt; margin: 4pt 0 9pt 0;
           line-height: 1.28; }
div.diagram-label { font-size: 7.2pt; color: #5c6f80; margin: 6pt 0 1pt 0; font-style: italic; }
div.quote { border-left: 2.5pt solid #94a8b8; background-color: #f6f9fb;
            padding: 5pt 8pt; margin: 4pt 0 9pt 0; font-size: 9pt; }
/* xhtml2pdf replica el borde de un div en cada hijo de bloque, asi que la
   portada y el indice se componen con tablas, que si controla bien. */
table.cover { width: 100%; border-collapse: collapse; margin: 0 0 14pt 0; font-size: 9.5pt; }
table.cover td { border: none; background-color: #f4f8fb; padding: 14pt 16pt; }
p.eyebrow { font-size: 7.6pt; color: #5c6f80; letter-spacing: 1.4pt; margin: 0 0 5pt 0; }
p.system { font-size: 12pt; color: #0d2337; font-weight: bold; margin: 0 0 2pt 0; }
p.meta { font-size: 7.8pt; color: #46586a; margin: 9pt 0 0 0; }
table.toc { width: 100%; border-collapse: collapse; margin: 0 0 14pt 0; font-size: 8.2pt; }
table.toc td { border: none; padding: 1.6pt 8pt 1.6pt 0; vertical-align: top; }
table.toc td.toc-title { font-weight: bold; font-size: 8.8pt; color: #0d2337;
                         padding-bottom: 5pt; border-bottom: 0.6pt solid #dde4ea; }
#footer { font-size: 7pt; color: #74838f; text-align: center; }
"""

PAGE = """<html><head><meta charset="utf-8"><style>%(css)s</style></head><body>
<table class="cover"><tr><td>
  <p class="eyebrow">DOCUMENTACION DE SISTEMA</p>
  <p class="system">%(system)s</p>
  <h1>%(title)s</h1>
  <p class="meta">Version analizada %(version)s &middot; commit %(commit)s &middot;
     generado el %(today)s<br>Documento %(number)s de la serie &middot;
     fuente: docs/system-documentation/%(source)s</p>
</td></tr></table>
%(toc)s
%(body)s
<div id="footer">%(system)s &middot; %(title)s &middot; v%(version)s &middot;
  pagina <pdf:pagenumber> de <pdf:pagecount></div>
</body></html>"""


def build_toc(html_body):
    """Indice de secciones de nivel 2, solo si el documento lo justifica.

    Las secciones ya vienen numeradas desde el Markdown (`1 . Que es`), asi que
    aqui NO se vuelve a numerar: se maquetan a dos columnas para que el indice
    quepa y no empuje el contenido a la pagina siguiente.
    """
    headings = [
        re.sub(r"<[^>]+>", "", h).strip()
        for h in re.findall(r"<h2>(.*?)</h2>", html_body, flags=re.S)
    ]
    if len(headings) < 4:
        return ""
    half = (len(headings) + 1) // 2
    left, right = headings[:half], headings[half:]
    rows = ['<tr><td class="toc-title" colspan="2" width="100%">Contenido</td></tr>']
    for index in range(half):
        second = right[index] if index < len(right) else ""
        # El ancho va como atributo: xhtml2pdf no reparte columnas por CSS y
        # sin esto la segunda columna sale de un solo caracter de ancho.
        rows.append(
            '<tr><td width="50%%">%s</td><td width="50%%">%s</td></tr>'
            % (left[index], second)
        )
    return '<table class="toc">%s</table>' % "".join(rows)


def register_fonts():
    """Registra una fuente con cobertura Unicode amplia, si la hay.

    Sin ella, reportlab cae a Helvetica (Latin-1) y los guiones largos, las
    comillas angulares y las flechas salen como cuadros. Se buscan rutas
    habituales en Windows, Linux y macOS.
    """
    from reportlab.pdfbase import pdfmetrics
    from reportlab.pdfbase.ttfonts import TTFont

    families = [
        ("DejaVuSans.ttf", "DejaVuSans-Bold.ttf", "DejaVuSans-Oblique.ttf",
         "DejaVuSansMono.ttf", "DejaVuSansMono-Bold.ttf"),
    ]
    directories = [
        "C:/Windows/Fonts",
        "/usr/share/fonts/truetype/dejavu",
        "/usr/share/fonts/TTF",
        "/Library/Fonts",
    ]
    try:
        import matplotlib
        directories.append(
            os.path.join(os.path.dirname(matplotlib.__file__), "mpl-data", "fonts", "ttf")
        )
    except Exception:
        pass

    for directory in directories:
        for regular, bold, italic, mono, mono_bold in families:
            paths = [os.path.join(directory, f) for f in (regular, bold, italic, mono, mono_bold)]
            if not all(os.path.exists(p) for p in paths):
                continue
            pdfmetrics.registerFont(TTFont("main", paths[0]))
            pdfmetrics.registerFont(TTFont("main-b", paths[1]))
            pdfmetrics.registerFont(TTFont("main-i", paths[2]))
            pdfmetrics.registerFont(TTFont("mono", paths[3]))
            pdfmetrics.registerFont(TTFont("mono-b", paths[4]))
            pdfmetrics.registerFontFamily("main", normal="main", bold="main-b", italic="main-i")
            pdfmetrics.registerFontFamily("mono", normal="mono", bold="mono-b")
            return os.path.join(directory, regular)
    return None


def repo_version():
    manifest = os.path.join(ROOT, "package.json")
    with io.open(manifest, encoding="utf-8") as handle:
        match = re.search(r'"version"\s*:\s*"([^"]+)"', handle.read())
    return match.group(1) if match else "desconocida"


def repo_commit():
    head = os.path.join(ROOT, ".git", "HEAD")
    try:
        with io.open(head, encoding="utf-8") as handle:
            content = handle.read().strip()
        if content.startswith("ref:"):
            ref = os.path.join(ROOT, ".git", content.split(" ", 1)[1].strip())
            with io.open(ref, encoding="utf-8") as handle:
                return handle.read().strip()[:7]
        return content[:7]
    except OSError:
        return "sin git"


def main():
    parser = argparse.ArgumentParser(description="Genera los PDF de la documentacion de sistema.")
    parser.add_argument("--check", action="store_true",
                        help="comprueba que exista un PDF por cada Markdown, sin generar")
    parser.add_argument("--only", default="",
                        help="lista de prefijos separados por coma, por ejemplo 03,07")
    args = parser.parse_args()

    sources = sorted(f for f in os.listdir(DOCS) if f.endswith(".md"))
    if args.only:
        wanted = {p.strip() for p in args.only.split(",") if p.strip()}
        sources = [f for f in sources if f.split("-")[0] in wanted or f.startswith(tuple(wanted))]

    if args.check:
        missing = [f for f in sources
                   if not os.path.exists(os.path.join(OUT, f[:-3] + ".pdf"))]
        if missing:
            sys.stderr.write("Faltan PDF para: %s\n" % ", ".join(missing))
            sys.stderr.write("Genera con: python scripts/build-docs-pdf.py\n")
            return 1
        print("PDF presentes para los %d documentos." % len(sources))
        return 0

    try:
        from xhtml2pdf import pisa
    except ImportError:
        sys.stderr.write(
            "Falta xhtml2pdf. Instalalo con:  pip install xhtml2pdf\n"
            "Sin el no se generan los PDF: esto no es un aviso menor, es que la "
            "tarea NO se hizo.\n"
        )
        return 1

    font = register_fonts()
    print("Fuente: %s" % (font or "Helvetica (cobertura Latin-1, sin flechas ni guion largo)"))

    if not os.path.isdir(OUT):
        os.makedirs(OUT)

    version = repo_version()
    commit = repo_commit()
    today = date.today().isoformat()
    generated = []

    for name in sources:
        with io.open(os.path.join(DOCS, name), encoding="utf-8") as handle:
            raw = normalize_text(handle.read())

        title_match = re.search(r"^#\s+(.*)$", raw, flags=re.M)
        title = title_match.group(1).strip() if title_match else name[:-3]
        # El H1 ya va en la portada: se retira del cuerpo para no repetirlo.
        body_source = re.sub(r"^#\s+.*$", "", raw, count=1, flags=re.M)
        body = markdown_to_html(body_source)

        page = PAGE % {
            "css": CSS,
            "system": SYSTEM_NAME,
            "title": html.escape(title),
            "version": version,
            "commit": commit,
            "today": today,
            "number": name[:2] if name[:2].isdigit() else "indice",
            "source": name,
            "toc": build_toc(body),
            "body": body,
        }

        target = os.path.join(OUT, name[:-3] + ".pdf")
        with open(target, "wb") as handle:
            result = pisa.CreatePDF(io.StringIO(page), dest=handle, encoding="utf-8")
        if result.err:
            sys.stderr.write("Fallo al generar %s\n" % target)
            return 1
        size = os.path.getsize(target)
        generated.append((name, size))
        print("  %-46s %7.1f KB" % (name[:-3] + ".pdf", size / 1024.0))

    print("\nGenerados %d PDF en docs/system-documentation/pdf/" % len(generated))
    tiny = [n for n, s in generated if s < 4096]
    if tiny:
        # Un PDF de pocos bytes casi siempre significa un documento vacio: se
        # denuncia en vez de dar el proceso por bueno.
        sys.stderr.write("Sospechosamente pequenos (revisalos): %s\n" % ", ".join(tiny))
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
