#!/usr/bin/env python3
"""Comprova o regenera el mirall Markdown de `.agents` dins d'Obsidian.

`.agents` és sempre la font. El mirall és una vista generada i prescindible.
Per defecte no escriu res; `--write` fa escriptures atòmiques. `--prune` no
esborra sobrants: els mou a una paperera recuperable.
"""

from __future__ import annotations

import argparse
import hashlib
import os
import shutil
import sys
from datetime import datetime, timezone
from pathlib import Path


HEADER = """---
estat: generat
tipus: document
description: Vista generada des de {source}; no editar.
source: {source}
source_sha256: {digest}
---

> [!warning] FITXER GENERAT
> Font canònica: `{source}`. Qualsevol edició manual serà sobreescrita.

"""


def digest_bytes(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def project_path(root: Path, value: str) -> Path:
    candidate = (root / value).resolve()
    try:
        candidate.relative_to(root)
    except ValueError as error:
        raise ValueError(f"Ruta fora del projecte: {value}") from error
    return candidate


def atomic_write(path: Path, data: bytes) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = path.with_name(f".{path.name}.{os.getpid()}.tmp")
    temporary.write_bytes(data)
    os.replace(temporary, path)


def strip_frontmatter(text: str) -> str:
    if not text.startswith("---\n"):
        return text
    closing = text.find("\n---\n", 4)
    return text[closing + 5:] if closing >= 0 else text


def source_mapping(root: Path, source_dir: str, mirror_dir: str) -> dict[Path, bytes]:
    source_root = project_path(root, source_dir)
    mirror_root = project_path(root, mirror_dir)
    if not source_root.is_dir():
        raise ValueError(f"No existeix la font: {source_root}")
    if mirror_root.is_relative_to(source_root):
        raise ValueError("El mirall no pot estar dins de la font .agents")
    if source_root.is_relative_to(mirror_root):
        raise ValueError("La font .agents no pot estar dins del mirall")
    result: dict[Path, bytes] = {}
    sources = [*source_root.glob("*.md")]
    if (source_root / "identity").is_dir():
        sources.extend((source_root / "identity").glob("*.md"))
    sources.extend(source_root.glob("skills/*/SKILL.md"))
    index_destination = mirror_root / "00_INDEX_MIRROR.md"
    index_content = "---\nestat: generat\ntipus: document\ndescription: Índex automàtic de les fonts canòniques d'agents i skills.\n---\n\n# Fonts Canòniques d'Agents i Skills (.agents/)\n\nAquest índex conté les rutes en text pla cap als fitxers canònics. Cap IA ha de llegir contingut redundat a la Wiki.\n\n"
    
    for source in sorted(set(sources)):
        if source.is_symlink():
            raise ValueError(f"No s'admeten symlinks en la font: {source}")
        
        # Ruta relativa per escriure a l'índex (ex. .agents/skills/core-context-panic/SKILL.md)
        source_name = f"{source_dir.rstrip('/')}/{source.relative_to(source_root).as_posix()}"
        index_content += f"- `{source_name}`\n"
        
    result[index_destination] = index_content.encode("utf-8")
    return result



def run(args: argparse.Namespace) -> int:
    root = args.root.resolve()
    expected = source_mapping(root, args.source, args.mirror)
    mirror_root = project_path(root, args.mirror)
    existing = set(mirror_root.rglob("*.md")) if mirror_root.is_dir() else set()
    changed = [path for path, data in expected.items() if not path.is_file() or path.read_bytes() != data]
    stale = sorted(existing - set(expected))

    for path in changed:
        print(f"CHANGE {path.relative_to(root)}")
    for path in stale:
        print(f"STALE  {path.relative_to(root)}")

    if not args.write:
        if changed or stale:
            print("Mirall divergent. Executa amb --write per regenerar.", file=sys.stderr)
            return 1
        print(f"Mirall correcte: {len(expected)} fitxers.")
        return 0

    for path in changed:
        atomic_write(path, expected[path])
    if args.prune and stale:
        stamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
        trash_root = project_path(root, args.trash) / stamp / "mirror-stale"
        for path in stale:
            relative = path.relative_to(mirror_root)
            destination = trash_root / relative
            destination.parent.mkdir(parents=True, exist_ok=True)
            if destination.exists():
                raise FileExistsError(f"Col·lisió en paperera: {destination}")
            shutil.move(str(path), str(destination))
    print(f"Mirall regenerat: {len(changed)} canvis; {len(stale) if args.prune else 0} sobrants apartats.")
    if stale and not args.prune:
        print("Queden fitxers sobrants; revisa'ls i torna a executar amb --write --prune.", file=sys.stderr)
        return 1
    return 0


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("root", type=Path, help="Arrel del projecte")
    parser.add_argument("--source", default=".agents", help="Font canònica relativa")
    parser.add_argument(
        "--mirror",
        default="_wiki_de_poble/01_Ser/00_AGENTS_I_SKILLS_MIRROR",
        help="Directori de vista generada",
    )
    parser.add_argument("--write", action="store_true", help="Aplica la regeneració")
    parser.add_argument("--prune", action="store_true", help="Aparta sobrants quan s'usa --write")
    parser.add_argument("--trash", default=".brain-trash", help="Paperera relativa al projecte")
    try:
        return run(parser.parse_args())
    except (OSError, UnicodeError, ValueError) as error:
        print(f"sync_agent_mirror: {error}", file=sys.stderr)
        return 2


if __name__ == "__main__":
    raise SystemExit(main())
