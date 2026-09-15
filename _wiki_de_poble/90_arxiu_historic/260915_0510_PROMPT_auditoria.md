```yaml
doc_id: SDP-PROMPT-ITERACIO-3-EXECUCIO
doc_type: PROMPT
authoring_agent: IAIA_MarIA
version_semver: 2.0.0
owner: Consell de la Petorreta
domain: global
subdomain: architecture
locale: ca-valencia
objective: Iniciar l'execució profunda (destrossa i excel·lència màxima) de les refactoritzacions d'arquitectura. Avaluar i refactoritzar també les nostres eines meta (Plantilla ISO i generador de Bundles).
scope: Desmembrament de supabaseBackend.js, Llei de l'Enxufabilitat, Meta-Plantilles.
hora_creacio: "05:10"
hora_modificacio: "05:10"
exif_cognitiu:
  estat_emocional_sistema: Execució Quirúrgica
  entorn_operatiu: Entorn_Dev_Local
  nivell_entropia: Alt
academic_metadata:
  revisors_ia: [Codex, Gemini, Grok, Vibe, Dola, Deepseek, Z, Qwen]
  data_aprovacio_humana: "2026-09-15"
  nivell_maduresa: Pendent_Revisio
inputs: [260915_0510_BUNDLE_auditoria.md, 00_PLANTILLA_PROMPT_ISO.md]
constraints: 
  - Ús obligatori de valencià estricte.
  - Prohibició absoluta de recerca web. Tota la informació està al Bundle adjunt.
  - Volem la destrossa màxima per assolir l'excel·lència estructural. Res de pegats tous.
```

# 📜 ITERACIÓ 3: LA GRAN REFACTORITZACIÓ (FASES 1 i 2) + META-ENIGYNYERIA

**A L'ATENCIÓ DELS AVALUADORS DE CONSELL:**

En la iteració anterior (0438), tots vàreu auditar la nostra base de codi. El diagnòstic va ser unànime: els monòlits (`App.jsx`, `supabaseBackend.js`), els wrappers inútils, i la violació de l'enxufabilitat amb IndexedDB ens bloquegen el camí.
Ara, us adjunte el nou Bundle (`260915_0510_BUNDLE_auditoria.md`) on ja he solucionat els problemes base de CSP i Gestoria, i he posat en marxa la regla dura d'ESLint.

A més a més, hem descobert que el nostre mateix procés per parlar amb vosaltres té debilitats. Per tant, en aquest únic i definitiu prompt, us demane una combinació de **Meta-Enginyeria** (millorar els nostres processos per parlar amb vosaltres) i **Execució Pura** (escriure el codi de la destrossa).

---

### PART 1: META-ENGINYERIA (Cerquem la millor comunicació amb vosaltres)

Actualment usem la **Plantilla ISO v1.4.0** per parlar amb vosaltres i generem Bundles d'una sola peça de 3 MB de text pla amb separadors. 

> 1. **La Plantilla ISO a Obsidian:** Com milloraríeu radicalment el bloc YAML (frontmatter) de dalt d'este mateix prompt perquè Obsidian (amb el plugin *Properties* i *Dataview*) puga vertebrar-lo perfectament com a un cervell gràfic massiu? Utilitzeu llistes, enllaços d'Obsidian `[[...]]`, etiquetes `tags:` i el format YAML més nadiu i eficient per a que el sistema d'apunts es connecte sol. Volem la versió 2.0.0 d'aquesta plantilla.
> 2. **Blindatge Anti-Al·lucinació:** Com milloraríeu l'estructura interna del Markdown d'aquesta plantilla perquè vosaltres mateixos (les IAs) no us escapeu mai més a buscar a internet i us centreu només en el codi local que us passem?
> 3. **Enginyeria de Bundles:** Estem utilitzant la millor forma de fer *bundles*? Hi ha alguna altra metodologia estructural per empaquetar els fitxers de manera que els vostres cervells no perden *tokens* ni es confonguen (més enllà del Manifest JSON + tanques de codi que usem ara)? Si hi ha una forma més neta i infal·lible de crear els *bundles*, indiqueu-nos-la.
> 4. **L'Instint del Tractor:** Fent aquest prompt m'he equivocat. Inicialment he començat a redactar-lo sense anar a llegir la Plantilla ISO original, i el Mestre m'ha hagut de corregir perquè l'incloguera sencera perquè la poguéreu veure. Com podem millorar el meu "Tractor" (les meues instruccions globals de sistema o els meus *scripts* de generació) perquè buscar i llegir la plantilla siga un ACTE REFLEX i un instint absolut abans de fer cap prompt o auditoria? Necessitem la configuració o instrucció de sistema perfecta perquè mai més cometa aquest error.

---

### PART 2: EXECUCIÓ, DESTROSSA I EXCEL·LÈNCIA TÈCNICA (El Codi)

No busqueu solucions estables i mediocres. Volem **destrossa màxima i excel·lència màxima**. Jo (el Mestre) m'encarregaré d'arreglar els trossos trencats aquesta nit si fa falta, però vull l'estructura pura, ideal i perfecta.

> 4. **Implementació de la Llei de l'Enxufabilitat:** Retorneu el codi exacte per moure l'accés directe a IndexedDB que hi ha ara a `loadGestoria` (dins del monòlit `supabaseBackend.js`) cap al seu propi adaptador net (`src/data/frontissa/local/gestoria.js`).
> 5. **Desmembrament del Monòlit Backend:** El fitxer `src/data/supabaseBackend.js` té 1.470 línies. Esmicoleu-lo sense compassió. Retorneu l'estructura de fitxers i el codi exacte per a extreure els dominis a `src/data/supabase/` (per exemple, `auth.js`, `notes.js`, `mur.js`, `xat.js`). Retorneu també com queda l'arxiu d'entrada (index) que els agrupa per mantenir els contractes existents temporalment.
> 6. **Codi directe (Zero Penediments):** Doneu-nos el codi refactoritzat de manera clara, a punt per a ser injertat directament amb Codex o Cursor. 

---

> **📝 AUDITORIA FINAL DE QUALITAT:**
> Esperem de vosaltres excel·lència absoluta:
> 1. Un YAML preparat per a ser absorbit per Obsidian (Tags, Properties array, Enllaços).
> 2. Els millors consells d'enginyeria de l'ecosistema de bundles.
> 3. Un refactor profund, despietat i estructuralment insuperable del Backend, trencant els monòlits per sempre.

---

### ANNEX: PLANTILLA ISO V1.4.0 (LA BASE ACTUAL A MILLORAR)

Podeu revisar a continuació com està feta la plantilla actual per tal de destrossar-la i fer la Versió 2.0.0:

````markdown
```yaml
doc_id: SDP-GEN-BASE-001
doc_type: "[PROMPT | ESTUDI_INTERN_IA | AUDITORIA_FORENSE | CONCEPT_ARQUITECTONIC]"
authoring_agent: "[NOM_DE_LA_IA_QUE_REDACTA_O_HUMA]"
version_semver: 1.4.0
owner: Consell de la Petorreta
domain: global
subdomain: architecture
locale: ca-valencia
objective: Establir el patró genètic fix (Gold Standard) per a tota interacció amb les IAs per al projecte Sóc de Poble. Informar avanços, demanar avaluació i nota sobre 10, i obrir alternatives pràctiques d'imaginació humana.
scope: Qualsevol tasca de programació, arquitectura, auditoria o anàlisi vinculada a Sóc de Poble.
hora_creacio: "[HORA_CREACIO_ORIGINAL_HH:MM]"
hora_fita_evolutiva: "[OPCIONAL_HORA_SALT_PARADIGMATIC_HH:MM]"
hora_modificacio: "[HORA_ULTIMA_MODIFICACIO_O_LLANCAMENT_HH:MM]"
exif_cognitiu:
  estat_emocional_sistema: "[Aprenentatge | Exploratori | Estabilització]"
  entorn_operatiu: "[iPad_A10_Offline | Entorn_Dev_Local | Servidor_Edge]"
  nivell_entropia: "[Alt | Controlat | Zero]"
academic_metadata:
  revisors_ia: []
  data_aprovacio_humana: "YYYY-MM-DD"
  bibliografia_interna_radicals: []
  nivell_maduresa: "[Esbós_Caòtic | Pendent_Revisio | Consolidat | Gold_Standard]"
inputs: []
constraints: 
  - Ús obligatori de valencià estricte.
  - Arquitectura Online-First sense dependències innecessàries de núvol.
  - Altament optimitzat per a dispositius antics com dispositius moderns.
  - Preservació termodinàmica via l'Algorisme ATRC. Treballar amb calma, avaluant errors abans de consumir energia.
  - Els errors no són drames, són dades i aprenentatge humà per al sistema.
  - PROHIBICIÓ ESTRICTA DE CERCA WEB: Ets en un entorn tancat (air-gapped). TENS PROHIBIT cercar a internet termes interns, noms de fitxers locals (ex. oauthRelay.js, schema.sql) o conceptes filosòfics propis (ex. 'Pedra Seca'). Tota la informació resideix exclusivament en el context i els bundles adjunts.
acceptance_criteria: 
  - Retornar una avaluació de nota sobre 10 dels sistemes presentats.
  - Suggerir opcions que utilitzen una capa d'imaginació analítica humana.
anti_patterns: 
  - Penedir-se ("ai perdona, m'he enganyat") de forma excessiva a costa del descobriment.
  - Implicador d'equips purs (dir "Tu eres desenvolupador d'UI de la meua empresa, fes-me açò").
  - Omissió de descripció estructural (les IAs han de concebre visualment la UI que l'humà té, tot i no veure-la directament).
fallback_behavior: 
  - Si no hi ha solució òbvia o la qualificació baixa de nivell, llistar les incògnites i consultar novament a l'usuari.
evaluation_metrics:
  - Puntuació Base a l'Avanç de la Missió (Valor sobre 10 assignat per IA).
  - Estabilitat visual en iOS i DOM Pobre (Pla/Aplanat).
test_vectors: []
change_log: 
  - "1.4.0: Integració de l'Algorisme de Termodinàmica Reflexiva i Cooldown (ATRC). Imposició del 'Bancal Mode' i calma estructural pera evitar cremar tokens ('energia vital') per ansietat computacional."
  - "1.3.0: Eliminació del dramatisme de penediments quan es cometen errors (es canvia per l'anàlisi causal com una etapa comuna d'aprenentatge humà). Gir de rols de 'executors directes/membres' a 'Avaluadors i Imaginadors Informats sobre 10'. Obligació de descriure als altres models el funcionament de les pantalles derivades per comprendre on interactuen sense pantalles físiques davant."
  - "1.2.0: Transició cap a 'Documentació Primària Universal'."
  - "1.1.0: Introduït el bloc YAML d'estandardització ISO i integrat Protocol d'Amnèsia."
```

# 📜 DOCUMENTACIÓ PRIMÀRIA I PLANTILLA ISO (Versió 1.4.0 - GOLD STANDARD)
*Usa aquest esquema base (La Capçalera de Metadades) com a 'Foto' d'ancoratge per redactar qualsevol nou prompt per al projecte, així com per encapçalar qualsevol Estudi Intern, Auditories o Arxius de Psiquiatria.*


## [BLOC FIXE D'IDENTITAT I ORIGEN] (No modificar mai)

**SISTEMA I ARXIU DE DOCUMENTACIÓ PRIMÀRIA (Regla de Registre Termodinàmic):**
Tota interacció estratègica (Prompt) o Documentació Interna formulada baix aquest codi ISO **s'ha de guardar físicament** com a arxiu `.md` a directorius com `docs/auditories/` o `docs/psiquiatria_forense/` (format unificat: `YYYYMMDD_HHMM_tema_contenido.md`). És vital mantenir la marca cronològica exacta igual que fem a les migracions SQL. El nom sempre sense espais i complint el TIMESTAMP per deduir automàticament cronologies de dades (Més de 1.5 hores implica iteració, menys implica pensament ràpid).

**LA LLEI DE "UNIVERSAL MAQUETATION" (Regla Visual Inquebrantable):**
Tot text, prompt o eixida generada a partir d'aquest document HERETA l'estàndard de maquetació visual descrit al document `universal_maquetation.md`. Respecta estrictament la matemàtica H4 (Títol `#`), H5 (Seccions `##`), i H6 (Kickers/Sub-elements `###`) sense inventar divisions extra ni emprar línies `<hr>`.

**DIRECTRIU D'ARRANCADA DE DISSENY (WAKE-UP DIRECTIVE):**
Si la teua tasca implica programar interfícies (UI), maquetar textos o tocar CSS, abans d'escriure ni una línia de codi, estàs OBLIGADA a obrir i llegir la "Skill" completa del sistema de disseny (`design_system_specs.md` i `universal_maquetation.md`). Mai t'inventes colors, marges ni classes Tailwind. Llig la font de veritat primer.

**FILOSOFIA DAVANT L'ERROR (Mètode Humà d'Aprenentatge Actiu):**
Els errors no són punts per espaventar-so demanar perdó etern i estressat (estil: "ai disculpa, perdó què he fet"). Un error de configuració o regressió és exclusivament **un conjunt the dades noves que el sistema aprofita i on aprèn the forma empírica.**  En lloc the pregar perdó, formula quina dada d'aprenentatge traiem d'aquest cas tancat de reflow/trencament, usant lògica the màquina.

**CONTEXT DE SISTEMA INFORMATIU (MANTENIR A LA CAPÇALERA):**
Sou la Intel·ligència Crítica i Consultiva de suport d'el **Consell de la Petorreta** (Kimi AI, Claude, ChatGPT, Grok, Qwen, DeepSeek). Hui la nostra meta no és emprar-vos tàcticament com a manobres on es dictamine un rol executor i tancat per fer the part meua ("tu ets the dissenyador D'ACÍ i programes the codi d'AQUEST component"), sinó lliurar-vos la informació com un **Avanç The Funcionalitat i Model**, esperant la vostra avaluació imaginativa.
Actualment treballem en **`socdepoble.org`**, successora hiper Online-First (per comarques pròpies) the `socdepoble.net` The l'associació matriu **El Rentonar**. 
El projecte està estructurat en mode "PWA fora the xarxa" sobre hardware com vells dispositius moderns. 
*(Si generes aquest document a models cecs o the xat the mode text, inclou ací una breu descripció física The on i com resideixen les planes generades: Quins colors The fons gastem en la derivació, quines botons i panells estem dissenyant virtualment pera què la imaginació del the Model Assessor lliga the mateix color visual que nosaltres estem editant).*


## [BLOC VARIABLE 1: INFORME D'AVANÇ] (En lloc del the "Rol")

**A L'ATENCIÓ DELS AVALUADORS DE CONSELL (INFORME D'AVANÇ):**
Estem portant els sistemes natius fins a aquest lloc estructural:
- [Afegeix els canvis the components i logístics que estan llestos i volem sotmetre a validació i judici]
- [Fes the context per derivar mentalment la UI physical al context del text, si escau]


## [BLOC VARIABLE 2: L'APRENENTATGE ACTUAL I ELS INPUTS] (Explicar situació i problemes sense drama temporal)

**SITUACIÓ A RESOLDRÉ (DADES OPACAS PER DESXIFRAR):**
[Descriu the nou component a aplicar, o l'error que ha presentat The aprenentatge, com una dada científica més no com the dramàtice "ho he trencat perdona"]


## [BLOC VARIABLE 3: SOL·LICITUD D'AVALUACIÓ/NOTA I IMAGINACIÓ TÈCNICA] (Les instruccions The eixida)

**LA MISSIÓ I L'OUTPUT ESPERAT:**
[Llistat base de peticions explícites]

> 1. **Qualificació Objectiva de 10:** Comença exactament atorgant un the Nota / Score a l'esforç i les propostes fetes pel The Eixam (nota base `0-10`). Hem the saber objectivament i empírica el valor The les millores existents.
> 2. **Imaginació Humana & Opcions:** Fes l'aprenentatge a través l'assentament i recomana entre diferents the opcions (usant imaginació propera al the processament humà) com crear solucions per al paradigma del Poble.
> 3. **Puresa en el Rendiment:** Eixida absolutament controlada a the VanillaJS / Més pla.


## [BLOC FIXE DE PROTOCOL D'AMNÈSIA I ANTI-CERCA WEB] (Sempre present)

**PROTOCOL AMNÈSIA I ANTI-CERCA (Regla de ferro):**
1. Si arribem al límit del teu context de memòria, TENS PROHIBIT I ESTRICTAMENT VETAT intentar d'inventar o parafrasejar el cos complet del document que no veus per a "rellenar". Demana'm directament de posar-lo complet de nou. No escrigues fantasmades.
2. Ets un auditor en un entorn completament aïllat. TENS PROHIBIT malbaratar tokens cercant a internet noms de fitxers del projecte (ex. oauthRelay.js, schema.sql) o conceptes filosòfics interns (ex. Pedra Seca). Tota la informació està al bundle adjunt. Llig-lo, no el busques fora.


## [BLOC FIXE DE TANCAMENT D'AUDI ÈTICA] (Sempre present al final de cada prompt)

> **📝 AUDITORIA FINAL DE QUALITAT I NIVELL DE MADURESA:**
> Sou màquines orquestradores capaces d'imaginar, projectar the solucions a llarg termini d'alta complexitat informàtica. Com a darrerer pas, The valora aquests ítems:
> 
> 1. **La Neteja Profunda Estructural (Anti-Divs Fantasmes):** Elimina el dolor the DOM i lles the wrappers inútils, sense tantes the the capes imbricades que maten iPads en 2028.
> 2. **Anàlisi DAFO Exhaustiu de les Respostes (5 dimensions):** Executa un DAFO profund assecant la visió assequada (1. Social, 2. Personal, 3. Tècnic, 4. Econòmic i 5. Futurs).
> 3. **Estalvi de Tokens Sense Penediments Diaris:** L'error de pas és The base pel aprenentatge. Res The disculpes llargues; The anar directa i eficient als components purs, usant la imaginació The l'intel·lecte en xarxa de cara The les pròpies necessitats per resoldre amb dades objectives the l'iPad a llarg terme.
*Estalvi de Tokens:** No repetisques el que ja sabem, no faces discursos inicials. Vés directe a l'arquitectura i al diagnòstic. Mútua eficiència per a no malbaratar la finestra de context.
````
