#!/usr/bin/env python3
"""Extract the historical La Parròquia sources without evaluating Excel formulas.

Usage: python3 tooling/menjarIBeure/importaParroquia.py --font /path/to/la_parroquia_menjar_i_beure_socdepoble
Requires openpyxl for the read-only XLSX inputs. The application has no new dependency.

Sanejament R15 (PRIV-06): two outputs. --sortida is the COMPLETE snapshot (pack purchase prices,
equivalence surcharge and origin cells with costs, margins and formulas): local only, ignored by git,
read in DEV or with the opt-in build. --sortida-publica is the versioned one, without those fields.
"""
import argparse
import copy
import csv
import hashlib
import json
import re
import unicodedata
from collections import Counter
from decimal import Decimal
from pathlib import Path

import openpyxl


def ordena(path):
    return (unicodedata.normalize('NFC', str(path)), str(path))


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def cents(value):
    if value in ('', None) or str(value).lower() == 'variable':
        return None
    number = Decimal(str(value).replace(',', '.')) * 100
    if number != number.to_integral_value():
        raise ValueError(f'Fractional cent in source: {value}')
    return int(number)


def categoria(nom):
    match = re.match(r'^(B[1-5]|M[1-5])', nom)
    return match.group(1) if match else None


CAMPS_PRIVATS_TARIFA = ('cellesOrigen', 'preuPackCents', 'recarrecEquivalenciaPercent')
CAMI_PRIVAT = 'src/data/menjarIBeure/parroquiaDades.privat.json'


def versio_publica(result):
    """The versioned snapshot: the same, minus the purchase fields of every tariff."""
    public = copy.deepcopy(result)
    public['tarifes'] = [{k: v for k, v in t.items() if k not in CAMPS_PRIVATS_TARIFA} for t in result['tarifes']]
    public['privadesa'] = {'versio': 'publica', 'campsTarifaRetirats': list(CAMPS_PRIVATS_TARIFA), 'completa': CAMI_PRIVAT}
    return public


def escriu(path, value):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(',', ':'), allow_nan=False) + '\n', encoding='utf8')


def nom_net(nom):
    return re.sub(r'^(?:[A-Z]\d+[A-Z]?\S*|x)\s+(?:-\s+)?', '', nom).strip()


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--font', required=True, type=Path)
    parser.add_argument('--sortida', type=Path, default=Path(CAMI_PRIVAT))
    parser.add_argument('--sortida-publica', type=Path, default=Path('src/data/menjarIBeure/parroquiaDades.generated.json'))
    args = parser.parse_args()
    root = args.font.resolve(strict=True)
    csv_path = root / '¡¡¡TPV/export_items.csv'
    xlsx_path = root / '¡¡¡TPV/export_items.xlsx'
    with csv_path.open(encoding='utf-8-sig', newline='') as file:
        reader = csv.DictReader(file)
        headers = reader.fieldnames
        rows = list(reader)
    modifiers = [h for h in headers if h.startswith('modificador - ')]
    products, variants = {}, []
    refs = set()
    for line, row in enumerate(rows, 2):
        handle = row['Handle']
        if not handle or row['REF'] in refs:
            raise ValueError(f'Missing handle or repeated REF at row {line}')
        refs.add(row['REF'])
        if handle not in products:
            if not row['Nombre']:
                raise ValueError(f'Orphan variant at row {line}')
            products[handle] = {
                'handle': handle,
                'nomOrigen': row['Nombre'],
                'nom': nom_net(row['Nombre']),
                'categoria': categoria(row['Nombre']),
                'categoriaOrigen': row['Categoria'],
                'fila': line,
                'grupsModificadorsOrigen': [h.split('"')[1] for h in modifiers if row[h] == 'Y'],
                'impostosOrigen': [int(re.search(r'\((\d+)%\)', h).group(1)) for h in headers if h.startswith('impuesto - ') and row[h] == 'Y'],
                'refs': [],
                'alergensEstat': 'pendent',
            }
        product = products[handle]
        product['refs'].append(row['REF'])
        variants.append({
            'ref': row['REF'], 'handle': handle, 'fila': line,
            'nom': ' · '.join(row[f'Opción {i} valor'] for i in range(1, 4) if row[f'Opción {i} valor']) or 'Unitat',
            'opcionsOrigen': [{'nom': row[f'Opción {i} nombre'], 'valor': row[f'Opción {i} valor']} for i in range(1, 4)],
            'preuCents': cents(row['Precio [La Parròquia]']),
            'preuOrigen': row['Precio [La Parròquia]'],
            'costCentsOrigen': cents(row['Coste']),
            'costOrigen': row['Coste'],
            'disponibleOrigen': row['Disponibles para la venta [La Parròquia]'],
        })
    xlsx = openpyxl.load_workbook(xlsx_path, data_only=False, read_only=True)
    xlsx_rows = list(xlsx.active.values)
    # The XLSX is a reduced 6-column view. Verify every row instead of claiming 37-column parity.
    if len(xlsx_rows) != len(rows) + 1:
        raise ValueError('CSV/XLSX row count differs')
    for number, (row, sheetrow) in enumerate(zip(rows, xlsx_rows[1:]), 2):
        if (sheetrow[0] or '') != row['Handle'] or cents(sheetrow[5]) != cents(row['Precio [La Parròquia]']):
            raise ValueError(f'CSV/XLSX handle or price differs at row {number}')

    prices = next(p for p in root.rglob('*.xlsx') if p.name == 'La Parròquia - Llistat de preus.xlsx')
    workbook = openpyxl.load_workbook(prices, data_only=False)
    tariffs = []
    for sheet in workbook:
        food = sheet.title.startswith('Menjars')
        columns = {'pvp': 'D' if food else 'E', 'marge': 'E' if food else 'F', 'guany': 'F' if food else 'G',
                   'cost': 'G' if food else 'H', 'base': 'H' if food else 'I', 'unitatsPack': 'I' if food else 'J',
                   'preuPack': 'J' if food else 'K', 'iva': 'K' if food else 'L', 'recarrecEquivalencia': 'L' if food else 'M'}
        for line in range(7, sheet.max_row + 1):
            name, code = sheet[f'C{line}'].value, sheet[f'A{line}'].value
            if not isinstance(name, str) or not name.strip() or not isinstance(code, str) or not categoria(code):
                continue
            tariffs.append({
                'full': sheet.title, 'fila': line, 'nom': name, 'categoria': categoria(code),
                'tipus': sheet[f'B{line}'].value,
                'cl': None if food else sheet[f'D{line}'].value,
                'pvpCents': cents(sheet[f'{columns["pvp"]}{line}'].value) if not isinstance(sheet[f'{columns["pvp"]}{line}'].value, str) else None,
                'unitatsPack': sheet[f'{columns["unitatsPack"]}{line}'].value,
                'preuPackCents': cents(sheet[f'{columns["preuPack"]}{line}'].value) if not isinstance(sheet[f'{columns["preuPack"]}{line}'].value, str) else None,
                'ivaPercent': float(Decimal(str(sheet[f'{columns["iva"]}{line}'].value or 0)) * 100),
                'recarrecEquivalenciaPercent': float(Decimal(str(sheet[f'{columns["recarrecEquivalencia"]}{line}'].value or 0)) * 100),
                'cellesOrigen': {key: {'cela': f'{col}{line}', 'valor': sheet[f'{col}{line}'].value} for key, col in columns.items()},
            })

    image_root = root / '¡¡¡TPV/¡¡¡Imatges de productes'
    image_files = sorted((p for p in image_root.rglob('*') if p.is_file()), key=ordena)
    bitmap_extensions = {'.jpg', '.jpeg', '.png', '.webp', '.gif', '.tif', '.tiff'}
    images = [{'ruta': p.relative_to(root).as_posix(), 'bytes': p.stat().st_size, 'sha256': sha(p),
               'bitmap': p.suffix.lower() in bitmap_extensions,
               'publicacio': 'autoritzada_encarrec_r14' if p.suffix.lower() in bitmap_extensions else 'no_es_bitmap_no_distribuir'} for p in image_files]
    extra_sources = sorted((p for p in root.rglob('*') if p.is_file() and p.name in ['Ficha de escandallo.xlsx', 'Costeo_copa_botella.xls', 'Fitxa_plat_per_plat_alergens.xlsx']), key=ordena)
    sources = [csv_path, xlsx_path, prices, *extra_sources]
    result = {
        'versio': 1,
        'naturalesa': 'instantania_historica_no_tarifa_actual',
        'fonts': [{'ruta': p.relative_to(root).as_posix(), 'sha256': sha(p), 'bytes': p.stat().st_size} for p in sources],
        'resum': {'filesCsvAmbCapcalera': len(rows) + 1, 'variants': len(variants), 'productes': len(products), 'columnesCsv': len(headers),
                  'columnesXlsx': len(xlsx_rows[0]), 'grupsModificadors': len(modifiers), 'tarifesWorkbook': len(tariffs),
                  'entradesDirectoriImatges': len(images), 'bitmaps': sum(i['bitmap'] for i in images),
                  'extensionsImatges': dict(sorted(Counter(p.suffix.lower() or '(sense extensio)' for p in image_files).items()))},
        'grupsModificadors': [{'id': f'parroquia-mod-{i + 1}', 'nom': h.split('"')[1], 'opcions': None, 'estat': 'opcions_no_exportades'} for i, h in enumerate(modifiers)],
        'productes': list(products.values()), 'variants': variants, 'tarifes': tariffs, 'imatges': images,
        'limits': ['L’XLSX de TPV conserva 6 columnes: s’ha contrastat Handle i Preu en totes les files.',
                   'El CSV indica elegibilitat dels 13 grups, sense opcions ni suplements.',
                   '528 costos 0.00 són valors originals; no proven cost gratuït.',
                   'El full d’al·lèrgens és una plantilla sense plats ni marques; no acredita absència.',
                   'Ficha de escandallo és una plantilla sense receptes emplenades; la minva històrica és un recàrrec, no rendiment.',
                   'Costeo_copa_botella.xls conté exemples aliens i IVA 15% històric: no són costos del Cafè de la Plaça.',
                   'Els bitmaps originals autoritzats es carreguen només amb la llavor històrica opt-in. DS_Store i webloc no són fotos.'],
    }
    escriu(args.sortida, result)
    escriu(args.sortida_publica, versio_publica(result))
    print(json.dumps({'sortida': str(args.sortida), 'sha256': sha(args.sortida), 'sortidaPublica': str(args.sortida_publica),
                      'sha256Publica': sha(args.sortida_publica), **result['resum']}, ensure_ascii=False))


if __name__ == '__main__':
    main()
