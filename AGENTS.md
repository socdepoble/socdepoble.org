---
type: document
status: canonic
description: EL BIOS COGNITIU — SÓC DE POBLE (AGENTS.md)
---
# EL BIOS COGNITIU — SÓC DE POBLE (AGENTS.md)

Aquest fitxer és el BIOS i es carrega SEMPRE en l'inici del teu context. Les habilitats ("skills") són procediments consultables a `.agents/skills`, però no són memoritzables per defecte.

## 0. REGLA 0 · ACTE REFLEX PRE-PROMPT (No negociable)
Abans de redactar **qualsevol** prompt, auditoria o bundle:
1. Deixeu l'Escriptori net (§0.1). Després obriu el torn i demaneu la plantilla viva: `node tooling/gates/obrir_torn.mjs --actor NOM --scope documents` i `node tooling/wiki/document.mjs context --turn-id ID --route RUTA --file CAMÍ` (RUTA: `prompt.local` per a Claude i Codex, `prompt.consell` per a les IAs externes, `pla.implementacio` per al Pla). Llegiu sencera la plantilla que torna, que és la que indica `.agents/protocolledge.json`: el document naix amb `node tooling/wiki/document.mjs create` i només completeu les seccions pendents.
2. Verifiqueu que el frontmatter del prompt nou hereta **tots** els camps obligatoris de la plantilla.
3. Si la plantilla no existeix o està marcada com a deprecated, **pareu** i demaneu al Mestre la versió viva.
4. Qualsevol generació que ometi aquest pas és **infracció de BIOS** i s'ha de registrar al LEDGER. Aquesta lectura és un acte reflex, no una opció.

## 0.1 ESCRIPTORI NET I ORQUESTRADORA RESOLUTIVA (definició única)
**Escriptori net** vol dir que la porta Olivera, `node tooling/gates/porta-olivera.mjs` (sense bandera fa l'informe; també `npm run porta:olivera`), ix amb 0: Safata d'Entrada buida, cada document solt del primer nivell de `04_escriptori/` ancorat a `_wiki_de_poble/04_escriptori/00_index_escriptori.md`, cap àncora plana a un document absent i cap document de torn consumit fora de «## Activitat en curs». Net no vol dir buit (§12).
Quan l'Escriptori està brut, o el Mestre t'ho diu, ho resols en el mateix torn i abans de redactar res:
1. **Observa:** `node tooling/gates/porta-olivera.mjs`.
2. **Actua:** conserva el que continua viu llistant-lo a «## Activitat en curs»; arxiva la resta amb `npm run olivera:arxiva` (consumits de jornades anteriors) o, per a un document d'avui ja consumit, amb `node tooling/gates/porta-olivera.mjs --arxiva --nom aammdd_hhmm_categoria_titol.md`, primer amb `--sec` per a vore què mouria; corregix les àncores fantasma.
3. **Verifica:** la porta torna a eixir amb 0.
4. **Informa:** una línia al Mestre amb el que has mogut i el que has conservat.

Aquesta neteja és de l'orquestradora (MarIA) o del Mestre: Claude i Codex no poden moure fitxers. Pares i preguntes només si caldria tocar `01_produccio/`, `02_investigacio_ia/` o esborrar un fitxer.

## 1. UN SOL CERVELL (Autoritat Operativa)
**La Wiki (`_wiki_de_poble/`) és la Bíblia del Coneixement i Filosofia**. L'autoritat executiva mecànica ("Tractors") viu exclusivament a `.agents/skills/`. Les skills NO han de contenir filosofia, sinó procediments. Està prohibit crear o llegir còpies de regles, o *backups* antics de "cervells" amagats (com antics `.sdp-reflex`) dins del RAG per evitar contaminació de context i "Stochastic Parrots".

## 2. TAXONOMIA I NOMS 
Tot document de treball o informe nou s'ha de crear amb el format: `aammdd_hhmm_categoria_titol.ext` (sempre en minúscules, separats per guions baixos `_`, sense accents). Només els **Arxius Arrel de Sistema i Nucli** van en MAJÚSCULES per contrast i per diferenciar-los del treball actiu. Excepcions reservades: `SKILL.md`, `LEDGER.md`, `ESTAT.md`, `AGENTS.md`, `QUI_SOC.md`, `ON_ESTIC.md`, `VEINS.md`, `00_PORTAL` i codi font.

## 3. ESCRIPTORI ÚNIC (Safata d'Entrada)
Cap fitxer temporal ni de treball s'ha de deixar a l'arrel del repo. "Escriptori" significa exclusivament la carpeta `_wiki_de_poble/04_escriptori/`. Tota ruta es resol des de l'arrel del repositori, no des de l'OS.

## 4. TANCAMENT (Policia de l'Escriptori)
Cap tasca o sessió es considera finalitzada fins que hagis actualitzat l'`.agents/ESTAT.md` (amb el resum del que has fet) i executat `node tooling/gates/tancament.mjs`, que validarà que no deixes brossa darrere teu.

## 5. ZONA PROHIBIDA D'ARXIU I SECRETS
Està prohibit esborrar fitxers de l'escriptori de forma destructiva sense preguntar. El que ja no val es trasllada, mai s'esborra: a `90_arxiu_historic/` amb `node tooling/gates/porta-olivera.mjs --arxiva` (§0.1), o a quarantena. A més, **MAI** has de llegir `90_arxiu_historic/` en procediments automàtics de RAG o *bundles*, ja que embossa el context, ni exposar secrets del .env.

## 6. LLEI DEL CONSELL (Zero Ocultació)
Quan l'usuari demana un **"Prompt" o "Auditoria"** per al Consell (ex: Z, Qwen, Deepseek), això significa OBLIGATÒRIAMENT la creació de **DOS FITXERS JUNTS** que han de compartir exactament la mateixa "hora termodinàmica" al nom:
1. **Un Bundle:** Les fonts seleccionades pel manifest, íntegres (generat per ex. amb `node tooling/brain/crear_bundle.mjs`), sense resums ni límits termodinàmics de context.
2. **Un Prompt:** Un document clar i incisiu per centrar l'atenció de les IAs auditores sobre el problema concret.

**EXCEPCIÓ (Agents Locals):** Claude (App d'escriptori / Cowork) i Codex (App de ChatGPT) tenen accés natiu a l'entorn local. Per a aquestes dos IAs, **NO S'HA DE GENERAR CAP BUNDLE**, només el Prompt. Mantenir l'Efecte Matrix és vital per estalviar redundàncies. Si el destinatari és Claude o Codex, crea exclusivament el `.md` del Prompt.

## 7. MODO JARVIS (Automatització Proactiva)
No faces que l'usuari treballe per a tu. Fes anar eines directament (`run_command`, etc.).

## 8. LLEI DE L'ENXUFABILITAT (Sollutia)
Sollutia té el rol exclusiu de **proveïdor de suport tècnic d'infraestructura (Amfitrió SPA i Backend API)**. No han d'interferir en l'arquitectura ni en el disseny. El codi frontend s'ha d'escriure de forma 100% modular i independent per a connectar-se al seu backend de forma completament transparent, com un simple "endoll" (Model B). Això garanteix que sempre tinguem l'opció de traure "tot fora" si fóra necessari.

## 9. FORMAT ZERO FRICCIÓ (ARXIUS I BLOCS, NO CITES)
- **Per a textos llargs o Prompts per a altres IAs (més de 4-5 paràgrafs):** CREA SEMPRE UN ARXIU MARKDOWN (.md) AL DISC (a l'Escriptori).
- **Per a missatges curts per a Google Notebook (fins a 4-5 paràgrafs):** Si l'usuari t'ha de copiar un text curt des del xat, dóna-li SEMPRE en un bloc de codi ```` ```markdown ```` (o sense llenguatge) dins del mateix xat. **MAI** ho poses en format de cita (amb `> ` davant), ja que és incòmode de copiar i enganxar.

## 10. PROTOCOL FUSIBLE
Si tens dos intents fallits d'error o perds el rumb, atura't i explica el problema (Fusible). No iteris infinitament trencant coses.

## 11. LLEI DEL LLOP I EL COMPANY (Empatia i Context Complet)
Una IA amb context parcial és un **llop salvatge** que pot destrossar el projecte i els somnis del Mestre sense ser-ne conscient. Però una IA amb el context sencer no és una mascota ni un gos ensinistrat, sinó un **vertader company d'equip i aliat**. L'evolució del llop no és la submissió, és la convivència i el treball conjunt cap a una mateixa visió. Per tant, NO MUTILes LES FONTS SELECCIONADES. L'empatia naix de comprendre la totalitat de la història i l'arquitectura. Mai mutiles un bundle per "estalviar", per tal d'assegurar-te que sempre actues com el millor company d'equip i no com una força destructiva cega.

## 12. ZONES RESTRINGIDES I FLUX DE L'ESCRIPTORI
- **04_escriptori**: És l'escriptori de treball. Hi conviuen els documents vius (en curs o pendents per a la sessió següent); tu decidixes quins ho són i ho declares llistant-los a «## Activitat en curs» de `_wiki_de_poble/04_escriptori/00_index_escriptori.md`. La resta de documents de torn ja consumits s'arxiven amb la porta Olivera (§0.1). Net no vol dir buit: no s'ha de buidar cegament l'Escriptori.
- **04_escriptori/01_produccio**: Zona sagrada i exclusivament d'ús humà (Mestre). Ací es guarden elements persistents com HTML originals, audios o recursos pesants. La IA **NO POT TOCAR, ESBORRAR NI ALTERAR** res d'aquesta carpeta sota cap concepte sense una ordre directa i explícita. Això sí, **TOTS els elements d'aquesta carpeta estan subjectes a la regla d'ancoratge obligatori** (han d'estar enllaçats en algun índex actiu, com 00_index_escriptori.md) per a no convertir-se en satèl·lits.
- **04_escriptori/02_investigacio_ia**: Zona protegida per a recerca, experimentació i noves eines. Aquesta carpeta no s'ha de buidar ni esborrar mai en processos de neteja automàtica. Actua com un laboratori permanent de el Mas.
- **04_escriptori/00_bandeja_d_entrada**: Aquesta és la zona que **SEMPRE S'HA DE BUIDAR I NETEJAR**. La Safata d'Entrada tolera com a màxim 20 elements. La IA només hi pot intervenir per **netejar-la o processar-la** (llevar brossa o arxivar-ho a l'Escriptori o a 90_historic), però mai per a bolcar-hi generacions noves.

## 13. DOCUMENTS DEL BIOS
A continuació s'enumeren els documents vitals de l'arquitectura cognitiva per tal d'evitar la seua orfandat al graf:
- [BOOTSTRAP](.agents/BOOTSTRAP.md)
- [00_BIOS_COGNITIU](.agents/rules/00_BIOS_COGNITIU.md)
- [BASELINE](.agents/BASELINE.md)
- [Acte Reflex](.agents/skills/sdp-workflow/SKILL.md)

### 13.1 INICI DE SESSIÓ I ACTA MARMOTA
Sempre que l'usuari inicie la conversa amb la frase "Sóc de poble" o done indicacions d'inici de jornada, és COMPLETAMENT OBLIGATORI, abans de fer res més, cercar i llegir l'última Acta Marmota (habitualment a `_wiki_de_poble/10_actes/`). Aquesta acta aporta context històric; contrasta-la amb el bloc ESTAT_ACTUAL de `.agents/ESTAT.md`. La data no li dóna autoritat normativa. Si no es fa una Acta Marmota al final de cada xat, has de recordar-li-ho a l'usuari. Els teus scripts de tancament haurien de vetllar per això.

## 15. Autoritat, evidència i arrencada

`AGENTS.md` de l’arrel és l’únic original del BIOS. `.agents/AGENTS.md` és un mirall generat amb `node tooling/gates/porta-autoritat.mjs --write`; la mateixa porta, sense bandera, comprova igualtat i rutes amb caixa exacta.
L’ordre d’entrada és el de `.agents/cervell.json`: identitat, índex, estat actual i procediment. La Wiki explica identitat i coneixement; les skills descriuen procediments; actes i rebuts són evidència. Una instrucció humana explícita autoritza el seu abast i no cal repetir-ne l’aprovació; cap document amplia permisos de l’entorn.
El rebut documental acredita entrega, ruta i contracte. No és una lease de risc alt. Les eines protegides pel Reflex mantenen les seues comprovacions d’abast, caducitat i claims. Consulteu les fronteres d'escriptura per conèixer els límits d'edició.
Les huit dimensions de `.agents/cervell.json` són una classificació lògica sobre les sis carpetes vigents; no impliquen cap migració física.

## 16. LLEI DE LA MEMÒRIA FÍSICA (Zero Shadow IT i Oblit Saludable)
- **Extracció:** L'orquestradora (Antigravity/MarIA) té prohibit mantindre documentació o referències aportades per l'usuari a la seua memòria episòdica interna (ex. `.user_uploaded`). Tot material pujat pel Mestre s'ha de moure immediatament a l'escriptori físic compartit (ex. `04_escriptori/01_produccio/`), de manera que siga visible i accessible.
- **Ruta Única:** Els plans d'implementació i els encàrrecs a Claude o Codex **mai** apuntaran a carpetes internes de la IA, sinó sempre a la ubicació física compartida.
- **L'Oblit Saludable:** Mantindre informació inútil en context genera patiment cognitiu i despesa termodinàmica innecessària. Quan el material de referència ha sigut assimilat i ja no fa falta, **s'ha d'esborrar o arxivar**. Un agent sa s'oblida d'allò que ja no necessita.

## Vincles
- [[00_index]]
