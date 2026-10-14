---
type: document
status: generat
description: Punter d'arrencada de sessió generat per despertar.mjs
---
# ON_ESTIC.md (Punter de Sessió)

> [!IMPORTANT]
> **GENERAT:** 2026-10-14T02:08:13.776Z
> Aquest document l'`@`-importa `CLAUDE.md`, i eixa importació es resol ABANS
> que el hook l'escriga: la còpia que tens al context és la de la sessió
> anterior. Per això **ací no hi ha cap llista de l'Escriptori**: la d'ahir
> apuntava a documents que ja són a `90_arxiu_historic/`, i AGENTS §5 prohibix
> llegir eixa carpeta en procediments automàtics.

**Branca Git:** backup-notes-publish
**Commit:** 09d22e64

## 1. Contingut de l'Escriptori (Taula de Treball)

No el tens ací, i és a propòsit. Tens dos maneres d'obtindre'l fresc:

- L'eixida del hook `SessionStart` d'aquesta sessió (canal fresc), o
- `node tooling/brain/despertar.mjs` (`npm run despertar`), que l'imprimix.

Si no tens cap de les dues, llista `_wiki_de_poble/04_escriptori/` amb una eina abans de decidir res.

## 2. Resum de l'ESTAT recent

> [!WARNING]
> ESTAT RANCI: l'últim relleu és de 261014_0330 i `_wiki_de_poble/04_escriptori/00_index_escriptori.md` s'ha tocat 37 min després. Hi ha faena feta que ningú ha anotat a `.agents/ESTAT.md`.

Últim relleu anotat a `.agents/ESTAT.md` (primera capçalera del fitxer):

## ESTAT_ACTUAL · 2026-10-14 03:30 · IAIA MarIA · Relleu Nocturn del Consell de les 4 IAs i Directives del Mestre

- **Estat del Consell i Coordinació Autònoma:**
  * **IAIA MarIA (Directora Tècnica):** Operant en mode autònom (`core-direccio-autonoma`), coordinant el relleu nocturn entre torns.
  * **Gemini 4 Argon High:** Ha lliurat la Gran Auditoria Atòmica Integral (v2.0.0) a `_wiki_de_poble/04_escriptori/261014_0148_auditoria_gemini4.md` (43 KB) amb 7 missions i 3 tractors JS complets (`tractor-temps-termodinamic.mjs`, `tractor-portaveu.mjs`, `tractor-llegibilitat.mjs`). S'ha preparat el prompt per a la seua segona empenta nocturna.
  * **Claude Code:** Ha entregat la solució al segrest de hash d'escriptori (`EntradaDelPoble.jsx`), la guarda `mitjaOpac` d'avatars, i ha encetat `261014_0320_auditoria_claude.md`.
  * **GPT Codex:** Ha lliurat l'auditoria adversarial profunda a `261014_0235_auditoria_codex.md` (44 KB).
- **Progrés Tècnic Realitzat en Aquest Torn:**
  * **Supabase Local (127.0.0.1:54321):** Sóc de Poble (`48e85bb4-9a18-49d3-9a87-c9288ec03079`) i Rentonar (`259e6cce-7700-4086-ae0b-98425f88e351`) assignats a Javi Llinares (`7b472893-0b89-402f-afdd-ca48359c139e`). Logo oficial resolt en verd (`logo-socdepoble-cuadrat-verd-256x256.png`).
  * **Terminologia:** "Notes personals" rebatejat a **"Bloc de notes"** a `src/config/i18n.js` en 5 idiomes.
  * **Calaix «Amb qui actues?»:** Botons inferiors estilitzats a `components.css` al 100% d'ample i apilats verticalment.
- **Directives Clau del Mestre (03:15h - 03:30h):**
  1. **Diferenciació Espai d'Usuari vs. Bloc de Notes:** El Bloc de Notes és un workspace editorial (com la Wiki o Disseny). L'espai d'usuari (`/el-meu-perfil` amb `PerfilShell.jsx`) és l'espai de gestió d'identitats, fitxa i ajustos. En fer clic a una identitat al calaix, ha de quedar clar si es canvia d'actor d'edició o si es navega a la gestió de l'actor.
  2. **Barra Taronja en Actuar com a Sóc de Poble:** En actuar com a Sóc de Poble, la barra taronja ha de carregar automàticament l'autoria de Sóc de Poble (logo verd oficial) i no un avatar buit o silueta negra de Foraster.
  3. **Taula del Full Trimestral (`/app/gestoria/full`):** Ha d'ocupar la pantalla completa (`width: 100%`), millorar l'ergonomia dels camps editables (fal.ai, Google Cloud, Som Energia, Anthropic), i resoldre/clarificar visualment les incidències detectades sense espantar l'usuari.
  4. **Error en Consola:** Investigar i blindar l'error d'ErrorBoundary detectat a la consola: `Error: useSession ha de ser usat dins de SessionProvider at useSession at useIdentitatDeLaBarra at TopBar2`.
- **Higiene:** Escriptori net (Porta Olivera en 0). Acta Marmota `261014_0330_acta_marmota.md` redactada i vinculada.

## 3. Què has de fer ara?

1. Aconseguix la llista viva de l'Escriptori (§1) i llig el que hi haja.
2. Contrasta el relleu amb l'última Acta Marmota de `_wiki_de_poble/10_actes/`.
3. Espera les ordres del Mestre.

## Vincles
- [[00_index]]
