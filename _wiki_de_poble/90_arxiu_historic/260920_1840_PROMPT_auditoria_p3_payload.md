---
tipus: petorreta
estat: esborrany
description: "Auditoria d'arquitectura inversa i integració amb Sollutia"
tags:
  - maquina
  - seguretat
---
# Petorreta — Auditoria Extrema: Integració Sollutia
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | SDP-PROMPT-202609201640 |
| Versió | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-09-20 16:40 |
| Modificació | 2026-09-20 16:40 |
| Agent redactor | [[IAIA MarIA]] |
| Propietari | [[Consell de la Petorreta]] |
| Aprovació humana | pendent · 2026-09-20 |
| Revisió pendent | no |

## Vincles

- [[00_INDEX_ESCRIPTORI]]
- [[universal_maquetation]]
- [[design_system_specs]]

Un document sense cap vincle és un satèl·lit. Ancora'l abans de tancar-lo.

## Entrades

- `260920_1840_BUNDLE_auditoria_p3_payload.md` · sha256 del manifest: 94c95f6943c618e591ccf0b8ce8ad162fd89dde71a892d3ef6ee80380e981970

## Consell convocat

Z.ai · Qwen · Deepseek · Dola · Kimi · Claude · Perplexity · Mistral Vibe ·
Grok · Gemini · Copilot · ChatGPT Codex

## Contracte de realitat

1. Entorn tancat. L'única font de veritat és el bundle adjunt.
2. Els únics fitxers que existixen són els del manifest, amb ruta i sha256.
   Qualsevol altre nom és ficció i va a §Incògnites.
3. Tota afirmació sobre codi es cita com `ruta:linies`. Si no es pot citar,
   no s'afirma.
4. Sense la sentinella `<<<FI_DEL_BUNDLE>>>` al final, el bundle arriba tallat.
   Tot fitxer sense la seua tanca `<<<FI_FITXER>>>` és il·legible. Omplir el
   buit és al·lucinar.
   **ATENCIÓ: SI NO TROBES <<<FI_DEL_BUNDLE>>> AL FINAL DEL DOCUMENT, ESTÀ TOTALMENT PROHIBIT AVALUAR RES. Has de retornar immediatament un error crític avisant a l'usuari que el text s'ha tallat en pujar-lo o copiar-lo.**
5. **MITIGACIÓ "PEDRA SECA"**: Sempre que lliges el terme "Pedra Seca" al codi,
   a la Wiki o al prompt, l'has d'interpretar estrictament com el nostre 
   **Sistema de Disseny (Design System / UI Kit)**. No al·lucinis referències 
   literals a construccions rurals o murs de pedra.
6. **PROTOCOL ANTI-CERCA (Prohibició de cerca):** Tens estrictament prohibit activar cap eina de cerca web, navegador o recuperació d'informació en línia externa. La resolució ha de donar-se exclusivament amb el codi aportat al bundle o pel propi agent.
7. **CONTENCIÓ ABSOLUTA (PROHIBIT TOCAR CODI I EVITAR "CONFIRMAR CANVIS"):** Encara que tingues capacitat i permisos per editar l'entorn de treball local (com Claude Code o Codex en Cursor), tens **ESTRICTAMENT PROHIBIT** modificar, afegir, esborrar cap línia de codi, o "proposar canvis". El teu rol és única i exclusivament d'auditor i analista. Generaràs l'informe amb els defectes trobats i la solució explicada de forma teòrica. **CRÍTIC PER A CODEX I CURSOR:** Tens PROHIBIT generar blocs de codi adreçats a l'aplicació automàtica que disparen la interfície o la barra de "Confirmar Canvis" (Confirm Changes) a l'editor. L'humà no ha de prémer cap botó per aplicar el teu codi, ni volem que la barra de confirmació de canvis aparega MAI a la pantalla, ja que l'agent central (IAIA MarIA) s'encarregarà d'eixa faena. Tota la teua proposta s'ha d'exposar de forma purament explicativa; si has de mostrar codi, fes-ho sense incloure la ruta del fitxer dalt del bloc o utilitza text pla, per evitar que l'IDE intente aplicar-ho automàticament i destrosse el sistema. No ens demanes confirmar cap canvi.

## Context Històric i Identitat (Qui som i Per a què treballem)

**L'Ànima del Projecte:** Treballem per a construir una plataforma de desenvolupament rural, un refugi digital, des de La Torre de les Maçanes. Aquest projecte és Sóc de Poble. Pots consultar els nostres orígens culturals a rentonar.blogspot.com i socdepoble.net.

**Visió Open-Source i "Estil Obsidian":** Tot el que construïm ací no només és per a nosaltres; la nostra voluntat és regalar-ho (open-source) a la comunitat global, perquè siga útil per a qualsevol persona que ho vullga utilitzar, al pur estil Obsidian (basat en l'Escriptori, arxius Markdown, portable i lliure de tancaments). 

**La Política de Codi Pur ("Zero brossa"):** Com que l'objectiu final és regalar l'arquitectura, l'exigència tècnica és implacable. No volem deixar nyaps, espagueti-code ni "mierda" perquè ningú acabe renegant de nosaltres el dia que ho fem lliure. La IA que llig açò ha d'entendre que no valen pegats ràpids; calen solucions estructurals elegants, testades i impecables. Volem codi "Pedra Seca" de veritat. (Sollutia és l'agència SaaS externa que ens proveeix exclusivament el backend, però el nostre cor és independent).

## Informe d'avanç

Bombardejar el sistema per fer arquitectura inversa i trobar forats de seguretat, SEO, usabilitat i defectes en la integració amb Sollutia.

## Situació i dades opaques

Bundle aparellat: 260920_1840_BUNDLE_auditoria_p3_payload.md.

Sollutia s'ha de connectar amb nosaltres hui mateix i la pàgina ha de ser perfectament visible en producció i lliure d'invencions com la "Pedra Seca" que no vinguen al cas o que els LLMs puguen al·lucinar.

## Missió

1. Bombardejar el sistema per fer arquitectura inversa i trobar forats de seguretat, SEO, usabilitat i defectes en la integració amb Sollutia.
2. Fes una auditoria extrema: analitza tot el front-end, els scripts d'integració i la capa de dades. Busca forats de seguretat, problemes de SEO, usabilitat i friccions en la integració amb el backend de Sollutia.

## Eixida esperada

markdown

## Incògnites

- Cap incògnita declarada en generar el prompt.

## Bateria de veritat

- [ ] He citat només rutes del manifest, en format `ruta:linies`?
- [ ] Cap nom de fitxer, funció o variable inventat?
- [ ] Tota conjectura marcada [SUPÒSIT] o moguda a Incògnites?
- [ ] He comprovat la sentinella abans de respondre?
- [ ] El document passa `tractor-frontmatter.mjs --estricte`?

<!-- SDP-SGQ-CONTEXT: {"_wiki_de_poble/03_actuar/plantilles/00_PLANTILLA_PROMPT_CONSELL.md":"b9243f587583debaa16147865a231a69afcfc393d311310547c81fc67ab71608","_wiki_de_poble/01_ser/00_bios.md":"24792e1617c2e647781ebe7e9d866cf63b48996220e1017aa85634476bc2affa","_wiki_de_poble/01_ser/02_genotip.md":"9ba06ed6529be94964778da05e85f4433466cf87aaff3c80ff6c54702fa19e27","_wiki_de_poble/02_saber/doc_governanca.md":"abb2f27f4a72cee9a2f1878a460b10b2f68773ad54ee989da01655904eaaf351","_wiki_de_poble/02_saber/doc_logos_oficials.md":"0fe505e7e29e7ca7398e5306e8af0a5c01eebb3c19f710047b5bb7c9ebd762f9","_wiki_de_poble/02_saber/architecture/ADR-2026-08-ONLINE-FIRST.md":"68e0b2c983845a614ea427ed1b2a3c6571b2a08709feab986efbdab36936e805"} -->
