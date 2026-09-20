#!/usr/bin/env python3
"""Àlies retirat: comprova/genera el catàleg; mai crea espills."""
import argparse
import os
from pathlib import Path
import subprocess


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('root', type=Path)
    parser.add_argument('--write', action='store_true')
    args = parser.parse_args()
    root = args.root.resolve(strict=True)
    command = Path(__file__).resolve().with_name('cataleg_skills.mjs')
    return subprocess.run(['node', str(command), '--escriu' if args.write else '--check'],
                          cwd=root, env={**os.environ, 'SDP_ARREL': str(root)}, check=False).returncode


if __name__ == '__main__':
    raise SystemExit(main())