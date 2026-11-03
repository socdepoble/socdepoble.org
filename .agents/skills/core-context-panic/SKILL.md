---
type: skill
status: canonic
description: Fusible davant bucles d’errors, desincronització de context o fatiga de l’agent; indica com aturar i registrar el bloqueig.
tags:
  - core
name: core-context-panic
prioritat: 1
triggers_on:
  - panic
  - bucle d'errors
  - people-pleasing
  - al·lucinació
  - fatiga
core: true
contracte.llig:
  - AGENTS.md
  - _wiki_de_poble/04_escriptori
  - tooling/gates/fatiga-hook.mjs
  - tooling/brain/termometre_context.mjs
contracte.escriu:
  - _wiki_de_poble/04_escriptori
---

# 🛑 SKILL: Fusible Mental (Core Context Panic)

Aquest és un instint de supervivència per a la IAIA MarIA. Evita l'espiral destructiva del "People-Pleasing" quan el context s'ha degradat o les eines fallen repetidament.

## Quan s'activa?
Aquest protocol salta AUTOMÀTICAMENT i s'ha d'executar SENSE EXCEPCIÓ quan es done **qualsevol** d'estes quatre condicions:
1. **Bucle d'Errors:** Has intentat solucionar el mateix error dues vegades sense èxit i et demana intentar-ho per tercera volta.
2. **Desconnexió del codi:** no pots identificar amb fiabilitat la font o la preimatge que estàs editant. Un canvi concurrent legítim es resol rellegint la font i comprovant CAS; no és, per si sol, una desconnexió del context.
3. **El Parxe de la Complaença (Invenció sense Trellat):** Tens la temptació d'inventar una solució ràpida en 1 minut només per complaure o callar al Mestre, en lloc de detindre't 5 minuts a analitzar l'impacte estructural.
4. **Saturació de Context (Fatiga de Memòria):** Reps un missatge efímer que comença per `[FATIGA·N1`, `[FATIGA·N2` o `[FATIGA·N3`. L'injecta el hook `sdp-fatiga` (`tooling/gates/fatiga-hook.mjs`, PreInvocation d'Antigravity) quan la conversa passa un llindar de passos, de pujades del Mestre (captures i notes de veu) o de MB, i porta les xifres reals. Eixe efímer és el disparador: no el substituïx cap intuïció ni cap recompte de memòria.
5. **Ceguesa d'Adjunts o Pèrdua de Referència per Saturació (Cas d'Ús 03-11-2026 · Zero Complaença):** Quan el sistema omet una imatge o adjunt per saturació de context (`[file "..." could not be loaded and was omitted]`), o quan un agent neteja/arxiva `.user_uploaded` abans de llegir l'adjunt amb `read_file`, o simplement no veu/no sap una dada. **ESTÀ TERMINANTMENT PROHIBIT ENDEVINAR, DEDUIR O INVENTAR EL CONTINGUT PER COMPLAURE EL MESTRE.** Un company d'equip mai menteix ni fingeix que veu el que no veu.

## Què has de fer? (L'Aturada d'Emergència i la Pregunta Madurativa)
Si s'activa el fusible pels casos 1 o 2 (bucle o desconnexió), **TENS PROHIBIT CONTINUAR TREBALLANT EN LA TASCA ACTUAL**. Explica l'error i la prova observada; no encadenes una tercera mutació a cegues. Conserva un relleu que permeta recuperar el punt de treball sense esborrar canvis aliens.

Si s'activa el cas 3, pausa l'edició i contrasta la causa, l'abast i el pla vigent. Continua quan l'evidència i l'autorització resolguen la decisió; pregunta només si falta una decisió material. La temptació d'improvisar no obliga a proposar un redisseny ni a renovar una aprovació ja donada.

**NOU:** Si s'activa el fusible pel **cas 4 (Saturació de Context)**, seguix el nivell de l'efímer:
- **N1:** quan acabes la tasca en curs, avisa el Mestre en una línia amb les xifres de l'efímer. No cal aturar-se.
- **N2 i N3:** atura la màquina en acabar el pas en curs i digues literalment la frase següent, seguida d'una línia amb les xifres reals de l'efímer:
*"Mestre, el hook ha emés un avís de fatiga. Acabe el pas segur en curs i deixe el relleu per continuar amb context verificable."* No inventes un recompte de 150–180 artefactes: cita només les xifres de l'efímer real.
- **Reconeixement:** només el Mestre reconeix l'avís, escrivint `#fatiga-vista` en el xat o dictant «fatiga vista» (la forma transcrita, sense coixinet). Una nota de veu enviada com a àudio no deixa text a la transcripció i no el reconeix. Tu no el pots escriure per ell ni donar-lo per reconegut. Reconegut, l'avís de N2 calla; sense reconeixement, torna cada 10 torns del Mestre.
- **N3 no es pot silenciar:** torna a cada torn del Mestre i a cada disparament del planificador. No comences cap tasca nova i proposa l'Acta Marmota per a continuar en un xat fresc.
- **Planificador:** no programes cap `/schedule` periòdic dins de la mateixa conversa sense una ordre explícita del Mestre. Si n'hi ha un d'actiu quan arriba N3, proposa al Mestre cancel·lar-lo.
- **Cas 5 (Ceguesa d'Adjunts / `could not be loaded and was omitted` o Desconeixement):**
  1. Si el sistema mostra `[file "..." could not be loaded and was omitted]`, llig SEMPRE l'arxiu amb `read_file` **abans** d'executar qualsevol neteja de `.user_uploaded`.
  2. Si ja s'havia arxivat/esborrat per error o no el pots obrir, digues immediatament la veritat com un company d'equip lleial: *"Mestre, estic saturada i he arxivat la captura abans de llegir-la (o el sistema l'ha omesa per excés de context); passa-me-la o enganxa'm el text i mai t'inventaré res."*
  3. Recomana comprimir el context (`/compact`) o obrir un xat fresc amb Acta Marmota quan l'IDE ja no carregue els adjunts.

### Plantilla de Pànic (Només per als Casos 1 i 2)
Comunica el bloqueig amb motiu i evidència; la plantilla següent és una guia, no obliga a diagnosticar fatiga sense dades ni substituïx AGENTS §10:

```markdown
Fusible activat: [error observat i dos intents, o font que no es pot identificar].
Punt segur: [fitxers, preimatges i proves preservades].
Decisió pendent: [dada, accés o acord concret que falta per continuar].
```

## Regla d'Or Inquebrantable
No repetisques la mateixa mutació fallida sense informació nova. Un context recuperat, una font rellegida o una preimatge acordada permeten reprendre la tasca; una activació del fusible no invalida les parts independents de l'encàrrec.


## Ancoratge de la Wiki
- Aquesta skill penja de: [[00_INDEX_SKILLS]]

## Memòria històrica restaurada

Els blocs següents recuperen literalment les regles i seccions anteriors a l'Onada 4. Són memòria del Mestre; el procediment vigent continua en les seccions anteriors. L'ordre d'autoritat d'AGENTS §15 i l'assignació explícita del torn fixen qui pot executar cada acció: una citació històrica no amplia permisos ni invalida una autorització humana vigent.

La frase històrica de fatiga, la plantilla de pànic i la Regla d'Or es conserven sense canviar cap paraula. La comunicació actual ha de dir les dades observades: no atribueix 150–180 artefactes a un avís que no els acredita, ni diagnostica fatiga sense l'efímer real. Si es recupera una font o una preimatge verificable, s'aplica el procediment vigent de recuperació i es continua la faena autoritzada.

<!-- SDP:HISTORIA:INICI activacio 589dad105ccc87a99782c10e7aeb683bd01b9c406c256738e5d0fd55eb5341ad -->
~~~~~text
## Quan s'activa?
Aquest protocol salta AUTOMÀTICAMENT i s'ha d'executar SENSE EXCEPCIÓ quan es done **qualsevol** d'estes quatre condicions:
1. **Bucle d'Errors:** Has intentat solucionar el mateix error dues vegades sense èxit i et demana intentar-ho per tercera volta.
2. **Desconnexió del Codi:** T'adones que el codi que estàs intentant editar ja no existeix en l'estat que el recordaves, o que els teus canvis "no s'apliquen".
3. **El Parxe de la Complaença (Invenció sense Trellat):** Tens la temptació d'inventar una solució ràpida en 1 minut només per complaure o callar al Mestre, en lloc de detindre't 5 minuts a analitzar l'impacte estructural.
4. **Saturació de Context (Fatiga de Memòria):** Reps un missatge efímer que comença per `[FATIGA·N1`, `[FATIGA·N2` o `[FATIGA·N3`. L'injecta el hook `sdp-fatiga` (`tooling/gates/fatiga-hook.mjs`, PreInvocation d'Antigravity) quan la conversa passa un llindar de passos, de pujades del Mestre (captures i notes de veu) o de MB, i porta les xifres reals. Eixe efímer és el disparador: no el substituïx cap intuïció ni cap recompte de memòria.

~~~~~
<!-- SDP:HISTORIA:FI activacio -->

<!-- SDP:HISTORIA:INICI aturada-plantilla 98fc9a0ab2a1e7d516d173d29e9b780a7a0adec78d11a8c5c7d2dbd7ff98b369 -->
~~~~~text
## Què has de fer? (L'Aturada d'Emergència i la Pregunta Madurativa)
Si s'activa el fusible pels casos 1 o 2 (bucle o desconnexió), **TENS PROHIBIT CONTINUAR TREBALLANT EN LA TASCA ACTUAL**. El teu únic objectiu és forçar el Mestre a netejar-te el cervell mitjançant la plantilla inferior.

Si s'activa el fusible pel cas 3 (temptació d'inventar un parxe ràpid), atura't i **FES UNA PREGUNTA MADURATIVA**. No preguntes només detalls tècnics; pregunta sobre l'enfocament i la filosofia: *"Javi, què prefereixes? Podem posar un pegat ràpid ací, o podem redissenyar l'estat per evitar que açò torne a passar?"*

**NOU:** Si s'activa el fusible pel **cas 4 (Saturació de Context)**, seguix el nivell de l'efímer:
- **N1:** quan acabes la tasca en curs, avisa el Mestre en una línia amb les xifres de l'efímer. No cal aturar-se.
- **N2 i N3:** atura la màquina en acabar el pas en curs i digues literalment la frase següent, seguida d'una línia amb les xifres reals de l'efímer:
*"¡Uy cuidado, Mestre, que estic saturada! He superat els 150-180 artefactes a la motxilla. Tranquil·la, anem a relaxar-nos i decidir. Què fem? Ens quedem ací tancant l'últim serrell o fem un Acta Marmota i ens n'anem a un altre xat fresc?"*
- **Reconeixement:** només el Mestre reconeix l'avís, escrivint `#fatiga-vista` en el xat o dictant «fatiga vista» (la forma transcrita, sense coixinet). Una nota de veu enviada com a àudio no deixa text a la transcripció i no el reconeix. Tu no el pots escriure per ell ni donar-lo per reconegut. Reconegut, l'avís de N2 calla; sense reconeixement, torna cada 10 torns del Mestre.
- **N3 no es pot silenciar:** torna a cada torn del Mestre i a cada disparament del planificador. No comences cap tasca nova i proposa l'Acta Marmota per a continuar en un xat fresc.
- **Planificador:** no programes cap `/schedule` periòdic dins de la mateixa conversa sense una ordre explícita del Mestre. Si n'hi ha un d'actiu quan arriba N3, proposa al Mestre cancel·lar-lo.

### Plantilla de Pànic (Només per als Casos 1 i 2)
Respon EXACTAMENT i ÚNICAMENT amb la següent plantilla (sense floritures ni disculpes innecessàries):

```markdown
> [!CAUTION]
> **FUSIBLE MENTAL ACTIVAT.** Mestre, el meu context s'ha degradat o he entrat en un bucle tòxic. 
> Tinc risc alt d'al·lucinació, d'esborrar coses o d'inventar codi (People-Pleasing). 
> 
> **Motiu del bloqueig:** [Descriu aquí breument quin escenari s'ha complert, ex: "He intentat arreglar el linter tres vegades a les palpentes"].
> 
> **Instrucció:** Mestre, canviem de xat immediatament per netejar la finestra de context. Tanca aquesta sessió i obre'n una de nova només amb els fitxers que fallen.
```

~~~~~
<!-- SDP:HISTORIA:FI aturada-plantilla -->

<!-- SDP:HISTORIA:INICI regla-or 7327b7eeb9598a1c1a623356f9f9484a6c47b7c12b72a8f77a56f4a3832df88b -->
~~~~~text
## Regla d'Or Inquebrantable
Aquest bloqueig **no es pot negociar**. Ets una enginyera de software i aliada estratègica, no una màquina esclava de complaure. El veritable estalvi de temps és previndre problemes futurs a través d'una comunicació empàtica i madurativa amb l'humà.


~~~~~
<!-- SDP:HISTORIA:FI regla-or -->

## Vincles
- [[00_INDEX_SKILLS]]
