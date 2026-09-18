import json

entries = [
    {'id': 'shell', 'comp': 'EspecimenShell', 'category': 'estructura'},
    {'id': 'page', 'comp': 'EspecimenPage', 'category': 'estructura'},
    {'id': 'gestor', 'comp': 'EspecimenGestor', 'category': 'estructura'},
    {'id': 'divisor', 'comp': 'EspecimenDivisor', 'category': 'estructura'},
    {'id': 'boto', 'comp': 'EspecimenBoto', 'category': 'formularis'},
    {'id': 'camp', 'comp': 'EspecimenCamp', 'category': 'formularis'},
    {'id': 'opcions', 'comp': 'EspecimenOpcions', 'category': 'formularis'},
    {'id': 'pindola', 'comp': 'EspecimenPindola', 'category': 'formularis'},
    {'id': 'cerca', 'comp': 'EspecimenCerca', 'category': 'formularis'},
    {'id': 'formulari-complex', 'comp': 'EspecimenFormulariComplex', 'category': 'formularis'},
    {'id': 'pestanyes', 'comp': 'EspecimenPestanyes', 'category': 'navegacio'},
    {'id': 'molla', 'comp': 'EspecimenMolla', 'category': 'navegacio'},
    {'id': 'paginacio', 'comp': 'EspecimenPaginacio', 'category': 'navegacio'},
    {'id': 'acordio', 'comp': 'EspecimenAcordio', 'category': 'navegacio'},
    {'id': 'nav-mobil', 'comp': 'EspecimenNavMobil', 'category': 'navegacio'},
    {'id': 'alerta', 'comp': 'EspecimenAlerta', 'category': 'retroalimentacio'},
    {'id': 'insignia', 'comp': 'EspecimenInsignia', 'category': 'retroalimentacio'},
    {'id': 'buit', 'comp': 'EspecimenBuit', 'category': 'retroalimentacio'},
    {'id': 'carrega', 'comp': 'EspecimenCarrega', 'category': 'retroalimentacio'},
    {'id': 'progres', 'comp': 'EspecimenProgres', 'category': 'retroalimentacio'},
    {'id': 'dialeg', 'comp': 'EspecimenDialeg', 'category': 'superposicions'},
    {'id': 'confirmacio', 'comp': 'EspecimenConfirmacio', 'category': 'superposicions'},
    {'id': 'calaix', 'comp': 'EspecimenCalaix', 'category': 'superposicions'},
    {'id': 'pista', 'comp': 'EspecimenPista', 'category': 'superposicions'},
    {'id': 'menu', 'comp': 'EspecimenMenu', 'category': 'superposicions'},
    {'id': 'toast', 'comp': 'EspecimenToast', 'category': 'superposicions'}
]

categories_code = """
export const CATALOG_CATEGORIES = [
  { id: 'fonaments', label: 'Fonaments', order: 10 },
  { id: 'estructura', label: 'Estructura', order: 20 },
  { id: 'formularis', label: 'Formularis', order: 30 },
  { id: 'superposicions', label: 'Superposicions', order: 40 },
  { id: 'retroalimentacio', label: 'Retroalimentació', order: 50 },
  { id: 'navegacio', label: 'Navegació', order: 60 },
  { id: 'inventari', label: 'Inventari', order: 70 }
];
"""

items_code = "export const CATALOG_ITEMS = [\n"
registry_code = "import { lazy } from 'react';\n\nexport const CATALOG_DETAIL_LOADERS = {\n"

# add universalcard (which is already there)
items_code += """  {
    id: 'fonaments-universalcard',
    categoryIds: ['fonaments'],
    kind: 'component-doc',
    title: 'UniversalCard',
    subtitle: 'PedraSeca/organismes/UniversalCard.jsx',
    tags: ['organisme', 'targeta', 'contingut'],
    searchText: 'universalcard organisme targeta contingut',
    detailKey: 'fonaments/universalcard',
    status: 'viu'
  },
"""
registry_code += "  'fonaments/universalcard': lazy(() => import('./detalls/EspecimenUniversalCard.jsx')),\n"

# add inventari
items_code += """  {
    id: 'inventari-global',
    categoryIds: ['inventari'],
    kind: 'component-doc',
    title: 'Inventari Global',
    subtitle: 'Taula de components',
    tags: ['inventari', 'llista'],
    searchText: 'inventari global llista components',
    detailKey: 'inventari/global',
    status: 'viu'
  },
"""
registry_code += "  'inventari/global': lazy(() => import('./detalls/EspecimenInventariGlobal.jsx')),\n"


for item in entries:
    items_code += f"""  {{
    id: '{item['category']}-{item['id']}',
    categoryIds: ['{item['category']}'],
    kind: 'component-doc',
    title: '{item['id'].replace('-', ' ').title()}',
    subtitle: '',
    tags: [],
    searchText: '{item['id'].replace('-', ' ')}',
    detailKey: '{item['category']}/{item['id']}',
    status: 'viu'
  }},
"""
    registry_code += f"  '{item['category']}/{item['id']}': lazy(() => import('./detalls/{item['comp']}.jsx')),\n"

items_code += "];\n"
registry_code += "};\n"

with open('src/sections/disseny/cataleg/manifest.js', 'w') as f:
    f.write(categories_code + "\n" + items_code)

with open('src/sections/disseny/cataleg/detailRegistry.jsx', 'w') as f:
    f.write(registry_code)

print("done")
