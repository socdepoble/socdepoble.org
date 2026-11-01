// @vitest-environment node
/* T2-G01/G02 (correcció de l'assalt 261101) · Un paquet 1.0.0 DE VERES,
   congelat: el va fer el generador de f66de7865 (el del build del 261101, la
   fitxa del poble de socdepoble.org) per a La Torre federada, amb directori,
   notícies, agenda (dies sencers, hora, un dia sense durada i un acte sense
   data) i outbox. Els fitxers van ací en text, línia a línia; la prova refà el
   ZIP i comprova que té el SHA-256 de l'original: és el paquet byte a byte.
   El restaurador l'ha de llegir sencer, comparant cada .jsonld amb els bytes
   del generador 1.0.0 (el nom de l'actor «de La Torre» i la fi exclusiva), i
   ha de rebutjar qualsevol valor que eixe generador no escrivia. Cap xarxa.
   Dades de prova. */
import { createHash, webcrypto } from 'node:crypto';
import { describe, expect, test, vi } from 'vitest';
import { estatBuitDeDadesObertes, entitatsDeLEstat, fusionaLotDadesObertes, llegixDeLEstat } from './dadesObertesLot.js';
import { empaquetaZip, exportaMunicipiOpenData, jsonCanonic, recullDadesPubliquesDelMunicipi, verificaPaquetOpenData } from './exportaMunicipiOpenData.js';
import { importaMunicipiOpenData, llegeixPaquetOpenData } from './importaMunicipiOpenData.js';
import { llegeixZip } from '../utils/fulls/zip.js';

const subtle = webcrypto.subtle;
const ENC = new TextEncoder();
const sha = (dades) => createHash('sha256').update(typeof dades === 'string' ? ENC.encode(dades) : dades).digest('hex');
const TORRE = Object.freeze({ slug: 'la-torre-de-les-macanes', nom: 'La Torre de les Maçanes' });
const ARREL = `dades-obertes-${TORRE.slug}`;
const ORIGEN = 'https://socdepoble.org';

/* ── El paquet 1.0.0 de f66de7865 (generat el 261101 amb fes-fixtura-100.mjs, obra/T2/correccio) ── */

const SHA256_100 = '7af6f7149c9951275c249fff560fb992435cd17dc7cb13c620026d63bd5746bf';
const PAQUET_100 = Object.freeze({
  'bag-info.txt': [
    "Bag-Software-Agent: Sóc de Poble · exportaMunicipiOpenData 1.0.0",
    "Bagging-Date: 2026-11-01",
    "External-Description: Dades obertes públiques de La Torre de les Maçanes (socdepoble.dadesobertes.v1)",
    "External-Identifier: dades-obertes-la-torre-de-les-macanes",
    "Payload-Oxum: 13215.10",
    ""
  ].join('\n'),
  'bagit.txt': [
    "BagIt-Version: 1.0",
    "Tag-File-Character-Encoding: UTF-8",
    ""
  ].join('\n'),
  'data/activitystreams.json': [
    "{",
    "  \"@context\": \"https://www.w3.org/ns/activitystreams\",",
    "  \"id\": \"https://socdepoble.org/ap/outbox/la-torre-de-les-macanes.json\",",
    "  \"orderedItems\": [",
    "    {",
    "      \"actor\": \"https://socdepoble.org/ap/actors/la-torre-de-les-macanes.json\",",
    "      \"cc\": [",
    "        \"https://socdepoble.org/ap/followers/la-torre-de-les-macanes.json\"",
    "      ],",
    "      \"id\": \"https://socdepoble.org/ap/objectes/la-torre-de-les-macanes/avis-1.json#create\",",
    "      \"object\": {",
    "        \"attributedTo\": \"https://socdepoble.org/ap/actors/la-torre-de-les-macanes.json\",",
    "        \"cc\": [",
    "          \"https://socdepoble.org/ap/followers/la-torre-de-les-macanes.json\"",
    "        ],",
    "        \"content\": \"<p><strong>Avís de prova</strong></p><p>Text públic de prova</p>\",",
    "        \"contentMap\": {",
    "          \"ca\": \"<p><strong>Avís de prova</strong></p><p>Text públic de prova</p>\"",
    "        },",
    "        \"id\": \"https://socdepoble.org/ap/objectes/la-torre-de-les-macanes/avis-1.json\",",
    "        \"published\": \"2026-10-01T10:00:00Z\",",
    "        \"to\": [",
    "          \"https://www.w3.org/ns/activitystreams#Public\"",
    "        ],",
    "        \"type\": \"Note\"",
    "      },",
    "      \"published\": \"2026-10-01T10:00:00Z\",",
    "      \"to\": [",
    "        \"https://www.w3.org/ns/activitystreams#Public\"",
    "      ],",
    "      \"type\": \"Create\"",
    "    }",
    "  ],",
    "  \"totalItems\": 1,",
    "  \"type\": \"OrderedCollection\"",
    "}",
    ""
  ].join('\n'),
  'data/agenda.jsonld': [
    "{",
    "  \"@context\": \"https://schema.org\",",
    "  \"@graph\": [",
    "    {",
    "      \"@id\": \"agenda.jsonld#concert-de-prova\",",
    "      \"@type\": \"Event\",",
    "      \"endDate\": \"2026-08-16T01:30:00+02:00\",",
    "      \"identifier\": \"concert-de-prova\",",
    "      \"location\": {",
    "        \"@type\": \"Place\",",
    "        \"name\": \"Plaça de prova\"",
    "      },",
    "      \"name\": \"Concert de prova\",",
    "      \"organizer\": {",
    "        \"@id\": \"directori.jsonld#" + "7d1f0000-0000-4000-8000-000000000001\",",
    "        \"@type\": \"Organization\",",
    "        \"identifier\": \"7d1f0000-0000-4000-8000-000000000001\",",
    "        \"name\": \"Rentonar\"",
    "      },",
    "      \"startDate\": \"2026-08-15T22:00:00+02:00\",",
    "      \"subjectOf\": {",
    "        \"@type\": \"CreativeWork\",",
    "        \"copyrightNotice\": \"CC BY-SA 4.0\",",
    "        \"license\": \"https://creativecommons.org/licenses/by-sa/4.0/\"",
    "      }",
    "    },",
    "    {",
    "      \"@id\": \"agenda.jsonld#fira-de-prova\",",
    "      \"@type\": \"Event\",",
    "      \"endDate\": \"2026-10-31\",",
    "      \"identifier\": \"fira-de-prova\",",
    "      \"name\": \"Fira de prova\",",
    "      \"organizer\": {",
    "        \"@id\": \"directori.jsonld#" + "7d1f0000-0000-4000-8000-000000000002\",",
    "        \"@type\": \"LocalBusiness\",",
    "        \"identifier\": \"7d1f0000-0000-4000-8000-000000000002\",",
    "        \"name\": \"Forn de prova\"",
    "      },",
    "      \"startDate\": \"2026-10-29\"",
    "    },",
    "    {",
    "      \"@id\": \"agenda.jsonld#dia-sense-durada\",",
    "      \"@type\": \"Event\",",
    "      \"endDate\": \"2026-12-01\",",
    "      \"identifier\": \"dia-sense-durada\",",
    "      \"name\": \"Dia sense durada\",",
    "      \"organizer\": {",
    "        \"@id\": \"directori.jsonld#" + "7d1f0000-0000-4000-8000-000000000001\",",
    "        \"@type\": \"Organization\",",
    "        \"identifier\": \"7d1f0000-0000-4000-8000-000000000001\",",
    "        \"name\": \"Rentonar\"",
    "      },",
    "      \"startDate\": \"2026-12-01\"",
    "    },",
    "    {",
    "      \"@id\": \"agenda.jsonld#sense-inici\",",
    "      \"@type\": \"Event\",",
    "      \"identifier\": \"sense-inici\",",
    "      \"name\": \"Acte sense data\",",
    "      \"organizer\": {",
    "        \"@id\": \"directori.jsonld#" + "7d1f0000-0000-4000-8000-000000000001\",",
    "        \"@type\": \"Organization\",",
    "        \"identifier\": \"7d1f0000-0000-4000-8000-000000000001\",",
    "        \"name\": \"Rentonar\"",
    "      }",
    "    }",
    "  ]",
    "}",
    ""
  ].join('\n'),
  'data/configuracio.json': [
    "{",
    "  \"format\": \"socdepoble.dadesobertes.v1\",",
    "  \"municipi\": {",
    "    \"nom\": \"La Torre de les Maçanes\",",
    "    \"slug\": \"la-torre-de-les-macanes\"",
    "  },",
    "  \"personalitzacio\": {}",
    "}",
    ""
  ].join('\n'),
  'data/datapackage.json': [
    "{",
    "  \"$schema\": \"https://datapackage.org/profiles/2.0/datapackage.json\",",
    "  \"created\": \"2026-11-01T03:00:00Z\",",
    "  \"description\": \"Contingut públic del municipi i de les seues entitats exportat pel Mas (Sóc de Poble). Sense dades de persones. La llicència de cada element és a llicencies.md: el conjunt no n'atorga cap de nova.\",",
    "  \"keywords\": [",
    "    \"dades obertes\",",
    "    \"municipi\",",
    "    \"la-torre-de-les-macanes\"",
    "  ],",
    "  \"licenses\": [",
    "    {",
    "      \"path\": \"llicencies.md\",",
    "      \"title\": \"Cada element porta la seua llicència; sense llicència declarada no hi ha cap dret de reutilització\"",
    "    }",
    "  ],",
    "  \"name\": \"dades-obertes-la-torre-de-les-macanes\",",
    "  \"resources\": [",
    "    {",
    "      \"bytes\": 2053,",
    "      \"encoding\": \"utf-8\",",
    "      \"format\": \"jsonld\",",
    "      \"hash\": \"sha256:3494a70f0739d66bc3a503f777b8f9e2c7118ddff875fcadc21d37b40cc71510\",",
    "      \"mediatype\": \"application/ld+json\",",
    "      \"name\": \"agenda\",",
    "      \"path\": \"agenda.jsonld\",",
    "      \"title\": \"Agenda (schema.org Event)\"",
    "    },",
    "    {",
    "      \"bytes\": 168,",
    "      \"encoding\": \"utf-8\",",
    "      \"format\": \"json\",",
    "      \"hash\": \"sha256:fa317d2e1f1380190ffab6878790ca8ef530133fd62c2f44c557a5e30a481bac\",",
    "      \"mediatype\": \"application/json\",",
    "      \"name\": \"configuracio\",",
    "      \"path\": \"configuracio.json\",",
    "      \"title\": \"Configuració del poble (taxonomia i estil)\"",
    "    },",
    "    {",
    "      \"bytes\": 1075,",
    "      \"encoding\": \"utf-8\",",
    "      \"format\": \"jsonld\",",
    "      \"hash\": \"sha256:1feee20aa280eb090270e175fccfed09c13dd15a24e0939bca2eff193cdc918d\",",
    "      \"mediatype\": \"application/ld+json\",",
    "      \"name\": \"directori\",",
    "      \"path\": \"directori.jsonld\",",
    "      \"title\": \"Directori d'entitats i comerços (schema.org)\"",
    "    },",
    "    {",
    "      \"bytes\": 874,",
    "      \"encoding\": \"utf-8\",",
    "      \"format\": \"md\",",
    "      \"hash\": \"sha256:4d6e98caf3234d9ab199948b861db12f4466faf4ec7303e7540a03aa93800427\",",
    "      \"mediatype\": \"text/markdown\",",
    "      \"name\": \"llicencies\",",
    "      \"path\": \"llicencies.md\",",
    "      \"title\": \"Llicència de cada element\"",
    "    },",
    "    {",
    "      \"bytes\": 55,",
    "      \"encoding\": \"utf-8\",",
    "      \"format\": \"jsonld\",",
    "      \"hash\": \"sha256:80384e322e8c8962b9b81a09b7a06d5231676c4530bd0e60fa1626dc81c5f3f9\",",
    "      \"mediatype\": \"application/ld+json\",",
    "      \"name\": \"memoria-cultural\",",
    "      \"path\": \"memoria-cultural.jsonld\",",
    "      \"title\": \"Memòria cultural (schema.org CreativeWork)\"",
    "    },",
    "    {",
    "      \"bytes\": 2303,",
    "      \"encoding\": \"utf-8\",",
    "      \"format\": \"md\",",
    "      \"hash\": \"sha256:12ea6fae1e657d1f5bcc02e1ea8f52f1e1eb1c9bea96b2e7f78f3125545d4a53\",",
    "      \"mediatype\": \"text/markdown\",",
    "      \"name\": \"memoria\",",
    "      \"path\": \"memoria.md\",",
    "      \"title\": \"Memòria del paquet (Markdown)\"",
    "    },",
    "    {",
    "      \"bytes\": 550,",
    "      \"encoding\": \"utf-8\",",
    "      \"format\": \"jsonld\",",
    "      \"hash\": \"sha256:45b0490d4c9eac9cca2416ba3792eaeb41266867e03f41c1cbed0b92a0c02860\",",
    "      \"mediatype\": \"application/ld+json\",",
    "      \"name\": \"municipi\",",
    "      \"path\": \"municipi.jsonld\",",
    "      \"title\": \"El municipi (schema.org AdministrativeArea)\"",
    "    },",
    "    {",
    "      \"bytes\": 622,",
    "      \"encoding\": \"utf-8\",",
    "      \"format\": \"jsonld\",",
    "      \"hash\": \"sha256:eccba13991187099e7341bcfd6c74038513c12b14258efcd2f370e8b4f7854c9\",",
    "      \"mediatype\": \"application/ld+json\",",
    "      \"name\": \"noticies\",",
    "      \"path\": \"noticies.jsonld\",",
    "      \"title\": \"Notícies i avisos (schema.org NewsArticle)\"",
    "    },",
    "    {",
    "      \"bytes\": 1302,",
    "      \"encoding\": \"utf-8\",",
    "      \"format\": \"json\",",
    "      \"hash\": \"sha256:e26b4bab92c019f217004ae723322910b84752dc666952f3861ef23cc74ca979\",",
    "      \"mediatype\": \"application/activity+json\",",
    "      \"name\": \"activitystreams\",",
    "      \"path\": \"activitystreams.json\",",
    "      \"title\": \"Publicacions municipals (ActivityStreams 2.0)\"",
    "    }",
    "  ],",
    "  \"socdepoble\": {",
    "    \"comptes\": {",
    "      \"agenda\": 4,",
    "      \"directori\": 2,",
    "      \"memoria\": 0,",
    "      \"noticies\": 1",
    "    },",
    "    \"format\": \"socdepoble.dadesobertes.v1\",",
    "    \"municipi\": \"la-torre-de-les-macanes\",",
    "    \"omissions\": {",
    "      \"agenda\": {},",
    "      \"configuracio\": {},",
    "      \"directori\": {},",
    "      \"memoria\": {},",
    "      \"noticies\": {}",
    "    },",
    "    \"versio\": \"1.0.0\"",
    "  },",
    "  \"sources\": [",
    "    {",
    "      \"path\": \"https://socdepoble.org\",",
    "      \"title\": \"Sóc de Poble (el Mas)\"",
    "    }",
    "  ],",
    "  \"title\": \"Dades obertes de La Torre de les Maçanes\"",
    "}",
    ""
  ].join('\n'),
  'data/directori.jsonld': [
    "{",
    "  \"@context\": \"https://schema.org\",",
    "  \"@graph\": [",
    "    {",
    "      \"@id\": \"directori.jsonld#" + "7d1f0000-0000-4000-8000-000000000002\",",
    "      \"@type\": \"LocalBusiness\",",
    "      \"alternateName\": \"forn-de-prova\",",
    "      \"identifier\": \"7d1f0000-0000-4000-8000-000000000002\",",
    "      \"location\": {",
    "        \"@id\": \"municipi.jsonld#la-torre-de-les-macanes\"",
    "      },",
    "      \"name\": \"Forn de prova\",",
    "      \"parentOrganization\": {",
    "        \"@id\": \"directori.jsonld#" + "7d1f0000-0000-4000-8000-000000000001\"",
    "      }",
    "    },",
    "    {",
    "      \"@id\": \"directori.jsonld#" + "7d1f0000-0000-4000-8000-000000000001\",",
    "      \"@type\": \"Organization\",",
    "      \"alternateName\": \"rentonar\",",
    "      \"description\": \"Grup ecologista de prova.\",",
    "      \"identifier\": \"7d1f0000-0000-4000-8000-000000000001\",",
    "      \"location\": {",
    "        \"@id\": \"municipi.jsonld#la-torre-de-les-macanes\"",
    "      },",
    "      \"name\": \"Rentonar\",",
    "      \"slogan\": \"Natura i Patrimoni\",",
    "      \"subjectOf\": {",
    "        \"@type\": \"CreativeWork\",",
    "        \"copyrightNotice\": \"CC BY 4.0\",",
    "        \"license\": \"https://creativecommons.org/licenses/by/4.0/\"",
    "      }",
    "    }",
    "  ]",
    "}",
    ""
  ].join('\n'),
  'data/llicencies.md': [
    "# Llicències dels elements",
    "",
    "Este paquet no canvia la llicència de cap contingut: cada element porta la seua. Sense llicència declarada, no s'atorga cap dret de reutilització.",
    "Obertes: CC0 1.0, CC BY 4.0 i CC BY-SA 4.0. Les NC, ND i «©» no ho són.",
    "",
    "| Col·lecció | Element | Llicència declarada | Oberta |",
    "| --- | --- | --- | --- |",
    "| noticies | `ban-de-prova` | CC BY 4.0 | sí |",
    "| agenda | `concert-de-prova` | CC BY-SA 4.0 | sí |",
    "| agenda | `fira-de-prova` | (no declarada) | no |",
    "| agenda | `dia-sense-durada` | (no declarada) | no |",
    "| agenda | `sense-inici` | (no declarada) | no |",
    "| directori | `7d1f0000-0000-4000-8000-000000000002` | (no declarada) | no |",
    "| directori | `7d1f0000-0000-4000-8000-000000000001` | CC BY 4.0 | sí |",
    "",
    "Publicacions federades (`activitystreams.json`): 1 element sense llicència declarada; no s'atorga cap dret de reutilització.",
    ""
  ].join('\n'),
  'data/memoria-cultural.jsonld': [
    "{",
    "  \"@context\": \"https://schema.org\",",
    "  \"@graph\": []",
    "}",
    ""
  ].join('\n'),
  'data/memoria.md': [
    "# Dades obertes de La Torre de les Maçanes",
    "",
    "Paquet `socdepoble.dadesobertes.v1` (versió 1.0.0) generat pel Mas (Sóc de Poble) el 2026-11-01T03:00:00Z.",
    "Conté només contingut públic del municipi i de les seues entitats. No conté cap dada de persones: ni perfils, ni publicacions del veïnat, ni xats, ni el Mercat.",
    "",
    "_English:_ open data package of La Torre de les Maçanes (schema.org JSON-LD, Frictionless Data Package v2, BagIt with a SHA-256 manifest). It holds public municipal and organisation content only, never personal data.",
    "",
    "## Contingut",
    "",
    "| Fitxer | Elements |",
    "| --- | --- |",
    "| `noticies.jsonld` | 1 |",
    "| `agenda.jsonld` | 4 |",
    "| `directori.jsonld` | 2 |",
    "| `memoria-cultural.jsonld` | 0 |",
    "| `activitystreams.json` | 1 |",
    "| `configuracio.json` | sense personalització |",
    "",
    "## Notícies i avisos (1)",
    "",
    "- **Ban de prova** · 2026-10-20T08:00:00Z · Rentonar (`ban-de-prova`)",
    "",
    "## Agenda (4)",
    "",
    "- **Concert de prova** · 2026-08-15T22:00:00+02:00 · Rentonar (`concert-de-prova`)",
    "- **Fira de prova** · 2026-10-29 · Forn de prova (`fira-de-prova`)",
    "- **Dia sense durada** · 2026-12-01 · Rentonar (`dia-sense-durada`)",
    "- **Acte sense data** · Rentonar (`sense-inici`)",
    "",
    "## Directori d'entitats i comerços (2)",
    "",
    "- **Forn de prova** (`7d1f0000-0000-4000-8000-000000000002`)",
    "- **Rentonar** (`7d1f0000-0000-4000-8000-000000000001`)",
    "  Grup ecologista de prova.",
    "",
    "## Memòria cultural (0)",
    "",
    "Sense elements en esta exportació.",
    "",
    "## Federació (ActivityPub, fase 1: només lectura)",
    "",
    "- Compte: `@la-torre-de-les-macanes@socdepoble.org`",
    "- Actor: `https://socdepoble.org/ap/actors/la-torre-de-les-macanes.json`",
    "- Outbox: `https://socdepoble.org/ap/outbox/la-torre-de-les-macanes.json`",
    "",
    "L'actor i l'outbox es poden consultar per URL. Seguir el poble des del Fedivers necessita la fase 2 (inbox i signatures HTTP), que encara no existix.",
    "En un allotjament estàtic com socdepoble.org, el compte @ es troba amb host-meta i un JRD estàtic; la consulta WebFinger per paràmetre (`?resource=`) necessita un servidor propi, com el mòdul NixOS.",
    "",
    "## Què queda fora",
    "",
    "Només recomptes, mai valors.",
    "",
    "- Res.",
    "",
    "## Verificació",
    "",
    "Des de la carpeta `dades-obertes-la-torre-de-les-macanes`: `sha256sum -c manifest-sha256.txt` (a macOS, `shasum -a 256 -c manifest-sha256.txt`).",
    "La llicència de cada element és a `llicencies.md`.",
    ""
  ].join('\n'),
  'data/municipi.jsonld': [
    "{",
    "  \"@context\": \"https://schema.org\",",
    "  \"@id\": \"municipi.jsonld#la-torre-de-les-macanes\",",
    "  \"@type\": \"AdministrativeArea\",",
    "  \"identifier\": \"la-torre-de-les-macanes\",",
    "  \"name\": \"La Torre de les Maçanes\",",
    "  \"subjectOf\": {",
    "    \"@type\": \"CreativeWork\",",
    "    \"encodingFormat\": \"application/activity+json\",",
    "    \"name\": \"Actor ActivityPub de La Torre de les Maçanes a Sóc de Poble (fase 1, només lectura)\",",
    "    \"url\": \"https://socdepoble.org/ap/actors/la-torre-de-les-macanes.json\"",
    "  },",
    "  \"url\": \"https://socdepoble.org/pobles/la-torre-de-les-macanes\"",
    "}",
    ""
  ].join('\n'),
  'data/noticies.jsonld': [
    "{",
    "  \"@context\": \"https://schema.org\",",
    "  \"@graph\": [",
    "    {",
    "      \"@id\": \"noticies.jsonld#ban-de-prova\",",
    "      \"@type\": \"NewsArticle\",",
    "      \"articleBody\": \"Text & més.\",",
    "      \"author\": {",
    "        \"@id\": \"directori.jsonld#" + "7d1f0000-0000-4000-8000-000000000001\",",
    "        \"@type\": \"Organization\",",
    "        \"identifier\": \"7d1f0000-0000-4000-8000-000000000001\",",
    "        \"name\": \"Rentonar\"",
    "      },",
    "      \"copyrightNotice\": \"CC BY 4.0\",",
    "      \"datePublished\": \"2026-10-20T08:00:00Z\",",
    "      \"headline\": \"Ban de prova\",",
    "      \"identifier\": \"ban-de-prova\",",
    "      \"license\": \"https://creativecommons.org/licenses/by/4.0/\"",
    "    }",
    "  ]",
    "}",
    ""
  ].join('\n'),
  'manifest-sha256.txt': [
    "e26b4bab92c019f217004ae723322910b84752dc666952f3861ef23cc74ca979  data/activitystreams.json",
    "3494a70f0739d66bc3a503f777b8f9e2c7118ddff875fcadc21d37b40cc71510  data/agenda.jsonld",
    "fa317d2e1f1380190ffab6878790ca8ef530133fd62c2f44c557a5e30a481bac  data/configuracio.json",
    "780c992d179c6272ace754f5d1c6da0d5a2973c213643c224cd60c68ba5e4928  data/datapackage.json",
    "1feee20aa280eb090270e175fccfed09c13dd15a24e0939bca2eff193cdc918d  data/directori.jsonld",
    "4d6e98caf3234d9ab199948b861db12f4466faf4ec7303e7540a03aa93800427  data/llicencies.md",
    "80384e322e8c8962b9b81a09b7a06d5231676c4530bd0e60fa1626dc81c5f3f9  data/memoria-cultural.jsonld",
    "12ea6fae1e657d1f5bcc02e1ea8f52f1e1eb1c9bea96b2e7f78f3125545d4a53  data/memoria.md",
    "45b0490d4c9eac9cca2416ba3792eaeb41266867e03f41c1cbed0b92a0c02860  data/municipi.jsonld",
    "eccba13991187099e7341bcfd6c74038513c12b14258efcd2f370e8b4f7854c9  data/noticies.jsonld",
    ""
  ].join('\n'),
  'tagmanifest-sha256.txt': [
    "79c8a5ba37de1c2b2f509216548777a5daca3aea10d45fb3398aa9c2bb8eb32c  bag-info.txt",
    "1712ecfb074bf29c4188ad3421032509159a09739fd604f8fe57038b4ddefcc9  bagit.txt",
    "531ad84f7682e00bdcfd16808215337034d6c444beef4a5dfc9437d7653701f8  manifest-sha256.txt",
    ""
  ].join('\n')
});

/* El ZIP a partir dels fitxers, en l'ordre de l'exportador (empaquetaZip). */
const zipDe = (fitxers) => empaquetaZip(Object.entries(fitxers).map(([cami, text]) => ({ nom: `${ARREL}/${cami}`, dades: ENC.encode(text) })));

/* Canvia fitxers de dades i refà el Data Package, el manifest, l'Oxum i el tagmanifest (un atacant ho pot fer tot). */
function refa(canvia) {
  const f = new Map(Object.entries(PAQUET_100));
  canvia(f);
  const dp = JSON.parse(f.get('data/datapackage.json'));
  dp.resources = dp.resources.map((r) => ({ ...r, bytes: ENC.encode(f.get(`data/${r.path}`)).length, hash: `sha256:${sha(f.get(`data/${r.path}`))}` }));
  f.set('data/datapackage.json', jsonCanonic(dp));
  const carrega = [...f.keys()].filter((c) => c.startsWith('data/')).sort();
  f.set('manifest-sha256.txt', carrega.map((c) => `${sha(f.get(c))}  ${c}\n`).join(''));
  const octets = carrega.reduce((t, c) => t + ENC.encode(f.get(c)).length, 0);
  f.set('bag-info.txt', f.get('bag-info.txt').replace(/Payload-Oxum: .*\n/, `Payload-Oxum: ${octets}.${carrega.length}\n`));
  f.set('tagmanifest-sha256.txt', ['bag-info.txt', 'bagit.txt', 'manifest-sha256.txt'].map((c) => `${sha(f.get(c))}  ${c}\n`).join(''));
  return zipDe(Object.fromEntries(f));
}
const ambJson = (cami, canvia) => (f) => {
  const valor = JSON.parse(f.get(cami));
  canvia(valor);
  f.set(cami, jsonCanonic(valor));
};

function servidorEnMemoria() {
  const s = { estat: estatBuitDeDadesObertes() };
  const port = {
    teCapacitat: (capacitat) => ['directoriEntitats', 'dadesObertes', 'restauracioDadesObertes'].includes(capacitat),
    listPublicOrganizations: vi.fn(async ({ poble }) => entitatsDeLEstat(s.estat, { nom: poble })),
    llegixDadesObertes: vi.fn(async ({ poble }) => llegixDeLEstat(s.estat, { poble })),
    restauraDadesObertes: vi.fn(async (lot) => {
      const { estat, informe } = fusionaLotDadesObertes(s.estat, lot);
      s.estat = estat;
      return informe;
    })
  };
  return { port, s };
}

describe('un paquet 1.0.0 de veres (f66de7865, La Torre federada)', () => {
  test('la fixació és el paquet original byte a byte, i la bossa verifica', async () => {
    const zip = zipDe(PAQUET_100);
    expect(sha(zip)).toBe(SHA256_100);
    await expect(verificaPaquetOpenData(zip, { subtle })).resolves.toMatchObject({ slug: TORRE.slug });
    // És la forma de la 1.0.0: cap schemaVersion ni agenda.ics, i l'actor «de La Torre».
    expect(JSON.parse(PAQUET_100['data/datapackage.json']).socdepoble).not.toHaveProperty('schemaVersion');
    expect(PAQUET_100).not.toHaveProperty('data/agenda.ics');
    expect(JSON.parse(PAQUET_100['data/municipi.jsonld']).subjectOf.name).toBe(`Actor ActivityPub de ${TORRE.nom} a Sóc de Poble (fase 1, només lectura)`);
  });

  test('es restaura sencer: l’actor federat, i la fi exclusiva tal qual (també amb hora i amb un dia sense durada)', async () => {
    const { port, s } = servidorEnMemoria();
    const informe = await importaMunicipiOpenData(zipDe(PAQUET_100), port, { subtle, sha256Esperat: SHA256_100 });
    expect(informe).toMatchObject({ slug: TORRE.slug, versio: '1.0.0', autenticitat: 'sha256-esperat-coincidix',
      comptes: { noticies: 1, agenda: 4, directori: 2, memoria: 0 } });
    expect(informe.restauracio.creats).toEqual({ entitats: 2, noticies: 1, agenda: 4, memoria: 0, memoriaOral: 0 });
    const { actorsPublicats, activityStreams } = await llegeixPaquetOpenData(zipDe(PAQUET_100), { subtle });
    expect(actorsPublicats).toEqual([TORRE.slug]);
    expect(activityStreams.orderedItems).toHaveLength(1);
    const agenda = Object.fromEntries(llegixDeLEstat(s.estat, { poble: TORRE }).agenda.map((acte) => [acte.id, [acte.inici, acte.fi]]));
    expect(agenda).toEqual({
      'concert-de-prova': ['2026-08-15T22:00:00+02:00', '2026-08-16T01:30:00+02:00'],
      'dia-sense-durada': ['2026-12-01', '2026-12-01'],
      'fira-de-prova': ['2026-10-29', '2026-10-31'],
      'sense-inici': [undefined, undefined]
    });
  });

  test('la tornada en la versió d’ara: l’endDate inclusiu, l’actor «de la Torre», i es torna a llegir igual', async () => {
    const A = servidorEnMemoria();
    await importaMunicipiOpenData(zipDe(PAQUET_100), A.port, { subtle });
    const outbox = JSON.parse(PAQUET_100['data/activitystreams.json']);
    const { entitats, ...resta } = await recullDadesPubliquesDelMunicipi(A.port, TORRE);
    const P = await exportaMunicipiOpenData({ municipi: TORRE, ara: '2026-11-01T10:00:00Z', origen: ORIGEN, actorsPublicats: [TORRE.slug],
      activityStreams: outbox, ...resta, entitats }, { subtle });
    const llegit = await llegeixPaquetOpenData(P.zip, { subtle });
    expect(llegit.versio).not.toBe('1.0.0');
    const municipi = llegeixZip(P.zip).find((e) => e.nom === `${ARREL}/data/municipi.jsonld`);
    expect(JSON.parse(new TextDecoder().decode(municipi.dades)).subjectOf.name)
      .toBe('Actor ActivityPub de la Torre de les Maçanes a Sóc de Poble (fase 1, només lectura)');
    const fins = Object.fromEntries(llegit.lot.agenda.map((acte) => [acte.id, acte.fi]));
    // La fi del model és la mateixa; el dia sense durada (el model no l'admet) perd l'endDate (fiInclusiva).
    expect(fins).toEqual({ 'concert-de-prova': '2026-08-16T01:30:00+02:00', 'fira-de-prova': '2026-10-31', 'dia-sense-durada': undefined, 'sense-inici': undefined });
  });

  /* Una rebaixa de versió no salta la regeneració: cada valor que el generador 1.0.0 no escrivia, fora. */
  test.each([
    ['un nom amb HTML', ambJson('data/agenda.jsonld', (g) => { g['@graph'][1].name = '<img src=x onerror=alert(1)>'; })],
    ['una imatge javascript:', ambJson('data/agenda.jsonld', (g) => { g['@graph'][1].image = 'javascript:alert(1)'; })],
    ['un startDate que no és cap data', ambJson('data/agenda.jsonld', (g) => { g['@graph'][1].startDate = 'quan vulgues'; })],
    ['un endDate que no és cap data', ambJson('data/agenda.jsonld', (g) => { g['@graph'][1].endDate = 'quan vulgues'; })],
    ['un endDate amb hora sense desfasament', ambJson('data/agenda.jsonld', (g) => { g['@graph'][0].endDate = '2026-08-16T01:30'; })],
    ['l’actor amb el nom de la 1.1.0', ambJson('data/municipi.jsonld', (m) => { m.subjectOf.name = 'Actor ActivityPub de la Torre de les Maçanes a Sóc de Poble (fase 1, només lectura)'; })],
    ['l’actor amb un altre nom', ambJson('data/municipi.jsonld', (m) => { m.subjectOf.name = 'Actor de prova'; })],
    ['un titular amb HTML a les notícies', ambJson('data/noticies.jsonld', (g) => { g['@graph'][0].headline = '<b>Ban</b>'; })]
  ])('1.0.0 amb %s: TypeError i res escrit', async (_, canvia) => {
    const { port } = servidorEnMemoria();
    await expect(importaMunicipiOpenData(refa(canvia), port, { subtle })).rejects.toThrow(/no és canònic/);
    expect(port.restauraDadesObertes).not.toHaveBeenCalled();
  });

  test('la bossa refeta sense canvis passa (cada cas de dalt en canvia UNA cosa)', async () => {
    const { port } = servidorEnMemoria();
    await expect(importaMunicipiOpenData(refa(() => {}), port, { subtle })).resolves.toMatchObject({ versio: '1.0.0' });
  });
});
