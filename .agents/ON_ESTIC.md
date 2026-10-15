---
type: document
status: generat
description: Punter d'arrencada de sessió generat per despertar.mjs
---
# ON_ESTIC.md (Punter de Sessió)

> [!IMPORTANT]
> **GENERAT:** 2026-10-14T18:30:26.516Z
> Aquest document l'`@`-importa `CLAUDE.md`, i eixa importació es resol ABANS
> que el hook l'escriga: la còpia que tens al context és la de la sessió
> anterior. Per això **ací no hi ha cap llista de l'Escriptori**: la d'ahir
> apuntava a documents que ja són a `90_arxiu_historic/`, i AGENTS §5 prohibix
> llegir eixa carpeta en procediments automàtics.

**Branca Git:** backup-notes-publish
**Commit:** 31d93d88

## 1. Contingut de l'Escriptori (Taula de Treball)

No el tens ací, i és a propòsit. Tens dos maneres d'obtindre'l fresc:

- L'eixida del hook `SessionStart` d'aquesta sessió (canal fresc), o
- `node tooling/brain/despertar.mjs` (`npm run despertar`), que l'imprimix.

Si no tens cap de les dues, llista `_wiki_de_poble/04_escriptori/` amb una eina abans de decidir res.

## 2. Resum de l'ESTAT recent

> [!WARNING]
> ESTAT RANCI: l'últim relleu és de 261014_1505 i `_wiki_de_poble/04_escriptori/261014_2015_prompt_claude_i_gemini4_quadre_comandament_gestoria.md` s'ha tocat 5 h després. Hi ha faena feta que ningú ha anotat a `.agents/ESTAT.md`.

Últim relleu anotat a `.agents/ESTAT.md` (primera capçalera del fitxer):

## ESTAT_ACTUAL · 2026-10-14 15:05 · IAIA MarIA · Sanejament d'Escriptori, Plugin WP 1.1.2, Portada Fedivers i Pla d'Enginyeria Inversa

- **Porta Olivera en Verd i Higiene Documental:**
  * 12 documents de torns consumits de la matinada (01:30 a 04:25) arxivats formalment a `_wiki_de_poble/90_arxiu_historic/` mitjançant `porta-olivera.mjs`.
  * `00_index_escriptori.md` actualitzat automàticament sense àncores fantasma ni residus.
- **Connector WordPress v1.1.2 («Sóc de Poble. Portal de Pobles Connectats»):**
  * Eliminat el terme d'enginyeria «Enxufe» de la interfície d'usuari i consolidat el nom oficial.
  * Humanitzada la descripció pública evitant argot tècnic.
  * Eliminat el missatge críptic de canal no verificat a la columna d'actualitzacions automàtiques de WordPress.
  * Paquet ZIP v1.1.2 generat i signat a `wordpress-plugin/builds/`. 17/17 tests de l'enxufe verds.
- **Portada Còmic de /fedivers (Escola Bruguera / Francisco Ibáñez):**
  * Generada la il·lustració a sang sense vores blanques (`/assets/ui/plugins/fedivers_vinyeta.jpg`) amb dos pobles connectats per pots de llauna, coloms missatgers i el tractor verd amb antena parabòlica de fusta.
  * Vinculada a `src/sections/text/pageContent.js` i adaptat el banc de proves `TextSection.recursos.test.jsx` (4/4 tests verds).
- **Pla d'Implementació Sincronització d'Identitats, Xat i Gestoria (`261014_1450`):**
  * Creat i segellat sota el torn `torn_d54543b5`.
  * **Front A:** Reparació de l'avatar `JL` al rail del Xat (`ClosCaXat.jsx:371` mancant `src`).
  * **Front B:** Jerarquia d'avatar: prioritat absoluta de la imatge pujada a Sóc de Poble sobre la foto per defecte de Google OAuth.
  * **Front C:** Unificació d'Actor Actiu entre la TopBar (Sóc de Poble) i el Xat per eliminar l'esquizofrènia de perfils.
  * **Front D:** Proves unitàries i d'integració.
  * **Front E (Enginyeria Inversa REA):** Metodologia de desconstrucció estructural de WhatsApp Desktop (per al Xat) i simplificació radical de la Gestoria en 3 passos manuals inspirats en la claredat de Factura Directa / Holded.
- **Salut del Sistema:** 100% verd a les proves pertinents, dev server actiu a localhost:3340.

## 3. Què has de fer ara?

1. Aconseguix la llista viva de l'Escriptori (§1) i llig el que hi haja.
2. Contrasta el relleu amb l'última Acta Marmota de `_wiki_de_poble/10_actes/`.
3. Espera les ordres del Mestre.
