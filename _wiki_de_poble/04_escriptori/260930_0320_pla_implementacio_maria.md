---
type: document
status: esborrany
description: Pla de la nova sessio
tags:
  - implementacio
visibility: private
reflex: sdp:torn_f734b982-8506-4d18-8c15-c593bdaf497f:42595a43-53f4-4c0b-b35a-4f2e2ef8b97c
---
# Pla Implementacio MarIA

**Estat del Pla:** [en elaboració | aprovat | acabat | descartat]

<!-- SDP:SECTION pla.implementacio.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_f734b982-8506-4d18-8c15-c593bdaf497f:42595a43-53f4-4c0b-b35a-4f2e2ef8b97c |
| Versió | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-09-30T01:20:21.643Z |
| Modificació | 2026-09-30T04:30:00.000Z |
| Propietari | MarIA |
| Aprovació humana | pendent |
| Plantilla | _wiki_de_poble/03_actuar/plantilles/pla_implementacio.md (v2.0.0) |
| Model IA | [pendent] |
| Tokens consumits | [pendent] |

<!-- SDP:SECTION pla.implementacio.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/03_actuar/plantilles/pla_implementacio.md; SHA-256 99b143078fb4534160d2f52deaf0ff9ef1d64ad9d4472c1665f46fe82b894bd1. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION pla.implementacio.s3 -->
## Historial

2026-09-30T01:20:21.643Z: esborrany creat; contingut i verificació pendents.
2026-09-30T04:30:00.000Z: Pla omplert amb les sis llesques, decisions obertes i pla de verificació.

<!-- SDP:SECTION pla.implementacio.s4 -->
## Canvis proposats

### 1. Context i Troballes (Les Sis Llesques)
S'ha finalitzat el workflow d'auditoria (SDD) de les 6 tasques actuals:
- **T1 & T3 (UI Tauler i Mètriques):** La Consola no ha d'usar `h5` per als estats, ja que embruta l'Índex. Usarem `ul.sdp-consola__estats` amb Insígnies.
- **T4 (Google Translate):** Es retirarà el widget l'1 d'octubre de 2026 i, a més, trenca el DOM virtual de React. Cal reemplaçar-lo.
- **T5 (Dades del Mur / Frontmatter):** S'han localitzat 22 problemes de frontmatter i 101 torns caducats que cal corregir.
- **T6 (Actualitzacions Automàtiques WP):** La columna buida es deu a com WordPress processa el filtre `update_plugins_socdepoble.org`. Aquest s'executa només si rep un 200 de la API i si el plugin està activat. També cal compilar (`npm run build:wp`) per evitar avisos del shortcode `[socdepoble_app]`.

### 2. Decisions Obertes (Per al Mestre)
1. **Google Translate (T4):** Atés que es retira demà i trenca React, procedim a implementar un servei de traducció alternatiu (com Bergamot o lliure) o eliminem temporalment la funcionalitat?
2. **Actualització del Mur (T5):** Els 101 torns caducats i els 22 errors de frontmatter: els corregim manualment o executem un script automatitzat per reparar-los en bloc?
3. **Columna Plugin WP (T6):** Modifiquem el comportament de l'actualitzador per forçar la renderització d'estat encara que no hi haja 200 de WordPress.org, o l'integrem tal qual està documentat?

### 3. Canvis Proposats i Llesques d'Implementació

#### [Acció: MODIFY] `src/sections/consola/ConsolaPagines.jsx` / Mètriques (T1/T3)
- Refactoritzar les mètriques d'estat perquè utilitzen la classe `ul.sdp-consola__estats` i elements `li` en lloc de tags `h5`, per mantenir l'Índex net de `PageFrame`.

#### [Acció: MODIFY] `wordpress-plugin/actualitzador.php` (T6)
- Gestionar millor el feedback del filtre `update_plugins_socdepoble.org` o documentar l'estat buit condicionat.

#### [Acció: MODIFY] Fitxers del Mur i Torn (T5)
- Script de correcció o ajustos manuals als `.md` per resoldre els torns caducats i problemes de Frontmatter.

#### [Acció: MODIFY] Fitxers relacionats amb Traducció (T4)
- Retirar/refactoritzar la incrustació de Google Translate.

### 4. Pla de Verificació
- **Unitàries:** `npm run test` per als components modificats.
- **Visuals:** Verificació visual a la consola i l'explorador a resolucions de 1440px i 375px. 
- **WordPress:** Provar el build del plugin amb `npm run build:wp` i verificar-lo a Studio.

<!-- SDP:SECTION pla.implementacio.s5 -->
## Verificació

- [ ] Proves unitàries de Vitest passades en verd.
- [ ] Validació visual sense desbordaments (1440 i 375).
- [ ] Verificació del segell d'Antigravity (`node tooling/gates/tancament.mjs`).

<!-- SDP:SECTION pla.implementacio.s6 -->
## Riscos

- T4 (Traductor): Canviar el sistema de traducció de cop podria implicar carregar llibreries pesades.
- T5 (Dades): Modificar de forma automatitzada tants fitxers frontmatter requereix assegurar que no trenquem cap referència d'ancoratge al Mur.

<!-- SDP:SECTION pla.implementacio.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
