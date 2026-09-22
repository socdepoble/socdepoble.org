---
type: document
status: esborrany
description: Pla executable per tancar P0 i P1, completar graf i sincronització, fortificar Storage i migrar residus sense perdre dades.
visibility: private
reflex: "Plantilla pla.md i prompt_local.md llegides; torn_1790037477445. Declaració no autenticada."
tags:
  - pla
  - fortificacio
  - arquitectura
---
# Pla d’implementació de fortificació final

## Registre

| Camp | Valor |
| --- | --- |
| Identificador | SDP-PLA-260922-0240 |
| Versió | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació / Modificació | 2026-09-22 02:40 / 02:45 Europe/Madrid |
| Propietari | Agents Locals — Codex |
| Aprovació humana | Pendent d’aprovació d’aquest disseny |

## Resultat final i tres criteris d’èxit

Fer que cada document i cada canvi visible es validen amb un contracte únic i amb dades actualitzades, sense dependre de recordar rituals en prosa.

1. Cap artefacte formal invàlid pot superar la validació final; els cinc bypass actuals i els casos Edit/Bash/rutes equivalents tenen proves negatives, i un torn inventat no es pot tancar.
2. Comprovar no modifica cap fitxer: els hashes abans/després de --check són idèntics. Les 50 portes tenen abast i cobertura declarats; lint queda a zero sense afluixar normes.
3. El graf permet cercar, filtrar i obrir documents; crear/editar/esborrar un fitxer local actualitza la vista sense npm run build manual i preserva selecció, filtres i zoom.

## Preparació i estat heretat

Llegir l’auditoria [[260922_0240_auditoria_opus]] i preservar el treball brut existent. Capturar un diff inicial per atribuir canvis i no fer restauracions globals. Acta base: 260922_0235. Bloc A implementat parcialment; no tornar a executar-lo com si estiguera pendent. No cal recuperar el prompt perdut per completar una UI nativa ja iniciada.

Logos oficials: public/assets/system/ui/; referències web /assets/system/ui/. Components del graf i controls seguiran EspecimenUniversalWorkspace.jsx i els tokens/mesures vigents de Pedra Seca. No s’afegeix una llibreria visual externa.

## Producció: seqüència, dependències i lliurables

| Ordre | Tasca | Dependències | Lliurable | Estimació orientativa |
| --- | --- | --- | --- | --- |
| P0 | Contracte documental i plantilles | Auditoria i aprovació del disseny | Esquema/route únics, generador i proves | 1 jornada |
| P1 | Torns persistents, adaptadors i tancament pur | P0 | Registre de torns i validació comuna | 1–2 jornades |
| P2 | Compilador segur, IDs i enllaços | P0; abans de watcher | Corpus públic/local separats i --check pur | 1 jornada |
| P3 | Lint i regressions UI | Baseline actual | Zero errors i avisos sense silenciar | 0,5–1 jornada |
| P4 | Matriu de 50 portes i Porta Promesa | P0–P3 | Catàleg executable i proves d’enrogiment | 1 jornada |
| P5 | Disseny/migració public_assets | Política de publicació i backend conegut | SQL versionat, RLS i proves d’accés | 0,5–1 jornada local |
| P6 | Migració final de reports i paperera | Inventari/hash i productors | Manifest de trasllats, recuperació i purga | 0,5 jornada |
| P7 | Graf interactiu complet | P2, P3 | Panell, selecció i accessibilitat | 1–2 jornades |
| P8 | Sincronització en viu | P2, P7 | Indexador incremental i adaptador Vite | 1–2 jornades |
| OEPM | Obtindre notificació i preparar resposta | Accés del titular a notificació | Motiu, termini acreditat i esborrany | Prioritat immediata; temps extern incert |

Estimacions de planificació, no terminis garantits. OEPM no espera el desenvolupament. Publicació/desplegament es plantejaran quan les proves siguen completes.

### P0 — Un sol contracte documental

Ampliar protocolledge.json perquè cada ruta declare explícitament tipus de sortida, plantilla, versió i seccions requerides. Mantindre schema.json com a definició de metadades i referenciar-lo; no duplicar els enums en les skills. Auditoria → informe; pla → document; prompt local → prompt; acta → acta. No inferir tipus del nom del model.

Separar metadades de la plantilla i exemple d’output amb un bloc de codi; concretar Registre, acte reflex, historial, troballes/proves, límits, pla i vincles segons tipus. Alinear la guia d’auditoria amb l’arquitectura real. Substituir defaults contradictoris per resolució explícita d’intenció/destinatari; desconegut produeix error accionable.

Un generador prepara estructura, camps i índex. Un validador comú comprova YAML complet, claus duplicades, enums, tipus, longituds i seccions, amb errors d’esquema que bloquegen. Reutilitzar parser només si supera aquestes proves; el parser regex actual no dona aquestes garanties. No afirmar certificació ISO: «plantilla ISO» és el nom intern del contracte.

### P1 — Torn verificable i límits dels rebuts

Registre local proposat .agents/runtime/turns/<uuid>.json, exclòs del compilador públic. Estats opened → context_loaded → planned → verified → closed. Incloure versió de contracte, hashes de plantilles, artefactes i verificacions, actor i timestamps. Escriptura atòmica i control de concurrència; torn fals, tancat o caducat rebutjat; changed hash invalida evidència anterior. Una tasca documental no exigeix proves de codi que no ha canviat: abast explícit.

El rebut acredita que el mecanisme ha entregat una versió de plantilla i ha validat un resultat, no la comprensió del model. Si l’agent pot modificar tant codi com registre, no és prova criptogràfica contra un actor maliciós: la CI o un executor separat ha de validar la revisió exacta per oferir eixa garantia addicional.

Adaptadors petits per host comparteixen el mateix validador. Normalitzar cwd/ruta/symlinks; Edit reconstrueix replace_all i totes les peces o bloqueja quan no pot fer-ho. No pretendre validar shell arbitrari amb una regex. La barrera final escaneja canvis reals en disc abans de commit/integració, inclosos els produïts per Bash i altres eines. Cobertura efectiva de Codex/Claude/Antigravity demostrada amb una prova d’escriptura invàlida en cada entorn; cap host es declara protegit només perquè existeix un JSON de configuració.

Tancament --check és només lectura; close persisteix l’estat explícitament després de validar artefactes, índex, ESTAT/LEDGER i proves corresponents. Distingir diagnòstic de reflex_petorreta i validació documental al runner.

### P2 — Compilador i frontera de publicació

Extraure funcions pures d’indexació i resolució, exportar dues entrades: check i generate. --check no crea directoris ni fitxers; errors de lectura, contingut malformat, IDs duplicats i enllaços obligatoris trencats fallen. Qualsevol excepció de deute ha d’identificar l’enllaç concret, motiu i caducitat, no un verd global.

IDs estables basats en ruta relativa o ID declarat únic; àlies per a URL antigues i migració comprovada. Extraure enllaços fora de blocs de codi; destins absents/ambigus es mostren al diagnòstic, no s’eliminen silenciosament.

Compilació pública només de contingut expressament autoritzat. Excloure registre de torns, .agents operatiu, Gestoria, producció humana i documents privats. Corpus local complet separat, servit només al procés local. La marca visibility no protegeix res si el compilador no la comprova. Fer fixture amb document privat i garantir-ne absència tant del manifest públic com del RAG i bundle final.

### P3 i P4 — Qualitat i Porta Promesa

Resoldre primer notes duplicat a pageContent.js; conservar la versió útil de la introducció recent. Classificar avisos per regla/fitxer, prioritzar hooks i closures; esborrar imports sobrants sense eliminar possibles efectes laterals. No usar --fix global sense revisar diff ni pujar max-warnings.

Inventari únic de les 50 entrades: id, finalitat, fitxers coberts, dependències, efectes, comandament, resultat JSON, timeout i proves negativa/positiva. Porta Build no pot reconstruir en un perfil de només lectura. Proves específiques dels controls cognitius han d’entrar al runner/CI, no quedar com fitxers optatius.

Porta Promesa no inferirà compliment per menció textual d’un camí. Cada invariant té identificador i prova executable; una fallada injectada ha de posar la porta en roig. Revisar la divergència observada del mode --json davant absència de baseline i el còmput P3 que exclou la Wiki. Baselines versionades amb IDs i propietari; mai regenerar-les només per obtenir verd.

### P5 — Fases 4/5: public_assets

Disseny proposat: bucket públic exclusiu d’actius aprovats (logos i imatges publicables). No reutilitzar mitjans_privats. Lectura pública per definició; insert/update/delete reservats a rol de publicació verificat al servidor, amb USING i WITH CHECK sobre bucket i permisos. Un usuari simplement autenticat no obté permís de publicar.

Proposta inicial per revisar: màxim 5 MiB, MIME PNG/JPEG/WebP; SVG corporatius continuen com a assets versionats fins a definir sanejament segur. Noms amb hash de contingut per a caché; inventari origen/destí/SHA-256 i proves dels consumidors. Migració idempotent i rollback que no esborre objectes existents automàticament. No s’ha verificat cap projecte Supabase remot ni s’ha executat SQL.

Acceptació: anònim llig actiu publicat; anònim i usuari ordinari no poden escriure; editor autoritzat publica només al bucket permés; fitxers fora de mida/tipus fallen; els actius privats continuen inaccesibles. Supabase confirma que un bucket públic omet control d’accés per servir fitxers, però conserva controls d’escriptura: [documentació oficial](https://supabase.com/docs/guides/storage/buckets/fundamentals) i [RLS de Storage](https://supabase.com/docs/guides/storage/security/access-control).

### P6 — Migració sense reaparició de residus

Inventari de tots els 50 fitxers actuals amb ruta/mida/SHA-256, estat tracked i referències. No carregar còpies de skills com a coneixement actiu. Reports històrics a destí canònic d’arxiu; reports regenerables a un directori runtime exclòs. Actualitzar maintain.sh, brain_distill.py i quarantena_espills.mjs perquè usen els destins definits.

Fer dry-run, detectar col·lisions i contingut únic, copiar/verificar destí i crear rebut de trasllat. Provar una restauració. Després eliminar els residus que l’encàrrec autoritza; preservar qualsevol element únic no classificat. Reexecutar productors i comprovar que no recreuen les rutes retirades. No tocar 01_produccio ni esborrar documents vius de l’escriptori.

### P7 — Completar el BrainGraph existent

Model compartit de nodes/arestes amb IDs estables, categories, tags, type i status. Panell de controls amb botó accessible, cerca, filtres de categories i etiquetes, commutadors de tipus d’aresta, orfes i restabliment. OR dins d’una faceta, AND entre facetes; mostrar recompte i estat buit. Filtrar arestes després dels nodes. No amagar errors documentals com si no existiren.

Clic sobre document obri el detall al UniversalWorkspace i manté context; distingir clic d’arrossegament. Llegenda, navegació amb teclat i llista equivalent per a qui no pot usar canvas. Controls amb les mides i fons de l’espècimen corporatiu, estils en CSS, tokens resolts amb getComputedStyle per al canvas, escala devicePixelRatio i suport de moviment reduït.

Índex Map per a cada ID; separar dibuix i simulació, aturar animació quan no cal. Conservar posicions entre actualitzacions. Mesurar corpus real i un fixture gran; només introduir partició espacial o worker si la mesura ho justifica.

### P8 — Actualització automàtica i mode local

Nucli indexador independent del frontend: mapa path → hash/metadata/content/edges i índex invers de dependències. Escoltar add/change/unlink amb debounce d’uns 150 ms, serialitzar ràfegues i tractar desats atòmics/renoms. Reprocessar fitxer canviat i nodes dependents; reconstrucció completa només a l’arrencada, canvi de contracte o recuperació.

Primer adaptador: plugin Vite de desenvolupament amb configureServer i watcher del servidor; dades per mòdul virtual o endpoint local i missatges HMR versionats. Client actualitza el store del Workspace i del graf sense perdre filtres/zoom/selecció. Per a un canvi no vàlid conservar l’última instantània vàlida i mostrar error del fitxer. Regenerar JSON amb reemplaçament atòmic; ignorar eixides pròpies per evitar bucles. Les [APIs de plugins de Vite](https://vite.dev/guide/api-plugin) documenten el canal HMR; implementar contra la versió 7 instal·lada, no copiar signatures d’una versió diferent.

Segon adaptador futur: servei Node local lligat a 127.0.0.1 amb SSE/WebSocket i comprovació d’origen, mateix indexador i contracte. No exposar endpoints d’escriptura de fitxers ni corpus privat a la xarxa. Un lloc estàtic desplegat no pot observar fitxers locals sense un procés local; HMR de desenvolupament tampoc equival a una aplicació d’escriptori empaquetada. Ajornar Electron/Tauri fins a validar aquest nucli local.

Acceptació proposada: afegir, editar, reanomenar i esborrar Markdown actualitza nodes i backlinks; ràfega de 20 canvis no perd l’últim; referència desapareguda es diagnostica; reinici recupera; JSON malformat no destrueix instantània; no hi ha bucle; objectiu de latència inferior a 1 s en la màquina i corpus de prova, mesurat i documentat.

## Revisió QA i publicació

Fixtures adversarials per contracte/paths/edits/torns i errors de lectura, hash de checkout invariant en comprovacions, proves de publicació privada, lint net i proves funcionals dels components tocats. Després executar cadena completa amb perfil d’efectes conegut. Provar explícitament el test App.test.jsx heretat que l’històric marcava fallit; no s’ha revalidat en aquesta auditoria.

Publicació només amb informe dels resultats reals i diff atribuïble. Cada fase deixa estat, historial i proves a l’escriptori. Acta Marmota al tancament de jornada; no reclamar fases futures com acabades.

## Riscos i alternatives

1. Concurrència amb canvis locals d’altres agents: capturar diff, modificar per blocs i aturar-se davant conflicte real; còpia aïllada per a proves que muten.
2. Enforcement massa restrictiu: migrar documents actius amb diagnòstic previ; exceptions explícites amb abast/caducitat, mai catch permissiu. Rollback del codi propi preservant historial.
3. Watcher publica informació privada o es retroalimenta: P2 és requisit dur; exclusions, límit de ràfegues i prova negativa de privacitat abans d’activar-lo.

Alternatives descartades: injectar totes les skills sempre (augmenta contradiccions sense provar compliment); reconstruir tot el bundle per cada edició (no resol latència ni separació entre dades i codi). Mantenibilitat: un contracte, un validador i un indexador, amb adaptadors petits i proves negatives.

## Decisions concretes per a l’execució

Aprovar el contracte proposat P0/P1 i el principi de corpus local privat; confirmar política d’editors/MIME/mida abans de publicar Storage. La ubicació final del graf pot esperar. Obtindre notificació OEPM per acreditar motiu i termini; el portal públic no mostra documents. No enviar una resposta jurídica basada només en l’acte resumit.

## Historial i vincles

2026-09-22: pla escrit abans de canvis funcionals, basat en proves actuals i en les auditories anteriors. Bloc A es conserva com a parcialment fet. Estat: preparació completada; producció pendent d’aprovació del disseny segons sdp-workflow §1.

- [[00_index]]
- [[00_index_escriptori]]
- [[260922_0240_auditoria_opus]]
