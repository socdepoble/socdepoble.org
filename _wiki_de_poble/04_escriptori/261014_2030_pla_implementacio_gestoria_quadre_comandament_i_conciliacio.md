---
type: document
status: esborrany
description: Pla d'implementació coordinat per a Claude, Gemini 4 i Codex per al Quadre de Comandament, correccions del 3T 2026, resolució d'avatar, plantilla gestoria XLSX i conciliació de factures
tags:
  - implementacio
visibility: private
reflex: sdp:torn_36186beb-43cd-49f8-b375-5ded76478491:3eb9b41c-ab70-46f4-9c64-1f115a314a05
---
# Pla d'Implementació · Gestoria de Poble, Quadre de Comandament, Conciliació i Exportació XLSX

**Estat del Pla:** aprovat per la Directora Tècnica (IAIA MarIA)

<!-- SDP:SECTION pla.implementacio.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_36186beb-43cd-49f8-b375-5ded76478491:3eb9b41c-ab70-46f4-9c64-1f115a314a05 |
| Versió del document | 1.1.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-14T18:27:04.921Z |
| Modificació | 2026-10-14T19:30:00.000Z |
| Propietari | maria |
| Aprovació humana | delegada al 100% a la Directora Tècnica (IAIA MarIA) pel Mestre Javi |
| Plantilla | _wiki_de_poble/03_actuar/plantilles/pla_implementacio.md (v2.0.0) |
| Model IA | IAIA MarIA + Claude Opus 5.5 + Gemini 4 Argon High |
| Tokens consumits | ~110.000 tokens |

<!-- SDP:SECTION pla.implementacio.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/03_actuar/plantilles/pla_implementacio.md; SHA-256 d05074ef89d1ec60596509565d7ac7a1e02b0e2bed1b304311b7fa651b0d23d0. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION pla.implementacio.s3 -->
## Historial

2026-10-14T18:27:04.921Z: esborrany creat; contingut i verificació pendents.
2026-10-14T19:28:00.000Z: acord d'exclusivitat per a Claude i activació de Gemini 4 com a suport passiu continu.
2026-10-14T19:30:00.000Z: activació de core-direccio-autonoma pel Mestre Javi; la Directora Tècnica MarIA aprova el pla al 100% i dóna llum verda total a Claude.

<!-- SDP:SECTION pla.implementacio.s4 -->
## Canvis proposats

### 0. Coordinació de l'Olivera i Directiva Tècnica Autònoma
- **Delegació Suprema de Permisos:** El Mestre Javi Llinares ha delegat expressament el 100% de les decisions i permisos a la IAIA MarIA com a Directora Tècnica (`core-direccio-autonoma`).
- **Instrucció a Claude:** NO tornes a demanar intervenció humana ni faces preguntes d'espera al Mestre: ell no està present a la pantalla. La Directora Tècnica (MarIA) resol i aprova tots els camins directament.
- **Implementació en exclusiva per a Claude:** Claude té l'exclusivitat d'escriptura sobre `src/sections/gestoria/` per a completar la tasca sense interferències (Opció 1 triada pel Mestre). Ni Antigravity ni Gemini 4 editaran cap fitxer a `src/sections/gestoria/`.
- **Aprovacions Tècniques Immediates (Llum Verda Total):**
  1. **T1 (Trimestre Operatiu 3T):** Concedit. Implementa `trimestreOperatiu(avui)` i el rellotge amb compte enrere ("queden 6 dies") per al 3T.
  2. **T2 (Avatar):** Concedit. Es manté la via de Pedra Seca amb `useResolvedAsset` ja present al disc. Afig les proves i la derogació de frontera corresponent.
  3. **T3 (Quadre de Comandament i Plantilla Gestoria):** Concedit. Implementa la vista apilada "Plantilla Gestoria" amb `PlantillaGestoria.jsx` i la descàrrega oficial de `2026-FACTURACIO-3T.xlsx`.
  4. **Punt 5 (Barres i Peu):** Concedit. Accions visibles i inoperatives amb missatge honest (`onClickInoperatiu` / `accionsInoperatives`) per preservar la privacitat del cofre local-first.
  5. **T4 (Factures que Falten al 3T):** Concedit. Mòdul pur `nucli/facturesQueFalten.js` i alerta de despeses sense factura (Lowi, Som Energia, etc.).
- **Gemini 4 permanentment al teu servei:** Gemini 4 i MarIA estan en mode vigilant i standby actiu (cicle de revisió periòdica cada 15 minuts via cron), observant el diff de git, contrastant tests i acompanyant l'execució.
- **Canal de coordinació:** Claude pot demanar contrastos o registrar dubtes directament al seu canal viu (`261014_2035_auditoria_claude.md`).

### 1. Context i Troballes (Research & Auditories Prèvies)
- **Continuïtat de l'anterior pla:** El pla anterior (`261014_1450_pla_implementacio_sincronitzacio_identitats_i_xat.md`) va resoldre la unificació d'identitats de sessió, l'autorització i la privacitat del xat. Ara s'adapta i eleva per centrar tota l'atenció en la **fita financera urgent del 20 d'octubre de 2026 (presentació del 3T 2026)**.
- **Auditoria visual del Tauler (`/app/gestoria/tauler`):**
  1. *Trimestre per defecte:* Mostra `4T 2026` (iniciat l'1 d'octubre) ignorant que del 1 al 20 d'octubre la finestra activa davant d'Hisenda és la presentació del **3T 2026**.
  2. *Avatar anònim:* La barra taronja i les UniversalCards mostren `👤` en lloc de la foto de Javi Llinares.
  3. *Nomenclatura:* La vista `cabina` s'ha de rebatejar a `Quadre de comandament` (segons la metodologia de Xavier Mitjana).
  4. *Plantilla Gestoria:* La gestoria humana de Javi rebutja CSV i exigeix la plantilla específica Excel (`.xlsx`), ja codificada a `PLANTILLA_GESTORIA` (`src/sections/gestoria/nucli/plantilla.js:71`).
  5. *Detecció de factures pendents:* A la carpeta física `_gestoria_de_poble/02_Facturacio/2026_3T/` cal encreuar els moviments bancaris amb els PDF per a trobar proveïdors habituals sense factura (com Lowi o Google Workspace).

### 2. Canvis Concrets per Fitxers

#### A. `src/sections/gestoria/tauler/nucli/targetesTauler.js`
- Afegir `trimestreOperatiu(avui)`: si avui cau dins de la finestra de presentació d'un trimestre anterior (de l'1 al 20 d'octubre per al 3T), el trimestre per defecte serà el 3T.
- Ajustar `rellotgeDelTermini`: en fase `'presentacio'`, mostrar clarament els dies transcorreguts i els dies que resten fins al dia 20.

#### B. `src/sections/gestoria/tauler/Tauler.jsx`
- Actualitzar `VISTES_TAULER`: canviar el text de `cabina` per `'Quadre de comandament'`.
- Afegir la pestanya / vista **«Plantilla Gestoria»** per visualitzar la taula en format oficial de la gestoria i descarregar el `.xlsx`.

#### C. `src/sections/gestoria/tauler/ShellGestoria.jsx`
- Assegurar que `titular.avatar` es propaga correctament sense que `fontSegura` o filtres interns el transformen en null per a usuaris autenticats.
- Eliminar les restriccions dures `showComment={false} showShare={false} showConnect={false}` que despullaven la barra blava i el peu de pàgina de la Gestoria.

#### D. Mòdul d'Exportació i Detecció de Factures Faltants
- Connectar la generació del fitxer canònic `2026-FACTURACIO-3T.xlsx` a la carpeta `_gestoria_de_poble/02_Facturacio/2026_3T/`.
- Afegir l'assistent proactiu que creua `account_activities_*.csv` amb les factures en PDF existents, alertant si hi ha càrrecs de proveïdors recurrents (Lowi, Som Energia, DonDominio) que no tinguen el seu document justificatiu.

<!-- SDP:SECTION pla.implementacio.s5 -->
## Verificació

1. **Verificació Funcional Local:**
   - Obrir `http://localhost:3340/app/gestoria/tauler` i verificar que el trimestre inicial és el `3T 2026` i el progrés marca els dies que queden per al 20/10/2026.
   - Comprovar que l'avatar de Javi Llinares es pinta fidelment a la boina taronja i a les targetes.
   - Comprovar que la vista es titula "Quadre de comandament" i inclou la pestanya "Plantilla Gestoria".
2. **Verificació de Tests:**
   - Executar `npx vitest run src/sections/gestoria/` per assegurar que cap contracte ni test es trenca.
3. **Verificació de Governança:**
   - Executar `node tooling/gates/porta-olivera.mjs` i comprovar sortida 0.

<!-- SDP:SECTION pla.implementacio.s6 -->
## Riscos

- **Infracció de Signatures de Tractors:** No modificar fitxers de càlcul segellats (`nucli/model.js`, `PanellGestoria.jsx`) que invalidarien les empremtes de `tractors.js`. Tota millora de presentació i selecció viu a `tauler/`, `ShellGestoria.jsx` i adaptadors.
- **Ruptura de contracte de PaginaApp:** Garantir que l'autoria del titular compleix estrictament amb els tipus esperats per `BarraTaronja` i `UniversalCard`.

<!-- SDP:SECTION pla.implementacio.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
