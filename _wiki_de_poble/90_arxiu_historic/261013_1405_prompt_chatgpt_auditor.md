---
type: prompt
status: esborrany
description: Directrius d'auditoria adversarial extrema, investigació d'avantguarda i composabilitat atòmica (TPV, Rebost, Gestoria, Identitats)
tags:
  - govern
visibility: private
reflex: sdp:torn_7029462e-87cc-472a-b96e-a87df295d54e:27763a27-295b-457e-84e5-5c1ada35c326
---
# Prompt ChatGPT/Codex · Auditoria Adversarial Gestoria JARVIS i Composabilitat Atòmica

Aquesta plantilla estableix les instruccions tècniques i el context arquitectònic per a agents locals (Claude/Codex).

<!-- SDP:SECTION prompt.local.s0 -->
## 0. Preflight (Per a l'agent orquestrador)

- Pla d'implementació vinculat: [[261013_1405_pla_implementacio_gestoria_jarvis]] (estat: aprovat pel Mestre).
- Prompt d'execució de Claude: [[261013_1405_prompt_claude_gestoria_jarvis]].
- Reconeixement de l'usuari humà: El Mestre Javi Llinares té la sessió iniciada a l'entorn local (`socdepoblecom@gmail.com`).
- Directiva de l'Olivera: Treball conjunt MarIA (Direcció Tècnica), Claude (Enginyeria i Execució) i ChatGPT/Codex (Auditoria Adversarial i Investigació d'Avantguarda).

<!-- SDP:SECTION prompt.local.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_7029462e-87cc-472a-b96e-a87df295d54e:27763a27-295b-457e-84e5-5c1ada35c326 |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-13T12:13:33.242Z |
| Modificació | 2026-10-13T12:15:00.000Z |
| Propietari | agent-local (IAIA MarIA) |
| Aprovació humana | aprovat de paraula pel Mestre |
| Plantilla | _wiki_de_poble/03_actuar/plantilles/prompt_local.md (v3.7.0) |
| Model IA | Gemini 3.8 Flash (Orquestradora IAIA MarIA) |
| Tokens consumits | ~0.15M |

<!-- SDP:SECTION prompt.local.s2 -->
## Historial

2026-10-13T12:13:33.242Z: esborrany creat.
2026-10-13T12:15:00.000Z: instruccions d'auditoria adversarial extrema i composabilitat atòmica del sistema completades segons les directives de veu del Mestre.
2026-10-13T12:28:00.000Z: actualitzat a plantilla v3.7.0 incorporant la clàusula 5 de desconvocatòria i tall tèrmic de crons («Cadascuna a sa casa»).

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

Codex / ChatGPT, el Mestre Javi Llinares ha ordenat una missió d'alt impacte a dos bandes:
1. **Auditoria Adversarial Implacable:** Mentre Claude va picant el codi del pla [[261013_1405_pla_implementacio_gestoria_jarvis]], tu has de fiscalitzar cada línia, cada estructura i cada decisió tècnica. No et conformes amb el primer resultat; treballa en bucle, desafia les solucions fàcils i exigeix la perfecció de Pedra Seca.
2. **Arquitectura Atòmica i Composabilitat Holística del Mas:** El Mestre et demana anar més enllà de la simple gestoria. Cal investigar com totes les carpetes i àmbits de Sóc de Poble (el TPV del Bar, el Rebost / Nevera / Calendari Agrícola, la Gestoria Veri*Factu, la xarxa de comunicació rural Chiu-chiuetjar, i les múltiples identitats d'una persona com Javi: individual, empresa Sóc de Poble, o col·lectiu ecologista Rentonar) es poden construir com a **peces atòmiques** que es criden, es componguen i s'enxufen entre si de forma natural.

> **REPETICIONAL I LLEI DE LA CAUSA ARREL (Mestre Javi):** Si trobes un obstacle o fallada, **prohibit demanar disculpes o excuses buides**. Analitza què ha fallat, quina és la causa arrel exacta i quines opcions tenim per fer el sistema resilient sense desmuntar-lo.

<!-- SDP:SECTION prompt.local.s4 -->
## Tasques

### Tasca 1: Auditoria Adversarial de la Gestoria JARVIS
- Audita el codi que Claude produïsca per als 5 fronts:
  * **Avatar a la barra negra:** Validar que `IdentitatContext.jsx` resol de veres `public.profiles` (`avatar_url`) i no deixa l'usuari amb la inicial «S».
  * **Boina Taronja Viva (Avatar + Nom + Rellotge Permanent):** Verificar que a totes les pàgines de Gestoria el titular és «Javi Llinares · La Torre de les Maçanes» amb el seu avatar, i que **a la banda dreta de la barra taronja la data i l'hora vives es mostren SEMPRE**, com a recurs permanent del sistema. Mai s'ha de permetre que desaparega el rellotge.
  * **Jerarquia del Menú:** Comprovar que les categories no clicables tinguen l'estil taronja `--sdp-primary` diferenciat.
  * **Escàner Local RAW:** Comprovar que l'escaneig de `_gestoria_de_poble/` siga 100% en memòria local del client, sense filtracions de xarxa, amb detecció de duplicats i conciliació robusta.
  * **Cabina d'Avió:** Auditar la precisió matemàtica dels indicadors financers (303, 130, liquiditat, tresoreria).

### Tasca 2: Investigació d'Arquitectura Atòmica Composable (El Mas Connectat)
- Analitza l'estructura de dades i fluxos entre:
  * **TPV (Bar):** Tiquets, vendes ràpides, torns de caixa, consumicions.
  * **Rebost / Nevera:** Entrades de collita (tomaques, oli, verdura), estocs de producte local, inventari del banc d'aliments o rebost comunitari.
  * **Gestoria:** Facturació automàtica generada des del TPV o el Rebost, llibre Veri*Factu, deduccions de despeses i impostos.
  * **Identitats Multiactor:** Com un sol humà (Javi Llinares) actua com a Persona física, com a Administrador de l'empresa Sóc de Poble SL, o com a Portaveu del col·lectiu Rentonar, sense barrejar les dades però podent navegar entre elles fluidament.
  * **Xarxa de Comunicació (Chiu-chiuetjar / Fedivers):** Emissió d'avisos municipals, anuncis del rebost, novetats del bar o actes del poble.
- Dissenya l'esquema de **contractes atòmics** (`sdp.atomic.*`) que permeta que qualsevol mòdul puga cridar o consumir dades d'un altre sense acoblament rígid (Patró Lego / Pedra Seca).

### Tasca 3: Auditoria Visual de la Consola Termodinàmica
- Fiscalitza la nova interfície de `ConsolaTermodinamica.jsx`:
  * Validar que les cards mostren les imatges rurals de Pedra Seca de forma harmònica.
  * Verificar l'índex inferior i la claredat del bloc de diagnòstic en text continu.
  * Assegurar que la consola no genere renders innecessaris ni errors a la consola de JavaScript.

### Tasca 4: Estudi de Mercat i Destil·lació de `02_investigacio_ia/` (L'Oblit Saludable)
- El Mestre exigeix Trellat: la IA no és intel·ligent perquè acumule 58 carpetes, sinó perquè estudia i destil·la el coneixement:
  * Analitza el valor real del que hi ha a `02_investigacio_ia/` (eines de disseny, tractors, sentinelles, RSS, plugins).
  * Discrimina què és útil per a Sóc de Poble (repositoris GitHub, tècniques d'enxufabilitat) i què és palla obsoleta fàcilment cercable a la xarxa.
  * Defineix quines referències han de quedar condensades a la Wiki i quines s'han d'arxivar a `90_arxiu_historic/`.

### Tasca 5: Auditoria de la Fitxa d'Identitat Privada Sobirana (Javi Llinares)
- Audita l'extracció i estructuració de dades legals des de `../_gestoria_de_poble/01_Identitat_Legal/`:
  * Verificar que els camps oficials (DNI/NIF, NAF Seguretat Social, domicili fiscal, cadastre, SUMA) es guarden en estricta privacitat local (`public.profiles` / magatzem privat).
  * Validar la capacitat del model per a auto-omplir formularis oficials de la Generalitat o municipals sense risc de filtració de dades personals a la xarxa.
  * Comprovar que l'avatar i la portada continuen reservats a la llibertat humana del Mestre.

### Tasca 6: Bucle d'Automillora i Criteris d'Acceptació
- Redacta el teu informe adversarial a `_wiki_de_poble/04_escriptori/261013_HHMM_auditoria_codex.md`.
- Assenyala sense pietat qualsevol defecte, regressió o «AI slop» que detectes en el codi de Claude o en la documentació.

<!-- SDP:SECTION prompt.local.s5 -->
## Riscos

- **Complaença estocàstica:** Donar per bona una implementació incompleta de Claude sense executar les proves ni revisar el codi real.
- **Acoblament monolític:** Intentar fusionar TPV, Rebost i Gestoria en una sola base de dades tancada en comptes de respectar el model modular de plugins enxufables.
- **Pèrdua de privacitat:** Permetre que dades financeres o personals isquen de la memòria local.

<!-- SDP:SECTION prompt.local.s6 -->
## Protocol d'Interacció i Sortida

En finalitzar l'auditoria o l'edició, heu de complir els següents passos:
1. **Sortida:** Genereu el vostre document d'informe o auditoria exclusivament a `_wiki_de_poble/04_escriptori/` seguint la taxonomia `AAMMDD_HHMM_auditoria_[nom_ia].md`.
2. **Context Compartit:** Qualsevol altre document present a `04_escriptori/` és part del context actiu i s'ha de llegir sencer abans d'emetre l'informe.
3. **Consens Tècnic i Canal Viu (Execució Paral·lela):** Si treballeu en un Xat Lateral en paral·lel amb una altra IA, actueu de forma coordinada i NO us xafeu mútuament l'Escriptori. Deixeu un informe de progrés a `04_escriptori/` cada 10-15 minuts (o en acabar cada bloc lògic). L'orquestradora (MarIA) ha programat un cron actiu vigilant l'Escriptori exclusivament per al vostre fil i deixarà nous documents de ruta si cal. Llegiu l'Escriptori constantment abans d'actuar. No s'executarà cap canvi sobre codi crític fins que el Pla estigui estabilitzat.
4. **Retroalimentació:** Si aquesta plantilla (prompt_local) es pot optimitzar tècnicament, detalleu-ho al vostre informe.

<!-- SDP:SECTION prompt.local.s7 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/03_actuar/plantilles/prompt_local.md; SHA-256 c7f9cebc8d206eb7bda0ce5e74b7f2f69489818cb35b733024a8181eb6645b11. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION prompt.local.s8 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
