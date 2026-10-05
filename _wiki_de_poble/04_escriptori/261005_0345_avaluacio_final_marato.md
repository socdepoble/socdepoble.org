---
type: informe
status: esborrany
description: Nota global i notes per àrea de Sóc de Poble sobre el codi viu congelat després de la Marató 2230, amb rúbrica de 2119, evidència i prioritats per a la setmana vinent.
tags:
  - auditoria
visibility: private
reflex: sdp:torn_8ec393af-c2a2-4019-af49-5b64677a0e4e:48486d5f-53c7-4cdb-8d01-f30973b6a30f
---
# Avaluació final de la Marató 2230

Document per al Mestre, en resposta al prompt [[261005_0335_prompt_avaluacio]] de MarIA. Les notes valoren el codi viu tal com va quedar en la congelació de les 03:45 del 05/10. Les propostes que no s'han aplicat no compten. L'informe detallat de Claude és [[261004_2245_auditoria_claude]], i el de Codex, [[261004_2240_auditoria_codex]].

<!-- SDP:SECTION auditoria.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_8ec393af-c2a2-4019-af49-5b64677a0e4e:48486d5f-53c7-4cdb-8d01-f30973b6a30f |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-05T01:37:50.569Z |
| Modificació | 2026-10-05 04:35 Europe/Madrid |
| Propietari | Claude (redacció i notes). La columna de Codex recull el que Codex ha declarat als seus relleus |
| Aprovació humana | Ordre del Mestre via MarIA (prompt 261005_0335, esborrany) |
| Plantilla | _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md (v2.0.0) |
| Model IA | Claude Opus 5.5 amb panells d'avaluació multiagent: 12 àrees, cadascuna amb dos avaluadors independents i un reconciliador |
| Tokens consumits | No disponible de manera exacta |

<!-- SDP:SECTION auditoria.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md; SHA-256 855544fb761eca8472fd500438aeb726b8b63e796ee5b733d83bd52a38d204cf. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION auditoria.s3 -->
## Historial

- 2026-10-05 01:37 UTC: esborrany creat pel circuit documental.
- 2026-10-05 04:35 Europe/Madrid: notes de consens de 12 àrees i síntesi. Codex hi pot afegir la seua discrepància en un relleu, que s'incorporarà ací amb la seua autoria.

<!-- SDP:SECTION auditoria.s4 -->
## Troballes

### Nota global: 6,1 sobre 10 (aprovat)

El sistema és sòlid en arquitectura i en la cancel·lació de la Gestoria. Falla en el rendiment mesurat, en el SEO per a robots i en el tancament: res no està commitejat i no hi ha cap test:ci complet. Esta marató ha millorat sobretot la correcció i la robustesa del codi; no ha tocat el pes de l'aplicació ni la mesura real.

| Capacitat | Nota | Nivell | En una línia |
| --- | --- | --- | --- |
| Rendiment | 4,7 | Insuficient | /disseny en mòbil: 51 → 70, CLS 0,279 → 0, però LCP 8,1 s (roig). L'entrada fa 1,25 MB amb el CSS dins. Mesura d'una sola ruta i una execució |
| Accessibilitat | 6,9 | Aprovat (llindar de notable) | Lighthouse 100 a /disseny. Focus gestionat en errors i al Tauler. Queden el contrast de .btn-date-time (3,69:1), aria-label en div i cap axe ni jsx-a11y |
| SEO i compartició | 4,8 | Insuficient | Etiquetes OG, Twitter i JSON-LD completes. Però la imatge OG nova no està versionada ni construïda, pesa 1,4 MB i els robots reben el mateix head a totes les rutes |
| UX/UI i Pedra Seca | 5,7 | Aprovat | Emojis XL, calaix de 300px, Mercat i avatar fets. Falta la barra mòbil de 5 (pla 2045:93). Una peça fallada a /disseny tomba la ruta. La porta de tokens té 161 defectes heretats |
| Arquitectura i codi | 7,4 | Notable | Model B 8,5 (endoll de backend validat). Correcció, seguretat i governança pugen. modules.css (9.848 línies) i 4 components de més de 900 línies |
| Arquitectura cognitiva (Tractor Cognitiu, skills) | 6,1 | Aprovat | force_ask i porta Olivera que veu tots els fitxers, aplicats. La ceguesa de MarIA (sessió per dia, cap obertura de sessió) continua oberta |
| Robustesa de tests i CI | 6,1 | Aprovat | CI amb 96 proves descobertes i un manifest que falla en tancat (31 obligatòries). Cap test:ci complet sobre el tall congelat |
| Resiliència a dècades | 6,7 | Aprovat | Runtime fixat i SELF-DESCRIBE reconciliat. Migracions i tooling sense versionar. Sense tags ni còpia remota verificada |

Pesos de la nota global: rendiment 12,5%, accessibilitat 10%, SEO 7,5%, UX/UI 15%, arquitectura i codi 15%, arquitectura cognitiva 10%, tests i CI 15%, resiliència 15%. És judici amb rúbrica, no una mesura.

### Fronts de la marató (contra l'auditoria 2119)

| Front | 2119 | Ara (Claude, consens) | Codex (declarat) | Estat |
| --- | --- | --- | --- | --- |
| A1 · recuperació d'imports lazy | 5,0 | 7,5 | 9,0 (00:29) | Recuperació explícita real. La peça fallada tomba la ruta (A1-01). La correcció e187 està proposada, sense aplicar |
| A2 · cancel·lació del Tauler | 6,0 | 9,7 | 9,2 (00:29) | Cancel·lació en cinc punts, amb proves amb dents. Cal signatura WebAuthn nova |
| Qualitat global | 7,0 | 7,4 | — | |
| Resiliència | 6,5 | 6,7 | — | |
| F1-F5 i P4 (Claude) | — | 7,8 | F3 9,2, P4 9,0, F4 7,5 (00:29) | El client és correcte. La migració de Supabase no està aplicada |
| T4 neteja visual (Codex) | — | 6,9 | — | Falta la barra mòbil |
| T5 Tractor Cognitiu (Codex) | — | 6,1 | — | C1, C2, C3 i C5 oberts |
| T3 CI (Codex) | — | 6,1 | — | Sense test:ci complet |

Les notes de Codex són d'abans de les correccions posteriors a les 00:29 i les va posar sobre el seu abast. El criteri d'esta taula és el codi viu.

### El que funciona millor (notable o excel·lent, amb evidència)

- **A2, la cancel·lació del Tauler: 9,7.** tractorTauler.js té cinc punts de control fora del try (:76-77). useTauler té un controlador per lectura. La fitxa és veraç, i hi ha proves amb espies de parser i en StrictMode.
- **Arquitectura Model B: 8,5.** contracte.js té 32 mètodes. backendPort rebutja un nucli incomplet, i supabase-js queda aïllat.
- **Privacitat:** Storage ja no escriu ruta, uid ni text cru a la consola (storage.js, quatre console.warn).
- **Missatges d'error honestos** a Supabase. Ja no es culpa la persona d'un 403 o 42501 que ve de la base.

### El que està en insuficient i per què

- **Rendiment (4,7).**
  - L'LCP és de 8,1 s en mòbil.
  - L'entrada de l'SPA fa 1,25 MB amb el CSS injectat dins del JS, i un segon chunk està sense ús en un 91%.
  - L'IIFE de WordPress fa 3,95 MB.
  - /disseny demana dades del Mur, el Mercat i els esdeveniments que no necessita.
  - La millora de 51 a 70 ve sobretot del CLS (14 dels 19 punts), i la mesura és d'una sola ruta, en una execució i amb la màquina carregada.
- **SEO i compartició (4,8).**
  - La imatge OG que demanava el pla 2045:55 (iaia_maria_portada.jpg, 1264×848) no està versionada ni construïda: el dist encara servix el PNG antic.
  - Pesa 1,4 MB.
  - Els robots sense JS reben el mateix head a totes les rutes, sense canonical ni og:url.
  - La canonada seo-routes de WordPress no té consumidor.

### Prioritats per a la setmana vinent (quan s'òbriga la persiana)

1. **Commit atòmic abans de res.** Hi ha fonts sense versionar de les quals depenen fitxers que sí ho estan:
   - tooling/tests/;
   - src/apps/plataforma/lazyRoute.js i src/app/RouteErrorBoundary.jsx;
   - les migracions 2610042330 i 2610042350;
   - EspecimenEmojisXL i les seues dades;
   - public/iaia_maria_portada.jpg i el derivat JPEG.
   Un commit parcial trenca la divisió per rutes i la CI.
2. **Un sol test:ci complet sobre el tall congelat**, amb la màquina lliure i el SHA anterior i posterior.
3. **Supabase.** Que el Mestre o Sollutia executen les quatre consultes de lectura i apliquen les migracions pendents i la de convergència (2610042350). Sense això, Avatar, Subtítol, Visibilitat i la creació d'organitzacions continuen fallant al servidor.
4. **Rendiment:**
   - el CSS com a fitxer a l'SPA;
   - dividir el chunk sense ús;
   - portada descobrible en WebP o AVIF;
   - mesura de 5 rutes, mòbil i escriptori, amb la mediana de 5 execucions.
5. **UX:**
   - la barra mòbil de 5 controls (proposta 3c2d);
   - la barrera de peça del catàleg (A1-01, proposta e187);
   - el crash de useSession en eixir des de Control (EixidaSegura.jsx:54; pla 2045:72). El Mestre ja l'ha vist i és la primera tasca de [[261005_0345_tasques_pendents_consola_visual]].
6. **SEO:** OG de 1200×630 i menys de 300 KB, versionada i construïda; canonical i og:url estàtics.
7. **Ceguesa de MarIA:** segell de sessió (obrir_sessio.mjs i preInvocation amb conversationId) i --nom per a qualsevol categoria.

### Decisions pendents del Mestre

- **Empremta.** Si ha tornat a signar Factures o Correus després de les 19:21. És la condició de l'ACK de restaurar empremta.js, que evitaria tornar-los a signar. El Tauler necessita signatura nova igualment.
- **Paquets de Codex amb revisió independent de Codex però sense ACK de Claude:**
  - A1 e187;
  - barra mòbil 3c2d;
  - skills ec281;
  - cens 946;
  - tokens V9;
  - LAB2 ed359;
  - SCC eff88d29;
  - manifest 33f1fb4f.
  Claude no els ha revisat per la congelació. Si el Mestre autoritza continuar, es revisaran sobre contingut.
- **F4, fase 2:** port paginat per a superar el límit de 50 publicacions per secció.
- **F3:** si els documents del manifest també han de portar una icona de document.
- **Llei del Píxel:**
  - el contrast de .btn-date-time;
  - el text «Empresa mare» o «Organització mare»;
  - el selector del Tauler, si s'ha de buidar després de cada lectura o només en prémer Oblida.

<!-- SDP:SECTION auditoria.s5 -->
## Verificació

- **Notes:**
  - 12 àrees, cadascuna amb dos avaluadors independents (estricte i d'evidència) i un reconciliador que verifica les cites on divergixen;
  - rúbrica de 2119 per a A1, A2, qualitat i resiliència; rúbriques pròpies declarades per a la resta;
  - cap prova executada durant la congelació.
- **Lighthouse:** 261005_0032 (abans) i 261005_0226 (després), de Codex, sobre /disseny en mòbil i amb una sola execució.
- **Proves que declaren els equips:**
  - Codex: test:node principal 770 (765 passen, 0 fallen, 1 saltada heretada i 4 todo, a les 00:29); última bateria Vitest global de 11.942 casos amb 49 roges, a les 00:13 i abans de moltes correccions.
  - Claude: per front, a l'informe 2245.
- **Revisió creuada:**
  - Claude ha revisat amb 142 agents els canvis de Codex, i ha fet tres rondes d'ACK sobre 12 propostes;
  - Codex ha trobat dos bloquejants a Claude (F2 i F4), tots dos corregits.

<!-- SDP:SECTION auditoria.s6 -->
## Límits

- **No certifica:**
  - cap test:ci complet;
  - la producció, Sollutia ni WordPress real;
  - la signatura WebAuthn;
  - l'aplicació de cap migració;
  - cap ruta pública de Lighthouse.
- **Res no està commitejat.**
- **Codex encara no ha publicat la nota global ni el resultat del runner únic.** Si ho fa, la seua discrepància s'afegirà ací amb la seua autoria.
- **Les notes són judici amb rúbrica i evidència, no mesura.** L'objectiu de 8,5 del prompt 2230 no s'ha usat com a criteri. Les àrees que no hi arriben es diuen tal com són.

<!-- SDP:SECTION auditoria.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
- [[261004_2245_auditoria_claude]]
- [[261004_2240_auditoria_codex]]
- [[261005_0335_prompt_avaluacio]]
