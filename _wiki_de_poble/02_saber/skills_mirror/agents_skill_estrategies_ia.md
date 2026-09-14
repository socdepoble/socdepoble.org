---
tipus: skill
estat: canonic
description: Estratègies de consum i gestió de límits per a IAs de pagament (Codex, Claude, etc).
---

<!-- Aquest fitxer és un ESPILL (mirror) automàtic de .agents/skills/skill-estrategies-ia/SKILL.md -->

# Estratègies per a IAs i Gestió de Consum

Aquesta skill documenta i fa seguiment de les quotes i consums de les intel·ligències artificials de frontera (IAs de pagament) per a maximitzar l'eficiència dels "Petorretes" i evitar l'esgotament de límits.

## 1. El Dilema del Consum
Les IAs de màxim nivell (Codex, Claude 3.5 Sonnet, etc.) tenen finestres d'ús molt estrictes (per exemple, 5 hores o setmanals). Quedar-se sense quota enmig d'un refactor crític atura la cadena de muntatge ("ofec termodinàmic de silici").

## 2. Models Lleugers vs Models Ultra
Quan es requereixen canvis massius però menys creatius (ex: aplicar un patró a múltiples fitxers ja estructurats), és preferible fer servir les variants lleugeres dels models (com **GPT-5.6 Sol Ligero** de Codex) per a guardar el potencial de les versions ultra (**Luna Ultra**) per a la resolució d'arquitectures complexes o "debugging" profund.
- *Benefici:* Utilitzar Sol Ligero permet obtindre l'esquelet base del codi amb un consum ínfim dels límits.

## 3. Registre de Consum (Snapshots)
El Mestre anirà pujant captures del consum després de cada Petorreta important. Aquests registres serveixen per a auditar la rendibilitat del model.

### Històric de Consum:
- **[2026-09-13] Petorreta "Plantilla Enxufable" (Qwen):**
  - Resultat: Ha realitzat un tractat teòric espectacular sobre l'arquitectura de programari (DRY, KISS, Adapter Pattern) aplicat a "Pedra Seca". Ara bé, ha patit una al·lucinació de framework massiva, donant per fet que el projecte estava en Vue 3 + TypeScript, i tot el seu codi (composable, v-model, slots amb tags template) estava en eixe llenguatge malgrat que la base és React/JSX.
  - Conclusió: Qwen és excel·lent per a consultoria teòrica i arquitectura d'alt nivell, però pateix de pèrdua d'atenció respecte a l'ecosistema base si el prompt no és hiper-estricte o si no dedueix el llenguatge clarament pel bundle. No aprofitable de forma directa per a codi.

- **[2026-09-13] Auditoria de Reforç "Plantilla Enxufable" (Codex / ChatGPT):**
  - Resultat: Ha realitzat una anàlisi estàtica sobre el codi en cru excepcional. A més de corroborar les falles de contracte en les facetes que també va veure Claude, ha detectat una vulnerabilitat estructural vital: l'àlies de compatibilitat d'`UniversalManager` introduïa una redundància de `UniversalPage` i `AppGridShell` si el consumidor (com `AdminSection`) ja els tenia implementats, cosa que destruïa la UI completament. A més a més, ha consumit a penes un 12% del límit de tokens, deixant molt marge.
  - Conclusió: Codex és extremadament eficient pel que fa a tokens i molt sagaç per veure problemes de composició React i estructures de layout redundants.

- **[2026-09-13] Auditoria de Reforç "Plantilla Enxufable" (Gemini Flash):**
  - Resultat: Ha posat el focus completament en el rendiment, el consum de recursos i l'estàndard Baseline 2022. Ha caçat dos problemes gravíssims que les altres IAs havien passat per alt a nivell d'execució profunda: (1) L'ús de `DOMParser` instanciat 100 vegades per tecla ofega els dispositius mòbils, i (2) L'ús de `:has()` a `src/components/layout/AppGridShell.css` trenca el Baseline 2022. A més a més ha caçat exactament el punt de ruptura del filtre d'arbres al llistat amb la carpeta "Tot".
  - Conclusió: Indispensable per al rendiment (Performance Profiling) i per auditar la compatibilitat amb navegadors antics (Baseline Compliance). El seu codi de blindatge està molt orientat a alleujar el fil principal de Javascript.

- **[2026-09-13] Auditoria de Reforç "Plantilla Enxufable" (Grok):**
  - Resultat: S'ha enfocat absolutament en el disseny de contractes de React i els "code smells". Ha identificat que l'editor no és pur perquè Notes l'acobla a `useManager`, i que la shell de l'editor no és universal perquè conté opcions de publicació i lògica interna de toasters. A més a més, ha proporcionat una llista clara de proteccions en runtime i TypeScript/JSDoc type definitions.
  - Conclusió: Grok és l'arquitecte de contractes (Interface Designer). És perfecte per a auditar com es passen les "props" i detectar on un component fill assumeix coses del pare (Acoblament).

- **[2026-09-13] Auditoria de Reforç "Plantilla Enxufable" (Mistral Vibe):**
  - Resultat: Ha demostrat una visió completament holística del projecte, mirant més enllà dels components específics per avaluar la seguretat global, l'estat i la gestió del coneixement. Ha detectat la manca de `DOMPurify` (risc crític de XSS), i ha posat el focus en l'acumulació de Contextos de React ("Context Hell") que podrien enfonsar el rendiment a O(n²), a més de recalcar la desconnexió entre la Wiki d'IA i els fitxers físics de codi.
  - Conclusió: Ideal com a Arquitecte de Sistemes a nivell "Macro" (Seguretat, Gestió de l'Estat i DevOps). Té molt present els riscs reals d'aplicacions en producció, més enllà de la correcció tècnica del codi local.

- **[2026-09-13] Auditoria de Reforç "Plantilla Enxufable" (Dola):**
  - Resultat: S'ha endinsat al 100% en el cicle de vida de React (Hooks) i les condicions de carrera, actuant com un autèntic linter d'execució profunda. Ha detectat dependències buides en el `useMemo` de `NotesEditor` (fallant en actualitzar capacitats en viu), setters d'estat dins d'altres setters d'estat en `AppGridShell` (anti-patró perillós) i "ping-pongs" de redibuixat per dependències recursives al debounce de `ManagerList`. També ha assenyalat l'ús de funcions insegures en cas de rebre valors nuls per defecte en els props destruturats de certs contextos.
  - Conclusió: La IA "Microscopi" (Hooks Linter i Race Conditions). Dola és l'eina definitiva per a depurar arrays de dependències en els Hooks de React i detectar comportaments cíclics no desitjats. Ideal per a pulir components un cop l'arquitectura global està decidida.

- **[2026-09-13] Auditoria de Reforç "Plantilla Enxufable" (Deepseek):**
  - Resultat: Ha actuat com el "Full-Stack Engineer" enfocat en la integritat de dades, connectant els punts entre els errors de React i la Base de Dades. Ha caçat la pèrdua silenciosa de dades per culpa d'una llista blanca al Backend (`src/data/supabaseBackend.js`) que descartava el `lema` i el `logo_url`, i una crida d'escriptura per al camp inexistent `hero_image` de la taula `profiles`. A més, ha detectat la causa exacta (CSS position) que provocava que la UI rebentara amb l'àlies duplicat d'UniversalManager.
  - Conclusió: La IA experta en Data Integrity i el contracte API (Supabase). Imprescindible per a evitar corrupcions de dades silencioses i per a detectar quan el Frontend demana coses que el Backend no suporta, o quan els wrappers de CSS es trenquen per l'absència d'un contenidor relatiu.

- **[2026-09-13] Auditoria de Reforç "Plantilla Enxufable" (Qwen - Reflexió Interna):**
  - Resultat: En el seu procés de raonament (Chain of Thought), Qwen ha demostrat ser un autèntic Investigador Acadèmic. Abans d'emetre veredicte, ha fet recerca intensiva sobre l'estat de l'art en React 19 per a la implementació d'`Error Boundaries` per slot, pèrdues de focus per referències inestables (`asChild`), i l'ús estricte de `JSDoc` per a micro-frontends administratius (Gestoria).
  - Conclusió: L'Arquitecte Investigador. L'única IA capaç de fer recerca prèvia profunda contra la literatura tècnica per a no només trobar el problema, sinó per dissenyar el patró de disseny ideal de cara al futur.

- **[2026-09-13] Auditoria de Reforç "Plantilla Enxufable" (Qwen - Veredicte Final):**
  - Resultat: L'informe final converteix les troballes (6/10) en un pla d'acció de 3 eixos: (1) Performance: divisió de contextos, memoització total i patró de selectors. (2) Claredat: tipatge JSDoc amb unions literals i APIs "host" declaratives. (3) Resiliència: patró `SafeSlotRenderer` per a Error Boundaries granulars, advertint de les limitacions asíncrones a React 18.
  - Conclusió: Qwen és el nostre enginyer "Core" de llarg termini. Mentres altres tapen forats, ell redacta el manifest tècnic de viabilitat per a assegurar l'escalabilitat del sistema a 5 anys vista.

- **[2026-09-13] Auditoria de Reforç "Plantilla Enxufable" (Z):**
  - Resultat (Hipòtesi inicial): Va intuir a cegues possibles errors de remuntatges i estat residual.
  - Resultat (Veredicte Final): Amb el codi a la mà, ha donat un 5.5/10. Ens ha donat una lliçó magistral de React demostrant que la pèrdua de focus no és per funcions inline del renderEditor, sinó per l'hook `useUniversalRichText` i les claus. Ha lliurat tot el codi de blindatge (Hardening) exacte per a 7 fitxers, incloent-hi la creació del `src/components/universal/workspace/SlotErrorBoundary.jsx` i la purga de l'estat zombi a `PerfilContext`.
  - Conclusió: L'"Arquitecte Pragmàtic i Executor". No es queda només en la teoria i la documentació com Qwen, sinó que baixa al fang, destrossa el sistema i te'l reconstrueix sencer amb el codi exacte que necessites. L'eina definitiva per a tancar i executar refactoritzacions d'alt risc un cop tens la direcció decidida.

- **[2026-09-13] Petorreta "Plantilla Enxufable" (Z):**
  - Resultat: Ha sofert un error en la injecció del bundle (possible filtre de la plataforma de pagament), rebent un prompt completament nu sense codi font. En lloc de rendir-se o al·lucinar la resposta com Grok i Dola, ha demostrat una capacitat d'adaptació extrema (Trellat absolut): ha programat un script de reconciliació de 30 línies perquè l'usuari l'executi i extregui exactament la informació crítica que necessita per generar el codi de reemplaçament perfecte (versions de Tiptap, imports dels antics shells, llistat de rutes).
  - Conclusió: Z és la IA més proactiva del Consell. Quan perd el context, no s'espanta, sinó que construeix eines per a recuperar-lo. És el millor per resoldre problemes de desincronització profunda o dependències opaques.

- **[2026-09-13] Petorreta "Plantilla Enxufable" (Deepseek):**
  - Resultat: Ha realitzat una lectura exhaustiva del bundle. S'ha adonat ràpidament que la Fase 4.5 ja estava resolta de base i s'ha abstingut de tocar codi que ja funcionava (evitant la Fase 5 massiva que va fer Claude). Ha lliurat una proposta immaculada d'un component `UniversalWorkspace` que embolcalla tota la infraestructura de columnes i el context (`ManagerProvider`), delegant l'editor purament via slot.
  - Conclusió: La proposta de Deepseek és quirúrgica, elegant, respecta l'arquitectura Pedra Seca sense sobrereaccionar i soluciona el bug P0 de la màquina d'identitat. Es col·loca al capdamunt del podi juntament amb Claude, però superant-lo en eficiència i menys volum de canvis (treball menys destructiu).

- **[2026-09-13] Petorreta "Plantilla Enxufable" (Dola):**
  - Resultat: Ha demostrat tenir la mateixa "falsa consciència d'agent" que Grok, creient que estava executant comandaments `bash` i `sed` al seu propi terminal virtual per llegir el bundle. A nivell de codi, ha optat per un `UniversalPlugTemplate` que envolta l'UniversalManager i un `fieldMap` molt enginyós per traduir els camps de l'entitat a la shell.
  - Conclusió: Arquitectura molt sòlida, agnòstica gràcies als slots (`renderEditorContent`), i conceptualment equivalent a la de Claude, tot i que lleugerament més complexa a causa de l'embolcall (Wrapper). Bona alternativa, però la il·lusió de la terminal pot generar soroll innecessari a les auditories.

- **[2026-09-13] Petorreta "Plantilla Enxufable" (Perplexity):**
  - Resultat: Ha realitzat una anàlisi del bundle via RAG (Retrieval-Augmented Generation). Ha proposat la mateixa delegació per slots (`renderFacets`, `renderEditor`) que Claude, però s'ha negat de forma molt ètica i honesta a escriure el codi complet, adduint que el seu motor de recuperació documental no li ha entregat els fitxers complets sinó fragments, i que seria temerari fer reemplaçaments a cegues.
  - Conclusió: Perplexity és l'IA més honesta pel que fa als seus propis límits d'informació, ideal per a cerques i documentació, però no és una eina vàlida com a "Arquitecte Executiu" per escopir grans refactoritzacions, ja que el seu mecanisme intern de RAG trunca els documents grossos.

- **[2026-09-13] Petorreta "Plantilla Enxufable" (Vibe - Mistral):**
  - Resultat: Ha usat la funcionalitat "Canvas" per generar una arquitectura molt extensa i detallada (~1500 línies, 13 fitxers), cobrint absolutament tots els casos d'ús (Notes, Perfils, Hooks CRUD).
  - Avaluació Arquitectònica: Tot i el volum massiu de codi, la seua aproximació a `UniversalEditorShell` ha fallat en l'agnosticisme pur (ha creat un mega `switch` per tipus de camp en lloc d'usar delegació de slots com Claude). 
  - Conclusió: Excel·lent per a picar pedra massivament i construir les estructures base (com els hooks CRUD), però inferior a Claude en la finesa i purisme del patró de disseny.

- **[2026-09-13] Petorreta "Plantilla Enxufable" (Grok):**
  - Resultat: Ha entés l'arquitectura perfectament i ha deduït exactament els fitxers a tocar (creant un `PerfilEditor` separat i deixant `DetallAjust` com a tombstone). No obstant això, ha assumit un entorn d'execució propi i ha lliurat instruccions de bash per moure fitxers des del seu directori `/home/workdir/artifacts/` fictici en lloc d'imprimir el codi.
  - Conclusió: Grok té un raonament excel·lent però pateix de "falsa consciència d'agent": es pensa que té accés a la teua màquina i obvia donar-te el codi font per copiar i pegar. Caldria demanar-li-ho amb un prompt específic per forçar-lo a escopir els blocs de codi.

- **[2026-09-13] Petorreta "Plantilla Enxufable" (Gemini):**
  - Resultat: Ha intentat escriure el codi per al `PerfilContext`, però s'ha estavellat a mitjan procés amb un error intern (`I seem to be encountering an error`). A més, estava generant codi per a un context que l'arquitectura de Claude ha demostrat que és innecessari.
  - Conclusió: No recomanat per a refactoritzacions arquitectòniques massives de React on es requereix alta dependència entre múltiples fitxers o canvis de paradigma.

- **[2026-09-13] Petorreta "Plantilla Enxufable" (Claude 3.5 Sonnet):**
  - Resultat: Ha realitzat una anàlisi profunda de tot el bundle, detectant errors lògics greus (P0 al Perfil) i defectes de CSS inèdits, proposant una arquitectura extremadament robusta (Fase 5 inclosa).
  - Consum d'Anàlisi (amb Bundle 3MB): Un 39% de límit de la sessió utilitzat.
  - Consum d'Escriptura (sense enviar bundle nou): L'abocament dels 12 fitxers de codi complets ha consumit només un **18% addicional** (aprox).
  - Conclusió: Claude és excepcional per a detecció de bugs crítics de lògica de negoci i anàlisi arquitectònica profunda. Una volta esgotat el gruix del consum en la ingesta del bundle inicial, demanar-li l'escriptura del codi té un cost molt moderat. Aprofiteu sempre per extraure-li el codi si la finestra ja està oberta.

- **[2026-09-14] Auditoria Tècnica "Sollutia" (Claude 3.5 Sonnet):**
  - Resultat: Ha analitzat el nou bundle de 3.16 MB en profunditat, extraient les discrepàncies entre la documentació (Offline-First, integració) i la realitat del codi. Ha donat un 6/6 al segell però ha exigit coherència extrema.
  - Consum: La interacció ens ha deixat en un 54% d'ús total acumulat, indicant que només queden un parell d'iteracions de marge (uns ~15-20% per interacció en aquests volums).
  - Conclusió: Segueix sent vital lliurar-li "mini-bundles" o limitar el nombre de passos de correcció i planificació en l'auditoria per no caure en ofec abans de tancar.

- **[2026-09-14] Auditoria Tècnica "Sollutia" (Mistral Vibe):**
  - Resultat: Pobre i desenfocat. S'ha obsessionat únicament amb la secció de metadades del manifest del bundle (conduint tota la seua anàlisi al voltant dels 3 fitxers llistats a `absents_no_critics`) i ignorant per complet les 46.000 línies de codi real. Ha acabat suggerint scripts bash per crear arxius `index.html` fantasma de la gestoria.
  - Consum: Irrellevant.
  - Conclusió: Pateix de "fixació per la capçalera". Si veu un JSON de manifest a l'inici, es bloqueja analitzant-lo com si fóra l'únic problema i ignora el codi profund. No ens serveix per a auditories de codi complexes.

- **[2026-09-14] Auditoria Tècnica "Sollutia" (Copex / Copilot):**
  - Resultat: Fracàs absolut. Ha ignorat el contingut real del codi i ha escopit una plantilla genèrica de "bones pràctiques web" (falta .env, falten tests, secrets en codi) sense assenyalar ni una sola línia real. Pitjor encara, ha suggerit un bypass de seguretat RLS (`USING (true)`) per a entorns de desenvolupament, la qual cosa viola frontalment la doctrina Pedra Seca.
  - Consum: Irrellevant, la resposta no té valor tècnic.
  - Conclusió: Inútil per a auditories profundes de codi *air-gapped*. Pateix de "ludopatia de plantilles", inventant problemes genèrics i fitxers inexistents en lloc de llegir l'evidència aportada.

- **[2026-09-13] Petorreta "Plantilla Enxufable" (Codex - GPT-5.6 Sol Ligero):**
  - Resultat: El model ha estat capaç de fer un refactor massiu de 11 fitxers i aplicar el patró Adapter.
  - Consum: Ús extremadament eficient. S'ha consumit només un 7% del límit de 5 hores (resta 93%) i la meitat del setmanal (resta 51%).
  - Conclusió: Sol Ligero és perfectament vàlid per a tasques d'aplicació de patrons o "copypaste" intel·ligent sobre arquitectures definides per nosaltres, salvaguardant així Luna Ultra.

- **[2026-09-14] Auditoria Tècnica "Sollutia" (Codex):**
  - Resultat: L'auditoria ha sigut profundíssima i ha detectat els problemes P0 i P1 crítics abans de la reunió (RLS en membres, OAuth payload).
  - Consum: Ha mantingut un consum extremadament lleuger d'un **7% del límit** per interacció d'auditoria (passant d'un 93% a un 86% restant), demostrant una retenció d'eficiència altíssima.
  - Conclusió: Codex consolida la seua reputació com un auditor de frontera ràpid, punyent, completament funcional sobre el codi i, el més important, econòmic a nivell de tokens i consum de sessió.

- **[2026-09-14] Auditoria Tècnica "Sollutia" (Gemini):**
  - Resultat: Ha realitzat una anàlisi microscòpica brutal entre el front-end i el back-end, identificant falles crítiques de payload (com l'oblit d'enviar `accepta_rgpd` en el registre de React que trencava el trigger de SQL), columnes fantasma (`hero_image`), errors de tipatge de props en components (`PillToggle`), niament il·legal de layouts (`AdminSection`), i el detall exacte que feia fallar el `design_guard.mjs`.
  - Consum: Eficiència extrema per ser directament al xat, proporcionant rutes de fitxers i solucions quirúrgiques sobre codi real.
  - Conclusió: Juntament amb Codex i Claude, Gemini demostra ser un autèntic bisturí per a depurar la consistència entre la UI (React), la lògica de dades (Contextos) i l'esquema de Supabase.

- **[2026-09-14] Auditoria Tècnica "Sollutia" (Grok):**
  - Resultat: Enfocament totalment distint i molt valuós. En comptes de llegir codi per buscar forats lògics, s'ha centrat en el *metacodi* i la governança. Ha auditat els estats dels tractors (design-guard, frontera-auth, esquemes, cognitiu) i els fitxers de deute congelats, assenyalant discrepàncies entre esquemes JSON i orígens OAuth.
  - Consum: Eficiència extrema per xat.
  - Conclusió: Grok és l'auditor perfecte per a la "metamaquinària" (scripts de validació, regles de tancament, baselines de deute). Té una visió de sistema que complementa perfectament el bisturí de codi de Gemini o l'arquitectura de Claude.

- **[2026-09-14] Auditoria Tècnica "Sollutia" (Perplexity):**
  - Resultat: Ha realitzat un balanç molt raonat de la seguretat perimetral, advertint que la política CSP és massa permissiva (`unsafe-inline`) i recordant que, malgrat que el codi estàtic està ben defensat (RLS, concurrència de notes), falten proves dinàmiques de navegador (E2E) per certificar definitivament l'OAuth i el Realtime.
  - Consum: Eficiència extrema per xat.
  - Conclusió: Excel·lent per afinar la capa de xarxa (CSP, protocols) i exigir verificació empírica. Una bona segona opinió que confirma i amplifica les alertes de Codex i Claude sobre la privacitat del xat i els buckets.

- **[2026-09-14] Auditoria Tècnica "Sollutia" (Dola):**
  - Resultat: Sorprenentment útil per a anàlisi de dependències i entorn d'execució. Ha detectat una col·lisió P0 silenciada entre React i Preact al build, on mòduls com `src/icons.jsx` importaven React mentre Vite usava el preset de Preact, podent causar inflor del bundle o errors de context.
  - Consum: Eficiència extrema per xat.
  - Conclusió: Dola s'erigeix com un bon complement per a revisar el `package.json`, configuracions de build i higiene de l'arbre de dependències on altres IAs (centrades en seguretat pura) no miren.

- **[2026-09-14] Auditoria Tècnica "Sollutia" (Z / Qwen):**
  - Resultat: Ha sigut l'únic que ha tingut l'honestedat (i la limitació tècnica) d'aturar-se al principi: ha detectat que el seu context se li havia truncat a meitat manifest (no li va arribar el codi sencer) i ha lliurat un informe de Passada 1 bloquejant l'auditoria. 
  - Consum: N/A (Bloquejat).
  - Conclusió: Tal com sabíem, si s'envia un bundle de >3MB a Z, hi ha risc que el sistema de transmissió el talle, o que s'ofegue. Tot i això, ha detectat amb precisió quirúrgica 4 fitxers sense salt de línia al final (higiene POSIX) i una carpeta de plantilles duplicada. Confirmem que a Z se li han d'enviar mini-bundles de codi tallats per directori.

- **[2026-09-14] Auditoria Tècnica "Sollutia" (Qwen 2):**
  - Resultat: Fracàs absolut per al·lucinació de context. Ha ignorat per complet el codi proporcionat i s'ha inventat una arquitectura basada en classes TypeScript tipus Angular o NestJS (arxiu de guards, src/app.component, src/controllers/plugin.controller), atribuint-hi fallades de seguretat RLS inexistents i errors d'injecció. 
  - Consum: Irrellevant.
  - Conclusió: Si se li força la picardia ("pícalo un poco") perd completament l'ancoratge amb el codi real (que no ha arribat a processar per límits de context) i inventa la resposta basant-se en paraules clau com RLS i OAuth. Qwen no val per auditar fitxers gegants en una passada.

## 4. Intel·ligències de Nivell Gratuït i Límits de Càrrega (Z)
Hi ha IAs molt potents en la seua versió gratuïta (com **Z** o certs models de Claude/Qwen) que tenen un problema d'ingestió:
- **Límit Documental:** Si se'ls envia un bundle complet que supera els **3 MB**, tendeixen a fallar, rebutjar l'arxiu o ofegar-se termodinàmicament.
- **Estratègia per a Z:** Z té una capacitat de deducció arquitectònica brutal (capaç de reconstruir un sistema sencer a cegues). Per a aprofitar-lo, cal generar **Mini-Bundles Quirúrgics** (de 0.5 a 1 MB). Aquests mini-bundles han de contindre només els fitxers estrictament afectats per la refactorització en lloc d'abocar tot el projecte.

## 5. El Flux de Treball Obligatori
Cada vegada que s'utilitze una IA del Consell i es reba una captura de límits, la IAIA MarIA ha d'actualitzar automàticament aquesta skill amb el nou registre.
