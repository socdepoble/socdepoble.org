#!/usr/bin/env python3
"""IDEA-278: diagnòstic amb descriptors, mai rm -rf ni symlink-follow.
La supressió queda bloquejada: descriptors no garantixen frontera davant rename concurrent.
Invocat pel motor Node. No executa instal·ladors ni utilitats del sistema.
"""
import json
import os
import re
import stat
import sys
import time

ROOTS = {"npm_cache": ".npm/_cacache", "puppeteer_cache": ".cache/puppeteer", "uv_cache": ".cache/uv"}
RESERVED = re.compile(r"^(CON|PRN|AUX|NUL|COM[1-9¹²³]|LPT[1-9¹²³])(?:\..*)?$", re.I)
SACRED = {".git", ".env", "esborranys", "drafts", "claus-e2ee"}
MAX_ENTRIES = 100000
MAX_DEPTH = 64

def component(name):
    if not name or name in (".", "..") or any(c in name for c in ":<>|?*") or "\\" in name or "/" in name or name.endswith((".", " ")) or RESERVED.fullmatch(name) or any(ord(c) < 32 for c in name):
        raise ValueError("COMPONENT_NO_PORTABLE")
    if name.lower() in SACRED or name.lower().endswith(".sdpbackup"):
        raise ValueError("DADA_SAGRADA")

def same(a, b):
    return (a.st_dev, a.st_ino, a.st_mode, a.st_size, a.st_mtime_ns) == (b.st_dev, b.st_ino, b.st_mode, b.st_size, b.st_mtime_ns)

def open_directory(parent, name):
    component(name)
    before = os.stat(name, dir_fd=parent, follow_symlinks=False)
    if not stat.S_ISDIR(before.st_mode):
        raise ValueError("DIRECTORI_NO_REGULAR")
    fd = os.open(name, os.O_RDONLY | os.O_DIRECTORY | os.O_NOFOLLOW, dir_fd=parent)
    after = os.fstat(fd)
    if (before.st_dev, before.st_ino) != (after.st_dev, after.st_ino):
        os.close(fd)
        raise ValueError("DIRECTORI_CANVIAT")
    return fd

def open_absolute(value):
    if not isinstance(value, str) or not value.startswith("/") or os.path.normpath(value) != value:
        raise ValueError("ARREL_INVALIDA")
    fd = os.open("/", os.O_RDONLY | os.O_DIRECTORY | os.O_NOFOLLOW)
    try:
        for name in value.split("/")[1:]:
            nxt = open_directory(fd, name)
            os.close(fd)
            fd = nxt
        return fd
    except BaseException:
        os.close(fd)
        raise

def inspect(fd, device, budget, depth=0):
    if depth > MAX_DEPTH or time.monotonic() > budget[1]:
        raise ValueError("LIMIT_EXPLORACIO")
    items = []
    for name in sorted(os.listdir(fd)):
        component(name)
        budget[0] += 1
        if budget[0] > MAX_ENTRIES:
            raise ValueError("LIMIT_ENTRADES")
        info = os.stat(name, dir_fd=fd, follow_symlinks=False)
        if info.st_uid != os.getuid() or info.st_dev != device or info.st_mode & 0o022:
            raise ValueError("PROPIETAT_O_VOLUM_NO_SEGUR")
        if stat.S_ISLNK(info.st_mode):
            raise ValueError("SYMLINK_PROHIBIT")
        if stat.S_ISDIR(info.st_mode):
            child = open_directory(fd, name)
            try:
                children = inspect(child, device, budget, depth + 1)
            finally:
                os.close(child)
            items.append((name, info, children))
        elif stat.S_ISREG(info.st_mode) and info.st_nlink == 1:
            # No lectura de contingut: O_NOFOLLOW confirma el full sense seguir-lo.
            leaf = os.open(name, os.O_RDONLY | os.O_NOFOLLOW | os.O_NONBLOCK, dir_fd=fd)
            try:
                if not same(info, os.fstat(leaf)):
                    raise ValueError("FITXER_CANVIAT")
            finally:
                os.close(leaf)
            items.append((name, info, None))
        else:
            raise ValueError("FULL_NO_REGULAR_O_HARDLINK")
    return items

def sizes(items):
    return sum(sizes(children) if children is not None else info.st_size for _, info, children in items)

def purge(_fd, _items, _result):
    # POSIX dir_fd/O_NOFOLLOW does not prevent a same-UID writer from renaming an
    # opened subtree outside the whitelist. No atomic compare-and-unlink primitive
    # is available here. Keep the public helper fail-closed as well as the CLI.
    raise ValueError("NETEJA_ATOMICA_NO_DISPONIBLE")

def run(config):
    if os.name != "posix" or not hasattr(os, "O_NOFOLLOW") or os.open not in os.supports_dir_fd:
        raise ValueError("PRIMITIVES_SEGURES_NO_DISPONIBLES")
    home = open_absolute(config["home"])
    try:
        home_stat = os.fstat(home)
        if home_stat.st_uid != os.getuid() or home_stat.st_mode & 0o022:
            raise ValueError("HOME_NO_PRIVAT")
        results = []
        for key, relative in ROOTS.items():
            result = {"id": key, "relatiu": relative, "bytes": None, "bytesEliminats": 0, "bytesAlliberats": None, "fitxersEliminats": 0, "estat": "absent"}
            fd = os.dup(home)
            try:
                for name in relative.split("/"):
                    nxt = open_directory(fd, name)
                    os.close(fd)
                    fd = nxt
                info = os.fstat(fd)
                if info.st_uid != os.getuid() or info.st_mode & 0o022:
                    raise ValueError("ARREL_NO_PRIVADA")
                plan = inspect(fd, info.st_dev, [0, time.monotonic() + 15])
                result["bytes"] = sizes(plan)
                result["estat"] = "mesurat"
                if config.get("neteja") is True:
                    result["estat"] = "bloquejat"
                    result["error"] = "NETEJA_ATOMICA_NO_DISPONIBLE"
            except FileNotFoundError:
                result["estat"] = "parcial" if result["fitxersEliminats"] else "absent"
            except (OSError, ValueError) as error:
                result["estat"] = "parcial" if result["fitxersEliminats"] else "bloquejat"
                result["error"] = str(error) if isinstance(error, ValueError) else error.__class__.__name__
            finally:
                os.close(fd)
            results.append(result)
        return results
    finally:
        os.close(home)

if __name__ == "__main__":
    try:
        raw = sys.stdin.buffer.read(16385)
        if len(raw) > 16384:
            raise ValueError("ENTRADA_MASSA_GRAN")
        print(json.dumps({"bosses": run(json.loads(raw))}))
    except (OSError, ValueError, KeyError, TypeError) as error:
        print(json.dumps({"error": str(error) if isinstance(error, ValueError) else error.__class__.__name__}))
        sys.exit(1)
