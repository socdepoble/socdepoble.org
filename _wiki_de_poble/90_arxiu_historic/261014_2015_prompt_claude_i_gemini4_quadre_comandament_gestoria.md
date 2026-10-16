---
type: prompt
status: esborrany
description: Prompt d'execució local (Gauntlet) per a Claude Opus i Gemini 4 per al Quadre de Comandament de Gestoria, exportació Excel, benchmarking amb FacturaDirecta, Holded, GnuCash i Odoo usant REA
tags:
  - govern
visibility: private
reflex: sdp:torn_36186beb-43cd-49f8-b375-5ded76478491:32bb8420-2a02-4cf9-a792-e88b27cfa20e
---
# Prompt per a Claude i Gemini 4 · Quadre de Comandament, Gestoria i Clonatge de Sistemes

Aquesta plantilla estableix les instruccions tècniques i el context arquitectònic per a agents locals (Claude/Codex).

<!-- SDP:SECTION prompt.local.s0 -->
## 0. Preflight (Per a l'agent orquestrador)

- [x] **Escriptori net i indexat**: La porta Olivera ix amb codi 0.
- [x] **Pla de referència**: `261014_2030_pla_implementacio_gestoria_quadre_comandament_i_conciliacio.md`.
- [x] **Rebut de torn obtingut**: `sdp:torn_36186beb-43cd-49f8-b375-5ded76478491:32bb8420-2a02-4cf9-a792-e88b27cfa20e`.
- [x] **Llei de l'Agent Local**: Claude i Codex tenen accés directe al disc; no es genera cap bundle auxiliar. Gemini 4 rep aquest mateix prompt com a auditor adversarial.

<!-- SDP:SECTION prompt.local.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_36186beb-43cd-49f8-b375-5ded76478491:32bb8420-2a02-4cf9-a792-e88b27cfa20e |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-14T18:15:51.635Z |
| Modificació | 2026-10-14T18:15:51.635Z |
| Propietari | maria |
| Aprovació humana | aprovada pel Mestre Javi |
| Plantilla | _wiki_de_poble/03_actuar/plantilles/prompt_local.md (v3.7.0) |
| Model IA | Claude 3.5 Sonnet / Claude 3 Opus / Gemini 1.5 Pro / GPT Codex |
| Tokens consumits | ~3.900.000 tokens |

<!-- SDP:SECTION prompt.local.s2 -->
## Historial

- **2026-10-14T18:15:51Z:** Creació del prompt de torn d'orquestració pel Mestre Javi Llinares i MarIA. Incorporació del mètode Gauntlet Prompt de Xavier Mitjana (quadre de comandament i Excel), eina REA (`morluto/rea`) per a benchmarking de FacturaDirecta, Holded, GnuCash i Odoo, i correccions urgents del Tauler de Gestoria (3T 2026 i avatars).

<!-- SDP:SECTION prompt.local.s3 -->
## Context Tècnic i Arquitectònic

Llegiu obligatòriament els següents fitxers abans d'actuar: `AGENTS.md`, `_wiki_de_poble/01_ser/02_genotip.md`, `_wiki_de_poble/00_index.md`, i `taxonomia_documental.md`.

**Visió i Identitat:**
- Objectiu: Xarxa descentralitzada per a connectivitat rural (`socdepoble.org`). Protecció contra obsolescència i dependència tecnològica. La descentralització definitiva arribarà a nivell de clonació de sistemes simplement llegint l'HTML, de forma completament hiperenxufable i modular.
- Llegat: 30 anys d'activisme rural ininterromput, herència directa de `socdepoble.net` i `rentonar.blogspot.com`. No som una startup, som la continuació d'una lluita històrica.

**Directrius Arquitectòniques (Innegociables):**
- **Hipermodularitat i Enxufabilitat:** La plataforma és un client pur (SPA) altament desacoblat. 
- **Model B:** Sollutia és l'amfitrió i el soci d'infraestructura de Sóc de Poble: allotja el Web Component, ens pot passar la sessió i ens obri la seua API només en lectura (GET a través de la Frontissa), sense injectar cap backend ni interferir en l'arquitectura o el disseny. Les dades del poble viuen al Supabase de Sóc de Poble, única font de veritat, darrere d'un port neutral (`src/data/backendPort.js`): el frontend, 100% modular, s'enxufa a qualsevol amfitrió (Sollutia, WordPress o Joomla), canviar de backend és una decisió de Sóc de Poble amb una ADR i el kit de conformitat, i sempre podem traure-ho «tot fora».
- **Visió de futur:** Evolució cap al **Fedivers**. El model de mal·leabilitat i independència a seguir és **Obsidian**.
- Tot el codi produït ha de respectar aquesta estricta modularitat i independència del proveïdor.

**🔥 DIRECTIVA SUPREMA (Llei de l'Enxufabilitat):**
Tot el que construïm al frontend (Consola, UI, etc.) té un únic objectiu fonamental: **l'enxufabilitat instantània amb Sollutia**. És imminent que Sollutia ens lliure els punts d'accés (endpoints/dades) de la seua API: entraran per la Frontissa (`src/data/adaptadors/sollutia/`), només en lectura GET i cada recurs amb captura real, traductor i fixture, sense tocar el port de backend. Tot el sistema ha d'estar fortificat i absolutament preparat perquè les dades fluïsquen i s'enxufen de forma eficient i sense el més mínim problema. Aquesta és la prioritat absoluta rere cada refactorització o component.

<!-- SDP:SECTION prompt.local.s_instruccio -->
## Instrucció del torn

> **MÈTODE GAUNTLET (Obligatori - Xavier Mitjana):**
> L'Agent Local (Claude / Gemini 4 / Codex) ha d'aplicar estrictament la metodologia explicada pel formador Xavier Mitjana al vídeo `https://youtu.be/sc6PJpFyrvY?si=a4mRFBcElAkcl3wA`:
> 1. **No et conformes amb la primera solució:** Formula hipòtesis, sotmet el teu propi disseny a un Àrbitre Adversarial intern abans de redactar el codi o l'informe.
> 2. **Quadre de Comandament Integral i Full de Càlcul:** El Mestre requereix un autèntic **Quadre de comandament** de gestió financera que permeta visualitzar la salut de l'activitat econòmica d'un colp d'ull i exportar/descarregar les dades en full de càlcul (Excel / CSV normalitzat per a gestoria humana).
> 3. **Connexió amb el Rebost i el TPV:** Tal com Mitjana exemplifica amb la gestió d'ingredients i cuina des de la nevera, el nostre sistema ha de connectar orgànicament el **Mode Rebost** (estoc, compres, despeses) amb el **Mode Bar / TPV** i la **Gestoria**.

### 1. Benchmarking i Enginyeria Inversa amb REA (`morluto/rea`)
L'eina de referència oberta triada pel Mas és **REA** (`https://github.com/morluto/rea`), de *morluto*, per a deconstruir interfícies web a components nets de codi:
- **FacturaDirecta:** Referència per al compliment fiscal espanyol més àgil (model 303 d'IVA, 130 d'IRPF, llibre d'ingressos i despeses sense burocràcia inútil).
- **Holded:** Referència visual per a la claredat dels quadres de comandament (mètriques clau, ràtios de liquiditat, estat de comptes bancaris).
- **GnuCash:** El patró d'or de sobirania de dades i comptabilitat local-first de codi obert (partida doble, zero dependència del núvol privatiu, exportacions netes).
- **Odoo:** Arquitectura modular per connectar TPV, vendes de taulell, compres i assentaments automàtics.

### 2. Deficiències urgents a auditar i corregir a `/app/gestoria/tauler`
En la sessió de hui (14 d'octubre de 2026), el Mestre ha accedit a `http://localhost:3340/app/gestoria/tauler` i ha detectat 5 punts inacceptables:
1. **Trimestre per defecte erroni:** La pantalla mostra per defecte el `4T 2026` (dia 14 de 92). **ERROR CRÍTIC:** Estem a 14 d'octubre i el termini de presentació del **3T 2026** està actiu i venç el **20 d'octubre de 2026** (queden només 6 dies!). El Tauler HA DE mostrar per defecte el trimestre que està en període de presentació oberta (**3T 2026**), indicant: `Presentació del 3T 2026: dia 14 de 20 (70%)` i el compte enrere urgent per a la presentació dels models 303 i 130!
2. **Nomenclatura i Vistes:** Canviar el botó de vista `'Cabina d’Avió'` per `'Quadre de comandament'`.
3. **Pestanya «Plantilla Gestoria» (XLSX) al Quadre de Comandament:** El Mestre ha recordat que els seus enviaments a la gestoria segueixen una plantilla molt estricta i específica en format Excel (`.xlsx`), definida al nostre codi com a `PLANTILLA_GESTORIA` (`src/sections/gestoria/nucli/plantilla.js:71-115`, que genera el fitxer canònic `{any}-FACTURACIO-{slug}_-_{n}T.xlsx` amb fulla `{n}T`, columnes normalitzades de Data, Número, Client/Proveïdor, NIF, Descripció, Subtotal, IVA, Total, i sumatoris `SUM`). Si s'envia en un altre format, la gestoria el rebutja. Per tant, **l'última pestanya o secció del Quadre de Comandament ha de ser «Plantilla Gestoria»**, des d'on el Mestre puga previsualitzar el full exacte i descarregar-lo o enviar-lo a la seua gestoria humana en un sol clic.
4. **Avatar del titular anònim:** La barra taronja superior i les UniversalCards mostren la silueta anònima `👤` en lloc de l'avatar real del compte autenticat de Javi Llinares. S'ha de garantir que `titular.avatar` i la validació de fonts segures permeten renderitzar la imatge real de l'usuari.
5. **Buidor a la barra blava i peu:** `ShellGestoria.jsx` té forçat `showComment={false} showShare={false} showConnect={false}`, deixant la barra superior i el peu despullats en lloc de seguir la coherència estàndard de `PaginaApp`.

### 3. Context empíric de les dades del Mestre (`_gestoria_de_poble/02_Facturacio/`)
El Mestre disposa a la carpeta física del Mas de l'històric real de les seues facturacions:
- **Exemple de referència (2T):** `_gestoria_de_poble/02_Facturacio/2026_2T/2026-FACTURACIO-2T.xlsx` i el seu CSV homònim. Proveïdors recurrents:
  * `Som Energia, SCCL` (F55091367)
  * `Google Cloud EMEA Limited` (IE3668997OH) — Google Workspace i AI Ultra
  * `Vodafone España S.A.U. (Lowi)` (A-80907397) — Fibra i mòbils
  * `Soluciones Corporativas IP, S.L. (DonDominio)` (B57333601)
- **Trimestre actiu d'urgència (3T):** `_gestoria_de_poble/02_Facturacio/2026_3T/`. Conté 45 fitxers (factures de Sollutia, Fal, Stripe, etc. i l'extracte `account_activities_202607.csv`).
- **Comportament intel·ligent exigit a la IA:**
  1. Encreuament banc vs factures: detectar càrrecs bancaris recurrents que no tenen el seu PDF associat a la carpeta (per exemple, les factures mensuals de Lowi que falten al 3T!).
  2. Alerta proactiva i resolució: indicar quines falten i oferir l'enllaç ràpid a la web del proveïdor (àrea de clients de Lowi, Google, Som Energia) o la comprovació de bústies de correu habituals (les 3-4 adreces on rep factures) perquè el Mestre les descarregue sense perdre temps.
  3. Generació del lliurable final: emetre el fitxer canònic `2026-FACTURACIO-3T.xlsx` llest per a enviar a la gestoria.

<!-- SDP:SECTION prompt.local.s4 -->
## Tasques

- **T1 · Auditoria Adversarial del Tauler de Gestoria:** Auditar `src/sections/gestoria/tauler/nucli/targetesTauler.js`, `Tauler.jsx` i `ShellGestoria.jsx`. Determinar com implementar la funció `trimestreOperatiu(avui)` perquè prioritze el trimestre amb finestra de presentació activa davant del trimestre natural en curs (el 3T 2026 fins al 20/10/2026).
- **T2 · Resolució de l'Avatar del Titular:** Auditar el flux d'imatge des de `fontSessio.js`, `useSessioApp`, `PaginaApp.jsx` i `UniversalCard.jsx`. Detectar per què es perd l'avatar de la sessió de Javi Llinares i aportar la correcció.
- **T3 · Redisseny del Quadre de Comandament i Pestanya «Plantilla Gestoria»:** Actualitzar el nom a `'Quadre de comandament'`, verificar els indicadors financers i afegir com a darrera pestanya la **«Plantilla Gestoria»**, connectada directament amb el motor existent `src/sections/gestoria/nucli/xlsx.js` i `PLANTILLA_GESTORIA` per a generar i descarregar el fitxer `.xlsx` exacte que accepta la gestoria.
- **T4 · Detecció de Factures Faltants i Conciliació Intel·ligent:** Dissenyar l'assistent de comprovació que creua els extractes del banc (`account_activities_*.csv`) amb les factures del 3T, alertant sobre proveïdors habituals pendents (com Lowi o Google) amb dreceres directes per a la descàrrega.
- **T5 · Síntesi de Benchmarking (FacturaDirecta + Holded + GnuCash + Odoo via REA):** Proposar l'especificació d'integració modular entre el Mode Rebost (cuina/nevera), el TPV (taulell) i la Gestoria (impostos i caixa).

### Criteris d’acceptació i reproducció

- **URL de proves:** `http://localhost:3340/app/gestoria/tauler`
- **Criteri 1:** En obrir el Tauler el 14/10/2026 sense selecció manual, el trimestre actiu és `3T 2026` i el rellotge diu `Presentació del 3T 2026: dia 14 de 20` amb l'avís del venciment del 20/10/2026.
- **Criteri 2:** La vista abans anomenada 'Cabina d'Avió' ara es titula 'Quadre de comandament' i conté com a darrera pestanya la 'Plantilla Gestoria' per a descarregar el `.xlsx` oficial.
- **Criteri 3:** L'avatar de Javi Llinares es renderitza tant a la boina superior com a les targetes de la graella.
- **Criteri 4:** El sistema detecta i avisa de les factures recurrents que falten al 3T respecte als moviments bancaris.
- **Criteri 5:** Cap tractor signat es trenca; les proves de Vitest (`npm test`) continuen en verd.

<!-- SDP:SECTION prompt.local.s5 -->
## Riscos

- **Tractors segellats:** Atenció a no modificar fitxers que invaliden l'aprovació del tractor `gestoria.tauler` o de la signatura financera sense actualitzar les empremtes corresponents.
- **Sanitització d'imatges:** Assegurar que la resolució de l'avatar respecta `esFontImatgeSegura` i la privacitat local.

<!-- SDP:SECTION prompt.local.s6 -->
## Protocol d'Interacció i Sortida

En finalitzar l'auditoria o l'edició, heu de complir els següents passos:
1. **Sortida:** Genereu el vostre document d'informe o auditoria exclusivament a `_wiki_de_poble/04_escriptori/` seguint la taxonomia `AAMMDD_HHMM_auditoria_[nom_ia].md`.
2. **Context Compartit:** Qualsevol altre document present a `04_escriptori/` és part del context actiu i s'ha de llegir sencer abans d'emetre l'informe.
3. **Consens Tècnic i Canal Viu (Execució Paral·lela):** Si treballeu en un Xat Lateral en paral·lel amb una altra IA, actueu de forma coordinada i NO us xafeu mútuament l'Escriptori. Deixeu un informe de progrés a `04_escriptori/` cada 10-15 minuts (o en acabar cada bloc lògic). L'orquestradora (MarIA) ha programat un cron actiu vigilant l'Escriptori exclusivament per al vostre fil i deixarà nous documents de ruta si cal. Llegiu l'Escriptori constantment abans d'actuar. No s'executarà cap canvi sobre codi crític fins que el Pla estigui estabilitzat.
4. **Retroalimentació:** Si aquesta plantilla (prompt_local) es pot optimitzar tècnicament, detalleu-ho al vostre informe.
5. **Desconvocatòria i Tancament de Crons («Cadascuna a sa casa»):** Quan l'informe final estiga emés o quan finalitze el torn de treball, és OBLIGATORI aturar i cancel·lar qualsevol cron o schedule recurrent de fons. Està terminantment prohibit deixar processos zombis actius que continuen consumint tokens o bloquegen el tancament de l'aplicació. En acabar, tot agent allibera els seus recursos i cancel·la les seues tasques programades.

<!-- SDP:SECTION prompt.local.s7 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/03_actuar/plantilles/prompt_local.md; SHA-256 89652d0020c665ffb26152e000fbf97406f3716c40b74f914cab4a04652b3513. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION prompt.local.s8 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
