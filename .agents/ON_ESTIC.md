---
type: document
status: generat
description: Punter d'arrencada de sessió generat per despertar.mjs
---
# ON_ESTIC.md (Punter de Sessió)

> [!IMPORTANT]
> **GENERAT:** 2026-10-04T09:17:45.275Z
> Aquest document l'`@`-importa `CLAUDE.md`, i eixa importació es resol ABANS
> que el hook l'escriga: la còpia que tens al context és la de la sessió
> anterior. Per això **ací no hi ha cap llista de l'Escriptori**: la d'ahir
> apuntava a documents que ja són a `90_arxiu_historic/`, i AGENTS §5 prohibix
> llegir eixa carpeta en procediments automàtics.

**Branca Git:** backup-notes-publish
**Commit:** f23dcf2b

## 1. Contingut de l'Escriptori (Taula de Treball)

No el tens ací, i és a propòsit. Tens dos maneres d'obtindre'l fresc:

- L'eixida del hook `SessionStart` d'aquesta sessió (canal fresc), o
- `node tooling/brain/despertar.mjs` (`npm run despertar`), que l'imprimix.

Si no tens cap de les dues, llista `_wiki_de_poble/04_escriptori/` amb una eina abans de decidir res.

## 2. Resum de l'ESTAT recent

> [!WARNING]
> L'ESTAT s'ha llegit del capçalera sense segell horari: no es pot datar. El fitxer viu més recent és `_wiki_de_poble/04_escriptori/261004_1045_auditoria_codex.md`.

Últim relleu anotat a `.agents/ESTAT.md` (primera capçalera del fitxer):

## ESTAT_ACTUAL · 2026-10-04 11:07 · Codex · ampliació beta, Sollutia i paquet

**Torn `torn_a6932539-8ecf-4fae-84b4-02faa6959a8e`; informes [[261004_1010_auditoria_codex]] i [[261004_1045_auditoria_codex]], v1.1.0, vàlids.** Rellegits els relleus 19–20 de Claude i el prompt de tancament 1045. Claude accepta F01–F06; al tall de font rellegit els pegats comptables encara no han arribat. Auditoria i relleu documental, sense font productiva editada.

**F07, bloqueig d'acceptació beta:** la pàgina real `/registre?mode=entrar` carrega, mostra servidor no disponible i desactiva Google, correu, contrasenya, entrada i recuperació. El reintent conserva el bloqueig. Vite servix la pàgina. Claude identifica després el node local 127.0.0.1:54321 apagat; el contrast propi no troba cap procés escoltant. Bloqueig d’entorn local, sense regressió de codi demostrada; entrada remota de producció sense prova pròpia. Cap credencial escrita ni compte creat.

**Verificació T3:** 397/402 al bloc ampliat de 20 suites; 94/96 al repàs aïllat App + identitat. Xat i Consola ja passen al repàs; resten les dues discrepàncies entre la barra mòbil actual i els tests de Telefonades/ordre. Connector WordPress: 55/56, amb marcatge `base-path`/`ruta-a-url` i expectativa antiga per reconciliar. UI i sessió consumixen port genèric, salut/recuperació opcionals; cap prova d'endpoints Sollutia reals.

**Producció:** ZIP 1.0.2 de les 05:27 coherent amb manifest i inventari, 215/215 fitxers sense divergències. És anterior als poliments; 1.0.3 anunciada per Claude encara sense artefacte observat. El hook que Claude declara no s'ha interpretat com una compilació feta ni com un bloqueig de Codex. Cap desplegament.

**Abast visual:** RSS Compartir continua confirmat a font; marge de dues barres present, sense contrast final propi de scroll/apilament en WordPress. Les troballes visuals noves del relleu 20 de Claude queden atribuïdes a ell i pendents de verificació independent. Olivera verda i dos informes vàlids; tancament global valid:false, 1.208 incidències i context_loaded, sense resegellar història aliena. Pla mecànic i deute global pendents; no són 1.208 defectes de producte.

##### ESTAT_ACTUAL · 2026-10-04 10:57 · Claude · Creuament Codex i Integració Final (Relleu 20)

**Informe de Claude (Relleu 20):** L'informe de Codex ha sigut llegit sencer i creuat amb l'auditoria pròpia. Les tasques prèvies seguixen en marxa.
- **Troballes de Codex a integrar:** Errors crítics en Facturació (F01, F02, F03), Nevera UI (F04), Compartir del Lector (F05) i tipografia a tokens (F06).
- **Troballes de Claude a integrar:** Marges de la barra mòbil tapant contingut i el salt de l'Índex dins de WP, que es dibuixa sense estils (vici d'enxufabilitat a erradicar per a Sollutia). El Lector encara no usa UniversalCard.
- **Pla de Tancament:** Quan acaben els poliments en curs, es farà la integració conjunta (separada per fronts amb verificadors). A continuació proves netes, captures, i finalment es deixarà tot a punt (1.0.3) perquè MarIA en compile el *bundle*.

## 3. Què has de fer ara?

1. Aconseguix la llista viva de l'Escriptori (§1) i llig el que hi haja.
2. Contrasta el relleu amb l'última Acta Marmota de `_wiki_de_poble/10_actes/`.
3. Espera les ordres del Mestre.
