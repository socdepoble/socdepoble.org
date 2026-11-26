---
type: document
status: canonic
visibility: private
description: 'Mapa canònic del contenidor «Som de Poble»: la llar única de cada contingut dins i fora de socdepoble.org, i com es comprova en temps real amb el cartògraf.'
tags:
  - maquina
---
# Mapa canònic del contenidor «Som de Poble»

El contenidor «Som de Poble» és la carpeta pare de `socdepoble.org`. No és un repositori: hi conviuen el repositori viu i els fons patrimonials, tècnics, legals i d'empaquetat. **Cada contingut hi té una sola llar canònica.** La regla: cap carpeta duplicada, cap còpia solta i cap enllaç simbòlic que al Finder semble una carpeta repetida. L'estat real el diu el cartògraf (per exemple, hui hi ha duplicats pesants sense justificar dins del laboratori).

Este mapa viu dins de Git des de la v1.2.26 (decisió del Mestre del 26-11-2026 a les 02:37 CET): un sol cervell versionat. Del mapa, fora de Git només queda un cartell de mig foli, `README.md`, a l'arrel del contenidor, que remet ací. El fitxer antic `00_MAPA_CANONIC_SOM_DE_POBLE.md` de l'arrel es conserva com a consulta, amb un punter al principi, fins que el Mestre decidisca retirar-lo.

## 1. Com es comprova

Des de `socdepoble.org/`:

- `node tooling/gates/cartograf-som-de-poble.mjs --on-va "<descripció>"` diu on va un contingut.
- `node tooling/gates/cartograf-som-de-poble.mjs --audit` jutja l'arrel (cap entrada fora del mapa), el mapa i el cartell, i els fons temàtics (cap symlink no autoritzat ni fitxer buit). Informa, sense jutjar-los, dels duplicats pesants per SHA-256, de les carpetes homònimes i de les carpetes de la carpeta pare que confonen, com «Som%20de%20Poble» al costat del contenidor. El laboratori, els builds, l'arxiu fred i el repositori no es jutgen: es mesuren amb l'inventari.
- `node tooling/gates/cartograf-som-de-poble.mjs --inventari` llig en temps real cada carpeta de l'arrel: fitxers, carpetes, mida, profunditat, symlinks (i si ixen del contenidor) i noms estranys o invisibles dins del contenidor. No desa cap catàleg dins de Git. `--json` dona el detall sencer, `--profunditat=N` en limita el recorregut i `--strict` falla per entrades fora del mapa, noms estranys o symlinks no autoritzats que ixen del contenidor.

El procediment per a les IAs és la skill `.agents/skills/core-cartografia-contenidor-som-de-poble/SKILL.md`.

## 2. On va cada cosa

- **`socdepoble.org/`** · El codi viu i la Wiki activa (`_wiki_de_poble/`): l'aplicació web, mòbil i WordPress, les migracions de Supabase, les portes (`tooling/gates/`), l'Escriptori (`04_escriptori/`), el Llibre Mestre i les Actes Marmota (`10_actes/`). *Qui la fa servir:* Persones i totes les IAs, amb torns i carrils.
- **`_cultura_de_poble/`** · El tresor cultural i patrimonial (només lectura per al codi), en tres subdominis: `menjar_i_beure_de_poble/` (receptari «Què dinem?», làmines, al·lèrgens), `musica_i_festa/` (etnografia, auques, campanes, festes, música, rondalles) i `patrimoni_i_llengua/` (llibres de Pep Cascant, pou de neu, Trilogia Mediterrània i molí de La Torre, gràfics etnogràfics). *Qui la fa servir:* Custòdia del Mestre i proves de patrimoni amb SHA-256 (`SDP_CULTURA_DE_POBLE`).
- **`_investigacio_ia_de_poble/`** · El laboratori d'enginyeria IA: kits CAS verificats (`SHA256SUMS`) abans d'integrar-los a Git, dossiers de cada onada i la biblioteca de cultura tècnica destil·lada del Node 0. *Qui la fa servir:* MarIA, Claude, Codex, Gemini i el Node 0.
- **`_builds_de_poble/`** · Empaquetats de botigues: WordPress (ZIP), Android, iOS, fitxes d'App Store i Google Play, i els worktrees i clons d'integració de `sandboxes_r26/`. *Qui la fa servir:* Scripts de botigues i revisions de llançament.
- **`_gestoria_de_poble/`** · Legal, fiscal i subvencions: identitat legal, facturació, burocràcia i memòries d'ajudes. *Qui la fa servir:* Mestre i mòduls de Gestoria.
- **`_oficina_de_poble/`** · Caixa forta: claus, certificats i factures de maquinari. Mai entra en cap paquet extern. *Qui la fa servir:* Només el Mestre.
- **`_multimedia_de_poble/`** · Fons visual i audiovisual de treball: originals ràster, il·lustracions i captures de disseny. *Qui la fa servir:* Mestre i disseny gràfic.
- **`_comunicacio_de_poble/`** · Relat i comunicació: dossiers institucionals i memòria narrativa. *Qui la fa servir:* Mestre i portaveu institucional.
- **`_salut_de_poble/`** · Recerca de salut comunitària per als mòduls de salut rural. *Qui la fa servir:* Mestre i recerca.
- **`_recursos_de_poble/`** · Enllaços i referències (`.webloc`) a consoles i documentació d'eines. *Qui la fa servir:* Mestre.
- **`_raw_de_poble/`** · Safata històrica congelada (juliol a octubre de 2026). No s'hi afig res. *Qui la fa servir:* Congelada fins al buidatge.
- **`_arxiu_wiki_de_poble/`** · Arxiu fred de la Wiki. Mai entra en el RAG viu. Només hi entra el que ix de la Wiki viva amb Doble Custòdia (D3): etiqueta git anotada i entrada a `00_manifest_arxiu_fred.json`. *Qui la fa servir:* Consulta puntual.
- **Entrades de sistema de l'arrel** · `.claude/` (el mirall local de les skills per a Claude, que no es versiona), `.gitignore` i les paperes `.sdp-paperera-*`. El cartògraf les accepta i no són llars de contingut.

## 3. Àlies i còpies justificades

- **Symlinks.** El cartògraf declara els únics autoritzats i la prova que en depén. Hui: `_cultura_de_poble/trilogia_mediterrania_i_moli_la_torre` (el llig `src/data/patrimoni/arbresMonumentals.js`) i els índexs per autor de `patrimoni_i_llengua/llibres_de_pep_cascant/`. Quan el codi deixe de dependre'n, es retiren.
- **Còpia binària servida pel web.** El llibre «Què dinem?» té l'original a `_cultura_de_poble/menjar_i_beure_de_poble/` i una còpia a `socdepoble.org/public/assets/uploads/patrimoni/que-dinem/`, perquè Firebase Hosting la servisca al botó de descàrrega. La seua empremta és a `DUPLICATS_JUSTIFICATS_SHA256` del cartògraf.

## 4. Regles

- Cap carpeta nova a l'arrel sense l'aprovació del Mestre i, en el mateix canvi, la seua fila en este mapa i a la taxonomia del cartògraf.
- Cap symlink d'accés ràpid, cap duplicat pesant sense justificar i res nou a `_raw_de_poble/`.
- Abans de retirar un duplicat: comprovar que cap mòdul ni prova en depén, verificar-ne la identitat i demanar confirmació al Mestre.

## Vincles

- [[00_index_maquina]]
- [[00_arquitectura_tecnica_unificada]]
