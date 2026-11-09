#!/usr/bin/env python3
"""Copy the authorized original bitmaps unchanged and reconcile the existing image map."""
import argparse
import hashlib
import json
import re
import unicodedata
from collections import Counter, defaultdict
from pathlib import Path


def digest(data):
    return hashlib.sha256(data).hexdigest()


def nfc(value):
    return unicodedata.normalize('NFC', value)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--font', required=True, type=Path)
    # Sanejament R15 (PRIV-06): la instantània completa (local, fora de git); fontInventariSha256 n'és l'empremta.
    parser.add_argument('--dades', type=Path, default=Path('src/data/menjarIBeure/parroquiaDades.privat.json'))
    parser.add_argument('--mapa', type=Path, default=Path('src/apps/bar/llavors/MAPA_IMATGES.txt'))
    parser.add_argument('--assets', type=Path, default=Path('src/assets/bar/parroquia'))
    parser.add_argument('--sortida', type=Path, default=Path('src/data/menjarIBeure/parroquiaFotos.generated.json'))
    args = parser.parse_args()
    source = args.font.resolve(strict=True)
    snapshot = json.loads(args.dades.read_text(encoding='utf8'))
    inventory = [image for image in snapshot['imatges'] if image['bitmap']]
    args.assets.mkdir(parents=True, exist_ok=True)
    images, copied, by_basename = [], set(), defaultdict(list)
    for image in inventory:
        original = source / image['ruta']
        data = original.read_bytes()
        sha = digest(data)
        if sha != image['sha256'] or len(data) != image['bytes']:
            raise ValueError(f'The original image changed: {image["ruta"]}')
        extension = original.suffix.lower()
        if extension not in {'.jpg', '.jpeg', '.png', '.webp'}:
            raise ValueError(f'Unsupported bitmap extension: {extension}')
        asset = f'p-{sha}{extension}'
        destination = args.assets / asset
        if destination.exists() and destination.read_bytes() != data:
            raise ValueError(f'Asset collision: {asset}')
        if not destination.exists():
            destination.write_bytes(data)
        copied.add(asset)
        folder = Path(image['ruta']).parts[2]
        match = re.match(r'^([BM][1-5])(?:-|$)', folder)
        record = {'fitxer': asset, 'rutaOriginal': image['ruta'], 'sha256': sha, 'bytes': len(data),
                  'nomFitxerOriginal': original.name, 'categoria': match.group(1) if match else None,
                  'transformacio': 'cap_copia_exacta', 'publicacioAutoritzada': 'encarrec_expres_r14'}
        images.append(record)
        by_basename[nfc(original.name)].append(record)

    mappings = []
    for line in args.mapa.read_text(encoding='utf8').splitlines():
        match = re.match(r'^\s*([a-z0-9-]+/[a-z0-9-]+)\.webp\s+<-\s+(\S.*\S)\s*$', line)
        if match:
            mappings.append({'destiOrigen': match[1], 'rutaMapa': match[2], 'confirmacioPendent': False})
        elif 'a confirmar' in line and mappings:
            mappings[-1]['confirmacioPendent'] = True
    if len(mappings) != 199:
        raise ValueError('The historical map must still contain its 199 explicit entries')
    categories = {'cafeteria': 'B1', 'refrescs': 'B2', 'cerveseria': 'B3', 'vins-i-caves': 'B4',
                  'licoreria': 'B5', 'combinats': 'B5', 'plats-combinats': 'M1', 'entrepans': 'M2',
                  'torrades': 'M3', 'tapes': 'M4', 'postres': 'M5'}
    for mapping in mappings:
        candidates = by_basename[nfc(Path(mapping['rutaMapa']).name)]
        method = 'nom_fitxer_exacte'
        if len(candidates) > 1:
            category = categories[mapping['destiOrigen'].split('/')[0]]
            candidates = [image for image in candidates if image['categoria'] == category]
            method = 'nom_fitxer_i_categoria_exactes'
        if mapping['confirmacioPendent']:
            mapping['estat'] = 'pendent_confirmacio_semantica'
        elif len(candidates) == 1:
            mapping.update({'estat': 'disponible', 'fitxer': candidates[0]['fitxer'], 'rutaOriginal': candidates[0]['rutaOriginal'],
                            'sha256': candidates[0]['sha256'], 'metode': method})
        else:
            mapping['estat'] = 'pendent_font' if not candidates else 'pendent_ambiguitat'
    result = {'versio': 1, 'fontInventariSha256': digest(args.dades.read_bytes()), 'mapaOriginalSha256': digest(args.mapa.read_bytes()),
              'resum': {'bitmapsOriginals': len(images), 'assetsUnics': len(copied), 'bytesOriginals': sum(i['bytes'] for i in images),
                        'entradesMapaOriginal': len(mappings), 'estatsMapa': dict(sorted(Counter(m['estat'] for m in mappings).items()))},
              'imatges': images, 'associacions': mappings}
    args.sortida.parent.mkdir(parents=True, exist_ok=True)
    args.sortida.write_text(json.dumps(result, ensure_ascii=False, sort_keys=True, separators=(',', ':')) + '\n', encoding='utf8')
    print(json.dumps({'sortida': str(args.sortida), 'sha256': digest(args.sortida.read_bytes()), **result['resum']}, ensure_ascii=False))


if __name__ == '__main__':
    main()
