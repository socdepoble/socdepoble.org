#!/usr/bin/env python3
"""
Inspector Diari de Frescor Editorial i Coherència Viva — Node 0 (Sóc de Poble)
==============================================================================
Servei d'observabilitat 100% READ-ONLY que corre cada matí (07:30) al Mac mini M4
del Node 0 (La Torre de les Maçanes, L'Alacantí) a cost 0,00 € d'API.

Compara:
  1. Els serveis i dimonis realment vius al Mac mini M4 (launchctl, Ollama, Matxa-TTS, Postgres 17).
  2. Les últimes fites publicades a /versions (i al Llibre Mestre si s'indica --repo).
  3. El contingut explicatiu real de /page/node-zero, /page/fediversity, /fedivers,
     /projecte, /anima, /consola i les pàgines de la Wiki (maquina.md, agents_equip_ia.md,
     perfil_minim_allotjament_node_municipal.md), tant en local (--repo) com en la web
     pública desplegada (https://socdepoble.org).

Consulta dues escoles locals d'Ollama (qwen2.5-coder:14b + iaia-maria:latest) i emet:
  - informes/aammdd_hhmm_informe_frescor_editorial_node0.md
  - ultim_informe_frescor.json

Garantia de seguretat: MAI modifica cap fitxer del repositori ni executa escriptures remotes.
"""

from __future__ import annotations

import argparse
import datetime as dt
import html
import json
import os
import re
import subprocess
import sys
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

BASE_DIR = Path(os.path.dirname(os.path.abspath(__file__)))
DEFAULT_OUT_DIR = BASE_DIR / "informes"
OLLAMA_URL = os.environ.get("OLLAMA_URL", "http://127.0.0.1:11434")
LIVE_WEB_URL = os.environ.get("SDP_LIVE_URL", "https://socdepoble.org")
VEU_HEALTH_URL = os.environ.get(
    "SDP_VEU_URL", "https://socdepoble.cat/api/v1/node0/veu"
)
HEADERS = {"User-Agent": "SocDePoble-Node0-FrescorEditorial/1.0 (+https://socdepoble.org)"}

FORBIDDEN_BRANDS_RE = re.compile(
    r"\b(Mercadona|Hacendado|Bosque\s+Verde|Deliplus|Compy)\b", re.IGNORECASE
)
BAD_TORRE_COMARCA_RE = re.compile(
    r"La Torre de les Maçanes\s*\(\s*L['’]Alcoià\s*\)", re.IGNORECASE
)
WAVE_RE = re.compile(r"\bOnada\s+R(\d{1,2})\b", re.IGNORECASE)


def strip_html(raw: str) -> str:
    txt = re.sub(r"<[^>]+>", " ", raw or "")
    txt = html.unescape(txt)
    return re.sub(r"\s+", " ", txt).strip()


def http_get_text(url: str, timeout: int = 15) -> str:
    req = urllib.request.Request(url, headers=HEADERS)
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        return resp.read().decode("utf-8", errors="replace")


def inspect_node0_runtime() -> dict:
    """Inspecciona en mode lectura els serveis locals del Mac mini M4."""
    info = {
        "ollama_ok": False,
        "escoles_ollama": [],
        "daemons_socdepoble": [],
        "veu_endpoint_ok": False,
    }
    try:
        raw_tags = http_get_text(f"{OLLAMA_URL}/api/tags", timeout=6)
        parsed = json.loads(raw_tags)
        info["ollama_ok"] = True
        info["escoles_ollama"] = [
            m.get("name", "") for m in parsed.get("models", []) if m.get("name")
        ]
    except Exception as exc:
        info["ollama_error"] = str(exc)

    try:
        proc = subprocess.run(
            ["launchctl", "list"],
            capture_output=True,
            text=True,
            timeout=6,
            check=False,
        )
        daemons = []
        for line in proc.stdout.splitlines():
            if "socdepoble" in line:
                parts = line.split()
                if len(parts) >= 3:
                    daemons.append(
                        {"pid": parts[0], "exit_status": parts[1], "label": parts[2]}
                    )
        info["daemons_socdepoble"] = daemons
    except Exception as exc:
        info["launchctl_error"] = str(exc)

    # Probe Matxa-TTS endpoint gently (OPTIONS / HEAD / tiny GET status if available)
    try:
        req = urllib.request.Request(VEU_HEALTH_URL, method="OPTIONS", headers=HEADERS)
        with urllib.request.urlopen(req, timeout=8) as resp:
            info["veu_endpoint_ok"] = resp.status < 500
    except urllib.error.HTTPError as http_err:
        # 405 Method Not Allowed or 400 Bad Request proves the FastAPI server is alive behind Caddy
        info["veu_endpoint_ok"] = http_err.code in (200, 204, 400, 405, 422)
        info["veu_http_code"] = http_err.code
    except Exception as exc:
        info["veu_error"] = str(exc)

    return info


def extract_sources_from_repo(repo_root: Path) -> dict:
    """Llig directament els fitxers font del repositori (mode --repo)."""
    sources = {"mode": "repo_local", "arrel": str(repo_root), "seccions": {}}
    files_map = {
        "pageContent_r10": repo_root / "src/sections/text/pageContent.r10.js",
        "pageContent_base": repo_root / "src/sections/text/pageContent.js",
        "wiki_maquina": repo_root / "_wiki_de_poble/02_saber/maquina.md",
        "wiki_agents": repo_root / "_wiki_de_poble/01_ser/agents_equip_ia.md",
        "wiki_node_municipal": (
            repo_root
            / "_wiki_de_poble/02_saber/architecture/perfil_minim_allotjament_node_municipal.md"
        ),
        "llibre_mestre": (
            repo_root / "_wiki_de_poble/04_escriptori/03_llibre_mestre_tasques_i_idees.md"
        ),
    }
    for key, path in files_map.items():
        if path.exists():
            sources["seccions"][key] = path.read_text(encoding="utf-8", errors="replace")
    return sources


def extract_sources_from_live_web(base_url: str, max_chunks: int = 180) -> dict:
    """Llig en mode read-only els chunks públics servits a https://socdepoble.org sense silenciar errors 404."""
    sources = {
        "mode": "web_publica",
        "url": base_url,
        "seccions": {},
        "chunk_errors": [],
        "chunks_descoberts": 0,
        "chunks_llegits": 0,
        "truncat_per_limit": False,
    }
    try:
        index_html = http_get_text(base_url, timeout=15)
        sources["seccions"]["index_html"] = index_html
        asset_paths = re.findall(r'/(?:assets|static|trossos)/[^"\'\s>]+\.js', index_html)
        seen = set()
        combined_chunks = []
        queue = list(asset_paths)
        while queue and len(seen) < max_chunks:
            rel = queue.pop(0)
            if rel in seen:
                continue
            seen.add(rel)
            full_url = urllib.parse.urljoin(base_url, rel)
            try:
                js_txt = http_get_text(full_url, timeout=15)
                sources["chunks_llegits"] += 1
            except Exception as exc:
                sources["chunk_errors"].append({"chunk": rel, "error": str(exc)})
                continue
            for sub in re.findall(r'["\']((?:assets|static|trossos)/[^"\']+?\.js)["\']', js_txt):
                sub_rel = "/" + sub.lstrip("/")
                if sub_rel not in seen and sub_rel not in queue:
                    queue.append(sub_rel)
            if any(
                marker in js_txt
                for marker in (
                    "node-zero",
                    "Matxa-TTS",
                    "Mac mini M4",
                    "Versions del Sistema",
                    "wikiManifest",
                    "fediversity",
                    "projecte",
                    "descarregues",
                )
            ):
                combined_chunks.append(f"/* CHUNK {rel} */\n" + js_txt)
        sources["chunks_descoberts"] = len(seen) + len(queue)
        sources["truncat_per_limit"] = len(queue) > 0
        sources["seccions"]["live_js_corpus"] = "\n".join(combined_chunks)
    except Exception as exc:
        sources["error"] = str(exc)
    return sources


def evaluate_freshness_heuristics(runtime: dict, sources: dict) -> dict:
    """Avalua de forma determinista el desfasament editorial i les regles d'or."""
    seccions = sources.get("seccions", {})
    corpus_all = "\n".join(seccions.values())

    # Highest wave mentioned in /versions or corpus
    waves_found = sorted({int(m) for m in WAVE_RE.findall(corpus_all) if int(m) <= 60})
    max_wave = f"R{waves_found[-1]}" if waves_found else "desconeguda"

    # Focus specifically on node-zero + wiki maquina if repo_local, else live_js_corpus
    if sources.get("mode") == "repo_local":
        r10 = seccions.get("pageContent_r10", "")
        base = seccions.get("pageContent_base", "")
        maquina = seccions.get("wiki_maquina", "")
        # Extract NODE_ZERO blocks
        nz_text = ""
        m_nz = re.search(r"const NODE_ZERO_R23\s*=\s*\{.*?\};", r10, re.DOTALL)
        if m_nz:
            nz_text += m_nz.group(0)
        m_base_nz = re.search(r'"node-zero"\s*:\s*\{.*?\n  \},', base, re.DOTALL)
        if m_base_nz:
            nz_text += "\n" + m_base_nz.group(0)
        editorial_focus = nz_text + "\n" + maquina
    else:
        editorial_focus = seccions.get("live_js_corpus", "")

    checks = []

    def add_check(code: str, ok: bool, detail: str):
        checks.append({"codi": code, "estat": "VERD" if ok else "ALERTA", "detall": detail})

    # 1. Matxa-TTS v2 documented if veu_endpoint_ok or cat.socdepoble.veu-node0 active
    veu_live = runtime.get("veu_endpoint_ok") or any(
        "veu-node0" in d.get("label", "") for d in runtime.get("daemons_socdepoble", [])
    )
    has_matxa = "Matxa-TTS" in editorial_focus
    add_check(
        "FRESCOR-VEU-NODE0",
        (not veu_live) or has_matxa,
        "Matxa-TTS v2 i endpoint /api/v1/node0/veu explicats a /page/node-zero i Wiki."
        if has_matxa
        else "El servei veu-node0 està viu al Mac mini M4 però NO apareix explicat al focus editorial de /page/node-zero.",
    )

    # 2. Verified F0 voices documented
    has_voices = all(v in editorial_focus for v in ("Gina", "Berta", "Arnau", "Lluc"))
    add_check(
        "FRESCOR-VEUS-F0",
        has_voices,
        "Veus verificades per F0 (Gina, Berta, Arnau, Lluc) citades amb precisió."
        if has_voices
        else "Falten els noms verificats per F0 (Gina, Berta, Arnau, Lluc) a la documentació pública del Node 0.",
    )

    # 3. Comarca La Torre de les Maçanes = L'Alacantí
    bad_comarca = bool(BAD_TORRE_COMARCA_RE.search(corpus_all))
    has_alacanti = ("L'Alacantí" in editorial_focus) or ("L’Alacantí" in editorial_focus)
    add_check(
        "TOPONIMIA-ALACANTI",
        (not bad_comarca) and has_alacanti,
        "La Torre de les Maçanes situada correctament a L'Alacantí."
        if ((not bad_comarca) and has_alacanti)
        else "Alerta toponímica: reviseu que La Torre de les Maçanes conste a L'Alacantí i mai per error a L'Alcoià.",
    )

    # 4. IDEA-258 Zero big-supermarket brands
    brand_match = FORBIDDEN_BRANDS_RE.search(editorial_focus)
    add_check(
        "IDEA-258-ZERO-MARQUES",
        brand_match is None,
        "Cap marca de gran superfície detectada al focus editorial."
        if brand_match is None
        else f"Detectada marca comercial a substituir per producte genèric de poble: {brand_match.group(0)}",
    )

    # 5. Inspector cron documented
    has_cron_doc = "frescor-editorial" in corpus_all
    add_check(
        "FRESCOR-CRON-DOCUMENTAT",
        has_cron_doc,
        "El dimoni diari org.socdepoble.node0.frescor-editorial consta documentat públicament."
        if has_cron_doc
        else "El dimoni org.socdepoble.node0.frescor-editorial encara no consta a la documentació desplegada.",
    )

    # 6. Zero errors de descàrrega de chunks i transparència de cobertura en mode web_publica (Llei 0)
    if sources.get("mode") == "web_publica":
        chunk_errs = sources.get("chunk_errors", [])
        truncat = bool(sources.get("truncat_per_limit"))
        llegits = sources.get("chunks_llegits", 0)
        descoberts = sources.get("chunks_descoberts", 0)
        ok_chunks = (len(chunk_errs) == 0) and (not truncat) and (not sources.get("error"))
        add_check(
            "CHUNKS-WEB-COBERTURA",
            ok_chunks,
            f"Cobertura web completa: {llegits}/{descoberts} chunks JS llegits amb 0 errors 404."
            if ok_chunks
            else f"Cobertura web incompleta o amb errors ({llegits}/{descoberts} llegits, {len(chunk_errs)} errors, truncat={truncat}).",
        )

    alerts = [c for c in checks if c["estat"] != "VERD"]
    return {
        "ultima_onada_detectada": max_wave,
        "total_checks": len(checks),
        "total_alertes": len(alerts),
        "estat_global": "FRESC" if len(alerts) == 0 else "DESFASAMENT_DETECTAT",
        "checks": checks,
        "extracte_focus": strip_html(editorial_focus)[:3600],
    }


def ask_ollama(model: str, prompt: str) -> str:
    payload = json.dumps(
        {
            "model": model,
            "prompt": prompt,
            "stream": False,
            "think": False,
            "keep_alive": 0,
            "options": {"temperature": 0.15, "num_predict": 450, "num_ctx": 8192},
        }
    ).encode("utf-8")
    req = urllib.request.Request(
        f"{OLLAMA_URL}/api/generate",
        data=payload,
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=120) as resp:
        data = json.loads(resp.read().decode("utf-8", errors="replace"))
        txt = data.get("response", "").strip()
        cleaned = re.sub(r"<think>.*?</think>", "", txt, flags=re.DOTALL).strip()
        return cleaned or re.sub(r"</?think>", "", txt).strip()


def run_ollama_deliberation(runtime: dict, eval_res: dict) -> dict:
    if not runtime.get("ollama_ok"):
        return {"actiu": False, "motiu": "Ollama no disponible en aquest instant."}

    installed = set(runtime.get("escoles_ollama", []))
    chosen = [
        m for m in ("qwen2.5-coder:14b", "iaia-maria:latest") if m in installed
    ]
    if not chosen and installed:
        chosen = [ sorted(installed)[0] ]

    summary_json = json.dumps(
        {
            "estat_global": eval_res["estat_global"],
            "ultima_onada_detectada": eval_res["ultima_onada_detectada"],
            "daemons_node0": [d["label"] for d in runtime.get("daemons_socdepoble", [])],
            "escoles_ollama": runtime.get("escoles_ollama", []),
            "checks": eval_res["checks"],
            "mostra_text_node_zero": eval_res["extracte_focus"][:1600],
        },
        ensure_ascii=False,
        indent=2,
    )

    opinions = {}
    for model in chosen:
        prompt = (
            f"Ets l'inspector matinal de frescor editorial ({model}) al Mac mini M4 del Node 0 "
            "de Sóc de Poble (La Torre de les Maçanes, L'Alacantí). "
            "En màxim 110 paraules i en valencià planer (dient 'de poble', mai 'sobirà/sobirana'), "
            "resumeix si la documentació pública (/page/node-zero i Wiki) està alineada amb "
            "els serveis reals del Node 0, i si hi ha cap alerta indica quina pàgina cal actualitzar:\n\n"
            f"{summary_json}"
        )
        try:
            opinions[model] = ask_ollama(model, prompt)
        except Exception as exc:
            opinions[model] = f"No s'ha pogut completar la consulta local: {exc}"

    return {"actiu": True, "opinions": opinions}


def render_markdown_report(now: dt.datetime, runtime: dict, sources: dict, eval_res: dict, ia_res: dict) -> str:
    ts_human = now.strftime("%Y-%m-%d %H:%M:%S %Z").strip()
    lines = [
        "# Informe Matinal de Frescor Editorial — Node 0",
        "",
        f"- **Data d'inspecció**: `{ts_human}`",
        f"- **Mode de lectura**: `{sources.get('mode')}` (`{sources.get('arrel') or sources.get('url')}`)",
        f"- **Estat global**: **`{eval_res['estat_global']}`** (`{eval_res['total_alertes']}` alertes de `{eval_res['total_checks']}` controls)",
        f"- **Última onada detectada**: `{eval_res['ultima_onada_detectada']}`",
        f"- **Endpoint de veu Matxa-TTS (`/api/v1/node0/veu`)**: `{'OPERATIU' if runtime.get('veu_endpoint_ok') else 'NO VERIFICAT'}`",
        f"- **Escoles locals disponibles a Ollama**: `{len(runtime.get('escoles_ollama', []))}`",
        "",
        "## 1. Controls Deterministes de Coherència Viva",
        "",
        "| Codi | Estat | Detall |",
        "| :--- | :--- | :--- |",
    ]
    for c in eval_res["checks"]:
        lines.append(f"| `{c['codi']}` | **{c['estat']}** | {c['detall']} |")

    lines.extend(
        [
            "",
            "## 2. Dimonis Actius de Sóc de Poble al Mac mini M4 (`launchctl`)",
            "",
        ]
    )
    daemons = runtime.get("daemons_socdepoble", [])
    if daemons:
        for d in daemons:
            lines.append(
                f"- `{d['label']}` — PID: `{d['pid']}` · últim codi d'eixida: `{d['exit_status']}`"
            )
    else:
        lines.append("- *(Executat fora del host macOS del Node 0 o sense dimonis visibles)*")

    lines.extend(
        [
            "",
            "## 3. Dictamen de les Escoles Locals d'Ollama (0,00 € API)",
            "",
        ]
    )
    if ia_res.get("actiu") and ia_res.get("opinions"):
        for model, text in ia_res["opinions"].items():
            lines.append(f"### `{model}`")
            lines.append("")
            lines.append(text)
            lines.append("")
    else:
        lines.append(f"- {ia_res.get('motiu', 'Sense consulta a Ollama.')}")
        lines.append("")

    return "\n".join(lines)


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Inspector read-only de frescor editorial del Node 0 (Sóc de Poble)."
    )
    parser.add_argument(
        "--repo",
        type=str,
        default=os.environ.get("SDP_REPO_ROOT", ""),
        help="Camí opcional al repositori local socdepoble.org (mode pre-deploy).",
    )
    parser.add_argument(
        "--url",
        type=str,
        default=LIVE_WEB_URL,
        help="URL pública a inspeccionar quan no es passa --repo.",
    )
    parser.add_argument(
        "--out-dir",
        type=str,
        default=str(DEFAULT_OUT_DIR),
        help="Directori d'eixida on escriure l'informe datat i ultim_informe_frescor.json.",
    )
    parser.add_argument(
        "--once",
        action="store_true",
        help="Executa una passada immediata i ix amb codi 0.",
    )
    parser.add_argument(
        "--no-ollama",
        action="store_true",
        help="Omet la deliberació amb Ollama (útil per a tests ràpids).",
    )
    args = parser.parse_args()

    now = dt.datetime.now().astimezone()
    out_dir = Path(args.out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)

    runtime = inspect_node0_runtime()
    if args.repo and Path(args.repo).exists():
        sources = extract_sources_from_repo(Path(args.repo))
    else:
        sources = extract_sources_from_live_web(args.url)

    eval_res = evaluate_freshness_heuristics(runtime, sources)
    ia_res = (
        {"actiu": False, "motiu": "Omés per bandera --no-ollama."}
        if args.no_ollama
        else run_ollama_deliberation(runtime, eval_res)
    )

    stamp = now.strftime("%y%m%d_%H%M")
    md_filename = f"{stamp}_informe_frescor_editorial_node0.md"
    md_path = out_dir / md_filename
    md_content = render_markdown_report(now, runtime, sources, eval_res, ia_res)
    md_path.write_text(md_content, encoding="utf-8")

    latest_payload = {
        "generat_el": now.isoformat(),
        "informe_markdown": str(md_path),
        "mode": sources.get("mode"),
        "estat_global": eval_res["estat_global"],
        "ultima_onada_detectada": eval_res["ultima_onada_detectada"],
        "total_alertes": eval_res["total_alertes"],
        "checks": eval_res["checks"],
        "runtime_node0": {
            "ollama_ok": runtime.get("ollama_ok"),
            "veu_endpoint_ok": runtime.get("veu_endpoint_ok"),
            "daemons": [d["label"] for d in runtime.get("daemons_socdepoble", [])],
        },
        "dictamen_ollama": ia_res.get("opinions", {}),
    }
    json_path = out_dir.parent / "ultim_informe_frescor.json"
    json_path.write_text(
        json.dumps(latest_payload, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    print(f"[frescor-editorial] {eval_res['estat_global']} -> {md_path}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
