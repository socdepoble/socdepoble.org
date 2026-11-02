# Dades obertes de la Torre de les Maçanes

Paquet `socdepoble.dadesobertes.v1` (versió 1.2.0) generat pel Mas (Sóc de Poble) el 2026-11-02T00:00:00Z.
Conté només contingut públic del municipi i de les seues entitats. No conté cap dada de persones: ni perfils, ni publicacions del veïnat, ni xats, ni el Mercat.

_English:_ open data package of La Torre de les Maçanes (schema.org JSON-LD, Frictionless Data Package v2, BagIt with a SHA-256 manifest). It holds public municipal and organisation content only, never personal data.

## Contingut

| Fitxer | Elements |
| --- | --- |
| `noticies.jsonld` | 0 |
| `agenda.jsonld` | 0 |
| `directori.jsonld` | 0 |
| `memoria-cultural.jsonld` | 0 |
| `activitystreams.json` | 1 |
| `configuracio.json` | no s'exporta |

## Notícies i avisos (0)

No s'exporta en esta versió: encara no hi ha cap lectura pública garantida d'estes dades.

## Agenda (0)

No s'exporta en esta versió: encara no hi ha cap lectura pública garantida d'estes dades.

## Directori d'entitats i comerços (0)

No s'exporta en esta versió: este servidor de dades no oferix el directori d'entitats.

## Memòria cultural (0)

No s'exporta en esta versió: el Mas no té cap mòdul de memòria cultural.

## Memòria oral (fitxes OKF) (0)

No s'exporta en esta versió: encara no hi ha cap lectura pública garantida d'estes dades.

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

- Directori d'entitats i comerços: este servidor de dades no oferix el directori d'entitats.
- Notícies i avisos: encara no hi ha cap lectura pública garantida d'estes dades.
- Agenda: encara no hi ha cap lectura pública garantida d'estes dades.
- Memòria cultural: el Mas no té cap mòdul de memòria cultural.
- Memòria oral (fitxes OKF): encara no hi ha cap lectura pública garantida d'estes dades.
- Configuració del poble: la personalització és de tot el node, no d'un poble, i la fitxa del poble no la inclou.

## Verificació

Des de la carpeta `dades-obertes-la-torre-de-les-macanes`: `sha256sum -c manifest-sha256.txt` (a macOS, `shasum -a 256 -c manifest-sha256.txt`).
La llicència de cada element és a `llicencies.md`.
