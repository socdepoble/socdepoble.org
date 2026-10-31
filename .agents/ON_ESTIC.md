---
type: document
status: generat
description: Punter d'arrencada de sessió generat per despertar.mjs
---
# ON_ESTIC.md (Punter de Sessió)

> [!IMPORTANT]
> **GENERAT:** 2026-10-31T02:38:47.912Z
> Aquest document l'`@`-importa `CLAUDE.md`, i eixa importació es resol ABANS
> que el hook l'escriga: la còpia que tens al context és la de la sessió
> anterior. Per això **ací no hi ha cap llista de l'Escriptori**: la d'ahir
> apuntava a documents que ja són a `90_arxiu_historic/`, i AGENTS §5 prohibix
> llegir eixa carpeta en procediments automàtics.

**Branca Git:** backup-notes-publish
**Commit:** d6ab025f4

## 1. Contingut de l'Escriptori (Taula de Treball)

No el tens ací, i és a propòsit. Tens dos maneres d'obtindre'l fresc:

- L'eixida del hook `SessionStart` d'aquesta sessió (canal fresc), o
- `node tooling/brain/despertar.mjs` (`npm run despertar`), que l'imprimix.

Si no tens cap de les dues, llista `_wiki_de_poble/04_escriptori/` amb una eina abans de decidir res.

## 2. Resum de l'ESTAT recent

Últim relleu anotat a `.agents/ESTAT.md` (primera capçalera del fitxer):

## ESTAT_ACTUAL · 2026-10-31T03:38:00+01:00 · Claude · Tancament pre-desplegament del prompt 261030_2208 (cobertura social, Consola pública amb instantània, tauler d'Umami, llistes i portes)

- **Torn i ordre:** `torn_f298d1e0-3122-47a0-b815-bf2f719c5be3` (code). [Prompt 2208](../_wiki_de_poble/90_arxiu_historic/261030_2208_prompt_claude_tancament_seo_consola_publica_i_telemetria_didactica.md) amb les auditories vespertines de [Gemini](../_wiki_de_poble/90_arxiu_historic/261030_2114_auditoria_vespertina_gemini.md) i [Codex](../_wiki_de_poble/90_arxiu_historic/261030_2114_auditoria_vespertina_codex.md), i les ordres del Mestre al xat de la nit del 30 al 31-10. Informe: [261031_0040_auditoria_claude](../_wiki_de_poble/04_escriptori/261031_0040_auditoria_claude.md).
- **Fet (sense commit ni desplegament):**
  - **T1 · Cobertura social:** 34 rutes públiques amb `og:image` pròpia al client, al manifest i a l'HTML prerenderitzat (8 de plugins, 10 de `/page`, `/wikidepoble`, `/disseny`, `/consola`, 9 pàgines i 4 del Govern), amb 26 variants socials noves.
  - **T2 · Obertura pública:** `/disseny` i `/consola` públiques i indexables; la Consola es munta sense guarda i, a cada build web, publica una instantània sanejada (fail-closed) de les seues quatre fonts; textos de consola, cervell i fediversity certs i frontissa 16/16.
  - **T3 · Telemetria:** tauler nadiu d'Umami sense iframe, construït amb l'organisme reutilitzable de Pedra Seca `QuadreDeComandament` i el full `src/css/taulers.css`; textos didàctics; cap enviament des d'un servidor local.
  - **T4 · Polits:** prosa del contracte de la graella, fila de l'enllaç de la imatge només a l'Arxiu o amb enllaç públic, vinyeta de Fedivers a sang.
  - **Llistes:** `--sdp-li-gap` a 4px i cap llista de text que sume `gap` al marge dels `<li>`.
  - **Documents i portes:** rebuts renovats de 14 documents de l'Escriptori; portes del cens arreglades segons les decisions del Mestre (Consell, Llavor, Rutes, Nomenclatura N2, Crom, Doctrina, Promesa, Llaurador); dades personals retirades d'una fila del Llibre Mestre perquè la matriu del Govern ara es publica.
- **Per al Mestre:** posar l'enllaç d'Umami amb la `m` minúscula al seu fitxer d'entorn de producció abans del build de desplegament; Reflex i Nomenclatura N1 després del commit; la part C de Pedra Seca i els punts 5 i 6 de Tokens; les decisions D-1 a D-6 de les llistes; i la resta de decisions de l'informe.
- **Porta final:** Vitest 26.725 passades i 0 fallades, `test:node` 1.713 i 0, `test:precommit`, ESLint, Doctrina, Promesa, Frontmatter, segell, LEDGER, frontissa 16/16 i Olivera en verd; el cens de `run-portes` en deixa 7 de roges, quatre per decisió del Mestre (Reflex, Nomenclatura N1, Pedra Seca i Tokens) i tres per un enllaç de l'índex a una acta de MarIA amb un altre nom.
- **Torn:** no s'ha tancat amb `--close`. Falten un pla d'implementació del prompt 2208 per a vincular-lo, el reconeixement del canvi autoritzat a la zona humana (`contracte_graella.md`, que este torn no pot fer mecànicament) i l'enllaç de l'índex a l'acta de MarIA; no es fabrica cap tancament.
- **Fronteres:** cap commit, push, desplegament, `npm install`, SQL remot ni lectura de fitxers d'entorn.

## 3. Què has de fer ara?

1. Aconseguix la llista viva de l'Escriptori (§1) i llig el que hi haja.
2. Contrasta el relleu amb l'última Acta Marmota de `_wiki_de_poble/10_actes/`.
3. Espera les ordres del Mestre.

## Vincles

- [[00_index]]
