---
type: document
status: esborrany
description: 'Pla d''acció per a la jornada nocturna autònoma: aplicació del sanejament de Consola, poda del sediment d''escriptori, cens d''imatges i harmonització d''skills.'
tags:
  - implementacio
visibility: private
reflex: sdp:torn_781fa9aa-db61-4c55-9124-baacd8c21800:f4af3888-9e8d-4446-bb42-8887ddd136bc
---
# Pla d'implementació per al sanejament de Consola, Llei del Tauler Net, Mòduls 8 i 9 i deutes tècnics del Llibre Mestre

**Estat del Pla:** [en elaboració | aprovat | acabat | descartat]

<!-- SDP:SECTION pla.implementacio.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_781fa9aa-db61-4c55-9124-baacd8c21800:f4af3888-9e8d-4446-bb42-8887ddd136bc |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-26T01:06:27.576Z |
| Modificació | 2026-10-26T01:10:00.000Z |
| Propietari | IAIA MarIA |
| Aprovació humana | Mestre Javi Llinares |
| Plantilla | _wiki_de_poble/03_actuar/plantilles/pla_implementacio.md (v2.0.0) |
| Model IA | Antigravity 2.0 (IAIA MarIA) |
| Tokens consumits | ~8.500 |

<!-- SDP:SECTION pla.implementacio.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/03_actuar/plantilles/pla_implementacio.md; SHA-256 d05074ef89d1ec60596509565d7ac7a1e02b0e2bed1b304311b7fa651b0d23d0. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION pla.implementacio.s3 -->
## Historial

- 2026-10-26T01:06:27.576Z: esborrany canònic creat sota torn `torn_781fa9aa-db61-4c55-9124-baacd8c21800`.
- 2026-10-26T01:10:00.000Z: pla de treball consolidat per a la jornada nocturna autònoma de la Colmena Integral (Claude, Codex, Gemini).

<!-- SDP:SECTION pla.implementacio.s4 -->
## Canvis proposats

### 1. Visió Estratègica: Tauler Net i Excel·lència de Pedra Seca
Aquest pla estructura l'execució nocturna autònoma per portar el sistema a **zero incidències de portes, zero alertes roges a la Consola i neteja radical del llast documental**:

---

### 2. Full de Ruta en 5 Fites Específiques

#### FITA 1 · Sanejament de la Consola Termodinàmica i Resegellat CAS
- **Objectiu:** Passar `run-portes.mjs --diagnostic` a 5/5 portes verdes i portar la Consola de 7 avisos alts a només 2 (les tasques programades de launchd).
- **Accions:**
  1. **Exempció Canònica del Llibre Mestre a `tooling/documental/turns.mjs:201`:**
     - Afegir `_wiki_de_poble/04_escriptori/03_llibre_mestre_tasques_i_idees.md` al conjunt d'arxius estructurals permanents de l'Escriptori exempts de rebut termodinàmic (`reflex`).
     - Sanejar el frontmatter del Llibre Mestre: substituir els tags invàlids (`full_de_ruta`, `backlog`, `llibre_mestre`) per `[govern, arquitectura, pla]` i afegir `## Vincles` al final.
  2. **Frontmatters d'Skills:**
     - Aplicar les correccions a `core-salfumant-radical`, `core-seguretat-audit`, `sdp-vigilant-tellado` i `core-gauntlet-loop` garantint descripcions `<= 220` caràcters i tags d'enum.
  3. **Resegellat Compare-And-Swap:**
     - Regenerar catàleg de skills i resegellar `SKILLS_SEAL.json` al hash `7df7a6fc4c997a35f0f89542233eacd79266d2d080e7724b4fbb561538afa97a`.
  4. **Tancament de 108 Torns Caducats:**
     - Executar `tooling/session/saneja_torns_caducats.mjs` tancant els 108 torns per expiració sense fabricar falses acreditacions de fitxers (C0145-01).

#### FITA 2 · Poda del Sediment Fòssil de l'Escriptori (Fulminar 944 Errors d'Enllaços)
- **Objectiu:** Resoldre el 82,2% dels errors de `VerificadorSCC`.
- **Accions:**
  - Podar les línies 51–1063 de `_wiki_de_poble/04_escriptori/00_index_escriptori.md`, eliminant les àncores fòssils a laboratoris que ja estan a `_investigacio_ia_de_poble/`.
  - Moure els fitxers residuals de `04_escriptori/02_investigacio_ia/` cap a `../_investigacio_ia_de_poble/`.
  - Verificar la caiguda massiva d'errors a `tooling/gates/verificador-scc.mjs`.

#### FITA 3 · Mòdul 8: Cens d'Imatges i Blindatge de la Imatge Única
- **Objectiu:** Traçabilitat de 480 imatges i garantia d'estil Bruguera/Berlanga.
- **Accions:**
  - Implementar `tooling/media/cens_imatges.mjs` per generar el cens automàtic de les 480 peces de `public/assets/`, identificant les 149 orfes.
  - Documentar a `src/sections/consola/imatgesConsola.js` la substitució pendent de les 4 imatges esborrany (`Actors`, `Salut`, `Fluxos`, `Calendari`).
  - Aïllar les 26 còpies físiques duplicades d'avatars a `EXCLOSES`.

#### FITA 4 · Mòdul 9: Harmonització i Poda de les 40 Skills
- **Objectiu:** Corregir referències trencades i eliminar solapaments.
- **Accions:**
  - Substituir `schema.js` per `schema.json` a `core-maquetacio-markdown` i `core-taxonomia-estricta`.
  - Reparar la comanda de Node a `core-consell-i-colmena`.
  - Harmonitzar els 4 clústers cognitius detectats en les auditories de Codex i Gemini.

#### FITA 5 · Deutes Tècnics Prioritaris del Llibre Mestre
- **Objectiu:** Polir l'experiència d'usuari i la robustesa de l'aplicació.
- **Accions:**
  - `P1-16`: Corregir el desbordament de taules amples a `estructura-gestor`.
  - `P1-20`: Preparar el suport per a documents de 20 MB al xat.

<!-- SDP:SECTION pla.implementacio.s5 -->
## Verificació

1. **Porta Olivera:** `node tooling/gates/porta-olivera.mjs` retornant 0.
2. **Cadena de Portes:** `node tooling/gates/run-portes.mjs --diagnostic` amb 5/5 portes verdes (0 fallades).
3. **Precommit Suite:** `npm run test:precommit` amb 3.410 proves verdes.
4. **Verificador SCC:** Comprovació de reducció d'errors d'enllaços a `tooling/gates/verificador-scc.mjs`.

<!-- SDP:SECTION pla.implementacio.s6 -->
## Riscos

| Risc | Impacte | Mitigació |
| :--- | :---: | :--- |
| **Fallada transaccional en aplicar pegats** | Mitjà | Preflight en còpia temporal abans de tocar fitxers vius, amb procediment de recuperació segons C0145-05. |
| **Falsa verificació en caducitat de torns** | Mitjà | Registrar caducitat sense crear falsos hashes de verificació de fitxers. |

<!-- SDP:SECTION pla.implementacio.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
- [[03_llibre_mestre_tasques_i_idees]]
- [[261026_0145_auditoria_gemini]]
- [[261026_0145_auditoria_codex]]
- [[261026_0200_acta_marmota_triomf_gauntlet_360_sanejament_consola_i_relleu_nocturn]]
