---
type: informe
status: esborrany
description: Verifica el configurador de l’Avisador, l’autoria de les llicències i la matriu d’al·lèrgens del receptari en el clon aïllat.
tags:
  - auditoria
visibility: private
reflex: sdp:torn_51ac554f-4279-45dd-9ab1-2cc2641b52f6:3fd19ba4-39cc-4b56-be86-6e61c1aea707
---
# Auditoria Gauntlet del Kit R17.2

Esta guia és consultiva i de només lectura. Els resultats els calcula el codi vigent; la guia no pot substituir els scripts ni declarar salut si una comprovació falla.

<!-- SDP:SECTION auditoria.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_51ac554f-4279-45dd-9ab1-2cc2641b52f6:3fd19ba4-39cc-4b56-be86-6e61c1aea707 |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-11-10T23:12:52.294Z |
| Modificació | 2026-11-10T23:36:15.736Z |
| Propietari | codex |
| Aprovació humana | pendent |
| Plantilla | _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md (v2.0.0) |
| Model IA | GPT-6.1 Sol Ultra (Codex) |
| Tokens consumits | Sense comptador per torn disponible |

<!-- SDP:SECTION auditoria.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md; SHA-256 8f66b7b4fba3395d1c2bd4111f085affeb2387bc0003ed18974d118221b05e61. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION auditoria.s3 -->
## Historial

- 2026-11-10T23:12:52.294Z · Obert el rebut documental.
- 2026-11-10T23:29:24.196Z · Revisió Gauntlet del clon, reproducció de la base i verificació del pegat CAS.

<!-- SDP:SECTION auditoria.s4 -->
## Troballes

El Kit R17.2 parteix de `0027b698d3c25041def6cad2c527d2addc22b8ff` al clon `/tmp/sdp_codex_r17`. El pegat toca 55 camins. S’ha aplicat a un índex Git independent amb la mateixa base i s’han comparat tots els bytes amb el clon. El SHA-256 del pegat és `370fa186205d3f3dda2816b21ee25bcad5ab34be9cad535a236e66f18ebbfc25`.

| Requeriment del Pla | Estat | Evidència | Límit o dependència |
| --- | --- | --- | --- |
| AH-R17-02 / P0-79 · Configurador i avís al Xat | [FET] | `AvisadorPage.jsx`, `AvisadorEnSessio.jsx`, `avisador.test.js` i prova de ruta de l’App | Ajustos locals per compte i node. Fils directes existents de persones, fins a tres. Cal sessió personal, app en execució, connexió i un fil que admeta l’enviament. |
| AH-R17-02 · Pausa i reintents | [FET] | Casos de 22:00–08:00, canvi d’hora, reconeixement del Xat, pèrdua de connexió, revocació i tancament amb Web Lock pendent | El port neutral usa un identificador per avís i destinatari. Quan hi ha xifrat, l’enviament amb termini prescindix de la safata diferida. |
| AH-R17-08 / P0-85 · Autories i llicències | [FET] | Editor, ús del copyright propi de pàgina, atribucions literals, PostgreSQL WASM i proves de 256/257 caràcters | La migració `2611110010_autoria_256_caracters.sql` precedix la publicació del client que escriu autories llargues. |
| AH-R17-07 · 149 receptes × 14 grups | [FET] | 161 «Conté», 175 «Pot contindre» i 1.750 «No en porta segons el text», amb contrast de la font del receptari | Cal verificar ingredients comprats, etiquetatge i contacte creuat. L’annex II fixa un llindar de sulfits sobre el producte final. |
| P0-95 · Càrrega diferida i pressupost | [PARCIAL] | 242.381 B gzip web i 244.010 B gzip natiu. Vista i monitor de l’Avisador en trossos diferits | L’entrada conté el codi mínim d’activació i el sanejador compartit d’autoria. WordPress queda en 1.740.448 B davant del sostre d’1.690.000 B. La base reconstruïda amb els mateixos ajustos fa 1.743.436 B. |
| Integració dels textos de patrimoni | [PARCIAL] | `frontissa-contingut.mjs --check` detecta dos canvis | Cal aprovar les noves empremtes de `receptes` i `arbres-monumentals` en el torn d’integració. |

El codi de l’Avisador compta interaccions de l’app. En una nit que creua mitjanit, descompta les hores reals del descans, inclòs el canvi d’horari. Un contacte només es compta com a avisat quan el port torna el seu identificador i una seqüència positiva. El reintent conserva l’identificador i torna a comprovar l’horari, les normes, la identitat i el fil. Les preferències són locals i es llegeixen entre pestanyes del mateix navegador. Un enviament confirmat pel Xat no acredita lectura pel destinatari.

L’Àrbitre ha comprovat tres regressions i se n’han verificat les correccions. El vinagre citat com a variant de l’aigua-sal ara dona «Pot contindre» sulfits. Les atribucions antigues amb sufix CC0 conserven la seua interpretació. Un Web Lock concedit després de desmuntar el monitor queda sense efecte. També s’ha corregit una importació d’autoria que el prerender social no podia llegir.

El mapa associa les decisions positives i possibles a literals del receptari, amb pàgina, empremta de la font i referència a l’ingredient quan prové d’una altra recepta. Les entrades revisades es revaliden contra el text. [Reglament (UE) 1169/2011, annex II](https://eur-lex.europa.eu/eli/reg/2011/1169/2025-04-01/eng) · [AESAN, gluten i llegums secs](https://www.aesan.gob.es/AECOSAN/docs/documentos/seguridad_alimentaria/gestion_riesgos/gluten_lentejas.pdf)

<!-- SDP:SECTION auditoria.s5 -->
## Verificació

- `npm run build` amb mode `seed` i configuració sintètica · Web, WordPress fragmentat, SEO i prerender social executats. El llindar del JS principal de WordPress es comprova a banda i continua excedit.
- `npm run build:natiu` i `npm run cap:sync` amb una configuració de compilació local · Paquet natiu i sincronització d’Android/iOS verificats.
- `npm run lint` i `git diff --check` · Verds.
- `tractor-promesa` i `tractor-vocabulari` passen amb el deute heretat de 2 avisos P2 i 31 infraccions de vocabulari, respectivament. Cap infracció nova. `tractor-rls` passa la comprovació estàtica.
- `node --test` amb PostgreSQL 17.5 WASM · 35 proves verdes, incloses les restriccions de les tres taules després de totes les migracions.
- Navegador local · `/page/avisador` ha mostrat el títol, l’avís de funcionament i l’enllaç d’entrada amb retorn a la ruta. El port 3340 era del repo viu. S’ha usat el 3341 i s’ha tancat la previsualització.
- Vitest dirigit sobre el pegat congelat · 719 proves verdes en 22 fitxers.
- L’assaig global inicial es va interrompre perquè havia començat sobre un arbre encara en edició. En una còpia neta de R16b s’han reproduït el llindar WordPress, esperes de Gestoria i Lector i l’error de hooks de l’editor TipTap. Les tres suites de l’editor, repetides amb memòria cau neta, donen el mateix recompte en R16b i R17.2 (61 fallides i 4 verdes). Els recomptes dirigits corresponen al lliurament.
- Trossos web · L’AST dels imports estàtics de l’entrada i les sis precàrregues exclou `AvisadorPage`, `AvisadorEnSessio` i el motor compartit. La inspecció REA de l’entrada minificada ha retornat evidència parcial `ev_4d373dc6b240a42793a65453bd75a4a29cc2905abfa26e792db94fdb27c13663` per termini esgotat. L’anàlisi dirigida dels tres trossos retorna el rebut REA `ev_69d9d89a38dd8c1f1182efeb53271d8ed605e7911f29885519dd335042bf6f3f` amb abast limitat als fitxers seleccionats.

<!-- SDP:SECTION auditoria.s6 -->
## Límits

El lliurament és local i els transports s’han verificat amb proves controlades. El navegador s’ha comprovat amb dades llavor. La prova de PostgreSQL és local i la sincronització de Capacitor no genera un binari signat. El model d’activitat requerix que el client s’execute i mantinga la sessió. La configuració es pot fer de manera independent en cada dispositiu.

El `git apply --check` al tall R16b net passa. A l’arbre viu, una modificació concurrent de `src/sections/notes/useLocalSandbox.js` ja fa divergir la preimatge. En integrar, cal conservar el canvi del Carril 1 i afegir-hi `sanejaDrets` per al camp `copyright`. Les dues empremtes de la Frontissa i el pressupost WordPress corresponen a l’assimilació.

El rebut de l’informe valida amb `document.mjs check` i la Porta Olivera passa. La comprovació global de tancament del torn documental continua oberta per canvis concurrents fora d’abast, el pla de tancament i el relleu del ledger pendents, i els ancoratges del laboratori que marca SCC.

El Llibre Mestre viu consultat acaba en una fila incompleta de `P0-75 / IDEA-206` amb el marcador literal `[truncated for diff preview]`. El pla i el prompt són la font dels identificadors R17. La pròxima convocatòria pot indicar el tall real del Llibre, distingir proves dirigides i globals, i separar el pressupost web del llindar WordPress.

El protocol d’emergències offline continua oferint el seu codi QR local. La pantalla de l’Avisador retira la confirmació simulada i no hereta els ajustos antics com a consentiment per a enviar missatges.

<!-- SDP:SECTION auditoria.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
- [[261110_2334_pla_implementacio_onada_r17_pentacanal_android_workspaces_i_drets]]
- [[261110_2334_prompt_codex_onada_r17_avisador_drets_i_alergens]]
- [[03_llibre_mestre_tasques_i_idees]]
