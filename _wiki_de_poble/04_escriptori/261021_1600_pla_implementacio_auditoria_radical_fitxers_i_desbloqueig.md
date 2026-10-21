---
type: document
status: esborrany
description: Pla per a auditoria exhaustiva fitxer per fitxer per a Claude i Codex, resolucio P0 botigues i assimilacio Tellado
tags:
  - implementacio
visibility: private
reflex: sdp:torn_a2bdc047-5728-48aa-b5cc-769832a46e10:49ee08c5-81e7-4c01-80ea-6ad5d3d18a24
---
# Auditoria Radical Fitxers, Desbloqueig Botigues i Assimilacio AyudaWP

**Estat del Pla:** aprovat

<!-- SDP:SECTION pla.implementacio.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_a2bdc047-5728-48aa-b5cc-769832a46e10:49ee08c5-81e7-4c01-80ea-6ad5d3d18a24 |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-21T13:51:33.426Z |
| Modificació | 2026-10-21T13:51:33.426Z |
| Propietari | agent-local |
| Aprovació humana | pendent |
| Plantilla | _wiki_de_poble/03_actuar/plantilles/pla_implementacio.md (v2.0.0) |
| Model IA | ant-gemini-2.5-pro / claude-3-7-sonnet / codex |
| Tokens consumits | ~15.000 tokens |

<!-- SDP:SECTION pla.implementacio.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/03_actuar/plantilles/pla_implementacio.md; SHA-256 d05074ef89d1ec60596509565d7ac7a1e02b0e2bed1b304311b7fa651b0d23d0. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION pla.implementacio.s3 -->
## Historial

2026-10-21T13:51:33.426Z: esborrany creat amb autoritat del Mestre Javi Llinares per a coordinar la Colmena (Claude, Codex, MarIA) en la jornada de vesprada.

<!-- SDP:SECTION pla.implementacio.s4 -->
## Canvis proposats

### 1. Context i Troballes (Research)
- **Bloqueig del Repositori:** El repositori acumulava 810 MB a `wordpress-plugin/` per culpa de 15 fitxers `.zip` antics i un bug al regex de `cron_higiene.mjs`. La purga inicial ha alliberat 763 MB immediats.
- **Mandat del Salfumant Radical (`P0-14`):** El Mestre exigeix una auditoria fitxer per fitxer de tot el repositori (`src/`, `public/`, `tooling/`, `supabase/`, `android/`, `ios/`). Cada arxiu ha de tindre una justificació irrebatible per a existir; si no se sap justificar, es demana permís o s'elimina.
- **Assimilació Continuada d'AyudaWP (`P0-13`):** Analitzar tant el checklist per a WordPress.org com els plugins gratuïts de Fernando Tellado (plugin 'Vigilante' de seguretat, sanejament de base de dades, optimització) per a crear tractors cognitius natius a `.agents/skills/`.
- **Desbloqueig Legal de Botigues (`P0-06`):** Desplegament de `socdepoble.org` a Firebase Hosting perquè Apple i Google verifiquen l'esborrat de compte i polítiques.

### 2. Canvis Proposats per Fitxers i Mòduls

#### Mòdul A: Auditoria Fitxer per Fitxer (`P0-14` · Salfumant Radical)
- **`src/`:** Auditar components no utilitzats, arxius de prova morts o duplicats.
- **`public/`:** Revisar imatges redundants o pesades que puguen passar a WebP o a `_multimedia_de_poble`.
- **`tooling/`:** Justificar cada script a `tooling/gates/`, `tooling/wiki/`, `tooling/higiene/`. Purgar eines de laboratori consumides.
- **`supabase/`:** Netejar fitxers temporals o branques locals ignorades.

#### Mòdul B: Ecosistema AyudaWP / Fernando Tellado (`P0-13`)
- **`wordpress-plugin/`:** Aplicar checklist de Fernando Tellado (zero dependències externes no segellades, neteja de funcions obsoletes, text domain unificat, llicències clares).
- **`.agents/skills/sdp-vigilant-tellado/` (o integrat a `core-seguretat-audit`):** Crear el tractor cognitiu que herete les defenses del plugin *Vigilante* d'AyudaWP.

#### Mòdul C: Desplegament i Botigues (`P0-06`, `P0-01`, `P0-08`, `P0-09`)
- Executar `firebase deploy --only hosting --project soc-de-poble`.
- Aplicar correcció RLS `contact_email` a `public.organizations`.
- Sanejar barbarismes a `legalContent.js` («conta» -> «compte»).
- Eliminar l'iframe recursiu a `pageContent.js:115`.
- **Higiene de Consola Xat:** Protegir la crida RPC `xat_fils_meus` perquè només s'invoque quan hi ha sessió d'usuari activa, evitant el 401 a la consola per a visitants anònims no connectats.

<!-- SDP:SECTION pla.implementacio.s5 -->
## Verificació

1. **Porta Olivera:** `npm run porta:olivera` ha d'emetre codi 0.
2. **Cron d'Higiene Deductiu:** `node tooling/higiene/cron_higiene.mjs` ha de confirmar 0 anomalies i 0 zips orfes a `builds/`.
3. **Bateria de Tests:** `npm test` ha de conservar la totalitat dels tests en verd (>20.300 tests).
4. **Verificació de Pes:** `du -sh socdepoble.org` per comprovar l'aprimament constant del Mas.

<!-- SDP:SECTION pla.implementacio.s6 -->
## Riscos

- **Eliminació accidental d'arxius vius:** Abans d'esborrar cap fitxer no trivial a `src/`, Claude i Codex han d'emetre la llista justificada a la seua auditoria i demanar confirmació humana o arxivar-lo a quarantena segura.
- **Regressió al Web Component:** Qualsevol canvi a `wordpress-plugin/` ha de verificar-se amb `tests/enxufe-empaqueta.test.mjs`.

<!-- SDP:SECTION pla.implementacio.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
- [[03_llibre_mestre_tasques_i_idees]]
- [[00_index_escriptori]]
