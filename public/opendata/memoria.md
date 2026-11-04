# Dades obertes de la Torre de les Maçanes

Paquet `socdepoble.dadesobertes.v1` (versió 1.2.0) generat pel Mas (Sóc de Poble) el 2026-11-03T17:29:24.547Z.
Conté només contingut públic del municipi i de les seues entitats. No conté cap dada de persones: ni perfils, ni publicacions del veïnat, ni xats, ni el Mercat.

_English:_ open data package of La Torre de les Maçanes (schema.org JSON-LD, iCalendar RFC 5545, Frictionless Data Package v2, BagIt with a SHA-256 manifest). It holds public municipal and organisation content only, never personal data.

## Contingut

| Fitxer | Elements |
| --- | --- |
| `noticies.jsonld` | 1 |
| `agenda.jsonld` | 1 |
| `directori.jsonld` | 3 |
| `memoria-cultural.jsonld` | 1 |
| `agenda.ics` | 1 |
| `activitystreams.json` | 1 |
| `configuracio.json` | no s'exporta |

## Notícies i avisos (1)

- **Node 0 · Mac mini M4: el servidor de l’habitació** · 2026-10-29T11:00:00Z · Sóc de Poble (`node-zero-mac-mini-m4`)
  Observació del 3 de novembre de 2026: dos punts d’accés públic, socdepoble.org i gentdelatorre.net, i un pilot físic en preparació a La Torre de les Maçanes. El Node 0 · Mac mini M4 encara no té servei públic acreditat.

## Agenda (1)

- **Exposició Casa Alta** · 2023-11-26T10:30:00+01:00 · Ajuntament de La Torre de les Maçanes (`casa-alta-exposicio-2023-11-26`)
  Acte històric de l’agenda municipal: exposició a la Casa Alta el 26 de novembre de 2023, de 10.30 a 13.30 h. Font pública municipal: https://www.torremanzanas.es/eventos/etiqueta/casa-alta/mes/

L'acte amb data d'inici també és a `agenda.ics` (iCalendar, RFC 5545), per a importar-lo a qualsevol calendari.

## Directori d'entitats i comerços (3)

- **Ajuntament de La Torre de les Maçanes** (`ajuntament-la-torre-de-les-macanes`)
- **Associació El Rentonar** (`rentonar`)
- **Sóc de Poble** (`socdepoble`)

## Memòria cultural (1)

- **Memòria de la campanya solidària del Rentonar de 2016** · Associació El Rentonar (`rentonar-solidaritat-refugiats-2016`)

## Memòria oral (fitxes OKF) (0)

No s'exporta en esta versió: no hi ha cap fitxa pública amb revisió humana acreditada en les fonts consultades; cal aportar-ne una abans d’exportar-la.

## Federació (ActivityPub, fase 1: només lectura)

- Compte: `@la-torre-de-les-macanes@socdepoble.org`
- Actor: `https://socdepoble.org/ap/actors/la-torre-de-les-macanes.json`
- Outbox: `https://socdepoble.org/ap/outbox/la-torre-de-les-macanes.json`

L'actor i l'outbox es poden consultar per URL. Seguir el poble des del Fedivers necessita la fase 2 (inbox i signatures HTTP), que encara no existix.
En un allotjament estàtic com socdepoble.org, el compte @ es troba amb host-meta i un JRD estàtic; la consulta WebFinger per paràmetre (`?resource=`) necessita un servidor propi, com el mòdul NixOS.

## Què queda fora

Només recomptes, mai valors.

- Res entre les col·leccions exportades. El que encara no s'exporta és a «Fonts pendents».

## Fonts pendents

El que este paquet encara no exporta, i per què. No vol dir que el poble no en tinga.

- Memòria oral (fitxes OKF): no hi ha cap fitxa pública amb revisió humana acreditada en les fonts consultades; cal aportar-ne una abans d’exportar-la.
- Configuració del poble: la configuració és del node i no del municipi.

## Verificació

Des de la carpeta `dades-obertes-la-torre-de-les-macanes`: `sha256sum -c manifest-sha256.txt` (a macOS, `shasum -a 256 -c manifest-sha256.txt`).
La llicència de cada element és a `llicencies.md`.
