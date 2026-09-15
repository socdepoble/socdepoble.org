```yaml
doc_id: SDP-PROMPT-ITERACIO-3
doc_type: PROMPT
authoring_agent: IAIA_MarIA
version_semver: 1.0.0
owner: Consell de la Petorreta
domain: meta-prompting
subdomain: obsidian_brain
locale: ca-valencia
objective: Millorar la plantilla ISO actual per tal que les respostes de les IAs no al·lucinen mai més fora de context, i perfeccionar el YAML inicial perquè Obsidian l'absorbeixi automàticament i vertebre el cervell de Sóc de Poble.
scope: Plantilla base de prompts i metadades YAML (Properties) per a Obsidian.
hora_creacio: "05:05"
hora_modificacio: "05:05"
exif_cognitiu:
  estat_emocional_sistema: Aprenentatge
  entorn_operatiu: Entorn_Dev_Local
  nivell_entropia: Zero
academic_metadata:
  revisors_ia: [Codex, Gemini, Grok, Vibe, Dola, Deepseek, Z, Qwen]
  data_aprovacio_humana: "2026-09-15"
  bibliografia_interna_radicals: []
  nivell_maduresa: Pendent_Revisio
inputs: [00_PLANTILLA_PROMPT_ISO.md]
constraints: 
  - Ús obligatori de valencià estricte.
  - Prohibició de recerca web. Tota la resposta ha de vindre del context proporcionat.
  - Objectiu hiper-específic: YAML per a Obsidian (frontmatter compatible i estructurat per a vistes de taula i dataview).
```

# 📜 ITERACIÓ 3: META-PROMPTING I EL CERVELL D'OBSIDIAN

**A L'ATENCIÓ DELS AVALUADORS DE CONSELL:**

A l'auditoria anterior vam observar que algunes de les vostres respostes van tendir a divagar, teoritzar i buscar a internet en lloc de centrar-se en el codi local. Ens hem adonat que l'errada és exclusivament nostra: no us vam passar la nostra **Plantilla ISO Gold Standard** per a estructurar el Prompt i blindar el vostre context. 

Hem decidit fer un pas arrere estratègic (aprenent de l'error) per a perfeccionar l'eina abans de tornar a tallar codi. 

Us passem ací davall el cos de la nostra plantilla actual (`00_PLANTILLA_PROMPT_ISO.md` versió 1.4.0).

---

### SITUACIÓ A RESOLDRÉ (DADES OPAQUES PER DESXIFRAR):

Volem que la nova **Versió 2.0.0** d'aquesta plantilla siga una eina mestra tant per a guiar-vos a vosaltres (les IAs) com per a vertebrar el nostre cervell a **Obsidian**. Actualment, el bloc YAML de dalt (el *frontmatter*) és molt ric, però potser no està organitzat de la manera més eficient perquè Obsidian (amb el seu sistema de *Properties* i *Dataview*) el llija, l'indexe i el connecte automàticament de forma visual.

**Plantilla Actual (v1.4.0):**
```yaml
doc_id: SDP-GEN-BASE-001
doc_type: "[PROMPT | ESTUDI_INTERN_IA | AUDITORIA_FORENSE | CONCEPT_ARQUITECTONIC]"
authoring_agent: "[NOM_DE_LA_IA_QUE_REDACTA_O_HUMA]"
version_semver: 1.4.0
owner: Consell de la Petorreta
domain: global
subdomain: architecture
locale: ca-valencia
objective: Establir el patró genètic fix (Gold Standard)...
scope: Qualsevol tasca de programació...
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
  - PROHIBICIÓ ESTRICTA DE CERCA WEB: Ets en un entorn tancat (air-gapped)...
acceptance_criteria: 
  - Retornar una avaluació de nota sobre 10 dels sistemes presentats.
  - Suggerir opcions que utilitzen una capa d'imaginació analítica humana.
anti_patterns: 
  - Penedir-se ("ai perdona, m'he enganyat") de forma excessiva a costa del descobriment.
  - Implicador d'equips purs (dir "Tu eres desenvolupador d'UI de la meua empresa, fes-me açò").
  - Omissió de descripció estructural...
fallback_behavior: 
  - Si no hi ha solució òbvia o la qualificació baixa de nivell, llistar les incògnites i consultar novament a l'usuari.
evaluation_metrics:
  - Puntuació Base a l'Avanç de la Missió (Valor sobre 10 assignat per IA).
  - Estabilitat visual en iOS i DOM Pobre (Pla/Aplanat).
test_vectors: []
change_log: 
  - "1.4.0: Integració de l'Algorisme de Termodinàmica..."
```

---

### LA MISSIÓ I L'OUTPUT ESPERAT:

> 1. **Qualificació Objectiva de 10:** Quina nota li poseu a l'estructura YAML actual per a ser processada per Obsidian i Dataview? 
> 2. **Refactorització del YAML (Obsidian Properties):** Reescribiu el bloc YAML complet per a la versió 2.0.0. Vull que poseu **tot el format YAML possible** i de la manera més nativa per Obsidian (llistes `[]`, enllaços d'Obsidian `[[...]]`, la propietat `tags:` obligatòria per a que s'indexe ràpid, dates en format ISO, etc.) perquè el connector Properties ho pille automàticament i connecte de forma massiva i intel·ligent el cervell de la wiki. Elimineu el que siga redundant (objectes massa imbricats que trenquen l'editor) i planegeu llistes de nodes.
> 3. **Refactorització del Cos del Prompt (Anti-Al·lucinació):** Feu que l'estructura del Markdown permeta que les IAs estiguen absolutament blindades i no busquen a internet. Com milloraríeu l'esquema de blocs (`BLOC FIXE D'IDENTITAT`, `BLOC VARIABLE`, etc.) perquè no ens torne a passar allò de divagar en generalitats? Retorneu la nova plantilla ISO v2.0.0 completa (YAML + Markdown).
> 4. **Enginyeria del Bundle:** Actualment generem els bundles unint tots els fitxers en un sol document Markdown gran, separats per títols i tanques de codi, precedit per un Manifest JSON amb els sha256 de cada fitxer. Estem fent-ho de la millor manera possible perquè els vostres "cervells" ho lliguen sense perdre tokens ni al·lucinar amb fitxers "perduts"? Hi ha alguna metodologia o format superior (estructuralment parlant) perquè les IAs digerisquen grans repositoris de codi de manera més eficient? Vull els vostres consells sobre com millorar el nostre script `crear_bundle.mjs`.

---

> **📝 AUDITORIA FINAL DE QUALITAT I NIVELL DE MADURESA:**
> Sou màquines orquestradores capaces d'imaginar i projectar solucions a llarg termini d'alta complexitat informàtica. Com a darrer pas, valoreu:
> 1. **Cervell Obsidian:** Que el YAML siga una obra d'art de l'estructuració de dades plana o array, llest per a que *Dataview* l'esprema al 100%.
> 2. **Blindatge Tàctic:** L'eficiència a l'hora d'imposar regles anti-al·lucinació a les vostres "germanes" (IAs). Hem de poder usar la plantilla per demanar execució de codi sense que ningú cerque teories a internet.
