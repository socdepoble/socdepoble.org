#!/usr/bin/env python3
# /// script
# requires-python = ">=3.10"
# dependencies = []
# ///
"""Mapa de mis agentes · dibuja en un HTML lo que tienes: skills, agentes, quién llama a
quién, lo que corre solo (cron, launchd, tareas programadas) y lo que te falta para
que todo eso sea un sistema. Solo LEE. No usa internet, no pide claves, no cambia nada.

  uv run mapa_agentes.py                      # rastrea LA CARPETA DESDE LA QUE LO EJECUTAS (y los sitios habituales
                                              # de Claude Code, Codex, Gemini CLI…) y deja el HTML en esa misma carpeta
  uv run mapa_agentes.py --raiz /ruta         # rastrea otra carpeta en vez de la actual (p. ej. tu vault de Obsidian)
  uv run mapa_agentes.py --salida mapa.html   # dónde dejar el HTML (por defecto, en la carpeta actual)
  uv run mapa_agentes.py --json               # además, un JSON con todo lo encontrado
"""
import argparse
import datetime as dt
import html
import json
import os
import re
import subprocess
import sys
from pathlib import Path

# Windows: la consola clásica (cp1252/cp850) no sabe pintar «✓» ni «·» y el
# print final tumbaría el programa con el HTML ya escrito. Se fuerza UTF-8 y,
# si no se puede, se sustituye lo que no quepa. En Mac y Linux no cambia nada.
for _flujo in (sys.stdout, sys.stderr):
    try:
        _flujo.reconfigure(encoding="utf-8", errors="replace")
    except (AttributeError, ValueError):
        pass
HOY = dt.date.today()
# Versión pública del mapa: va bajo el título y en el nombre del fichero. Solo
# cambia cuando el autor lo diga (Marcos, 17-sep-2026).
VERSION = "0.1"
CASA = Path.home()
# Dónde suelen vivir las skills y los agentes de cada herramienta (solo lectura)
RAICES = {
    "Claude Code": [CASA / ".claude" / "skills", CASA / ".claude" / "agents", CASA / ".claude" / "commands", Path.cwd() / ".claude" / "skills", Path.cwd() / ".claude" / "agents", Path.cwd() / ".claude" / "commands"],
    "Codex": [CASA / ".codex" / "skills", CASA / ".codex" / "prompts", Path.cwd() / ".codex" / "skills"],
    "Gemini CLI": [CASA / ".gemini" / "skills", CASA / ".gemini" / "commands", Path.cwd() / ".gemini" / "commands"],
    "Cursor / otros": [Path.cwd() / ".cursor" / "rules", Path.cwd() / ".agents" / "skills"],
}
FICHEROS_MEMORIA = [CASA / ".claude" / "CLAUDE.md", Path.cwd() / "CLAUDE.md", Path.cwd() / "AGENTS.md", Path.cwd() / "GEMINI.md"]
SALTAR = {"node_modules", ".git", ".venv", "venv", "__pycache__", "Library", ".Trash", "902 ARCHIVO", "_jubiladas", "_jubilados", "mapa-de-mis-agentes", "ENTREGABLES"}


def frontmatter(texto):
    if not texto.startswith("---"):
        return {}, texto
    partes = texto.split("---", 2)
    if len(partes) < 3:
        return {}, texto
    fm = {}
    for ln in partes[1].splitlines():
        m = re.match(r"^([A-Za-z_áéíóúñ][\w áéíóúñ-]*):\s*(.*)$", ln)
        if m:
            fm[m.group(1).strip().lower()] = m.group(2).strip().strip('"').strip("'")
    return fm, partes[2]


def slug(p: Path):
    return p.parent.name if p.name.lower() == "skill.md" else p.stem


def leer_skill(p: Path, herramienta: str):
    try:
        t = p.read_text(encoding="utf-8", errors="ignore")
    except OSError:
        return None
    fm, cuerpo = frontmatter(t)
    nombre = fm.get("name") or fm.get("nombre") or slug(p)
    desc = fm.get("description") or fm.get("descripción") or fm.get("descripcion") or ""
    if not desc:
        m = re.search(r"(?m)^(?!#)(?!\s*$)(.{20,})$", cuerpo)
        desc = m.group(1).strip() if m else ""
    st = p.stat()
    return {"nombre": nombre, "ruta": str(p), "herramienta": herramienta, "descripcion": desc[:220],
            "palabras": len(t.split()), "kb": round(st.st_size / 1024, 1), "modificado": dt.date.fromtimestamp(st.st_mtime).isoformat(),
            "dias": (HOY - dt.date.fromtimestamp(st.st_mtime)).days, "texto": t.lower(), "texto_orig": t,
            "es_agente": ("agents" in p.parts) or bool(fm.get("perfil")) or p.name.upper() == "PERFIL.MD",
            "tiene_ejemplos": bool(re.search(r"(?i)ejemplo|example|```", t)), "tiene_cuando": bool(re.search(r"(?i)cu[aá]ndo usar|when to use|activaci[oó]n|triggers?", t)),
            "privado": (fm.get("visibilidad") or fm.get("visibility") or fm.get("private") or "").lower() in ("privado", "private", "true", "si", "sí", "yes"),
            "ejemplo": (fm.get("visibilidad") or "").lower() == "ejemplo"}


def rastrear(raices, herramienta, encontrados):
    for raiz in raices:
        if not raiz.exists():
            continue
        for p in raiz.rglob("*.md"):
            # Se salta por lo que hay DEBAJO de la raíz, no por el nombre de la propia
            # raíz (si la carpeta que se pasa se llama, p. ej., ENTREGABLES/…, cuenta).
            if any(s in SALTAR or s.upper().startswith("ENTREGABLE") for s in p.relative_to(raiz).parts):
                continue
            if p.name.lower() in ("skill.md", "perfil.md") or ("agents" in p.parts and p.suffix == ".md") or ("commands" in p.parts) or ("prompts" in p.parts):
                if p.name.lower() in ("readme.md", "index.md"):
                    continue
                s = leer_skill(p, herramienta)
                if s and s["ruta"] not in encontrados:
                    encontrados[s["ruta"]] = s


EJEMPLOS_CRON = [   # crones VIRTUALES de ejemplo (del sistema del autor): se pintan en gris y se dice que no existen
    {"nombre": "cerrar-dia", "cada": "dia", "dia": "", "hora": "23:59", "quien": "cerrador", "que": "Lee el log del día y las tareas hechas y escribe el resumen en el diario."},
    {"nombre": "resumen-canales", "cada": "dia", "dia": "", "hora": "01:00", "quien": "resumidor-youtube", "que": "Baja las transcripciones de los canales que sigues y resume lo nuevo."},
    {"nombre": "articulo-diario", "cada": "dia", "dia": "", "hora": "01:15", "quien": "redactor", "que": "Escribe el borrador del artículo del día a partir de la mejor idea pendiente."},
    {"nombre": "mantenimiento-diario", "cada": "dia", "dia": "", "hora": "02:30", "quien": "mantenedor", "que": "Vigila, archiva, limpia logs, regenera el mapa y avisa si algo se rompió."},
    {"nombre": "informe-captacion", "cada": "semana", "dia": "lunes", "hora": "03:30", "quien": "analista-captacion", "que": "Informe semanal de leads: de qué vídeo y de qué medio viene cada alta."},
    {"nombre": "resumen-agentes", "cada": "semana", "dia": "lunes", "hora": "04:00", "quien": "analista-agentes", "que": "El sistema se pasa revista: qué hizo cada agente, cuánto tardó, qué se rompió."},
    {"nombre": "informe-semanal-vault", "cada": "semana", "dia": "viernes", "hora": "04:00", "quien": "analista-vault", "que": "Auditoría del vault: notas huérfanas, enlaces rotos, cambios pendientes."},
    {"nombre": "informe-captacion-mensual", "cada": "mes", "dia": "1", "hora": "03:45", "quien": "analista-captacion", "que": "El día 1, el informe de captación del mes anterior completo, comparado con los meses previos."},
]
DIAS_ES = ["lunes", "martes", "miércoles", "jueves", "viernes", "sábado", "domingo"]


def regla_cron(expr):
    """De un cron de 5 campos a (cada, dia, hora) para pintarlo; lo raro se deja como «otro»."""
    try:
        mi, ho, dom, mon, dow = expr.split()[:5]
    except ValueError:
        return "otro", "", ""
    hora = f"{int(ho):02d}:{int(mi):02d}" if ho.isdigit() and mi.isdigit() else ""
    if dom == "*" and dow == "*":
        return ("dia" if hora else "otro"), "", hora
    if dom == "*" and dow.isdigit():
        return "semana", DIAS_ES[(int(dow) + 6) % 7], hora
    if dom.isdigit() and dow == "*":
        return "mes", dom, hora
    return "otro", "", hora


def cron_y_launchd():
    tareas = []
    try:
        r = subprocess.run(["crontab", "-l"], capture_output=True, text=True, timeout=10)
        for ln in r.stdout.splitlines():
            ln = ln.strip()
            if ln and not ln.startswith("#") and len(ln.split()) >= 6:
                partes = ln.split(None, 5)
                cada, dia, hora = regla_cron(" ".join(partes[:5]))
                tareas.append({"fuente": "cron", "cuando": " ".join(partes[:5]), "que": partes[5][:160], "cada": cada, "dia": dia, "hora": hora, "nombre": partes[5].split("/")[-1][:40]})
    except Exception:  # noqa: BLE001
        pass
    for carpeta in (CASA / "Library" / "LaunchAgents",):
        if carpeta.exists():
            for p in carpeta.glob("*.plist"):
                try:
                    t = p.read_text(encoding="utf-8", errors="ignore")
                except OSError:
                    continue
                if not re.search(r"(?i)claude|agent|nexus|skill|gemini|codex|hermes|openclaw|obsidian|python|uv ", t):
                    continue
                hora = re.search(r"<key>Hour</key>\s*<integer>(\d+)</integer>", t); minu = re.search(r"<key>Minute</key>\s*<integer>(\d+)</integer>", t)
                inter = re.search(r"<key>StartInterval</key>\s*<integer>(\d+)</integer>", t)
                cuando = f"{int(hora.group(1)):02d}:{int(minu.group(1)) if minu else 0:02d}" if hora else (f"cada {int(inter.group(1)) // 60} min" if inter else "al arrancar")
                wd = re.search(r"<key>Weekday</key>\s*<integer>(\d+)</integer>", t)
                prog = re.findall(r"<string>([^<]{3,})</string>", t)
                tareas.append({"fuente": "launchd", "cuando": cuando, "que": (p.stem + " · " + " ".join(x for x in prog if "/" in x or x.endswith(".py") or x.endswith(".sh"))[:120]).strip(),
                               "cada": ("semana" if (hora and wd) else "dia" if hora else "otro"), "dia": (DIAS_ES[(int(wd.group(1)) + 6) % 7] if wd else ""), "hora": (cuando if hora else ""), "nombre": p.stem.split(".")[-1][:40]})
    if sys.platform.startswith("win"):
        try:
            r = subprocess.run(["schtasks", "/query", "/fo", "CSV", "/nh"], capture_output=True, text=True, errors="replace", timeout=15)
            for ln in r.stdout.splitlines()[:200]:
                c = [x.strip('"') for x in ln.split('","')]
                if len(c) >= 2 and re.search(r"(?i)claude|agent|skill|python|uv", ln):
                    tareas.append({"fuente": "tareas programadas", "cuando": c[1][:40], "que": c[0][:120], "cada": "otro", "dia": "", "hora": "", "nombre": c[0].split("\\")[-1][:40]})
        except Exception:  # noqa: BLE001
            pass
    return tareas


def programadas_en_texto(skills):
    """Skills que declaran un horario en su propio texto, y solo si cadencia y hora van JUNTAS en la misma frase
    («cada día a las 02:30», «los lunes a las 08:00», «daily at 07:00», «programada: cada viernes 04:00»).
    La palabra «diario» suelta (un correo diario, la carpeta DIARIO) o una hora suelta (un registro) NO cuentan:
    con eso salían decenas de puntos falsos (cicatriz 2026-09-16)."""
    DIAS = "lunes|martes|mi[eé]rcoles|jueves|viernes|s[aá]bado|domingo"
    RX = re.compile(r"(?i)(?P<cad>cada d[ií]a|todos los d[ií]as|diariamente|cada noche|cada madrugada|cada semana|semanalmente|cada (?:" + DIAS + r")|los (?:" + DIAS + r")s?|daily|weekly|every day|every (?:monday|tuesday|wednesday|thursday|friday|saturday|sunday))"
                    r"[^\n.;]{0,40}?(?:a las|at|,|:|\s)\s*(?P<h>[01]?\d|2[0-3])[:.h](?P<m>[0-5]\d)")
    out = []
    for s in skills:
        t = s.get("texto_orig") or s["texto"]
        for ln in t.splitlines():
            if re.search(r"(?i)^\s*-\s*\*\*v\d|registro|cicatriz|estreno", ln):
                continue   # líneas de historial: horas de cierres, no programaciones
            m = RX.search(ln)
            if not m:
                continue
            cad = m.group("cad").lower()
            md = re.search(DIAS, cad)
            dia = md.group(0).replace("miercoles", "miércoles").replace("sabado", "sábado") if md else ""
            cada = "semana" if (dia or "semana" in cad or "weekly" in cad) else "dia"
            out.append({"skill": s["nombre"], "dice": m.group(0).strip(), "cada": cada, "dia": dia, "hora": f"{int(m.group('h')):02d}:{m.group('m')}", "que": s["descripcion"]})
            break
    return out


# Verbos que convierten un nombre en una LLAMADA de verdad (una instrucción de usar la otra skill).
# Sin uno de estos delante o detrás, es solo una MENCIÓN (una lista, un «no confundir con», una explicación).
VERBOS_LLAMADA = r"(monta(r)?|montando|ejecuta(r)?|ejecutando|usa(r)?|usando|lanza(r)?|invoca(r)?|llama(r)? a|carga(r)?|aplica(r)?|run|use|invoke|call|load|apply|delega(r)? en|pasa(r)? a)"


def relaciones(skills):
    """(origen, destino, fuerza): fuerza «llama» si hay verbo de ejecución, ruta a su carpeta o enlace a su SKILL.md
    a menos de 80 caracteres del nombre; «menciona» si solo aparece el nombre."""
    nombres = {s["nombre"].lower(): s for s in skills if len(s["nombre"]) >= 4}
    aristas = []
    for s in skills:
        t = s["texto"]
        for n, o in nombres.items():
            if o is s:
                continue
            ok = False; fuerte = False
            for m in re.finditer(r"(?<![\w-])" + re.escape(n) + r"(?![\w-])", t):
                ok = True
                ctx = t[max(0, m.start() - 80):m.end() + 80]
                if re.search(VERBOS_LLAMADA + r"\s+(la\s+|el\s+|the\s+)?(skill|habilidad|herramienta)?\s*[`«\"']?" + re.escape(n), ctx) \
                   or re.search(re.escape(n) + r"/(skill\.md|[\w.-]+\.py)", ctx) or re.search(r"uv run[^\n]*" + re.escape(n), ctx) \
                   or re.search(r"\[\[[^\]]*" + re.escape(n) + r"[^\]]*skill", ctx) or re.search(r"skills:\s*\n(\s*-\s*[\w-]+\n)*\s*-\s*" + re.escape(n), t):
                    fuerte = True; break
            if ok:
                # lo que se nombra para decir que NO es lo mismo o que está jubilado no cuenta como llamada
                if fuerte and re.search(r"(no confundir|no es lo mismo|jubilad|eclipsad|sustituye a|antes se llamaba|en vez de)[^\n]{0,60}" + re.escape(n), t):
                    fuerte = False
                aristas.append((s["nombre"], o["nombre"], "llama" if fuerte else "menciona"))
    return aristas


# ─── entradas y salidas inferidas del texto de cada skill ───
EXT = r"(?:md|json|csv|yml|yaml|txt|html|pdf|png|jpg|log|jsonl|base|xlsx|docx)"
# Rutas que parecen rutas de verdad: absolutas o con ~ o ./; carpetas numeradas de un vault (001 CAPTURA/…);
# ficheros relativos con extensión de datos. Nada de fracciones (4/10) ni de «a/b» sueltos en prosa.
RE_RUTA = re.compile(r"(?<![\w/])((?:~|\.{1,2})?/(?:[\w .áéíóúñÁÉÍÓÚÑ()-]+/)*[\w .áéíóúñÁÉÍÓÚÑ()*-]*"
                     r"|\d{3,4} [A-ZÁÉÍÓÚÑ][\w .áéíóúñÁÉÍÓÚÑ()-]*(?:/[\w .áéíóúñÁÉÍÓÚÑ()*<>-]*)*"
                     r"|(?:[\w.-]+/)+[\w .<>*-]+\." + EXT + r"\b"
                     r"|[\w<>*.-]+\." + EXT + r"\b)")
OCULTAR = ("_privada", "/tmp/", "/.cache/", ".env")   # nunca se enseñan rutas de credenciales ni temporales
RE_URL = re.compile(r"https?://[\w.-]+(?:/[\w./?=&%-]*)?")
V_LEE = r"(lee|leer|leyendo|consulta|consultar|carga|cargar|abre|abrir|recibe|recibir|toma|tomar|busca|buscar|rastrea|barre|importa|descarga|extrae|read|reads|load|loads|open|opens|fetch|parse|input|entrada|entradas|fuente|desde)"
V_ESC = r"(escribe|escribir|guarda|guardar|crea|crear|genera|generar|produce|deja|dejar|actualiza|añade|anexa|exporta|publica|envía|mueve|renombra|write|writes|save|saves|create|creates|generate|output|salida|salidas|resultado|destino|hacia|en)"
HERRAMIENTAS = [("uv run", "uv (script Python)"), ("python", "Python"), ("curl", "curl (HTTP)"), ("yt-dlp", "yt-dlp"), ("ffmpeg", "ffmpeg"), ("obsidian ", "CLI de Obsidian"), ("git ", "git"), ("api", "una API externa"), ("telegram", "Telegram"), ("notion", "Notion"), ("kit.com", "Kit"), ("youtube", "YouTube"), ("gmail", "Gmail"), ("google", "Google"), ("openrouter", "OpenRouter"), ("supabase", "Supabase"), ("n8n", "n8n"), ("sqlite", "SQLite"), ("excel", "Excel"), ("csv", "CSV")]


def _limpia(r):
    r = r.strip().strip("`'\"()[],.;:")
    if r.startswith("/ ") or r.startswith("/\u00a0"):
        return ""
    # una ruta con espacios (carpetas de vault) termina donde empieza la prosa
    r = re.split(r"\)|\s+y\s+|\s+o\s+|\.\s|:\s|\s[—–-]\s|,\s|\s+(?:que|con|para|sin|donde|si)\s", r)[0].strip()
    r = re.sub(r"\s*\(.*$", "", r) if r.count("(") > r.count(")") else r
    if re.fullmatch(r"\d+/\d+", r) or "|" in r or len(r) < 3 or len(r) > 90 or r.lower().startswith(("http", "www")):
        return ""
    low = r.lower()
    if low.endswith((".py", ".sh", "skill.md", "perfil.md")) or any(o in low for o in OCULTAR):
        return ""
    return r.rstrip("/") if r.count("/") > 0 else r


def entradas_salidas(s):
    """Qué lee y qué produce una skill, inferido de su texto: rutas cerca de verbos de lectura o escritura,
    URLs, herramientas. Cada dato lleva su confianza: «declarado» (ruta escrita), «inferido» (verbo + tipo
    de cosa) o «supuesto» (solo por el tipo de skill). Si no hay nada, se dice."""
    t = s.get("texto_orig") or s["texto"]; lineas = [ln for ln in t.splitlines() if ln.strip() and not ln.strip().startswith(("#!", "# ///", "//"))]
    entradas, salidas = {}, {}
    def pon(dic, clave, nivel, por):
        clave = clave[:90]
        if clave and (clave not in dic or ["supuesto", "inferido", "declarado"].index(nivel) > ["supuesto", "inferido", "declarado"].index(dic[clave][0])):
            dic[clave] = (nivel, por[:80])
    for ln in lineas:
        low = ln.lower()
        lee = re.search(V_LEE, low); esc = re.search(V_ESC, low)
        rutas = [r for r in (_limpia(m.group(0)) for m in RE_RUTA.finditer(ln)) if r]
        for r in rutas:
            if esc and (not lee or esc.start() < lee.start()):
                pon(salidas, r, "declarado", ln.strip())
            elif lee:
                pon(entradas, r, "declarado", ln.strip())
            else:
                pon(entradas, r, "inferido", "ruta nombrada sin verbo: " + ln.strip())
        for u in RE_URL.findall(ln):
            dom = re.sub(r"^https?://", "", u).split("/")[0]
            if lee or "api" in low or "descarga" in low or "fetch" in low:
                pon(entradas, "web: " + dom, "inferido", ln.strip())
            elif esc:
                pon(salidas, "web: " + dom, "inferido", ln.strip())
    # frontmatter con entradas/salidas explícitas (contratos tipo Nexus u otros)
    fm = t.split("---", 2)[1] if t.startswith("---") else ""
    for m in re.finditer(r"(?m)^\s*(?:-\s*)?(?:defecto|default|entrada|input|fuente|source):\s*([^\n]+)$", fm):
        pon(entradas, _limpia(m.group(1)) or m.group(1)[:80], "declarado", "frontmatter")
    for m in re.finditer(r"(?m)^\s*(?:-\s*)?(?:salida|output|destino|target|patron_fichero):\s*([^\n]+)$", fm):
        pon(salidas, _limpia(m.group(1)) or m.group(1)[:80], "declarado", "frontmatter")
    herr = [nombre for clave, nombre in HERRAMIENTAS if clave in t]
    # supuestos por tipo de skill, cuando no hay nada declarado
    tipo = (s["descripcion"] + " " + s["nombre"]).lower()
    if not entradas:
        if re.search(r"transcri|v[ií]deo|youtube|audio", tipo): pon(entradas, "un vídeo o audio (URL o fichero)", "supuesto", "por el tipo de skill")
        elif re.search(r"resum|analiz|audit|revis|lee|libro|pdf|texto|nota", tipo): pon(entradas, "un texto o una nota (el que le pases)", "supuesto", "por el tipo de skill")
        elif re.search(r"idea|correo|gui[oó]n|art[ií]culo|escrib|redact", tipo): pon(entradas, "una idea o un tema dictado", "supuesto", "por el tipo de skill")
        else: pon(entradas, "lo que le digas en la conversación", "supuesto", "no declara nada: se le pasa por chat")
    if not salidas:
        if re.search(r"resum|informe|audit|analiz|report", tipo): pon(salidas, "una nota de informe o resumen (sitio sin declarar)", "supuesto", "por el tipo de skill")
        elif re.search(r"correo|email|mail", tipo): pon(salidas, "un correo (borrador o envío; sin declarar dónde)", "supuesto", "por el tipo de skill")
        elif re.search(r"gui[oó]n|art[ií]culo|post|escrib|redact|genera|crea", tipo): pon(salidas, "un texto nuevo (sitio sin declarar)", "supuesto", "por el tipo de skill")
        elif re.search(r"tarea|kanban|tablero", tipo): pon(salidas, "una tarea o tarjeta (sitio sin declarar)", "supuesto", "por el tipo de skill")
        else: pon(salidas, "solo una respuesta en el chat: no deja nada escrito", "supuesto", "no declara ninguna salida")
    def lista(d): return [{"que": k, "nivel": v[0], "por": v[1]} for k, v in sorted(d.items(), key=lambda kv: ["declarado", "inferido", "supuesto"].index(kv[1][0]))][:8]
    return {"entradas": lista(entradas), "salidas": lista(salidas), "herramientas": herr[:6],
            "opaca": all(v[0] == "supuesto" for v in entradas.values()) and all(v[0] == "supuesto" for v in salidas.values())}


def semaforo(skills, aristas):
    citadas = {b for _, b, fz in aristas if fz == "llama"}
    avisos = {}
    nombres = [s["nombre"].lower() for s in skills]
    for s in skills:
        a = []
        if not s["descripcion"]:
            a.append("sin descripción: tu agente no sabe cuándo usarla")
        if not s["tiene_cuando"]:
            a.append("no dice cuándo se activa")
        if s["dias"] > 90:
            a.append(f"sin tocar desde hace {s['dias']} días")
        if s["palabras"] > 3000:
            a.append(f"muy larga ({s['palabras']} palabras): cuesta contexto cada vez que se carga")
        if s["palabras"] < 60:
            a.append("casi vacía")
        base = re.sub(r"[-_ ]?(v?\d+|old|copy|copia|nuevo|new|2)$", "", s["nombre"].lower())
        gem = [n for n in nombres if n != s["nombre"].lower() and (n.startswith(base) or base.startswith(n)) and len(base) >= 5]
        if gem:
            a.append("parece duplicada de: " + ", ".join(sorted(set(gem))[:3]))
        if s["nombre"] not in citadas and not s["es_agente"]:
            a.append("nadie la llama: huérfana (solo la usas tú a mano, si te acuerdas)")
        avisos[s["ruta"]] = a
    return avisos


# Flujos de ejemplo (del sistema del autor, con nombres genéricos): lo que ve en gris quien no tiene ninguno.
# Flujo de ejemplo que dibuja la pestaña «Agentes atómicos» cuando en la carpeta no
# hay ninguno declarado. Es un flujo REAL del autor, escrito a mano (dummy): un
# director que encadena seis obreros. Cada paso: quién, qué skill monta, de dónde
# lee (`cd` = de tu cerebro digital, `her` = hereda del paso anterior, `ext` = de
# fuera), qué hace y qué deja (que es lo que lee el siguiente).
FLUJO_EJEMPLO = {
    "nombre": "Crear borradores de artículos y vídeos",
    "cuando": "cada domingo 23:00",
    "duracion": "unos 30 minutos, seis tarjetas, cero intervención",
    "director": {"nombre": "director-editorial",
                 "que": "No trabaja: crea UNA tarjeta hija cada vez, espera a que cierre y encarga la siguiente. Si una falla, reintenta, la salta o te avisa."},
    "pasos": [
        {"perfil": "rastreador-tendencias", "skill": "rastrear-fuentes",
         "lee": [["ext", "tus fuentes: feeds y canales"]],
         "hace": "Qué han publicado esta semana las fuentes que tú eliges. Cerrado a tu lista: nada de «internet».",
         "deja": "informe de tendencias (nota)"},
        {"perfil": "investigador-youtube", "skill": "investigar-demanda",
         "lee": [["her", "el informe del paso 1"], ["ext", "búsquedas de YouTube (API)"]],
         "hace": "Qué busca la gente y qué huecos dejan tus fuentes.",
         "deja": "informe con oferta + demanda"},
        {"perfil": "curador-editorial", "skill": "curar-con-criterio",
         "lee": [["her", "el informe del paso 2"], ["cd", "tu identidad editorial"]],
         "hace": "Item a item contra tu criterio: qué encaja contigo y qué no.",
         "deja": "selección editorial de la semana"},
        {"perfil": "generador-ideas", "skill": "generar-ideas · rankear-ideas",
         "lee": [["her", "la selección del paso 3"]],
         "hace": "Ideas de vídeo y de artículo, puntuadas, cada una con su item de origen.",
         "deja": "ideas de vídeo · ideas de artículo · ranking"},
        {"perfil": "redactor", "skill": "redactar-articulo",
         "lee": [["her", "la idea de artículo nº 1"], ["cd", "tu identidad editorial"]],
         "hace": "Escribe el borrador a la profundidad que pide tu identidad (1.800-2.500 palabras).",
         "deja": "propuesta de artículo"},
        {"perfil": "secretario", "skill": "crear-tarea",
         "lee": [["her", "todo lo anterior"]],
         "hace": "El recibo del flujo: una tarea en tu Kanban con los enlaces a lo que hay que revisar.",
         "deja": "tarea «Revisar propuestas editoriales»"},
    ],
}

EJEMPLOS_FLUJOS = json.loads(r'''[
 {
  "nombre": "Crear borradores de artículos y vídeos",
  "resumen": "Una vez por semana: qué publican tus fuentes, qué busca la gente en YouTube, qué de eso encaja contigo — y de esa única selección, ideas de vídeo y un borrador de artículo, con una tarea en tu Kanban para revisarlos.",
  "estado": "funcionando",
  "director": "director-editorial",
  "sirve_a": "NT YOUTUBE",
  "programada": "semana-editorial",
  "pasos": [
   {
    "perfil": "rastreador-tendencias",
    "nota": "Oferta: lo que PUBLICAN tus fuentes (feeds). Cerrado a tu lista.",
    "falta": false
   },
   {
    "perfil": "investigador-youtube",
    "nota": "Demanda: hereda el informe del paso 1 y le añade lo que la gente BUSCA en YouTube y los huecos que tus fuentes no tocan ",
    "falta": false
   },
   {
    "perfil": "curador-editorial",
    "nota": "Item a item contra tu identidad editorial; la coincidencia entre fuentes no es requisito y lo saturado no descarta.",
    "falta": false
   },
   {
    "perfil": "generador-ideas",
    "nota": "Dos ficheros: ideas de vídeo (V·SEO·C) e ideas de artículo (búsqueda·clientes·diferencial), cada idea con su item de ori",
    "falta": false
   },
   {
    "perfil": "redactor",
    "nota": "Escribe la idea de artículo número 1, a la profundidad que pide la identidad editorial (1.800-2.500 palabras). La propue",
    "falta": false
   },
   {
    "perfil": "secretario",
    "nota": "La tarea «Revisar propuestas editoriales» en tu Kanban con los enlaces. Es el recibo del flujo.",
    "falta": false
   }
  ]
 },
 {
  "nombre": "Crear guiones de vídeo para YouTube",
  "resumen": "De una idea ya elegida al guion grabable, con títulos candidatos puntuados y tres miniaturas completas en el mismo fichero. Empieza donde acaba la semana editorial.",
  "estado": "funcionando",
  "director": null,
  "sirve_a": "NT YOUTUBE",
  "programada": null,
  "pasos": [
   {
    "perfil": "guionista",
    "nota": "Dos bandejas de ideas: las que apuntas desde Telegram (CODEX, tipo youtube) y las propuestas semanales del generador. La",
    "falta": false
   },
   {
    "perfil": "diseñador-miniaturas",
    "nota": "No deja fichero aparte: escribe AL PRINCIPIO del propio guion la sección «# Diseño miniatura (Claude)» (títulos candidat",
    "falta": false
   },
   {
    "perfil": "diseñador-miniaturas-gemini",
    "nota": "COMPARATIVA (quitable): el mismo contrato con un modelo de Google vía hermes (nivel `comparativa-gemini` de modelos.yml)",
    "falta": false
   }
  ]
 },
 {
  "nombre": "Resumir canales de YouTube de referencia",
  "resumen": "Cada mañana, a goteo, los 5 últimos vídeos de cada canal transcritos y resumidos: por canal, un fichero con un resumen por vídeo (de qué habla, tu ángulo, la novedad), el más reciente arriba; y el resumen de la semana en curso, que se va completando día a día, con lo que más merece tu atención.",
  "estado": "funcionando",
  "director": null,
  "sirve_a": "NT YOUTUBE",
  "programada": "resumen-canales",
  "pasos": [
   {
    "perfil": "resumidor-youtube",
    "nota": "Tres skills: catálogo y transcripciones (captura, idempotentes) y resumir (comprensión). Lo que se lee el lunes es el re",
    "falta": false
   }
  ]
 },
 {
  "nombre": "Valorar una idea de vídeo",
  "resumen": "Le tiras una idea de vídeo por Telegram o en conversación y aparece desarrollada, puntuada y en su puesto del ranking de ideas, sin que hagas nada más.",
  "estado": "funcionando",
  "director": null,
  "sirve_a": "NT YOUTUBE",
  "programada": null,
  "pasos": [
   {
    "perfil": "valorador-ideas",
    "nota": "Dos skills en la misma pasada: puntuar (investigación) y regenerar el ranking (acción, script determinista).",
    "falta": false
   }
  ]
 },
 {
  "nombre": "Comité de sabios",
  "resumen": "Le planteas una decisión real y varios expertos —cada uno con el criterio destilado de un autor— emiten dictámenes aislados, replican si discrepan y un moderador escribe el acta sin promediar. El comité delibera; decides tú.",
  "estado": "falta una pieza",
  "director": "moderador-comite",
  "sirve_a": "NEGOCIO - BUSINESS",
  "programada": null,
  "pasos": [
   {
    "perfil": "destilador",
    "nota": "Skill prevista: `destilar-libro` (cuatro fases; notas antes que doctrina; índice al final). Construye mini cerebros; no ",
    "falta": true
   },
   {
    "perfil": "experto",
    "nota": "Un esqueleto, N expertos: se diferencian solo por `mini_cerebro`. Solo lectura sobre el corpus; si el autor no cubre el ",
    "falta": true
   }
  ]
 },
 {
  "nombre": "Anexar contenido al Cerebro Digital",
  "resumen": "Le mandas un apunte desde el móvil sin decir dónde va, aparece en la nota que toca marcado con #procesar, y te queda una tarea «cuanto antes» en tu Kanban con el enlace para revisarlo.",
  "estado": "funcionando",
  "director": null,
  "sirve_a": "200 MEMORIA DIGITAL",
  "programada": null,
  "pasos": [
   {
    "perfil": "asistente-cerebro-digital",
    "nota": "",
    "falta": false
   }
  ]
 },
 {
  "nombre": "Mantenimiento diario",
  "resumen": "La pasada de limpieza del sistema: archiva, limpia logs, sella costes, vigila tarjetas dormidas y regenera este mapa.",
  "estado": "funcionando",
  "director": null,
  "sirve_a": "Mantenimiento",
  "programada": "mantenimiento-diario",
  "pasos": [
   {
    "perfil": "mantenedor",
    "nota": "",
    "falta": false
   }
  ]
 },
 {
  "nombre": "Cerrar el día",
  "resumen": "Recoge lo que ha pasado hoy y lo resume en el diario, incluidas las anomalías de infraestructura que deja el vigilante.",
  "estado": "funcionando",
  "director": null,
  "sirve_a": "900 DIARIO",
  "programada": "cerrar-dia",
  "pasos": [
   {
    "perfil": "cerrador",
    "nota": "",
    "falta": false
   }
  ]
 },
 {
  "nombre": "Informe semanal del vault",
  "resumen": "Cada viernes, qué ha cambiado en tu Cerebro Digital y qué merece arreglar: índices al día, auditoría de lo modificado y una lista viva de propuestas que se va tachando con hechos.",
  "estado": "funcionando",
  "director": null,
  "sirve_a": "Mantenimiento",
  "programada": "informe-semanal-vault",
  "pasos": [
   {
    "perfil": "analista-vault",
    "nota": "Dos skills: indexar lo cambiado (dossier determinista + redacción) y auditar (métricas por CLI, diagnóstico por LLM). La",
    "falta": false
   }
  ]
 },
 {
  "nombre": "Resumen semanal de agentes",
  "resumen": "Cada lunes de madrugada, qué han hecho los agentes la semana anterior: cuántas tarjetas cerró cada perfil, cuánto tardaron, qué se reintentó, qué costó, qué flujos se completaron y qué se atascó.",
  "estado": "funcionando",
  "director": null,
  "sirve_a": "Mantenimiento",
  "programada": "resumen-semanal-agentes",
  "pasos": [
   {
    "perfil": "analista-agentes",
    "nota": "",
    "falta": false
   }
  ]
 }
]''')


def leer_flujos_yml(raiz):
    """Lee `flujos.yml` si existe (el formato del mapa de agentes atómicos) sin librería YAML:
    solo nombre, resumen, estado, director, sirve_a, programada y pasos[perfil, nota, falta]."""
    rutas = list(raiz.glob("**/flujos.yml")) if raiz and raiz.exists() else []
    if not rutas:
        return []
    flujos, f, paso = [], None, None
    for ln in rutas[0].read_text(encoding="utf-8", errors="ignore").splitlines():
        if ln.strip().startswith("#"):
            continue
        m = re.match(r"^  - nombre:\s*(.+)$", ln)
        if m:
            f = {"nombre": m.group(1).strip().strip('"'), "resumen": "", "estado": "", "director": None, "sirve_a": "", "programada": None, "pasos": []}; flujos.append(f); paso = None; continue
        if f is None:
            continue
        m = re.match(r"^    (resumen|estado|director|sirve_a|programada):\s*(.*)$", ln)
        if m:
            v = m.group(2).strip().strip('"'); f[m.group(1)] = None if v in ("null", "") else v; continue
        m = re.match(r"^      - perfil:\s*(.+)$", ln)
        if m:
            paso = {"perfil": m.group(1).strip(), "nota": "", "falta": False}; f["pasos"].append(paso); continue
        m = re.match(r"^        (nota|falta):\s*(.*)$", ln)
        if m and paso is not None:
            v = m.group(2).strip().strip('"')
            if m.group(1) == "falta":
                paso["falta"] = v.lower() in ("si", "sí", "true", "yes")
            else:
                paso["nota"] = v[:120]
    return flujos


def _clave_ruta(q):
    """Normaliza una entrada/salida para compararlas: minúsculas, sin plantillas (AAAA-MM-DD, <título>), sin extensión final."""
    q = q.lower().strip()
    q = re.sub(r"<[^>]*>|aaaa-mm-dd|yyyy-mm-dd|\d{4}-\d{2}-\d{2}|\*", "", q)
    return q.strip(" /_-")


def encaja(salida, entrada):
    """¿Lo que deja una skill es lo que lee otra? Misma ruta, o una carpeta que contiene a la otra, o el mismo fichero."""
    a, b = _clave_ruta(salida), _clave_ruta(entrada)
    if not a or not b or len(a) < 4 or len(b) < 4:
        return False
    # carpetas de primer nivel («050 activos») enlazarían con todo: hace falta al menos una subcarpeta o un fichero
    if a == b and (a.count("/") >= 1 or "." in a):
        return True
    if (a.startswith(b + "/") or b.startswith(a + "/")) and min(a.count("/"), b.count("/")) >= 1:
        return True
    fa, fb = a.rsplit("/", 1)[-1], b.rsplit("/", 1)[-1]
    return "." in fa and fa == fb and len(fa) > 6


def inferir_flujos(skills, aristas):
    """Flujos POSIBLES sin contratos: se encadenan skills cuando la salida de una es la entrada de otra
    (rutas declaradas o inferidas) o cuando una llama a la otra de verdad. Cadenas de 2 a 5 pasos."""
    sk = [x for x in skills if not x["es_agente"]]
    por_nombre = {x["nombre"]: x for x in sk}
    sig = {x["nombre"]: {} for x in sk}   # origen → {destino: motivo}
    for a in sk:
        for b in sk:
            if a is b:
                continue
            for sa in a["es"]["salidas"]:
                if sa["nivel"] == "supuesto":
                    continue
                for eb in b["es"]["entradas"]:
                    if eb["nivel"] != "supuesto" and encaja(sa["que"], eb["que"]):
                        sig[a["nombre"]].setdefault(b["nombre"], f"{a['nombre']} deja «{sa['que']}» y {b['nombre']} lo lee")
    for a, b, fz in aristas:
        if fz == "llama" and a in sig and b in por_nombre:
            sig[a].setdefault(b, f"{a} llama a {b}")
    entrantes = {n: 0 for n in sig}
    for a, d in sig.items():
        for b in d:
            entrantes[b] += 1
    cadenas = []
    def anda(camino):
        ult = camino[-1]
        salidas = [b for b in sig[ult] if b not in camino]
        if not salidas or len(camino) >= 5:
            if len(camino) >= 2:
                cadenas.append(list(camino))
            return
        for b in sorted(salidas):
            anda(camino + [b])
    for n in sorted(sig):
        if entrantes[n] == 0 and sig[n]:
            cadenas_n = []
            def anda_n(camino):
                ult = camino[-1]; salidas = [b for b in sig[ult] if b not in camino]
                if not salidas or len(camino) >= 5:
                    if len(camino) >= 2: cadenas_n.append(list(camino))
                    return
                for b in sorted(salidas): anda_n(camino + [b])
            anda_n([n])
            if cadenas_n:
                cadenas.append(max(cadenas_n, key=len))   # una cadena por origen: la más larga
    # sin cadenas contenidas en otras; las 12 más largas
    cadenas.sort(key=len, reverse=True)
    unicas = []
    for c in cadenas:
        if not any(set(c) <= set(u) for u in unicas):
            unicas.append(c)
    flujos = []
    for c in unicas[:12]:
        pasos = []
        for i, n in enumerate(c):
            motivo = sig[c[i - 1]][n] if i else ""
            pasos.append({"perfil": n, "nota": (motivo if i else (por_nombre[n]["descripcion"] or ""))[:120], "falta": False})
        primero, ultimo = por_nombre[c[0]], por_nombre[c[-1]]
        entrega = next((x["que"] for x in ultimo["es"]["salidas"] if x["nivel"] != "supuesto"), "")
        flujos.append({"nombre": f"{c[0]} → {c[-1]}", "resumen": f"Cadena posible de {len(c)} skills: empieza leyendo " + (next((x["que"] for x in primero["es"]["entradas"] if x["nivel"] != "supuesto"), "lo que le pases")) + " y termina dejando " + (entrega or "su resultado en un sitio sin declarar") + ". Inferida: nadie la ha declarado; es lo que las skills dicen que leen y escriben.",
                       "estado": "inferido", "director": None, "sirve_a": (re.match(r"^(\d{3,4} [^/]+)", entrega).group(1) if entrega and re.match(r"^(\d{3,4} [^/]+)", entrega) else ""), "programada": None, "pasos": pasos})
    return flujos


def detectar_sistema(raiz):
    """¿Hay ya un sistema de agentes atómicos (tablero, programadas, flujos)? Se mira sin leer contenido."""
    pistas = {"tablero": False, "programadas": False, "flujos": False, "vigilante": False}
    for base in ([raiz] if raiz else []) + [Path.cwd(), CASA]:
        if not base or not base.exists():
            continue
        if (base / "000 NEXUS" / "KANBAN").exists() or any(base.glob("**/KANBAN/pendientes")):
            pistas["tablero"] = True
        if any(base.glob("**/programadas/*.md")) or any(base.glob("**/programadas.yml")):
            pistas["programadas"] = True
        if any(base.glob("**/flujos.yml")):
            pistas["flujos"] = True
        if any(base.glob("**/vigilante*")):
            pistas["vigilante"] = True
        break
    return pistas


# ─── actores: lo que hay alrededor de tus agentes, en cualquier máquina ───
# Marcos, 17-sep-2026: «que sea capaz de identificar lo que tiene detrás quien
# se lo instale: la mayoría solo tendrá un agente continuo». Se mira qué
# herramientas hay instaladas, por dónde se les habla, qué corre solo, si hay
# candados y sobre qué carpeta trabajan. Todo por presencia de ficheros o
# binarios; nunca se lee contenido privado ni se ejecuta nada de la persona.
ARNESES = [  # (nombre, binario, carpeta de config, fichero de memoria/instrucciones)
    ("Claude Code", "claude", CASA / ".claude", "CLAUDE.md"),
    ("Codex", "codex", CASA / ".codex", "AGENTS.md"),
    ("Gemini CLI", "gemini", CASA / ".gemini", "GEMINI.md"),
    ("Hermes", "hermes", CASA / ".hermes", "SOUL.md"),
    ("OpenClaw", "openclaw", CASA / ".openclaw", ""),
    ("Aider", "aider", CASA / ".aider", ""),
    ("Cursor", "cursor", CASA / ".cursor", ".cursorrules"),
]
NOTAS_TIPO = {"001": "Recursos externos", "010": "Visión", "011": "Proyectos", "020": "Proyectos", "050": "Activos", "200": "Conocimiento", "400": "Sabiduría", "900": "Tiempo"}


def _hooks_en(settings: Path):
    """Cuántos candados (hooks) declara un settings.json de Claude Code. Solo cuenta; no lee comandos."""
    try:
        d = json.loads(settings.read_text(encoding="utf-8"))
        h = d.get("hooks") or {}
        return sum(len(v) if isinstance(v, list) else 1 for v in h.values())
    except Exception:  # noqa: BLE001
        return 0


def detectar_actores(raiz, skills, tareas, sistema, solo_carpeta=False):
    import shutil
    arneses = []
    for nombre, binario, conf, memoria in ARNESES:
        ruta_bin = None if solo_carpeta else shutil.which(binario)
        tiene_conf = (not solo_carpeta) and conf.exists()
        if not ruta_bin and not tiene_conf:
            continue
        mios = [x for x in skills if x["herramienta"] == nombre and not x.get("ejemplo")]
        mem = [str(m.name) for m in ([conf / memoria, raiz / memoria] if memoria else []) if m.exists()]
        mem_pal = sum(len(m.read_text(encoding="utf-8", errors="ignore").split()) for m in ([conf / memoria, raiz / memoria] if memoria else []) if m.exists())
        arneses.append({"nombre": nombre, "binario": binario, "instalado": bool(ruta_bin), "config": tiene_conf,
                        "skills": sum(1 for x in mios if not x["es_agente"]), "agentes": sum(1 for x in mios if x["es_agente"]),
                        "memoria": mem, "memoria_palabras": mem_pal})
    # Canales: por dónde se le habla al agente además de la terminal.
    canales = []
    if not solo_carpeta and (CASA / ".claude" / "channels" / "telegram").exists():
        canales.append({"nombre": "Telegram", "via": "plugin de Claude Code"})
    if not solo_carpeta and ((CASA / ".hermes" / "gateway.pid").exists() or (CASA / ".hermes" / "platforms").exists()):
        canales.append({"nombre": "Gateway de Hermes", "via": "bots de Hermes (Telegram, Discord…)"})
    if (raiz / ".obsidian").exists():
        canales.append({"nombre": "Obsidian", "via": "el vault está abierto como bóveda de Obsidian"})
    # Candados: hooks de Claude Code (usuario y carpeta) y carpetas HOOKS del sistema.
    hooks = (0 if solo_carpeta else _hooks_en(CASA / ".claude" / "settings.json")) + _hooks_en(raiz / ".claude" / "settings.json") + _hooks_en(raiz / ".claude" / "settings.local.json")
    hooks_sh = len(list(raiz.glob("**/HOOKS/handlers/*.sh"))) if raiz.exists() else 0
    # MCP: servidores declarados en la carpeta (solo cuenta).
    mcp = 0
    for f in ((raiz / ".mcp.json",) if solo_carpeta else (raiz / ".mcp.json", CASA / ".claude.json")):
        try:
            d = json.loads(f.read_text(encoding="utf-8")); mcp += len((d.get("mcpServers") or {}))
        except Exception:  # noqa: BLE001
            pass
    # El suelo: ¿es un Cerebro Digital (carpetas numeradas por nota tipo)?
    notas, vistos = [], set()
    if raiz.exists():
        for d in sorted(raiz.iterdir()):   # una por nota tipo: el color va por número
            num = {"011": "020"}.get(d.name[:3], d.name[:3])
            if d.is_dir() and d.name[:3] in NOTAS_TIPO and d.name[3:4] == " " and num not in vistos:
                vistos.add(num); notas.append({"num": num, "carpeta": d.name, "nombre": NOTAS_TIPO[d.name[:3]]})
    sistema_dirs = [d.name for d in raiz.iterdir() if d.is_dir() and d.name.upper().startswith("000 NEXUS")] if raiz.exists() else []
    # Lo que corre solo: por fuente, y si hay lanzador/vigilante entre ello.
    por_fuente = {}
    for t in tareas:
        por_fuente[t["fuente"]] = por_fuente.get(t["fuente"], 0) + 1
    lanzador = any(re.search(r"(?i)lanzador|launcher|dispatcher", t["que"]) for t in tareas) or any(raiz.glob("**/lanzador.py"))
    vigilante = sistema.get("vigilante") or any(re.search(r"(?i)vigilante|watchdog|arranque", t["que"]) for t in tareas)
    return {"arneses": arneses, "canales": canales, "hooks": hooks, "hooks_sh": hooks_sh, "mcp": mcp,
            "notas": notas, "sistema_dirs": sistema_dirs, "carpeta": raiz.name or str(raiz), "obsidian": (raiz / ".obsidian").exists(),
            "tareas_por_fuente": por_fuente, "lanzador": bool(lanzador), "vigilante": bool(vigilante),
            "tablero": bool(sistema.get("tablero")), "programadas": bool(sistema.get("programadas")),
            "agentes": sum(1 for x in skills if x["es_agente"] and not x.get("ejemplo")),
            "skills": sum(1 for x in skills if not x["es_agente"] and not x.get("ejemplo"))}


def construir_html(datos):
    j = json.dumps(datos, ensure_ascii=False)
    return r"""<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Mapa de mis agentes</title>
<style>
:root{--fondo:#f6f4ef;--tarjeta:#fff;--tinta:#1d1b18;--gris:#6b6760;--linea:#e2ddd3;--acento:#b5443c;--ok:#2f7d4f;--aviso:#c7861a;--mal:#b5443c;--hueco:#d8d3c8;--sans:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;--mono:ui-monospace,Menlo,Consolas,monospace}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){--fondo:#17161a;--tarjeta:#201f24;--tinta:#ecebe6;--gris:#a09b92;--linea:#34323a;--hueco:#3a3841}}
:root[data-theme="dark"]{--fondo:#17161a;--tarjeta:#201f24;--tinta:#ecebe6;--gris:#a09b92;--linea:#34323a;--hueco:#3a3841}
/* Colores de las notas tipo: los mismos del mapa de arquitectura del autor (900 DIARIO es blanco: el contorno hace el trabajo). */
:root{--c001:#C0392B;--c010:#B8860B;--c020:#27AE60;--c050:#E67E22;--c200:#34495E;--c400:#A03758;--c900:#2C3E50;--c000:#5A6673}
.t001{--c:var(--c001);--cs:#F7E2DF}.t010{--c:var(--c010);--cs:#F5EBCF}.t020{--c:var(--c020);--cs:#DFF1E6}.t050{--c:var(--c050);--cs:#FBE7D3}.t200{--c:var(--c200);--cs:#DFE4EA}.t400{--c:var(--c400);--cs:#F6E0E8}.t900{--c:var(--c900);--cs:#FFFFFF}.t000{--c:var(--c000);--cs:#E4E7E5}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){--c001:#E8725F;--c010:#D9AC4A;--c020:#5FD08D;--c050:#F0A055;--c200:#7C9BBD;--c400:#D1738F;--c900:#FFFFFF;--c000:#97A3B0}
 :root:not([data-theme="light"]) .t001,:root:not([data-theme="light"]) .t010,:root:not([data-theme="light"]) .t020,:root:not([data-theme="light"]) .t050,:root:not([data-theme="light"]) .t200,:root:not([data-theme="light"]) .t400,:root:not([data-theme="light"]) .t000{--cs:color-mix(in srgb,var(--c) 20%,var(--fondo))} :root:not([data-theme="light"]) .t900{--cs:var(--tarjeta)}}
:root[data-theme="dark"]{--c001:#E8725F;--c010:#D9AC4A;--c020:#5FD08D;--c050:#F0A055;--c200:#7C9BBD;--c400:#D1738F;--c900:#FFFFFF;--c000:#97A3B0}
:root[data-theme="dark"] .t001,:root[data-theme="dark"] .t010,:root[data-theme="dark"] .t020,:root[data-theme="dark"] .t050,:root[data-theme="dark"] .t200,:root[data-theme="dark"] .t400,:root[data-theme="dark"] .t000{--cs:color-mix(in srgb,var(--c) 20%,var(--fondo))}:root[data-theme="dark"] .t900{--cs:var(--tarjeta)}
.topline{display:flex;flex-wrap:wrap;align-items:flex-end;justify-content:space-between;gap:14px 20px}
#tema{width:36px;height:36px;border-radius:50%;border:1.5px solid var(--linea);background:var(--tarjeta);font-size:1.05rem;line-height:1;color:var(--tinta);cursor:pointer;flex:none}
#tema:hover{border-color:var(--acento)}
.controles{display:flex;align-items:center;gap:10px 16px;flex-wrap:wrap}
.sw-wrap{display:flex;align-items:center;gap:8px}.sw-et{font:.68rem var(--mono);letter-spacing:.09em;text-transform:uppercase;color:var(--gris)}
.sw-wrap button{position:relative;width:44px;height:25px;flex:none;border-radius:999px;border:1.5px solid var(--linea);background:var(--tarjeta);transition:background .15s;cursor:pointer}
.sw-wrap button::after{content:"";position:absolute;top:2px;left:2px;width:19px;height:19px;border-radius:50%;background:var(--gris);transition:transform .15s,background .15s}
.sw-wrap button[aria-checked="true"]{background:var(--acento);border-color:var(--acento)}.sw-wrap button[aria-checked="true"]::after{transform:translateX(19px);background:#fff}
.aviso-priv{margin:0 0 16px;padding:10px 14px;border-radius:10px;font-size:.88rem;background:color-mix(in srgb,var(--acento) 12%,var(--tarjeta));border:1.5px solid var(--acento)}
/* Modo privacidad: esconde lo marcado como privado y los detalles que delatan rutas o comandos, para grabar o compartir pantalla sin repasar antes. */
body.privado [data-priv="1"]{display:none!important}body.privado .n.ruta,body.privado .cal .n,body.privado #plano .dato li,body.privado .cal-caja li .n{filter:blur(6px)}
*{box-sizing:border-box}body{margin:0;background:var(--fondo);color:var(--tinta);font:15px/1.5 var(--sans);padding-block:28px;padding-inline:clamp(16px,4vw,48px)}
h1{font-size:1.7rem;margin:0 0 4px}h2{font-size:1.15rem;margin:26px 0 10px}.sub{color:var(--gris);margin:0 0 18px}
.pestanas{display:flex;flex-wrap:wrap;gap:6px;margin:18px 0 22px;border-bottom:1.5px solid var(--linea)}
.pestanas button{border:0;background:transparent;color:var(--gris);font:600 .95rem var(--sans);padding:10px 14px;border-bottom:3px solid transparent;cursor:pointer;margin-bottom:-1.5px}
.pestanas button[aria-selected=true]{color:var(--tinta);border-bottom-color:var(--acento)}
.cifras{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px;margin:0 0 18px}
.cifra{background:var(--tarjeta);border:1.5px solid var(--linea);border-radius:12px;padding:12px 14px}.cifra b{display:block;font-size:1.6rem;line-height:1.1}.cifra span{color:var(--gris);font-size:.85rem}
.buscador{display:flex;align-items:center;gap:10px;height:48px;padding:0 14px;border:1.5px solid var(--linea);border-radius:12px;background:var(--tarjeta);margin:0 0 14px}
.buscador input{flex:1;border:0;background:transparent;font:1rem var(--sans);color:var(--tinta);outline:none}
table{width:100%;border-collapse:collapse;background:var(--tarjeta);border:1.5px solid var(--linea);border-radius:12px;overflow:hidden}
th,td{text-align:left;padding:9px 10px;border-top:1px solid var(--linea);vertical-align:top;font-size:.92rem}th{color:var(--gris);font-size:.78rem;letter-spacing:.06em;text-transform:uppercase;border-top:0}
.tabla{overflow-x:auto}.n{font-family:var(--mono);font-size:.85rem}.d{color:var(--gris)}
.sk-filtros{display:flex;flex-wrap:wrap;gap:6px;align-items:center;margin:0 0 14px}.sk-f{border:1.5px solid var(--linea);background:var(--tarjeta);color:var(--tinta);border-radius:999px;padding:5px 12px;font:.85rem var(--sans);cursor:pointer}
.sk-f[aria-pressed=true]{background:var(--tinta);color:var(--fondo);border-color:var(--tinta)}.sk-f span{color:var(--gris);margin-left:6px;font-family:var(--mono);font-size:.75rem}.sk-f[aria-pressed=true] span{color:inherit}.sk-sep{width:1px;height:22px;background:var(--linea);margin:0 4px}
.sem{display:inline-block;width:10px;height:10px;border-radius:50%;margin-right:6px;vertical-align:middle}.sem.gris{background:var(--hueco)}.sem.ok{background:var(--ok)}.sem.aviso{background:var(--aviso)}.sem.mal{background:var(--mal)}
.av{font-size:.85rem;color:var(--gris)}.av li{margin:0}
.grafo{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:10px}.nodo{background:var(--tarjeta);border:1.5px solid var(--linea);border-radius:12px;padding:12px 14px}.nodo b{display:block}.nodo .sale,.nodo .entra{font-size:.85rem;margin-top:6px}.nodo .sale::before{content:"→ llama a: ";color:var(--gris)}.nodo .entra::before{content:"← la llaman: ";color:var(--gris)}
.huerfana{border-style:dashed;color:var(--gris)}
.rel{display:grid;grid-template-columns:minmax(150px,1fr) 28px minmax(220px,1.4fr) 28px minmax(150px,1fr);align-items:center;gap:6px 0;background:var(--tarjeta);border:1.5px solid var(--linea);border-radius:14px;padding:14px 16px;margin-bottom:12px}
.rel.huerfana{border-style:dashed;opacity:.8}
.rel .lado{display:flex;flex-direction:column;gap:6px}.rel .lado.izq{align-items:flex-end}.rel .lado.der{align-items:flex-start}
.chip{display:inline-block;font:.82rem var(--mono);padding:5px 10px;border-radius:999px;border:1.5px solid var(--linea);background:var(--fondo);color:var(--tinta);max-width:100%;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.chip.nadie{border-style:dashed;color:var(--gris)}.chip.mencion{border-style:dotted;color:var(--gris);opacity:.75}
.chip.decl{border-color:var(--ok)}.chip.inf{border-color:var(--aviso);border-style:dashed}.chip.sup{border-style:dotted;color:var(--gris)}
.chip{white-space:normal;text-align:left;line-height:1.3}.rel .lado .chip{max-width:100%}
.rel.opaca .centro{border-style:dashed;border-color:var(--gris);background:transparent}.rel .usa{grid-column:1/-1;font-size:.8rem;color:var(--gris);margin-top:4px}.rel .usa b{color:var(--tinta)}.rel .herr{font-size:.75rem;color:var(--gris)}
.rel .centro{border:2px solid var(--acento);border-radius:12px;padding:10px 14px;background:color-mix(in srgb,var(--acento) 8%,var(--tarjeta))}
.rel .centro b{display:block;font:700 1rem var(--mono)}.rel .centro span{display:block;font-size:.85rem;color:var(--gris);margin-top:3px}
.rel .centro .cnt{font:.72rem var(--mono);color:var(--acento);margin-top:6px;display:block}
.rel .conector{height:3px;background:var(--linea);position:relative}.rel .conector::after{content:"";position:absolute;right:-1px;top:50%;transform:translateY(-50%);border-left:9px solid var(--linea);border-top:6px solid transparent;border-bottom:6px solid transparent}
.rel .conector.on{background:var(--acento)}.rel .conector.on::after{border-left-color:var(--acento)}
.rel .etq{font:.68rem var(--mono);letter-spacing:.08em;text-transform:uppercase;color:var(--gris);margin-bottom:2px}
@media (max-width:760px){.rel{grid-template-columns:1fr}.rel .conector{display:none}.rel .lado.izq,.rel .lado.der{align-items:flex-start}}
.cal{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:10px}
/* ══ Resumen del calendario: diarias · semanales · mensuales, todas juntas
   encima del mes (Marcos, 17-sep-2026) ═══════════════════════════════ */
.cal-resumen{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin:4px 0 18px}
.cal-caja{border:1.5px solid var(--linea);border-radius:10px;padding:10px 12px;background:var(--tarjeta);min-width:0}
.cal-caja h4{margin:0 0 6px;font:700 .68rem var(--mono);letter-spacing:.1em;text-transform:uppercase;color:var(--gris)}
.cal-caja h4 b{font:700 .95rem inherit;letter-spacing:0;margin-right:6px;color:var(--tinta)}
.cal-caja ul{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:3px}
.cal-caja li{font:.78rem/1.35 var(--mono);color:var(--tinta);display:flex;gap:8px;align-items:baseline;min-width:0}
.cal-caja li .h{flex:none;font-variant-numeric:tabular-nums;color:var(--gris);min-width:5ch}
.cal-caja li .n{overflow-wrap:anywhere}
.cal-caja li .q{color:var(--gris);font-size:.7rem}
.cal-caja li.parada{opacity:.5;text-decoration:line-through}
.cal-caja li.virtual{opacity:.6;font-style:italic}
.cal-caja .nada{color:var(--gris);font-size:.78rem;font-style:italic}
@media (max-width:760px){.cal-resumen{grid-template-columns:1fr}}
.cal-cabecera{display:flex;align-items:center;gap:10px;margin:4px 0 8px}.cal-mes{font:600 1.15rem var(--mono);margin:0;min-width:200px;text-transform:capitalize}
.cal-nav,.cal-hoy{font:600 .9rem var(--mono);border:1.5px solid var(--linea);background:transparent;color:var(--tinta);border-radius:8px;padding:4px 10px;cursor:pointer}.cal-hoy{font-size:.78rem;margin-left:auto}
.cal-semana{display:grid;grid-template-columns:repeat(7,1fr);gap:6px;margin-top:10px}.cal-semana span{font:600 .7rem var(--mono);text-transform:uppercase;letter-spacing:.06em;color:var(--gris);padding:0 6px}
.cal-rejilla{display:grid;grid-template-columns:repeat(7,1fr);gap:6px;margin-top:4px}
.cal-dia{min-height:96px;border:1.5px solid var(--linea);border-radius:8px;padding:6px 6px 8px;background:var(--tarjeta)}.cal-dia.fuera{opacity:.35}.cal-dia.hoy{border-color:var(--tinta);border-width:2px}
.cal-dia .num{font:.78rem var(--mono);color:var(--gris);font-variant-numeric:tabular-nums}.cal-dia.hoy .num{color:var(--tinta);font-weight:700}
.cal-puntos{display:flex;flex-direction:column;gap:3px}.arranque{display:inline-flex;align-items:center;gap:5px;line-height:1}.arranque .hora{font:.66rem var(--mono);color:var(--gris);font-variant-numeric:tabular-nums}
.punto{width:13px;height:13px;border-radius:50%;border:2px solid var(--c);background:var(--c);cursor:pointer;position:relative;flex:0 0 auto;transition:transform .12s}.punto:hover,.punto:focus-visible{transform:scale(1.35);outline:none;box-shadow:0 0 0 3px color-mix(in srgb,var(--c) 30%,transparent)}
.punto.virtual{background:transparent;border-style:dashed}.punto.declarada{background:transparent}
.cal-leyenda{display:flex;flex-wrap:wrap;gap:8px 18px;margin:12px 0 4px;font-size:.85rem;color:var(--gris)}.cal-leyenda i{display:inline-block;vertical-align:middle;margin-right:6px}
/* La chapa «ejemplo»: la MISMA en el aviso de cada pestaña y en cada skill, flujo o tarea que sea de ejemplo (Marcos, 17-sep). */
.ej{display:inline-block;font:700 .6rem var(--mono);letter-spacing:.09em;text-transform:uppercase;color:#fff;background:var(--aviso);border-radius:999px;padding:2px 9px;vertical-align:middle;white-space:nowrap}
.rel .centro .ej,.flujo h4 .ej,.n .ej{display:inline-block;width:auto;font:700 .6rem var(--mono);color:#fff;margin:0 0 0 6px}
.aviso-ejemplo{margin:0 0 16px;padding:10px 14px;border:2px dashed var(--aviso);border-radius:10px;background:color-mix(in srgb,var(--aviso) 8%,var(--tarjeta));font-size:.88rem}
.aviso-ejemplo b{color:var(--aviso)}
.cal-caja li .ej{margin-left:4px}
.aviso-virtual{margin:10px 0 0;padding:10px 14px;border:2px dashed var(--hueco);border-radius:10px;color:var(--gris);font-size:.9rem}
#globo{position:fixed;z-index:60;max-width:min(52ch,84vw);background:var(--tinta);color:var(--fondo);border-radius:8px;padding:9px 12px;font:.78rem/1.45 var(--sans);box-shadow:0 8px 24px rgb(0 0 0 / .25);pointer-events:none;opacity:0;visibility:hidden;transition:opacity .1s;white-space:pre-line}
#globo.visible{opacity:1;visibility:visible}#globo b{font-weight:700}#globo::after{content:"";position:absolute;top:100%;left:var(--flecha,50%);transform:translateX(-50%);border:6px solid transparent;border-top-color:var(--tinta)}#globo.abajo::after{top:auto;bottom:100%;border-top-color:transparent;border-bottom-color:var(--tinta)}
@media (max-width:560px){.arranque .hora{font-size:.58rem}.cal-dia{min-height:64px}}
.hueco{border:2px dashed var(--hueco);border-radius:14px;padding:18px;color:var(--gris);background:transparent;min-height:120px}
.hueco b{display:block;color:var(--tinta);margin-bottom:6px}.hueco.lleno{border-style:solid;border-color:var(--ok)}
.flujos{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:12px;margin-top:18px}
.lista-flujos{display:flex;flex-direction:column;gap:14px}
.flujo{background:var(--tarjeta);border:1.5px solid var(--linea);border-left:5px solid var(--acento);border-radius:6px 12px 12px 6px;padding:16px 18px 12px}
.flujo h4{margin:0 0 4px;font-size:1.1rem}.flujo .desc{margin:0 0 10px;color:var(--gris);max-width:70ch}
.flujo .meta{display:flex;flex-wrap:wrap;gap:6px 14px;font:.78rem var(--mono);color:var(--gris);margin-bottom:12px}.flujo .meta .ok{color:var(--ok)}.flujo .meta .est-av{color:var(--aviso)}
.cadena{display:flex;flex-wrap:wrap;align-items:stretch;gap:8px}
.paso{border:1.5px solid var(--linea);border-radius:10px;padding:8px 12px;min-width:150px;max-width:260px;background:var(--fondo)}.paso b{display:block;font-family:var(--mono);font-size:.85rem}.paso span{display:block;font-size:.78rem;color:var(--gris);margin-top:3px}
.paso.dir{border-color:var(--acento);border-style:double}.paso.falta{border-style:dashed;color:var(--gris)}
.fl{align-self:center;color:var(--gris);font-size:1.2rem}
.destinos{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin:0 0 14px}.destinos .etq{font-size:.85rem;color:var(--gris);margin-right:4px}
.destinos button{border:1px solid var(--linea);background:var(--tarjeta);color:var(--tinta);border-radius:999px;padding:6px 14px;font:.9rem var(--sans);cursor:pointer}
.destinos button[aria-pressed=true]{background:var(--tinta);color:var(--fondo);border-color:var(--tinta)}.destinos button span{opacity:.6;margin-left:6px;font-size:.8rem}
.destinos button.terr{border:1.5px solid var(--c);background:var(--cs);color:var(--c);font-weight:600}.destinos button.terr span{opacity:.75}
.destinos button.terr[aria-pressed=true]{background:var(--c);color:var(--fondo);border-color:var(--c);box-shadow:0 0 0 3px color-mix(in srgb,var(--c) 26%,transparent)}.destinos button.terr.t900[aria-pressed=true]{color:var(--tinta)}
.cifras-fl{display:flex;flex-wrap:wrap;align-items:center;gap:10px;margin:0 0 22px}.cifras-fl .etq{font-size:.85rem;color:var(--gris)}
.cifra-fl{background:var(--tarjeta);border:1.5px solid var(--linea);border-radius:8px;padding:8px 14px;font:.92rem var(--sans);color:var(--tinta);cursor:pointer;text-align:left}.cifra-fl b{font-size:1.3rem;margin-right:6px}
.cifra-fl:hover{border-color:var(--acento)}.cifra-fl[aria-pressed=true]{border-color:var(--acento);background:color-mix(in srgb,var(--acento) 14%,var(--tarjeta))}.cifra-fl[aria-pressed=true] b{color:var(--acento)}.cifra-fl.total{border-style:dashed}
/* ══ Figura de ejemplo: un flujo con director y obreros, dibujado en HTML a partir
   de FLUJO_EJEMPLO (datos dummy del propio script). Sale solo cuando la carpeta no
   tiene agentes atómicos declarados. Nada de aquí viene de la carpeta rastreada. ══ */
.fig{border:1.5px solid var(--linea);border-radius:14px;background:var(--tarjeta);padding:18px 18px 14px;margin:14px 0 22px}
.fig .fig-cab{display:flex;flex-wrap:wrap;align-items:baseline;gap:8px 14px;margin-bottom:12px}
.fig .fig-cab h3{margin:0;font-size:1.1rem}.fig .fig-cab .cuando{font:.78rem var(--mono);color:var(--gris)}
.fig .fig-cab .cuando b{color:var(--aviso)}
.fig .director{display:inline-flex;align-items:center;gap:10px;border:3px solid #2B5FA8;border-radius:10px;padding:8px 14px;background:var(--fondo);margin:0 auto 6px;max-width:100%;text-align:left}
.fig .director .nom{font:700 .95rem var(--mono)}.fig .director .que{font-size:.8rem;color:var(--gris);max-width:48ch}
.fig .chapa{font:700 .58rem var(--mono);letter-spacing:.08em;text-transform:uppercase;border-radius:999px;padding:2px 8px;white-space:nowrap}
.fig .chapa.dir{background:#2B5FA8;color:#fff}.fig .chapa.obr{background:var(--hueco);color:var(--tinta)}
.fig .centro{text-align:center}.fig .baja{font:.72rem var(--mono);color:var(--gris);text-align:center;margin:2px 0 12px}
.fig .baja::before{content:"↓ ";}
.fig .pasos{display:grid;grid-template-columns:repeat(auto-fit,minmax(168px,1fr));gap:10px}
.fig .paso{border:2px solid var(--tinta);border-radius:9px;background:var(--fondo);padding:8px 10px;display:flex;flex-direction:column;gap:6px;position:relative;min-width:0}
.fig .paso .num{position:absolute;top:-10px;left:10px;background:var(--tinta);color:var(--fondo);font:700 .66rem var(--mono);border-radius:999px;padding:1px 7px}
.fig .paso header{display:flex;align-items:center;justify-content:space-between;gap:6px;margin-top:4px}
.fig .paso .nom{font:700 .82rem var(--mono);overflow-wrap:anywhere}
.fig .paso .sk{display:inline-block;font:.68rem var(--mono);border:1.5px solid var(--tinta);border-radius:999px;padding:1px 8px;color:var(--tinta);align-self:flex-start}
.fig .caja{border:1.5px solid var(--gris);border-radius:6px;padding:4px 7px;font:.7rem/1.35 var(--mono);color:var(--tinta);background:var(--tarjeta)}
.fig .caja .et{display:block;font:600 .58rem var(--mono);letter-spacing:.08em;text-transform:uppercase;color:var(--gris)}
.fig .caja.ext{border-style:dashed}.fig .caja.her{box-shadow:inset 4px 0 0 var(--gris)}.fig .caja.deja{border-color:var(--ok);background:color-mix(in srgb,var(--ok) 8%,var(--tarjeta))}
.fig .paso .hace{font-size:.76rem;color:var(--gris);line-height:1.35}
.fig .leyenda{display:flex;flex-wrap:wrap;gap:14px;margin-top:12px;font-size:.78rem;color:var(--gris)}
.fig .leyenda span{display:flex;align-items:center;gap:6px}.fig .leyenda i{display:inline-block;width:22px;height:13px;border:1.5px solid var(--gris);border-radius:4px}
.fig .leyenda i.ext{border-style:dashed}.fig .leyenda i.her{box-shadow:inset 4px 0 0 var(--gris)}.fig .leyenda i.deja{border-color:var(--ok);background:color-mix(in srgb,var(--ok) 8%,var(--tarjeta))}
.fig .leyenda i.dir{border:2.5px solid #2B5FA8}.fig .leyenda i.obr{border:2px solid var(--tinta)}
.flujo{border-left-color:var(--c,var(--acento))}
/* ══ Pestaña Actores: cajas HTML en capas; los hilos los dibuja JS midiendo dónde quedó cada caja ══ */
.plano{--mi:150px;position:relative;padding:6px 60px 6px var(--mi);margin:8px 0 22px}
.plano-hilos{position:absolute;inset:0;width:100%;height:100%;pointer-events:none;overflow:visible;color:var(--gris)}
.plano-hilos path{fill:none;stroke:currentColor;stroke-width:1.6}.plano-hilos path.vig{stroke-dasharray:5 4}.plano-hilos path.aviso{stroke-dasharray:1.5 4;stroke-linecap:round}.plano-hilos path.candado{stroke-dasharray:2 3;stroke:#B0473A}.plano-hilos path.falta{stroke-dasharray:3 5;opacity:.6}
.plano-hilos text{font:600 .62rem var(--mono);fill:var(--gris);paint-order:stroke;stroke:var(--fondo);stroke-width:4px;stroke-linejoin:round}
.capa{display:grid;grid-template-columns:repeat(12,1fr);gap:14px;position:relative;margin:0 0 46px}.capa:last-child{margin-bottom:0}
.capa-et{position:absolute;left:calc(var(--mi) * -1);top:0;width:70px;font:700 .6rem/1.3 var(--mono);letter-spacing:.1em;text-transform:uppercase;color:var(--gris);text-align:right;padding-top:12px}
.actor{position:relative;grid-column:span 3;border:2px solid var(--tinta);background:var(--tarjeta);border-radius:9px;padding:10px 12px 11px;min-width:0;display:flex;flex-direction:column;gap:6px}
.actor.persona{border-color:var(--aviso);background:color-mix(in srgb,var(--aviso) 9%,var(--tarjeta))}.actor.canal{border-style:dashed;border-color:var(--ok);background:color-mix(in srgb,var(--ok) 7%,var(--tarjeta))}
.actor.continuo{border-width:3px;border-color:#2B5FA8}.actor.tablero{border-color:#3D6296}.actor.base{border-color:var(--gris);background:var(--fondo)}
.actor.vault{border-color:#3D6296;border-radius:0;background:repeating-linear-gradient(0deg,transparent 0 22px,color-mix(in srgb,#3D6296 9%,transparent) 22px 23px),color-mix(in srgb,#3D6296 5%,var(--tarjeta))}
.actor.contexto{border-color:#2B5FA8;border-style:double;border-width:4px;background:color-mix(in srgb,#2B5FA8 6%,var(--tarjeta))}
.actor.falta{border-style:dashed;background:var(--hueco);color:var(--gris)}.actor.falta h4{color:var(--gris)}
.actor>header{display:flex;align-items:center;gap:8px;flex-wrap:wrap}.actor h4{margin:0;font-size:1rem;line-height:1.2}.actor h4 small{display:block;font:.7rem/1.3 var(--mono);color:var(--gris);font-weight:400;margin-top:1px}
.chapa-act{margin-left:auto;font:700 .58rem var(--mono);letter-spacing:.08em;text-transform:uppercase;border-radius:999px;padding:2px 8px;background:var(--hueco);color:var(--tinta);white-space:nowrap}
.chapa-act.res{background:#2B5FA8;color:#fff}.chapa-act.reloj{background:var(--aviso);color:#fff}.chapa-act.efi{background:transparent;border:1.5px dashed var(--gris);color:var(--gris)}.chapa-act.conv{background:var(--ok);color:#fff}.chapa-act.falta{background:transparent;border:1.5px dashed var(--mal);color:var(--mal)}
.actor p{margin:0;font-size:.8rem;line-height:1.4;color:var(--gris)}
.actor .dato{display:flex;flex-wrap:wrap;gap:4px 6px;margin:0;padding:0;list-style:none}.actor .dato li{font:.7rem/1.3 var(--mono);color:var(--tinta);border:1px solid var(--linea);border-radius:5px;padding:2px 6px;background:var(--tarjeta);max-width:100%;overflow-wrap:anywhere}
.actor .dato li.ok{border-color:var(--ok)}.actor .dato li.no{border-color:var(--mal);color:var(--mal)}.actor .dato li b{font-weight:600;color:var(--gris)}.actor .dato li[data-globo]{cursor:help}
.actor .dato li.terr{border:1.5px solid var(--c);background:var(--cs);color:var(--c);font-weight:600}.actor .dato li.terr.falta-nt{border-style:dashed;background:transparent;opacity:.55}.actor .dato li.terr.t900{color:var(--tinta)}.actor .dato li.terr b{color:inherit;font-weight:700;margin-right:4px}
.leyenda-act{display:flex;flex-wrap:wrap;gap:16px;font-size:.85rem;color:var(--gris);padding:12px 14px;background:var(--tarjeta);border:1.5px solid var(--linea);border-radius:10px}.leyenda-act span{display:flex;align-items:center;gap:8px}.leyenda-act .chapa-act{margin-left:0}
@media (max-width:760px){.plano{padding-left:0;padding-right:0}.capa{grid-template-columns:1fr;margin-bottom:34px}.capa-et{position:static;width:auto;text-align:left;padding:0 0 6px}.actor{grid-column:1/-1!important}}
.flujo.fantasma{border-style:dashed;border-left-style:dashed;opacity:.62;filter:grayscale(1)}.flujo.fantasma h4::after{content:" · así se vería";font:.75rem var(--mono);color:var(--gris)}
.flujo.inferido{border-left-color:var(--aviso)}.flujo.inferido h4::after{content:" · inferido, no declarado";font:.75rem var(--mono);color:var(--aviso)}
.pie{margin-top:32px;color:var(--gris);font-size:.85rem;border-top:1.5px solid var(--linea);padding-top:12px}
[hidden]{display:none!important}
</style></head><body>
<div class="topline"><div><h1>Mapa de mis agentes</h1><p class="sub" id="version" style="margin:0 0 4px;font:.78rem var(--mono)"></p><p class="sub" id="sub"></p></div>
<div class="controles"><span class="sw-wrap"><span class="sw-et" id="priv-et">Privacidad</span><button id="priv" type="button" role="switch" aria-checked="false" aria-labelledby="priv-et"></button></span>
<button id="tema" type="button" aria-label="Cambiar entre tema claro y oscuro" title="Cambiar tema">☀︎</button></div></div>
<p class="aviso-priv" id="aviso-priv" hidden></p>
<div class="cifras" id="cifras"></div>
<div class="pestanas" role="tablist">
  <button role="tab" aria-selected="true" data-v="inferidos">Flujos trabajo skills</button>
  <button role="tab" aria-selected="false" data-v="cal">Calendario</button>
  <button role="tab" aria-selected="false" data-v="skills">Skills</button>
  <button role="tab" aria-selected="false" data-v="grafo">Entradas y salidas</button>
  <button role="tab" aria-selected="false" data-v="flujos">Agentes atómicos</button>
  <button role="tab" aria-selected="false" data-v="actores">Actores</button>
</div>
<section id="v-skills" hidden>
  <div class="buscador"><input id="q" type="search" placeholder="Escribe para filtrar por nombre o descripción…" aria-label="Filtrar skills"></div>
  <div class="sk-filtros" id="sk-filtros"></div>
  <div class="tabla"><table><thead><tr><th></th><th>Skill</th><th>Herramienta</th><th>Qué hace</th><th>La monta</th><th>Tamaño</th><th>Tokens ≈</th><th>Tocada</th><th>Avisos</th></tr></thead><tbody id="tb"></tbody></table></div>
</section>
<section id="v-grafo" hidden><p class="sub">Solo skills (los agentes, en su pestaña). Para cada una: a la izquierda <b>qué lee</b>, en el centro la skill y qué hace, a la derecha <b>qué produce y dónde lo deja</b>. Como una skill normal no declara nada de esto, se infiere de su texto, y cada dato dice cuánto fiarse: <span class="chip decl">declarado</span> la ruta está escrita en la skill · <span class="chip inf">inferido</span> hay un verbo de leer o escribir cerca de un fichero, una carpeta o una web · <span class="chip sup">supuesto</span> no dice nada y se deduce por el tipo de skill. Una skill con todo en «supuesto» es una <b>caja opaca</b>: nadie (ni tu agente) sabe qué entra ni qué sale, y por eso no se puede encadenar con otra. Debajo, las skills a las que llama de verdad.</p>
  <div class="buscador"><input id="q-rel" type="search" placeholder="Escribe para filtrar por skill, fichero o carpeta…" aria-label="Filtrar entradas y salidas"></div><div id="grafo"></div></section>
<section id="v-cal" hidden><p class="sub"><b>Aquí solo salen las skills y agentes que tienen alguna programación</b>: un cron de tu usuario, una tarea de launchd (Mac) o de Tareas programadas (Windows), un agente programado, o un horario escrito dentro de la propia skill («cada día a las 02:30»). Para encontrarlas, el programa barre tu crontab, tus LaunchAgents, tus tareas programadas y el texto de todas las skills de la carpeta que le indiques. Un punto por arranque: en color, lo real de esta máquina; hueco, lo que la skill dice pero nadie lanza; en gris discontinuo, <b>crones virtuales de ejemplo</b> que no existen en tu ordenador y enseñan cómo se ve un sistema donde los agentes trabajan de madrugada. Pasa el cursor por un punto para ver quién arranca y qué hace.</p>
  <div class="cal-resumen" id="cal-resumen" aria-label="Lo programado, por cadencia"></div>
  <div class="cal-cabecera"><button type="button" class="cal-nav" id="cal-prev" aria-label="Mes anterior">‹</button><h3 class="cal-mes" id="cal-mes"></h3><button type="button" class="cal-nav" id="cal-next" aria-label="Mes siguiente">›</button><button type="button" class="cal-hoy" id="cal-hoy">hoy</button></div>
  <div class="cal-semana"><span>lun</span><span>mar</span><span>mié</span><span>jue</span><span>vie</span><span>sáb</span><span>dom</span></div>
  <div class="cal-rejilla" id="cal-rejilla"></div><div class="cal-leyenda" id="cal-leyenda"></div><p class="aviso-virtual" id="aviso-virtual" hidden></p>
  <h2>Lo que corre solo en esta máquina</h2><div class="cal" id="cal"></div></section>
<div id="globo" role="tooltip" aria-hidden="true"></div>
<section id="v-actores" hidden><p class="sub">Lo que hay <b>alrededor</b> de tus agentes en esta máquina: con qué herramienta hablas, por dónde, qué corre solo, qué candados hay y sobre qué carpeta trabajan. Lo que existe sale con trazo lleno; lo que falta para que esto sea un sistema, con trazo discontinuo. Pasa el cursor por las etiquetas.</p>
  <div class="plano" id="plano"><svg class="plano-hilos" id="plano-hilos" aria-hidden="true"></svg><div id="plano-capas"></div></div>
  <div class="leyenda-act"><span><i class="chapa-act conv">conversa</i>habla contigo</span><span><i class="chapa-act res">residente</i>proceso vivo siempre</span><span><i class="chapa-act reloj">reloj</i>salta a una hora</span><span><i class="chapa-act efi">efímero</i>nace para una tarjeta y muere</span><span><i class="chapa-act falta">falta</i>no detectado</span></div>
</section>
<section id="v-inferidos"></section>
<section id="v-flujos" hidden><p class="sub">Un flujo de trabajo es una cadena de skills o agentes con un resultado que llega solo. Si tienes agentes atómicos con contratos (entradas y salidas declaradas), los flujos salen de ahí. Si no, el mapa <b>infiere flujos posibles</b> encadenando tus skills cuando lo que una deja es lo que otra lee, o cuando una llama a otra. Y si no hay ninguno declarado, te enseña arriba un flujo real del autor para que veas a qué se parece.</p><div class="flujos" id="flujos"></div></section>
<p class="pie">Generado por «Mapa de mis agentes» el <span id="fecha"></span>. Solo lectura: no ha tocado ningún fichero, no ha usado internet ni claves.</p>
<script>
const D = __DATOS__;
const $ = s => document.querySelector(s);
const escT = v => String(v).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
// Tema claro/oscuro: sigue al sistema hasta que pulsas el sol/la luna; la elección se guarda en este navegador.
const bt = $("#tema");
function oscuroAhora(){ const t = document.documentElement.dataset.theme; return t ? t === "dark" : matchMedia("(prefers-color-scheme: dark)").matches; }
function pintarTema(){ bt.textContent = oscuroAhora() ? "☀︎" : "☾"; }
bt.addEventListener("click", () => { const sig = oscuroAhora() ? "light" : "dark"; document.documentElement.dataset.theme = sig; try { localStorage.setItem("tema-mapa-agentes", sig); } catch (e) {} pintarTema(); });
try { const g = localStorage.getItem("tema-mapa-agentes"); if (g) document.documentElement.dataset.theme = g; } catch (e) {}
matchMedia("(prefers-color-scheme: dark)").addEventListener("change", pintarTema); pintarTema();
// Modo privacidad: esconde lo marcado `visibilidad: privado` (o `private: true`) en el frontmatter y difumina rutas y comandos. Se recuerda entre visitas.
const bp = $("#priv"), avisoP = $("#aviso-priv");
const nPriv = D.skills.filter(s => s.privado).length;
function pintarPriv(on){ document.body.classList.toggle("privado", on); bp.setAttribute("aria-checked", String(on)); avisoP.hidden = !on;
  avisoP.textContent = on ? (nPriv ? `Modo privacidad activo: ${nPriv} ${nPriv === 1 ? "pieza oculta" : "piezas ocultas"}; rutas y comandos difuminados.` : "Modo privacidad activo: rutas y comandos difuminados. No hay ninguna skill marcada como privada (ponle `visibilidad: privado` en su frontmatter para esconderla).") : ""; }
bp.addEventListener("click", () => { const on = bp.getAttribute("aria-checked") !== "true"; try { localStorage.setItem("privacidad-mapa-agentes", on ? "1" : "0"); } catch (e) {} pintarPriv(on); });
try { pintarPriv(localStorage.getItem("privacidad-mapa-agentes") === "1"); } catch (e) { pintarPriv(false); }
$("#fecha").textContent = D.generado;
// Aviso de ejemplo en cada pestaña (Marcos, 17-sep-2026): lo marcado como
// «ejemplo» viene con el mapa para que haya algo con lo que jugar; hay que
// verlo y que la propia pestaña lo diga.
{
  const nEjSk = D.skills.filter(s => s.ejemplo && !s.es_agente).length, nEjAg = D.skills.filter(s => s.ejemplo && s.es_agente).length;
  const nVirt = (D.ejemplos_cron || []).length, nDecl = (D.dicen || []).filter(x => (D.skills.find(s => s.nombre === x.skill) || {}).ejemplo).length;
  const aviso = t => `<p class="aviso-ejemplo"><span class="ej">ejemplo</span> ${t} Están para que veas cómo funcionaría y tengas algo con lo que jugar; cuando tengas los tuyos, sustituirán a estos (en Skills, el filtro «solo las mías» los quita).</p>`;
  if (nEjSk || nEjAg) {
    $("#v-skills").insertAdjacentHTML("afterbegin", aviso(`Las piezas marcadas «ejemplo» —${nEjSk} skills y ${nEjAg} agentes— vienen incluidas con el mapa; no las has creado tú.`));
    $("#v-grafo").insertAdjacentHTML("afterbegin", aviso(`Las entradas y salidas que ves son las de las ${nEjSk} skills de ejemplo incluidas con el mapa (más las tuyas, si las hay).`));
    $("#v-inferidos").insertAdjacentHTML("afterbegin", aviso(`Estas cadenas se infieren de las skills de ejemplo incluidas con el mapa (más las tuyas, si las hay).`));
  }
  if (nVirt || nDecl) $("#v-cal").insertAdjacentHTML("afterbegin", aviso(`Lo que lleva la marca «ejemplo» no existe en tu máquina: ${nVirt} tareas programadas de ejemplo (en gris discontinuo en el mes) y ${nDecl} horarios que las skills de ejemplo declaran en su texto. Lo que salga en color sí es tuyo: viene de tu cron, tus LaunchAgents o tus tareas programadas.`));
} $("#version").textContent = "versión " + (D.version || "1.0") + " · generado el " + D.generado;
const nEj = D.skills.filter(s => s.ejemplo).length;
$("#sub").textContent = D.skills.length ? `${D.skills.length - nEj} skills y agentes tuyos encontrados en ${[...new Set(D.skills.filter(s=>!s.ejemplo).map(s=>s.herramienta))].join(", ") || "esta carpeta"}${nEj ? `, más ${nEj} de ejemplo incluidos con el mapa (marcados «ejemplo»; usa el filtro «solo las mías» para quitarlos)` : ""}.` : "No he encontrado skills en los sitios habituales. Ejecuta con --raiz <carpeta> para rastrear otra carpeta.";
const nAv = D.skills.filter(s => (D.avisos[s.ruta]||[]).length).length;
$("#cifras").innerHTML = [[D.skills.filter(s=>!s.es_agente).length,"skills"],[D.skills.filter(s=>s.es_agente).length,"agentes"],[D.skills.filter(s => !s.es_agente && s.es && s.es.opaca).length,"skills opacas (sin entradas ni salidas)"],[D.tareas.length,"cosas que corren solas"],[nAv,"skills con avisos"]].map(([n,t])=>`<div class="cifra"><b>${n}</b><span>${t}</span></div>`).join("");
document.querySelectorAll(".pestanas button").forEach(b => b.addEventListener("click", () => {
  document.querySelectorAll(".pestanas button").forEach(x => x.setAttribute("aria-selected", x===b));
  ["skills","grafo","cal","flujos","inferidos","actores"].forEach(v => $("#v-"+v).hidden = v !== b.dataset.v);
  if (b.dataset.v === "actores") requestAnimationFrame(dibujarHilos);
}));
// Quién monta cada skill: si un AGENTE la llama de verdad, la usan agentes atómicos; si no, la usa el agente continuo (tú, al pedirla).
const montadaPor = {}; D.aristas.forEach(([a,b,fz]) => { const A = D.skills.find(x => x.nombre === a); if (fz === "llama" && A && A.es_agente) (montadaPor[b] = montadaPor[b] || new Set()).add(a); });
let fSk = "todos";
const FILTROS_SK = [
  ["todos", "todas", s => true],
  ["30", '<i class="sem ok"></i>tocadas en 30 días', s => s.dias <= 30],
  ["sin30", '<i class="sem aviso"></i>sin tocar 30 días', s => s.dias > 30],
  ["montada", '<i class="sem mal"></i>montada por un agente', s => !s.es_agente && !!montadaPor[s.nombre]],
  ["continuo", '<i class="sem gris"></i>agente continuo (nadie la monta)', s => !s.es_agente && !montadaPor[s.nombre]],
  ["agentes", "agentes", s => s.es_agente],
  ["avisos", "con avisos", s => (D.avisos[s.ruta]||[]).length > 0],
  ["mias", "solo las mías (sin ejemplos)", s => !s.ejemplo],
];
function pintarFiltrosSk(){
  $("#sk-filtros").innerHTML = FILTROS_SK.map(([k, etq, f]) => `<button type="button" class="sk-f" data-k="${k}" aria-pressed="${fSk===k}">${etq}<span>${D.skills.filter(f).length}</span></button>`).join("");
  $("#sk-filtros").querySelectorAll(".sk-f").forEach(b => b.addEventListener("click", () => { fSk = b.dataset.k; pintarFiltrosSk(); pintar(); }));
}
function pintar(){
  const q = ($("#q").value||"").toLowerCase();
  const filtro = FILTROS_SK.find(x => x[0] === fSk)[2];
  const filas = D.skills.filter(s => filtro(s) && (!q || (s.nombre+" "+s.descripcion).toLowerCase().includes(q))).sort((a,b)=> (D.avisos[b.ruta]||[]).length - (D.avisos[a.ruta]||[]).length || a.nombre.localeCompare(b.nombre));
  $("#tb").innerHTML = filas.map(s => { const av = D.avisos[s.ruta]||[]; const cl = av.length>=3?"mal":av.length?"aviso":"ok";
    return `<tr data-priv="${s.privado?1:0}"><td><span class="sem ${cl}"></span></td><td><span class="n">${s.nombre}</span>${s.es_agente?' <span class="d">(agente)</span>':''}${s.ejemplo?' <span class="ej" title="Skill de ejemplo incluida con el mapa: puedes borrarla o copiarla">ejemplo</span>':''}</td><td class="d">${s.herramienta}</td><td>${s.descripcion||'<span class="d">—</span>'}</td><td class="d">${s.es_agente ? '—' : (montadaPor[s.nombre] ? [...montadaPor[s.nombre]].sort().join(", ") : 'agente continuo')}</td><td class="d">${s.palabras} pal.</td><td class="d" title="Tokens que cuesta cargarla cada vez (≈ palabras × 1,3)">${Math.round(s.palabras * 1.3).toLocaleString("es-ES")}</td><td class="d">${s.modificado}</td><td><ul class="av">${av.map(a=>`<li>${a}</li>`).join("")}</ul></td></tr>`; }).join("") || `<tr><td colspan="9" class="d">Nada que coincida.</td></tr>`;
}
$("#q").addEventListener("input", pintar); pintarFiltrosSk(); pintar();
const esSkill = {}; D.skills.forEach(s => esSkill[s.nombre] = !s.es_agente);
const sale = {}, entra = {}, saleM = {}, entraM = {};
D.aristas.forEach(([a,b,fz]) => { if (!esSkill[a] || !esSkill[b]) return; if (fz === "llama") { (sale[a]=sale[a]||new Set()).add(b); (entra[b]=entra[b]||new Set()).add(a); } else { (saleM[a]=saleM[a]||new Set()).add(b); (entraM[b]=entraM[b]||new Set()).add(a); } });
function chips(set, setM, vacio){ const f = set && set.size ? [...set].sort().map(n => `<span class="chip" title="Llamada real: hay una instrucción de usar ${n}">${n}</span>`).join("") : "";
  const m = setM && setM.size ? [...setM].sort().filter(n => !(set && set.has(n))).map(n => `<span class="chip mencion" title="Solo la nombra: no hay instrucción de ejecutarla">${n}</span>`).join("") : "";
  return (f + m) || `<span class="chip nadie">${vacio}</span>`; }
const NIVEL = {declarado: ["decl", "Declarado: la ruta está escrita en la skill"], inferido: ["inf", "Inferido: hay un verbo de leer/escribir cerca"], supuesto: ["sup", "Supuesto: la skill no lo dice; se deduce por su tipo"]};
function chipsES(lst){ return lst.length ? lst.map(x => `<span class="chip ${NIVEL[x.nivel][0]}" title="${NIVEL[x.nivel][1]} — ${escT(x.por)}">${escT(x.que)}</span>`).join("") : `<span class="chip nadie">nada</span>`; }
function pintarRel(){
  const q = ($("#q-rel").value || "").toLowerCase();
  const lista = D.skills.filter(s => !s.es_agente && (!q || s.nombre.toLowerCase().includes(q) || (s.es.entradas.concat(s.es.salidas)).some(x => x.que.toLowerCase().includes(q))))
    .sort((a,b) => (b.es.opaca ? 0 : 1) - (a.es.opaca ? 0 : 1) || a.nombre.localeCompare(b.nombre));
  $("#grafo").innerHTML = lista.map(s => { const o = sale[s.nombre]||new Set(); const es = s.es;
    const nE = es.entradas.filter(x => x.nivel !== "supuesto").length, nS = es.salidas.filter(x => x.nivel !== "supuesto").length;
    return `<div class="rel${es.opaca?' opaca':''}" data-priv="${s.privado?1:0}">
      <div class="lado izq"><span class="etq">qué lee</span>${chipsES(es.entradas)}</div><div class="conector${nE?' on':''}"></div>
      <div class="centro"><b>${s.nombre}${s.ejemplo?' <span class="ej">ejemplo</span>':''}</b><span>${s.descripcion || 'sin descripción'}</span>${es.herramientas.length?`<span class="herr">usa: ${es.herramientas.join(", ")}</span>`:''}<span class="cnt">${es.opaca ? 'caja opaca: no declara qué lee ni qué produce' : nE + ' entrada' + (nE===1?'':'s') + ' y ' + nS + ' salida' + (nS===1?'':'s') + ' con base en el texto'}</span></div>
      <div class="conector${nS?' on':''}"></div><div class="lado der"><span class="etq">qué produce · dónde</span>${chipsES(es.salidas)}</div>
      ${o.size ? `<div class="usa">llama a: <b>${[...o].sort().join("</b>, <b>")}</b></div>` : ''}</div>`; }).join("") || `<p class="d">Nada que coincida.</p>`;
}
$("#q-rel").addEventListener("input", pintarRel); pintarRel();
$("#cal").innerHTML = (D.tareas.map(t => `<div class="nodo"><b>${t.cuando}</b><div class="d">${t.fuente}</div><div class="n">${t.que}</div></div>`).join("") || `<div class="hueco"><b>Nada programado</b>Ninguna skill corre sola en esta máquina. Todo lo que hacen tus agentes empieza cuando tú lo pides.</div>`)
  + D.dicen.map(x => `<div class="nodo huerfana"><b>${x.skill}</b><div class="d">dice «${x.dice}», pero nadie la lanza</div></div>`).join("");
// Los territorios del Cerebro Digital (7 notas tipo + la máquina), con el nombre que se enseña y para qué sirve cada uno.
const TERR = [["000","Mantenimiento","La máquina que mantiene el sistema: vigilar, archivar, limpiar, avisar. No es contenido de tu cerebro; es lo que lo mantiene vivo."],
 ["001","Recursos externos","Todo lo que capturas de fuera antes de procesarlo: artículos, vídeos, libros, ideas, notas de voz, lo que te mandan. Responde a «¿dónde lo dejo? ¿dónde estaba aquello?»."],
 ["010","Visión","Hacia dónde vas y por qué: visión, objetivos, lo que quieres que pase. Responde a «¿por qué hago esto? ¿para qué?»."],
 ["020","Proyectos","La ejecución: proyectos, tareas, lo que estás haciendo ahora. Responde a «¿cómo lo hago? ¿qué toca hoy?»."],
 ["050","Activos","Lo que construyes y te queda: el negocio, el canal, los productos, la casa, las herramientas. Responde a «¿con qué cuento? ¿qué tengo montado?»."],
 ["200","Conocimiento","Lo que sabes, ya procesado y enlazado: tus notas de conocimiento por temas. Responde a «¿qué sé sobre esto? ¿qué aprendí?»."],
 ["400","Sabiduría","Tus modelos mentales, principios y criterios: cómo decides. Responde a «¿quién soy? ¿cómo pienso? ¿con qué criterio?»."],
 ["900","Tiempo","Cómo empleas el tiempo: el diario, los cierres del día, lo que pasó y cuándo. Responde a «¿cuándo fue? ¿qué hice ese día?»."]];
function terrDe(sirve){ const v = String(sirve || "").trim(); if (!v) return null; if (v.toLowerCase() === "mantenimiento") return "000"; const m = v.match(/^(\d{3})/); if (m) return m[1] === "011" ? "020" : m[1]; return "050"; }
function nombreTerr(n){ const t = TERR.find(x => x[0] === n); return t ? t[1] : n; }
let fDest = "todos";
function tarjetaFlujo(f, fantasma){
  const cls = f.estado === "funcionando" ? "ok" : "est-av";
  const inf = f.estado === "inferido";
  const pasos = (f.director ? [`<div class="paso dir"><b>${f.director}</b><span>director: reparte, espera, junta</span></div><div class="fl">→</div>`] : [])
    .concat(f.pasos.map((p, i) => `${i ? '<div class="fl">→</div>' : ''}<div class="paso${p.falta ? ' falta' : ''}"><b>${p.perfil}${p.falta ? ' (por construir)' : ''}</b>${p.nota ? `<span>${p.nota}</span>` : ''}</div>`));
  return `<article class="flujo t${terrDe(f.sirve_a) || '000'}${fantasma ? ' fantasma' : ''}${inf ? ' inferido' : ''}" data-dest="${terrDe(f.sirve_a) || ''}" data-nombre="${escT(f.nombre)}"><h4>${f.nombre}${(f.pasos || []).some(p => (D.skills.find(s => s.nombre === p.perfil) || {}).ejemplo) ? ' <span class="ej">ejemplo</span>' : ''}</h4><p class="desc">${f.resumen || ''}</p>
    <div class="meta"><span class="${cls}">${f.estado || 'sin estado'}</span>${f.programada ? `<span>programada: ${f.programada}</span>` : '<span>lo lanzas tú</span>'}<span>${f.pasos.length} ${f.pasos.length === 1 ? 'paso' : 'pasos'}</span>${f.sirve_a ? `<span title="${(TERR.find(x=>x[0]===terrDe(f.sirve_a))||[])[2]||''}">entrega a ${nombreTerr(terrDe(f.sirve_a))}${terrDe(f.sirve_a)==='050' && f.sirve_a.toLowerCase()!=='mantenimiento' ? ' · ' + f.sirve_a : ''}</span>` : ''}</div>
    <div class="cadena">${pasos.join("")}</div></article>`;
}
/* Calendario: clon del mapa de arquitectura del autor. Reales en color; virtuales en gris discontinuo. */
const PALETA = ["#B4642E","#3D6296","#2F7D4F","#8B3A62","#8A6A1F","#2C7A75","#6B4E96","#4E6B73"];
const colorDe = (() => { const m = {}; let i = 0; return n => (n in m ? m[n] : (m[n] = PALETA[i++ % PALETA.length])); })();
const DIAS = {"lunes":1,"martes":2,"miércoles":3,"jueves":4,"viernes":5,"sábado":6,"domingo":0};
const PROGS = D.tareas.filter(t => t.cada && t.cada !== "otro").map(t => ({nombre: t.nombre || t.que.slice(0, 30), cada: t.cada, dia: t.dia, hora: t.hora, quien: t.fuente, que: t.que, virtual: false, declarada: false}))
  .concat(D.dicen.filter(x => x.cada && x.cada !== "otro").map(x => ({nombre: x.skill, cada: x.cada, dia: x.dia, hora: x.hora, quien: "declarada en la skill", ej: !!(D.skills.find(s => s.nombre === x.skill) || {}).ejemplo, que: `La skill dice «${x.dice}»${x.hora ? '' : ' (sin hora: se pinta al final del día)'}; nadie la lanza desde cron o launchd, que se sepa. ` + (x.que || ''), virtual: false, declarada: true})))
  .concat(D.ejemplos_cron.filter(e => !D.tareas.some(t => (t.nombre||"").includes(e.nombre)) && !D.dicen.some(x => x.skill === e.nombre || x.skill === e.quien)).map(e => ({...e, virtual: true, declarada: false})));
PROGS.forEach(p => colorDe(p.virtual ? "ejemplo" : p.quien));
let calAno, calMes;
const hoyStr = (() => { const d = new Date(); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); })();
const fechaStr = (a, m, d) => a + "-" + String(m + 1).padStart(2, "0") + "-" + String(d).padStart(2, "0");
function tocaEse(p, a, m, d){ if (p.cada === "dia") return true; const dow = new Date(a, m, d).getDay(); if (p.cada === "semana") return DIAS[p.dia] === dow; if (p.cada === "mes") return String(d) === String(parseInt(p.dia, 10)); return false; }
const DIAS_NOMBRE = {1: "lunes", 2: "martes", 3: "miércoles", 4: "jueves", 5: "viernes", 6: "sábado", 0: "domingo"};
/* Las tres cajas de arriba: todo lo programado junto, por cadencia. */
function pintarResumenCal(){
  const caja = $("#cal-resumen"); if (!caja || caja.dataset.ok) return; caja.dataset.ok = "1";
  const cuando = p => p.cada === "semana" ? (p.dia ? "cada " + p.dia : "cada semana") : p.cada === "mes" ? (p.dia ? "el día " + p.dia : "cada mes") : "";
  const fila = p => `<li class="${p.virtual ? "virtual" : ""}" data-globo="${escT((p.hora || "??:??") + " · " + p.nombre + " · " + p.quien + "\n" + (p.que || "") + (p.virtual ? "\n(ejemplo: así se vería)" : ""))}" tabindex="0"><span class="h">${escT(p.hora || "—")}</span><span class="n">${escT(p.nombre)}${p.cada !== "dia" ? ` <span class="q">${escT(cuando(p))}</span>` : ""}${(p.virtual || p.ej) ? '<span class="ej">ejemplo</span>' : ""}</span></li>`;
  const grupo = (et, cada) => { const xs = PROGS.filter(p => p.cada === cada).sort((x, y) => (x.virtual - y.virtual) || (x.hora || "99").localeCompare(y.hora || "99"));
    return `<div class="cal-caja"><h4><b>${xs.filter(x => !x.virtual).length}</b>${et}</h4>${xs.length ? `<ul>${xs.map(fila).join("")}</ul>` : `<p class="nada">ninguna</p>`}</div>`; };
  caja.innerHTML = grupo("diarias", "dia") + grupo("semanales", "semana") + grupo("mensuales", "mes");
}
function pintarCalendario(){
  pintarResumenCal();
  if (calAno === undefined) { const d = new Date(); calAno = d.getFullYear(); calMes = d.getMonth(); }
  $("#cal-mes").textContent = new Date(calAno, calMes, 1).toLocaleDateString("es-ES", {month: "long", year: "numeric"});
  const desplaz = (new Date(calAno, calMes, 1).getDay() + 6) % 7, nDias = new Date(calAno, calMes + 1, 0).getDate(), celdas = [];
  for (let i = 0; i < desplaz; i++) celdas.push('<div class="cal-dia fuera" aria-hidden="true"></div>');
  for (let d = 1; d <= nDias; d++) {
    const f = fechaStr(calAno, calMes, d), puntos = [];
    PROGS.forEach(p => { if (!tocaEse(p, calAno, calMes, d)) return;
      const c = colorDe(p.virtual ? "ejemplo" : p.quien);
      const tip = (p.hora || "??:??") + " · " + p.nombre + " → " + (p.virtual ? p.quien + " (agente atómico)" : p.quien) + "\n" + (p.virtual ? "CRON VIRTUAL DE EJEMPLO: no existe en tu ordenador. Así se vería si lo tuvieras." : "real en esta máquina") + (p.que ? "\n\n" + p.que : "");
      puntos.push({hora: p.hora || "99:99", html: `<span class="arranque"><span class="punto${p.virtual ? ' virtual' : ''}${p.declarada ? ' declarada' : ''}" style="--c:${c}" tabindex="0" role="button" aria-label="${escT(tip)}" data-globo="${escT(tip)}"></span><span class="hora">${p.hora || ''}</span></span>`}); });
    puntos.sort((x, y) => x.hora.localeCompare(y.hora));
    celdas.push(`<div class="cal-dia${f === hoyStr ? " hoy" : ""}"><span class="num">${d}</span><div class="cal-puntos">${puntos.map(x => x.html).join("")}</div></div>`);
  }
  $("#cal-rejilla").innerHTML = celdas.join("");
  const realesP = PROGS.filter(p => !p.virtual), virt = PROGS.filter(p => p.virtual);
  const porQuien = {}; realesP.forEach(p => { (porQuien[p.quien] = porQuien[p.quien] || []).push(p); });
  $("#cal-leyenda").innerHTML = Object.keys(porQuien).sort().map(q => `<span><i class="punto" style="--c:${colorDe(q)}"></i>${q} <small>· ${porQuien[q].map(p => p.nombre).join(", ")}</small></span>`).join("")
    + (realesP.some(p => p.declarada) ? `<span><i class="punto declarada" style="--c:${colorDe("declarada en la skill")}"></i>declarada dentro de la skill (nadie la lanza)</span>` : "")
    + (virt.length ? `<span><i class="punto virtual" style="--c:${colorDe("ejemplo")}"></i>crones virtuales de ejemplo (no existen): ${virt.map(p => p.nombre).join(", ")}</span>` : "");
  const av = $("#aviso-virtual"); av.hidden = !virt.length;
  av.innerHTML = realesP.length ? `Los puntos discontinuos son <b>ejemplos</b>: agentes del autor que arrancan solos de madrugada. No existen en tu máquina; están para que veas cómo sería.` : `<b>En esta máquina no arranca nada solo.</b> Los puntos discontinuos son ejemplos del sistema del autor: cada uno es un agente que trabaja de madrugada y deja un resultado listo por la mañana. No existen aquí; están para que veas cómo sería.`;
}
$("#cal-prev").addEventListener("click", () => { calMes--; if (calMes < 0) { calMes = 11; calAno--; } pintarCalendario(); });
$("#cal-next").addEventListener("click", () => { calMes++; if (calMes > 11) { calMes = 0; calAno++; } pintarCalendario(); });
$("#cal-hoy").addEventListener("click", () => { calAno = undefined; pintarCalendario(); });
pintarCalendario();
{ const globo = $("#globo");
  const mostrar = el => { const txt = el.dataset.globo; if (!txt) return; const ln = txt.split("\n");
    globo.innerHTML = `<b>${escT(ln[0])}</b>` + (ln.length > 1 ? "\n" + ln.slice(1).map(escT).join("\n") : ""); globo.classList.add("visible");
    const r = el.getBoundingClientRect(), g = globo.getBoundingClientRect(); let x = Math.max(8, Math.min(r.left + r.width / 2 - g.width / 2, window.innerWidth - g.width - 8)); let y = r.top - g.height - 10, abajo = false; if (y < 8) { y = r.bottom + 10; abajo = true; }
    globo.style.left = x + "px"; globo.style.top = y + "px"; globo.style.setProperty("--flecha", (r.left + r.width / 2 - x) + "px"); globo.classList.toggle("abajo", abajo); };
  const ocultar = () => globo.classList.remove("visible");
  document.addEventListener("mouseover", e => { const el = e.target.closest("[data-globo]"); if (el) mostrar(el); });
  document.addEventListener("mouseout", e => { if (e.target.closest("[data-globo]")) ocultar(); });
  document.addEventListener("focusin", e => { const el = e.target.closest("[data-globo]"); if (el) mostrar(el); });
  document.addEventListener("focusout", e => { if (e.target.closest("[data-globo]")) ocultar(); });
  window.addEventListener("scroll", ocultar, {passive: true}); }
// La figura del flujo de ejemplo se dibuja a partir de D.flujo_ejemplo (datos dummy
// del script): quien quiera otra figura cambia los datos, no el HTML.
function figuraFlujo(F){
  const ET = {ext: "lee de fuera", her: "hereda del paso anterior", cd: "lee de tu cerebro"};
  const caja = (cls, et, txt) => `<div class="caja ${cls}"><span class="et">${et}</span>${escT(txt)}</div>`;
  const paso = (p, i) => `<div class="paso"><span class="num">${i + 1}</span><header><span class="nom">${escT(p.perfil)}</span><span class="chapa obr">obrero</span></header><span class="sk">${escT(p.skill)}</span>${(p.lee || []).map(([c, t]) => caja(c, ET[c] || c, t)).join("")}<div class="hace">${escT(p.hace)}</div>${caja("deja", "deja en", p.deja)}</div>`;
  return `<div class="fig">
  <div class="fig-cab"><h3><span class="ej">ejemplo</span> Un flujo de agentes atómicos: «${escT(F.nombre)}»</h3><span class="cuando">⚡ programada <b>${escT(F.cuando)}</b> · ${F.pasos.length} obreros en cadena · ${escT(F.duracion)}</span></div>
  <div class="centro"><div class="director"><span class="chapa dir">director</span><div><div class="nom">${escT(F.director.nombre)}</div><div class="que">${escT(F.director.que)}</div></div></div></div>
  <div class="baja">una tarjeta por paso, en orden; cada obrero lee lo que dejó el anterior</div>
  <div class="pasos">${F.pasos.map(paso).join("")}</div>
  <div class="leyenda"><span><i class="dir"></i>perfil director — encadena, no trabaja</span><span><i class="obr"></i>perfil obrero — trabaja y cierra</span><span><i></i>lee de tu cerebro digital</span><span><i class="her"></i>hereda del paso anterior</span><span><i class="ext"></i>fuente externa</span><span><i class="deja"></i>lo que deja (y lee el siguiente)</span></div>
</div>`;
}
const p = D.sistema;
const reales = D.flujos && D.flujos.length;
const inferidos = D.inferidos || [];
const lista = reales ? D.flujos : D.ejemplos;   // los inferidos tienen su propia pestaña («Flujos trabajo skills»)
let fEst = null;
const ESTADOS_FL = [
  ["construido", "construidos", "Todos sus pasos existen: se puede lanzar hoy", f => f.estado === "funcionando" || f.estado === "sin probar"],
  ["pendiente", "pendientes", "Enunciados, pero les falta al menos una pieza por construir", f => f.estado === "falta una pieza" || f.estado === "en construccion" || (f.pasos||[]).some(p => p.falta)],
];
function cuentaDest(n){ return lista.filter(f => (n === "todos" || terrDe(f.sirve_a) === n) && (!fEst || ESTADOS_FL.find(e => e[0] === fEst)[3](f))).length; }
function botonesDestino(){
  return `<div class="cifras-fl" id="cifras-fl"><span class="etq">Flujos de trabajo</span><button type="button" class="cifra-fl total" data-k="" aria-pressed="${!fEst}" title="Quitar el filtro de estado"><b>${lista.length}</b>${lista.length === 1 ? "flujo en total" : "flujos en total"}</button>` +
    ESTADOS_FL.map(([k, et, ti, f]) => `<button type="button" class="cifra-fl" data-k="${k}" aria-pressed="${fEst===k}" title="${ti}"><b>${lista.filter(f).length}</b>${et}</button>`).join("") + `</div>` +
    `<div class="destinos" id="destinos"><span class="etq">Destino</span><button type="button" data-d="todos" aria-pressed="${fDest==='todos'}">Todos<span>${cuentaDest("todos")}</span></button>` +
    TERR.filter(t => t[0] !== "000").concat(TERR.filter(t => t[0] === "000")).map(t => `<button type="button" class="terr t${t[0]}" data-d="${t[0]}" title="${t[2]}" aria-pressed="${fDest===t[0]}">${t[1]}<span>${cuentaDest(t[0])}</span></button>`).join("") + `</div>`;
}
function aplicarFlujos(){
  document.querySelectorAll("#lista-flujos .flujo, .lista-inf .flujo").forEach(a => { const f = lista.find(x => x.nombre === a.dataset.nombre) || {}; a.hidden = (fDest !== "todos" && a.dataset.dest !== fDest) || (fEst && !ESTADOS_FL.find(e => e[0] === fEst)[3](f)); });
  document.querySelectorAll("#destinos button").forEach(x => { x.setAttribute("aria-pressed", x.dataset.d === fDest); x.querySelector("span").textContent = cuentaDest(x.dataset.d); });
  document.querySelectorAll("#cifras-fl .cifra-fl").forEach(x => x.setAttribute("aria-pressed", (x.dataset.k || null) === fEst));
}
$("#v-inferidos").innerHTML = inferidos.length ? `<h2>Flujos posibles, inferidos de tus skills (${inferidos.length})</h2><p class="sub">Nadie los ha declarado: son cadenas que salen de cruzar lo que cada skill dice que lee y que escribe, y de las llamadas reales entre ellas. Cada paso explica el enlace. Si una cadena te parece un flujo de verdad, ya sabes cuál es el siguiente paso: declararla con contratos para que corra sola.</p><div class="lista-flujos lista-inf">${inferidos.map(f => tarjetaFlujo(f, false)).join("")}</div>` : `<h2>Flujos inferidos de tus skills: ninguno</h2><p class="sub">El mapa deduce flujos cruzando lo que cada skill dice que lee y que escribe. Tus skills no declaran ni lo uno ni lo otro, así que no hay nada que encadenar. Es lo primero que se arregla: una línea de «lee de» y otra de «deja en» por skill.</p>`;
$("#v-flujos").insertAdjacentHTML("afterbegin", reales
  ? `<h2>Tus flujos de trabajo (${lista.length})</h2><p class="sub">Salen de tu <code>flujos.yml</code>: agentes atómicos con contratos que dicen qué leen y qué dejan. Los que el mapa <b>infiere</b> de tus skills, sin que nadie los declare, están en la pestaña <b>Flujos trabajo skills</b>.</p>${botonesDestino()}<div class="lista-flujos" id="lista-flujos">${D.flujos.map(f => tarjetaFlujo(f, false)).join("")}</div>`
  : `<h2>Agentes atómicos en esta carpeta: ninguno</h2><p class="sub">No hay perfiles con contratos (qué leen, qué dejan, a quién sirven), así que <b>nada corre solo todavía</b>: todo lo que hacen tus agentes pasa por ti, en la conversación.${inferidos.length ? ` Tus skills sí se pueden encadenar: mira la pestaña <b>Flujos trabajo skills</b> (${inferidos.length} cadenas posibles).` : ""} Abajo te dejo un ejemplo <b>fake</b>, para que te hagas una idea de cómo funciona un sistema de agentes atómicos y a qué se parece cuando exista. Esto lo explicamos en el club <b>CD+IA</b> (tienes el enlace en la descripción del vídeo de YouTube), y puedes saber más suscribiéndote a la newsletter de CD+IA: <a href="https://emowe.com/regalo-cdia" target="_blank" rel="noopener">emowe.com/regalo-cdia</a>.</p>${D.flujo_ejemplo ? figuraFlujo(D.flujo_ejemplo) : ""}<h2>Y las cuatro piezas que lo hacen posible</h2>`);
if ($("#destinos")) $("#destinos").addEventListener("click", e => { const b = e.target.closest("button"); if (!b) return; fDest = b.dataset.d; aplicarFlujos(); });
if ($("#cifras-fl")) $("#cifras-fl").addEventListener("click", e => { const b = e.target.closest("button"); if (!b) return; fEst = (b.dataset.k && b.dataset.k !== fEst) ? b.dataset.k : null; aplicarFlujos(); });
/* ── Actores: el plano de lo que hay alrededor de tus agentes ─────────── */
{
  const A = D.actores || {}, esc = escT;
  const capas = $("#plano-capas"), svg = $("#plano-hilos"), plano = $("#plano");
  const chip = (t, cls = "", g = "") => `<li class="${cls}"${g ? ` data-globo="${esc(g)}" tabindex="0"` : ""}>${t}</li>`;
  const nodo = (id, cls, titulo, sub, chapa, cuerpo, span = 3) => `<article class="actor ${cls}" id="ac-${id}" style="grid-column:span ${span}"><header><h4>${titulo}${sub ? `<small>${sub}</small>` : ""}</h4>${chapa || ""}</header>${cuerpo}</article>`;
  const CH = {res: '<span class="chapa-act res">residente</span>', rel: '<span class="chapa-act reloj">reloj</span>', efi: '<span class="chapa-act efi">efímero</span>', conv: '<span class="chapa-act conv">conversa</span>', falta: '<span class="chapa-act falta">falta</span>'};
  const AR = A.arneses || [], CA = A.canales || [], NT = A.notas || [], TF = A.tareas_por_fuente || {};
  const nTareas = Object.values(TF).reduce((a, b) => a + b, 0);
  const capa = (et, html) => `<div class="capa"><span class="capa-et">${et}</span>${html}</div>`;
  // Quien manda: tú, y el reloj si algo corre solo.
  const tu = nodo("tu", "persona", "Tú", "quien manda: pides, revisas, decides", "", `<ul class="dato">${chip("⌨ terminal")}${CA.map(c => chip(esc(c.nombre), "", c.via)).join("")}</ul>`, nTareas ? 7 : 12);
  const reloj = nTareas ? nodo("reloj", "persona", "Lo programado", `${nTareas} ${nTareas === 1 ? "tarea" : "tareas"} · ${Object.entries(TF).map(([k, v]) => `${k} ${v}`).join(" · ")}`, CH.rel, `<ul class="dato">${(D.tareas || []).slice(0, 8).map(t => chip(`${esc(t.nombre)}${t.hora ? " · " + esc(t.hora) : ""}`, "", `${t.fuente}: ${t.cuando}\n${t.que}`)).join("")}${(D.tareas || []).length > 8 ? chip(`+${D.tareas.length - 8} más (pestaña Calendario)`) : ""}</ul>`, 5) : "";
  // Conversan: un agente continuo por herramienta encontrada.
  const spanAr = AR.length ? Math.max(3, Math.floor(12 / AR.length)) : 12;
  const continuos = AR.length ? AR.map(a => nodo("arnes-" + a.binario, "continuo", esc(a.nombre), `${a.instalado ? "instalado" : "config sin binario"}${a.memoria.length ? " · " + a.memoria.map(esc).join(", ") : ""}`, CH.conv,
    `<ul class="dato">${chip(`<b>${a.skills}</b> skills`, "", "Skills de esta herramienta encontradas en esta máquina (pestaña Skills).")}${a.agentes ? chip(`<b>${a.agentes}</b> agentes`, "", "Perfiles o subagentes: piezas que pueden trabajar por tarjeta, no solo en conversación.") : ""}${a.memoria.length ? chip("instrucciones propias", "ok", "Tiene un fichero de instrucciones (" + a.memoria.join(", ") + "): sabe cómo trabajas antes de que se lo digas.") : chip("sin fichero de instrucciones", "no", "Ningún " + (a.binario === "claude" ? "CLAUDE.md" : a.binario === "gemini" ? "GEMINI.md" : "AGENTS.md") + " encontrado: cada sesión empieza de cero.")}${a.binario === "claude" && A.mcp ? chip(`<b>${A.mcp}</b> MCP`, "", "Servidores MCP declarados: herramientas externas conectadas al agente.") : ""}</ul>`, spanAr)).join("")
    : nodo("arnes-ninguno", "continuo falta", "Ningún agente encontrado", "ni Claude Code, ni Codex, ni Gemini CLI, ni Hermes", CH.falta, `<p>No hay ningún binario ni carpeta de configuración de un agente de terminal. Todo lo que hagas con IA hoy pasa por una web y no deja rastro aquí.</p>`, 12);
  // El tablero y el reparto: si hay sistema de agentes atómicos, se dibuja; si no, la caja gris dice qué falta.
  const tablero = A.tablero ? nodo("tablero", "tablero", "El tablero", "tarjetas: pendientes → en curso → hechas" + (A.programadas ? " · programadas ⚡" : ""), "", `<p>Cada encargo es una tarjeta; el que la atiende deja Registro. Es lo único que pasa de un agente a otro.</p>`, 12)
    : nodo("tablero", "tablero falta", "Sin tablero", "todo se pide y se revisa en la conversación", CH.falta, `<p>No hay tarjetas ni columnas: lo que pides vive en el chat y se borra con él. Un tablero es lo que permite que un agente trabaje sin que estés delante y que otro lo revise después.</p>`, 12);
  const lanzador = A.lanzador ? nodo("lanzador", "base", "El lanzador", "reparte las tarjetas", CH.res, `<p>Un proceso residente mira el tablero, elige quién atiende cada tarjeta y levanta al obrero.</p>`, 4)
    : nodo("lanzador", "base falta", "Sin lanzador", "nadie reparte", CH.falta, `<p>Sin lanzador, nada arranca solo: eres tú el que abre la sesión y pide. Es la pieza que convierte tareas programadas en trabajo hecho.</p>`, 4);
  const obreros = A.agentes ? nodo("obreros", "base", "Obreros", `${A.agentes} ${A.agentes === 1 ? "perfil" : "perfiles"} · uno por tarjeta`, CH.efi, `<p>Agentes que nacen con un perfil y una tarjeta, hacen lo que dice el perfil y mueren. Sin conversación.</p>`, 4)
    : nodo("obreros", "base falta", "Sin obreros", "solo el agente que conversa", CH.falta, `<p>No hay perfiles ni subagentes: el único que trabaja es el que habla contigo, y solo mientras hablas.</p>`, 4);
  const vigilante = A.vigilante ? nodo("vigilante", "base", "El vigilante", "mira que todo siga vivo", CH.res, `<p>Un proceso independiente comprueba que el agente y el lanzador siguen vivos, y avisa si no.</p>`, 4)
    : nodo("vigilante", "base falta", "Sin vigilante", "nadie avisa si algo se rompe", CH.falta, `<p>Cuando un agente se cuelga o una programada deja de salir, te enteras cuando lo echas de menos.</p>`, 4);
  const planificador = nTareas ? nodo("planificador", "base", "Planificador del sistema", Object.keys(TF).map(esc).join(" · "), "", `<p>Lo único que late fuera del agente: dispara los relojes y resucita a los residentes.</p><ul class="dato">${Object.entries(TF).map(([k, v]) => chip(`<b>${v}</b> ${esc(k)}`)).join("")}</ul>`, 4)
    : nodo("planificador", "base falta", "Nada corre solo", "ni cron, ni launchd, ni tareas programadas", CH.falta, `<p>No hay ninguna tarea del sistema operativo que llame a tus agentes. Sin esto, trabajan solo mientras tecleas.</p>`, 4);
  const hooks = (A.hooks || A.hooks_sh) ? nodo("hooks", "base", "Candados · hooks", `${A.hooks} en settings${A.hooks_sh ? ` · ${A.hooks_sh} scripts` : ""}`, "", `<p>Interceptan cada herramienta del agente antes de ejecutarse: lo que no debe leer, borrar o publicar, no lo hace.</p>`, 4)
    : nodo("hooks", "base falta", "Sin candados", "ningún hook configurado", CH.falta, `<p>El agente puede leer y escribir cualquier cosa a la que llegue: claves, notas privadas, ficheros que no debe tocar. Un hook es un «no» que no depende de que el modelo se acuerde.</p>`, 4);
  // La ventana de contexto del agente con el que hablas: lo que carga al arrancar
  // (sus ficheros de instrucciones, medidos) y lo que le pasa cuando se llena.
  const palIns = AR.reduce((n, a) => n + (a.memoria_palabras || 0), 0);
  const contexto = nodo("contexto", "contexto", "Ventana de contexto", "la memoria de trabajo del agente con el que hablas · se carga al arrancar, se llena con el día y se compacta", "",
    `<ul class="dato">${AR.length ? chip(`<b>${palIns.toLocaleString("es-ES")}</b> palabras de instrucciones al arrancar`, palIns ? "" : "no", palIns ? "Lo que tus ficheros de instrucciones (CLAUDE.md, AGENTS.md, GEMINI.md, SOUL.md…) cargan en cada arranque, antes de que digas nada." : "Ningún fichero de instrucciones: cada sesión empieza de cero y todo lo que sabe de ti se lo tienes que contar cada vez.") : chip("sin agente, sin ventana", "no")}${chip("cuando se llena, se compacta", "no", "El agente resume lo de atrás para hacer sitio a lo de delante: las instrucciones concretas se convierten en una frase que ya no manda nada. Por eso los flujos que viven dentro de la conversación se degradan.")}${chip("un agente atómico nace con la suya", "", "Pequeña y limpia: un perfil y una tarjeta. Por eso hace lo mismo dentro de tres meses.")}</ul>`, 12);
  // Las siete notas tipo del Cerebro Digital, siempre y en el mismo formato que el
  // mapa del autor: con color las que existen en la carpeta, en gris discontinuo
  // las que faltan (así la fila es a la vez inventario y hoja de ruta).
  const NOTAS_TIPO = [["001", "Recursos externos"], ["010", "Visión"], ["020", "Proyectos"], ["050", "Activos"], ["200", "Conocimiento"], ["400", "Sabiduría"], ["900", "Tiempo"]];
  const tieneNT = Object.fromEntries(NT.map(t => [t.num, t]));
  const suelo = nodo("suelo", "vault", "Tu carpeta · Cerebro Digital", esc(A.carpeta || "") + " · donde todos escriben y ninguno manda", "",
    `<ul class="dato">${NOTAS_TIPO.map(([n, nom]) => tieneNT[n] ? chip(esc(nom), `terr t${n}`, `${tieneNT[n].carpeta}: existe en tu carpeta.`) : chip(esc(nom), `terr t${n} falta-nt`, `No hay carpeta «${n} …» en tu carpeta. Es una de las siete notas tipo del Cerebro Digital; el mapa la enseña para que veas el hueco.`)).join("")}${(A.sistema_dirs || []).map(d => chip(`<b>${esc(d)}</b> agentes`, "", "Carpeta del sistema de agentes: skills, perfiles, tablero, hooks.")).join("")}${chip(`<b>${A.skills}</b> skills · <b>${A.agentes}</b> agentes tuyos en esta carpeta`, "", "Lo que el rastreo encontró dentro de la carpeta (pestaña Skills), sin contar los de ejemplo. Las skills de la propia herramienta (~/.claude, ~/.codex…) se cuentan en su caja de arriba.")}${(D.skills.filter(x => x.ejemplo).length) ? chip(`+ <b>${D.skills.filter(x => x.ejemplo && !x.es_agente).length}</b> skills y <b>${D.skills.filter(x => x.ejemplo && x.es_agente).length}</b> agentes <span class="ej">ejemplo</span>`, "", "Incluidos con el mapa para que tengas algo con lo que jugar.") : ""}${!NT.length ? chip("ninguna de las siete todavía", "no", "No hay carpetas numeradas por nota tipo (001, 010, 020, 050, 200, 400, 900): el agente trabaja sobre una carpeta sin estructura que le diga dónde va cada cosa.") : ""}</ul>`, 12);
  capas.innerHTML = capa("quien manda", tu + reloj) + capa("conversan", continuos) + capa("el tablero", tablero) + capa("el reparto", vigilante + lanzador + obreros) + capa("la base", hooks + planificador + nodo("nota", "base", "Lo que no se mira", "por diseño", "", `<p>Este mapa no lee claves, ni mensajes, ni el contenido de tus notas: solo qué ficheros y binarios existen.</p>`, 4)) + capa("la memoria de trabajo", contexto) + capa("el suelo", suelo);
  const primer = AR.length ? "arnes-" + AR[0].binario : "arnes-ninguno";
  const HILOS = [["tu", primer, "conversación"], ...(nTareas ? [["reloj", "tablero", A.tablero ? "materializa" : "", "", "der", 20]] : []),
    [primer, "tablero", A.tablero ? "deja tarjetas" : "", A.tablero ? "" : "falta"], ["tablero", "lanzador", A.lanzador ? "reclama · despacha" : "", A.lanzador ? "" : "falta"],
    ["lanzador", "obreros", A.agentes ? "levanta" : "", A.agentes ? "" : "falta"], ["obreros", "tablero", A.agentes && A.tablero ? "cierran" : "", A.agentes && A.tablero ? "" : "falta"],
    ["planificador", "lanzador", nTareas ? "KeepAlive" : "", "vig"], ["vigilante", primer, A.vigilante ? "levanta la sesión" : "", "vig", "izq", 20],
    ["hooks", primer, (A.hooks || A.hooks_sh) ? "candado" : "", "candado", "izq", 40], ["obreros", "suelo", A.agentes ? "escriben" : "", "", "der", 40], [primer, "contexto", "se carga al arrancar", "", "izq", 60], ["contexto", "suelo", "lee y escribe"]];
  function dibujarHilos(){
    if ($("#v-actores").hidden) return;
    const P = plano.getBoundingClientRect(), W = plano.clientWidth, H = plano.clientHeight;
    svg.setAttribute("viewBox", `0 0 ${W} ${H}`); svg.setAttribute("width", W); svg.setAttribute("height", H);
    const rect = id => { const el = document.getElementById("ac-" + id); if (!el) return null; const r = el.getBoundingClientRect(); return {left: r.left - P.left, right: r.right - P.left, top: r.top - P.top, bottom: r.bottom - P.top, cx: (r.left + r.right) / 2 - P.left, cy: (r.top + r.bottom) / 2 - P.top}; };
    const clamp = (v, a, b) => Math.max(a, Math.min(b, v)), ancla = (r, x) => { const ins = Math.min(60, (r.right - r.left) / 4); return clamp(x, r.left + ins, r.right - ins); };
    const estrecho = matchMedia("(max-width:760px)").matches, mi = parseFloat(getComputedStyle(plano).paddingLeft), md = parseFloat(getComputedStyle(plano).paddingRight);
    let out = `<defs><marker id="fl" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="currentColor"/></marker><marker id="fl-c" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="#B0473A"/></marker></defs>`;
    const vistosH = {};
    HILOS.forEach(([de, a, rot, cls = "", ruta = "", sep]) => {
      const s = rect(de), t = rect(a); if (!s || !t) return; if (estrecho && ruta) return;
      let d = "", lx = 0, ly = 0, rotar = false, anchor = "middle";
      if (ruta) { const izq = ruta === "izq", X = izq ? mi - sep : W - md + sep, y1 = s.cy, y2 = t.cy, sg = Math.sign(y2 - y1) || 1, x1 = izq ? s.left : s.right, x2 = izq ? t.left : t.right, k = izq ? 8 : -8;
        d = `M${x1} ${y1}L${X + k} ${y1}Q${X} ${y1} ${X} ${y1 + sg * 8}L${X} ${y2 - sg * 8}Q${X} ${y2} ${X + k} ${y2}L${x2} ${y2}`; lx = X; ly = (y1 + y2) / 2; rotar = true; }
      else if (t.top >= s.bottom - 1) { const sx = ancla(s, t.cx), tx = ancla(t, sx), my = (s.bottom + t.top) / 2; d = `M${sx} ${s.bottom}C${sx} ${my} ${tx} ${my} ${tx} ${t.top}`; lx = (sx + tx) / 2 + (sx === tx ? 7 : 0); ly = my + 3; anchor = sx === tx ? "start" : "middle"; }
      else if (s.top >= t.bottom - 1) { const sx = ancla(s, t.cx), tx = ancla(t, sx), my = (s.top + t.bottom) / 2; d = `M${sx} ${s.top}C${sx} ${my} ${tx} ${my} ${tx} ${t.bottom}`; lx = (sx + tx) / 2 + (sx === tx ? 7 : 0); ly = my + 3; anchor = sx === tx ? "start" : "middle"; }
      else { const n = (vistosH[de] = (vistosH[de] || 0) + 1), dy = (n - 1) * 16 - 8, der = t.left >= s.right, x1 = der ? s.right : s.left, x2 = der ? t.left : t.right, y = clamp(s.cy + dy, Math.max(s.top, t.top) + 14, Math.min(s.bottom, t.bottom) - 14), mx = (x1 + x2) / 2; d = `M${x1} ${y}C${mx} ${y} ${mx} ${y} ${x2} ${y}`; lx = mx; ly = y - 4; if (Math.abs(x2 - x1) < 50) rot = ""; }
      const m = cls === "candado" ? "fl-c" : "fl";
      out += `<path d="${d}" class="${cls}" marker-end="url(#${m})"/>`;
      if (rot) out += `<text x="${lx}" y="${ly}" text-anchor="${anchor}" class="${cls}"${rotar ? ` transform="rotate(-90 ${lx} ${ly})" dy="${ruta === "izq" ? -4 : 10}"` : ""}>${esc(rot)}</text>`;
    });
    svg.innerHTML = out;
  }
  let tmr; addEventListener("resize", () => { clearTimeout(tmr); tmr = setTimeout(dibujarHilos, 120); });
  window.dibujarHilos = dibujarHilos; requestAnimationFrame(dibujarHilos);
}
const cajas = [["Flujos de trabajo", p.flujos, "Skills encadenadas con un resultado que aparece solo (un informe, un correo, una nota en su sitio). Hoy: cada skill es una isla."],
 ["Tablero", p.tablero, "Un sitio donde se ve qué está pendiente, qué está en marcha y qué terminó, y quién lo hizo. Hoy: la conversación es el único registro, y se borra."],
 ["Agentes que trabajan solos", p.programadas, "Agentes que arrancan de madrugada, hacen una cosa y terminan, sin que estés delante. Hoy: solo trabajan mientras tú tecleas."],
 ["Quién avisa cuando algo se rompe", p.vigilante, "Un vigilante que detecta que un agente se colgó o que una skill dejó de funcionar, y te lo dice. Hoy: te enteras cuando lo echas de menos."]];
$("#flujos").innerHTML = cajas.map(([t,ok,d]) => `<div class="hueco${ok?' lleno':''}"><b>${ok?'✓ ':''}${t}</b>${ok?'Detectado en esta máquina.':d}</div>`).join("") + (cajas.every(c=>c[1])?'':`<div class="hueco" style="grid-column:1/-1"><b>Lo que ves en gris es la diferencia entre tener skills y tener un sistema.</b>Las skills las tienes. Lo que falta es lo que hace que trabajen juntas sin ti: es lo que se enseña en el Club Cerebro Digital + IA (__ENLACE__).</div>`);
</script></body></html>""".replace("__DATOS__", j).replace("__ENLACE__", datos.get("enlace", "enlace pendiente"))


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--raiz", default=None, help="carpeta que rastrear (por defecto, la carpeta desde la que se ejecuta)")
    ap.add_argument("--salida", default=None); ap.add_argument("--json", action="store_true")
    ap.add_argument("--sin-maquina", action="store_true", help="no mirar la máquina (cron, launchd, arneses, hooks del usuario): solo la carpeta. Para generar la muestra que se distribuye")
    ap.add_argument("--enlace", default="https://emowe.com/regalo-cdia", help="enlace de la caja «lo que falta» (la newsletter de CD+IA)")
    a = ap.parse_args()
    enc = {}
    for herramienta, raices in RAICES.items():
        rastrear(raices, herramienta, enc)
    raiz = Path(a.raiz).expanduser() if a.raiz else Path.cwd()   # cada uno lo ejecuta en SU carpeta: esa es la que se dibuja
    rastrear([raiz], "carpeta propia", enc)
    skills = sorted(enc.values(), key=lambda s: s["nombre"].lower())
    aristas = relaciones(skills)
    avisos = semaforo(skills, aristas)
    tareas = [] if a.sin_maquina else cron_y_launchd()
    dicen = programadas_en_texto(skills)
    sistema = detectar_sistema(raiz)
    flujos = leer_flujos_yml(raiz)
    sistema["flujos"] = bool(flujos)
    actores = detectar_actores(raiz, skills, tareas, sistema, solo_carpeta=a.sin_maquina)
    for s in skills:
        s["es"] = entradas_salidas(s)
    inferidos = inferir_flujos(skills, aristas)
    for s in skills:
        s.pop("texto", None); s.pop("texto_orig", None)
    # Rutas relativas en el HTML: a la carpeta dibujada si están dentro, a «~» si
    # están en la casa del usuario. Un mapa que se comparte no debe llevar el
    # nombre de usuario ni la ruta del disco de quien lo generó.
    def _corta(r):
        for base, pre in ((str(raiz), ""), (str(CASA), "~")):
            if r.startswith(base + os.sep) or r == base:
                resto = r[len(base):].replace(os.sep, "/").lstrip("/")
                return (pre + "/" + resto) if pre else resto
        return r
    for s in skills:
        nueva = _corta(s["ruta"])
        if nueva != s["ruta"]:
            avisos[nueva] = avisos.pop(s["ruta"], [])
            s["ruta"] = nueva
    datos = {"version": VERSION, "generado": dt.datetime.now().strftime("%Y-%m-%d %H:%M"), "skills": skills, "aristas": aristas, "avisos": avisos, "tareas": tareas, "dicen": dicen, "sistema": sistema, "flujos": flujos, "inferidos": inferidos, "actores": actores, "flujo_ejemplo": FLUJO_EJEMPLO, "ejemplos": EJEMPLOS_FLUJOS, "ejemplos_cron": EJEMPLOS_CRON, "enlace": a.enlace}
    salida = Path(a.salida) if a.salida else Path.cwd() / f"Mapa de mis agentes v{VERSION}.html"
    salida.write_text(construir_html(datos), encoding="utf-8")
    if a.json:
        salida.with_suffix(".json").write_text(json.dumps(datos, ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"✓ {salida}  ·  {len(skills)} skills/agentes · {len(aristas)} llamadas · {len(tareas)} programadas · {sum(1 for s in skills if avisos[s['ruta']])} con avisos")
    print("  Ábrelo con doble clic (o arrástralo al navegador). No se ha enviado nada a ningún sitio.")


if __name__ == "__main__":
    main()
