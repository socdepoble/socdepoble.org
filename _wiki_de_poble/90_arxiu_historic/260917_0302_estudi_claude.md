---
type: document
status: esborrany
description: Contradiccions amb l'informe d'avanç
---
Claude: Fase 4 primer.# Auditoria Fases 4-5 i Amnèsia Cognitiva: resultat

He comprovat el bundle abans d'auditar. La sentinella hi és (línia 78709) i els 564 fitxers quadren amb el sha256 del manifest. Per límit d'eines no he pogut crear el `.md`, i tampoc tinc accés a `_wiki_de_poble/04_escriptori/`. El proper torn te'l genere amb frontmatter vàlid segons `tooling/wiki/schema.json`.

**Veredicte: no és un 10.** Fase 4: 6/10. Fase 5: 4/10, perquè hi ha una regressió. L'amnèsia no és principalment culpa del model: la maquinària que l'hauria d'impedir no s'executa, i on s'executaria es contradiu.

## Contradiccions amb l'informe d'avanç

1. **La poda de `localhost` no poda res.** `tooling/gates/saneja-callback.mjs:13` busca `const ORIGENS_PERMESOS`, però `public/auth/callback.html:88` diu `var`. Com que `:16` no té `else`, el script no diu res i ix amb codi 0. Ho he executat: `callback.html:104-107` continua amb quatre `localhost`. A més, si trobara el patró, reescriuria el fitxer font de `public/` (`:23`) i el `split(',')` (`:17`) trossejaria el comentari de `:93-100`.
2. **La fallada tancada no és silenciosa.** `src/data/identitat.js:246,255,272` escriuen `console.warn`; la resta de branques callen. A més, el comentari de `:235` ("si se'n declara un") contradiu `:245`, que el fa obligatori.
3. **Les capes CSS estan al revés.** La migració ha deixat el deute fora de tota capa (vegeu Fase 5, punt 1).
4. **"Build correcte" no ho he pogut verificar.** `npm install` ha fallat al meu entorn. Un build verd tampoc demostraria res sobre la cascada: CSS sense capa compila perfectament.

## Fase 4 · Pont Sollutia

**Fissures**

1. **`emissorEsperat` no aporta seguretat.** El valor esperat el proporciona el mateix que envia el token:
   - `src/host.js:354-358` el pren de `payload.opcions`, i si falta usa `event.origin`.
   - `src/host.js:274-275` i la cua (`:203`, `:216`) passen les opcions de qui crida.
   - `identitat.js:269` compara el camp `iss` del token amb aquest valor autodeclarat.
   - Cal que siga una constant de configuració del SPA, mai un paràmetre.
2. **El valor per defecte rebutja sessions legítimes.** Un origen web (`https://sollutia.cat`) no coincidirà mai amb un `iss` real (l'informe proposa `https://api.sollutia.cat`, `260917_0055_INFORME_integracio_sollutia.md:71-72`).
   - [SUPÒSIT] `identitat.js:271` rebutjaria un token estàndard de Supabase, que porta `aud: "authenticated"`.
   - En canvi, un token sense `aud` passa.
3. **El token de Sollutia acaba a Supabase.** L'informe diu que l'iframe se segella amb Supabase (`260917_0055:117`), i `src/data/supabase/runtime.js:39-40` envia el JWT injectat a PostgREST.
   - [SUPÒSIT] Si Supabase no confia en Sollutia com a emissor, el resultat és un 401, després `refresca`, i finalment l'expulsió de la sessió. És la sessió fantasma per una altra via.
4. **Risc alt condicional: fuita del codi OAuth.** `src/data/oauthRelay.js:285-291` envia el `code` amb `postMessage` a un `sdp_origin` llegit de la URL sense cap llista blanca.
   - [SUPÒSIT] Si la llista de redireccions de Supabase accepta rutes de `socdepoble.org` amb query, un atacant pot iniciar el flux PKCE amb el seu propi verificador, obrir la finestra emergent i rebre el codi de la víctima. Això és presa de compte.
   - Solució: validar contra la llista o enviar només a `window.location.origin`.
5. **Finestra d'injecció de backend.** `host.js:233-258` i `SocDePobleCua` (`:197-227`) permeten que qualsevol script de la pàgina injecte un backend abans del tick, per exemple per interceptar `loginWithPassword`. És un risc residual inherent al disseny, però en WordPress és real.
6. **Punts menors:**
   - `identitat.js:287` propaga l'objecte `user` sencer de l'amfitrió. El risc és baix perquè els rols venen del servidor (`src/data/supabase/auth.js:53`).
   - Cap test cobreix `adoptaSessioExterna`.
   - `callback.html:37` cita `tractor-frontera-auth.mjs`, que no és al manifest.

**El que està bé**

- Validació d'origen i de font a l'iframe (`host.js:321-322`) i resposta dirigida a l'origen (`:339`).
- Prohibició de la injecció parcial (`:165-167`).
- Pany del backend (`backendPort.js:10-12`).
- Comprovació del `state` (`oauthRelay.js:206-207`).
- Comparació exacta al relé (`callback.html:138`) i filtre de rutes (`:120`).

## Fase 5 · Poda CSS

1. **Crític: el deute ha quedat fora de capa.** `tooling/scripts/migrate-css.mjs:88-91` afig les regles sense cap `@layer`. Resultat:
   - `src/css/components.css:339-1228`: 113 blocs sense capa (`.btn`, `.btn-primary`…).
   - `src/css/modules.css:627-769`: 22 blocs sense capa.
   - `src/css/base.css:366-376`: un bloc sense capa.
   
   El CSS sense capa guanya **totes** les capes, `utilities` inclosa. És el contrari del que declara `index.css:29-34`, i `components.css:329-333` ja documentava exactament aquest error. Les classes afectades són vives (per exemple a `PageFrame.jsx`): el deute ara mana sobre els components canònics.
2. **`!important` via script.** `base.css:368-374` introduïx `!important`, contra la LLEI 5 (`.agents/hooks/verify.mjs:180-194`). La porta només mira escriptures fetes amb eines, no les d'un script.
3. **Comentaris desfasats.** `index.css:63` diu que `modules.css` és `@layer components`, però té també `legacy` (`:771`) i una zona sense capa. `index.css:36` encara parla de `legat.css`.
4. **Classificació per subcadena.** `migrate-css.mjs:45,49` usen `includes('.'+c)`, així que `.btn` arrossega `.btn-connectar` i `.icon` arrossega `.icone…`.
5. **Zombis:**
   - Cap dels 28 noms apareix a cap JSX. Correcte, però són 28 noms, no "30+".
   - En sobreviuen alguns: `modules.css:548` i `:558`, i `src/sections/profile/PerfilShell.css:74-98`.
6. **Script orfe.** `migrate-css.mjs` llig un fitxer que ja no existix (`:4`) i manté la dependència `css` (`package.json:107`). Això va contra el Trellat, que prohibix scripts orfes.
7. **Façana `PedraSeca/index.js`.** No té col·lisions d'exportació i la usen 30 imports. Queden 4 importacions que se la salten:
   - `UniversalEditorShell.jsx:2`
   - `SearchSection.jsx:4`
   - `PaginaFormularis.jsx:7`
   - `OnboardingSection.jsx:6`

## Amnèsia Cognitiva · causes amb proves

1. **Tres encaminadors que no diuen el mateix.** Són `tooling/brain/classificador_tasques.mjs:4-16`, la taula de `.agents/skills/skill-acte-reflex/SKILL.md:35-53` i `matrix.mjs`, que parseja eixa taula (`:138-147`). He provat el classificador amb frases reals:
   - "Fes un bundle per a Qwen" → cap plantilla.
   - "Tanca la sessió" → cap plantilla.
   - "Fes l'auditoria de la fase 5" → cap plantilla.
   - "…agents de fases 4" → plantilla de planificació, perquè detecta `fases`.
2. **`matrix.mjs` sempre dona `ready:false`.** Amb "hola" ix amb codi 2 i 14 errors:
   - 12 skills no tenen `triggers_on` (`:82`), inclosa la mateixa `skill-acte-reflex`.
   - 2 rutes apunten a fitxers inexistents (`SKILL.md:39,44`).
   - Per tant no escriu mai el rebut (`:249-259`), i la LLEI 6 (`verify.mjs:222-226`) denegaria qualsevol document.
3. **Majúscules que no quadren.** `.agents/DESTINS_CANONICS.json` diu `04_ESCRIPTORI`, però `verify.mjs:34` i el directori real són en minúscula. La comparació `startsWith` distingix majúscules, així que `verify.mjs:213-218` denega tot document de l'Escriptori.
4. **Conclusió de 2 i 3** [SUPÒSIT raonat]: si la porta estiguera activa, avui no s'hauria pogut escriure cap document. Però `260917_0013` i `260917_0055` existixen, i a més violen l'esquema: el primer no té frontmatter i el segon usa claus fora d'esquema. **Els hooks no s'estan executant.**
5. **El rebut certifica l'actor equivocat.** `matrix.mjs:274-276` només imprimix hashos: demostra que ho ha llegit el script, no el model. A més, el rebut no està lligat al document i val 30 minuts per a qualsevol cosa (`verify.mjs:66`).
6. **L'embolcall falla obert.**
   - `.agents/hooks/preflight_matrix_wrapper.mjs:64-66` s'empassa qualsevol error i no injecta res.
   - `:13` només actua en la primera invocació.
   - `:25` depén del format `USER_INPUT` del transcript.
   - `hooks.json:2,14` usa una estructura d'arnés que el bundle no documenta [SUPÒSIT: no puc verificar què accepta Antigravity].
7. **Dos sistemes de rebuts, cap connectat a l'altre.**
   - `reflex_plantilles.mjs:24` escriu a `.agents/reflex/` i ningú ho comprova.
   - `verifica_plantilla.mjs:17` espera `plantilla_iso_sdp.md`, que no existix, i per a l'acta (`:26`) exigix seccions que la plantilla real no té. No està connectat enlloc.
8. **L'Anti-Qwen no està on hauria d'estar.** Només existix a `skill-consell-bundle/SKILL.md:82` i no apareix a `00_PLANTILLA_PROMPT_ISO.md`. El reflex injecta la plantilla, així que el protocol no arriba mai al model. És exactament el símptoma que descrius.

## Proposta perquè siga ineludible

- **Pas 0: comprovar si els hooks s'executen.** Un senyal de vida (escriure un fitxer amb marca de temps en cada invocació) abans de tocar res més.
- **Una sola llei.** Un únic JSON declaratiu, del qual deriven el classificador, la taula de la skill i `matrix.mjs`, amb claus com `bundle`, `auditoria`, `sessió`, `tancament`.
- **El que ha d'eixir, dins de la plantilla.** Movre l'Anti-Qwen i els blocs obligatoris a `00_PLANTILLA_PROMPT_ISO.md`.
- **`matrix.mjs` que no bloquege per salut global.**
  - La salut global (skills sense `triggers_on`) ha de ser un avís; només els errors de la petició concreta han de ser errors.
  - Cal restaurar els `triggers_on` i fer que el codemod els preserve.
- **Arreglar la caixa** de `DESTINS_CANONICS.json`.
- **Un rebut que només es puga obtindre llegint.** El reflex injecta el contingut sencer de la plantilla amb un nonce de sessió. El document ha de portar eixe nonce, com ja fa el vostre `SDP-ISO-CONTEXT`, i `verify.mjs` el comprova dins del contingut escrit.
- **Encara millor, esquelet determinista.** Prohibir crear `.md` nous a la wiki amb eines d'escriptura i permetre només omplir fitxers instanciats pel generador (`tooling/brain/crear_document.mjs`, que no he llegit sencer).
- **Embolcall que falle tancat** i `verifica_plantilla` connectat com a comprovació posterior, amb els blocs derivats dels encapçalaments reals de cada plantilla.

## Incògnites

- El build (no verificat).
- El contracte de hooks d'Antigravity.
- La configuració de Supabase: llista de redireccions i confiança en emissors externs.
- `[[universal_maquetation]]` i `[[design_system_specs]]` no existixen al manifest, així que són vincles morts de la petorreta.
- `doc_logos_oficials.md` apareix a `SDP-ISO-CONTEXT`, però és als `fitxers_prohibits` del bundle.
