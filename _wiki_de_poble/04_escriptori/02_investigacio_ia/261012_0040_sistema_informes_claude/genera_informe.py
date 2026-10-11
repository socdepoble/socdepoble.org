#!/usr/bin/env python3
"""Generador d'informes editorials de Sóc de Poble (sistema «Informe editorial» v1.0).

Ús:
    python3 genera_informe.py esquema_informe.json eixida.html

Llig un model de document en JSON (vegeu esquema_informe.json i README.txt) i escriu
un HTML autònom amb el CSS incrustat (informe_editorial.css, al costat d'este script).
L'HTML resultant es renderitza a PDF amb Chromium (tooling/pdf/render_pdf.sh).

Marcatge mínim admés dins de qualsevol text:
    **negreta**            → <strong>
    [COMPLETAR el que siga] → <mark>COMPLETAR el que siga</mark>
Tot el text s'escapa abans d'aplicar el marcatge: el JSON no porta HTML.

No executat per l'autor (el hook del repositori no permet llançar Python des de
l'agent): MarIA ha de provar-lo amb esquema_informe.json abans d'usar-lo en producció.
"""
import html
import json
import re
import sys
from pathlib import Path

CSS_PATH = Path(__file__).with_name("informe_editorial.css")
FONT_LINK = (
    '<link rel="preconnect" href="https://fonts.googleapis.com">\n'
    '<link href="https://fonts.googleapis.com/css2?family=Source+Sans+3:ital,wght@0,400;0,600;0,700;1,400'
    '&display=swap" rel="stylesheet">'
)
RISK_CLASS = {"alto": "b-alto", "medio": "b-medio", "bajo": "b-bajo"}


# ---------- text ----------

def esc(text):
    return html.escape("" if text is None else str(text), quote=False)


def inline(text):
    """Escapa el text i aplica el marcatge mínim (**negreta**, [COMPLETAR …])."""
    s = esc(text)
    s = re.sub(r"\[(COMPLETAR[^\]]*)\]", r"<mark>\1</mark>", s)
    s = re.sub(r"\*\*(.+?)\*\*", r"<strong>\1</strong>", s)
    return s


def attr_class(*names):
    names = [n for n in names if n]
    return f' class="{" ".join(names)}"' if names else ""


# ---------- blocs ----------

def r_heading(b, level):
    return f"<h{level}>{inline(b['text'])}</h{level}>"


def r_p(b):
    cls = []
    if b.get("lead"):
        cls.append("lead")
    if b.get("note"):
        cls.append("note")
    if b.get("span"):
        cls.append("span")
    return f"<p{attr_class(*cls)}>{inline(b['text'])}</p>"


def r_list(b, tag, cls=""):
    items = "".join(f"<li>{inline(i)}</li>" for i in b["items"])
    return f"<{tag}{attr_class(cls)}>{items}</{tag}>"


def r_box(b):
    title = f"<h4>{inline(b['title'])}</h4>" if b.get("title") else ""
    body = ""
    if b.get("text"):
        body += f"<p>{inline(b['text'])}</p>"
    if b.get("items"):
        body += r_list(b, "ul")
    return f"<div{attr_class('box', 'accent' if b.get('accent') else '', 'span' if b.get('span') else '')}>{title}{body}</div>"


def r_alert(b):
    label = f"<b>{inline(b['label'])}</b>" if b.get("label") else ""
    big = f'<span class="big">{inline(b["big"])}</span>' if b.get("big") else ""
    return f'<div class="alert">{label}{big}{inline(b.get("text", ""))}</div>'


def r_card(b):
    return (f'<div class="card"><span class="n">{esc(b["n"])}</span><h4>{inline(b["title"])}</h4>'
            f'<p>{inline(b.get("text", ""))}</p></div>')


def r_crit(b):
    level = (b.get("risk_level") or "").strip().lower()
    cls = RISK_CLASS.get(level, "b-na")
    risk_label = b.get("risk_label") or level.capitalize() or "—"
    paras = "".join(f"<p><b>{inline(p['label'])}:</b> {inline(p['text'])}</p>" for p in b.get("paras", []))
    return (
        f'<div class="crit"><div class="head"><div class="num">{esc(b["num"])}</div>'
        f'<div class="title">{inline(b["title"])}<span class="pts">{inline(b.get("pts", ""))}</span></div></div>'
        f'<div class="kv"><div><b>{inline(b.get("declares_label", "Lo que declaras"))}</b>'
        f'<span class="val">{inline(b.get("declares", ""))}</span></div>'
        f'<div><b>{inline(b.get("risk_title", "Riesgo"))}</b><span class="badge {cls}">{inline(risk_label)}</span></div></div>'
        f"{paras}</div>"
    )


def r_record(b):
    dl = ""
    if b.get("fields"):
        dl = "<dl>" + "".join(f"<dt>{inline(k)}</dt><dd>{inline(v)}</dd>" for k, v in b["fields"]) + "</dl>"
    text = ""
    if b.get("text"):
        label = f"<b>{inline(b['text_label'])}:</b> " if b.get("text_label") else ""
        text = f"<p>{label}{inline(b['text'])}</p>"
    return f'<div class="record"><h4>{inline(b["title"])}</h4>{dl}{text}</div>'


def r_table(b):
    cols = b["columns"]
    head = "".join(
        f'<th{attr_class("num" if c.get("num") else "")}>{inline(c["label"])}</th>' for c in cols
    )
    rows = []
    for row in b["rows"]:
        row_cls, cells = "", row
        if isinstance(row, dict):
            row_cls, cells = row.get("class", ""), row["cells"]
        tds = []
        for i, cell in enumerate(cells):
            num = cols[i].get("num") if i < len(cols) else False
            tds.append(f'<td{attr_class("num" if num else "")}>{inline(cell)}</td>')
        rows.append(f"<tr{attr_class(row_cls)}>{''.join(tds)}</tr>")
    cap = f"<caption>{inline(b['caption'])}</caption>" if b.get("caption") else ""
    return (f'<table{attr_class("span", "compact" if b.get("compact") else "")}>{cap}'
            f"<thead><tr>{head}</tr></thead><tbody>{''.join(rows)}</tbody></table>")


def r_field(b):
    return f'<div class="field"><b class="k">{inline(b["key"])}</b> {inline(b["text"])}</div>'


RENDERERS = {
    "h2": lambda b: r_heading(b, 2),
    "h3": lambda b: r_heading(b, 3),
    "h4": lambda b: r_heading(b, 4),
    "p": r_p,
    "ul": lambda b: r_list(b, "ul"),
    "ol": lambda b: r_list(b, "ol"),
    "letters": lambda b: r_list(b, "ol", "letters"),
    "steps": lambda b: r_list(b, "ol", "steps"),
    "check": lambda b: r_list(b, "ul", "check"),
    "box": r_box,
    "alert": r_alert,
    "card": r_card,
    "crit": r_crit,
    "record": r_record,
    "table": r_table,
    "field": r_field,
    "hr": lambda b: "<hr>",
}


def render_blocks(blocks):
    out = []
    for b in blocks:
        kind = b.get("type")
        if kind not in RENDERERS:
            raise ValueError(f"Bloc desconegut: {kind!r}")
        out.append(RENDERERS[kind](b))
    return "\n".join(out)


# ---------- estructura ----------

def render_cover(c):
    parts = []
    if c.get("kicker"):
        parts.append(f'<div class="kicker">{inline(c["kicker"])}</div>')
    parts.append(f"<h1>{inline(c['title'])}</h1>")
    if c.get("subtitle"):
        parts.append(f'<p class="sub">{inline(c["subtitle"])}</p>')
    if c.get("alert"):
        parts.append(r_alert(c["alert"]))
    if c.get("meta"):
        cells = "".join(f"<div><b>{inline(m['label'])}</b> {inline(m['value'])}</div>" for m in c["meta"])
        parts.append(f'<div class="meta">{cells}</div>')
    if c.get("box"):
        parts.append(r_box(c["box"]))
    if c.get("toc"):
        items = "".join(f"<li>{inline(i)}</li>" for i in c["toc"])
        parts.append(f'<div class="toc"><h3>{inline(c.get("toc_title", "Contenido"))}</h3><ol>{items}</ol></div>')
    return f'<header class="cover">\n{chr(10).join(parts)}\n</header>'


def render_part(p):
    kicker = f"<small>{inline(p['kicker'])}</small>" if p.get("kicker") else ""
    cls = attr_class("part", "colophon" if p.get("colophon") else "")
    return f"<section{cls}>\n<h1>{kicker}{inline(p['title'])}</h1>\n{render_blocks(p.get('blocks', []))}\n</section>"


def render_document(doc, css):
    body = [render_cover(doc["cover"])] + [render_part(p) for p in doc.get("parts", [])]
    lang = doc.get("lang", "es")
    desc = f'<meta name="description" content="{esc(doc["description"])}">' if doc.get("description") else ""
    return (
        "<!DOCTYPE html>\n"
        f'<html lang="{esc(lang)}">\n<head>\n<meta charset="utf-8">\n'
        '<meta name="viewport" content="width=device-width, initial-scale=1">\n'
        f"<title>{esc(doc['title'])}</title>\n{desc}\n{FONT_LINK}\n<style>\n{css}\n</style>\n</head>\n"
        '<body>\n<div class="doc">\n' + "\n\n".join(body) + "\n</div>\n</body>\n</html>\n"
    )


def main(argv):
    if len(argv) != 3:
        print(__doc__)
        return 2
    src, dst = Path(argv[1]), Path(argv[2])
    doc = json.loads(src.read_text(encoding="utf-8"))
    css = CSS_PATH.read_text(encoding="utf-8")
    dst.write_text(render_document(doc, css), encoding="utf-8")
    print(f"Escrit {dst} ({dst.stat().st_size} bytes)")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
