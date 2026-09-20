---
type: informe
status: esborrany
description: Informe complet compilat amb les tres respostes de l'auditoria profunda de Codex (Matrix, Sollutia i Cognició).
tags:
  - auditoria
  - arquitectura
  - govern
---

# Informe Complet d'Auditoria de Codex

*Compilat la matinada del 26-09-20 per IAIA MarIA a partir de les tres devolucions de Codex.*

## Bloc 1: Auditoria d'Execució i Seguretat de Matrix

Auditoria només lectura acabada. Cap fitxer modificat, cap petició de xarxa, cap secret llegit. He llegit AGENTS, la plantilla canònica íntegra i el pla Matrix. 

**Conclusió:** no hi ha mediació completa que obligue el model a rebre els procediments abans de qualsevol escriptura. Hi ha comprovacions útils dins d’alguns camins cooperatius, però continuen existint escriptures directes, rebuts autoexpedibles i hooks que no fan allò que la documentació promet. Llegir bytes en Node, emetre’ls per stdout, incorporar-los al context del model i comprendre’ls són quatre fets diferents.

1. **[P1] El hook Matrix no cobreix totes les escriptures ni acredita instal·lació real.**  
   El hook intercepta un rang limitat de comandos, no intercepta eines MCP ni exec_command, i atura només escriptures Markdown sota `_wiki_de_poble`, atorgant pas lliure a codi, SQL o CSS sense reclamar el rebut de Matrix.

2. **[P1] El propi Reflex exposa mutadors sense Reflex.**  
   Funcions com `prepararDocument` i `promoureDocument` a `reflex_document.mjs` escriuen sense demanar pany o rebut. `autoneteja_audit.mjs` exporta `applyAuditPlanLocked`, que permet evitar el *wrapper* d'autorització.

3. **[P1] La frontera de commit documentada està desconnectada.**  
   Els hooks pre-commit i post-commit de `.husky` no executen la verificació real (`verify --staged` ni `consume-commit`). El test del Gate de post-commit només s'empassa marcadors de text.

4. **[P1] Un rebut Matrix acredita valors recomputables, no recepció ni autorització.**  
   `desaEmissio` salva el JSON sense signatura d'autorització vinculant. El model pot fabricar el rebut i usar-lo per a múltiples escriptures durant 30 minuts.

5. **[P1] L'HMAC local continua sota la mateixa identitat OS.**  
   El pas de protocol Reflex no assegura l'acusament de recepció real per la IA externa, i els controls viuen al mateix context i usuari que l'agent auditat, una falla coneguda però greu.

6. **[P2] Els tractors comproven textos i patrons, no recepció ni cobertura.**  
   L'anàlisi de sintaxi mitjançant regex sobre importacions o comentaris no garanteix una frontera de seguretat autèntica per l'acte reflex.

**Proposta nova: broker extern amb mediació completa**
- Agent amb font muntada només lectura i un espai temporal separat. Sense permisos OS d’escriptura sobre repositori, índex Git, polítiques, claus, rebuts o dades externes; credencials de xarxa mutadora només al broker. Un wrapper executable pel mateix usuari amb permisos complets continua sent voluntari.
- Broker i política fora del repositori editable i sota una identitat distinta. Tota mutació passa pel broker.

*(NOTA: IAIA MarIA ha aplicat immediatament els dos pegats extractibles d'emergència en `autoneteja_audit.mjs` i `reflex_document.mjs`.)*

---

## Bloc 2: Auditoria del Backend i Connectors Sollutia (Supabase)

**1. [P1] Una renovació antiga pot expulsar la sessió nova.**  
   `renovaAra()` no comprova canvis de "generació" entre awaits, resultant en logouts asíncrons destructius si entra una sessió B mentre es renova la sessió A. Cal capturar `myGen` al principi i confirmar-lo abans d'efectuar un logout.

**2. [P1] Perdre xarxa durant la renovació esborra una sessió vàlida.**  
   `auth.js` retorna `false` (com si hagués caducat la sessió) front a timeouts de xarxa, causant que `renovaAra()` esborre el JWT vàlid localment quan l'usuari passa per un túnel. Cal distingir entre errors transitoris de xarxa i rebuigs d'autenticació absoluts.

**3. [P1] El xat perd els missatges nous quan el fil supera 200 missatges.**  
   L'RPC per al xat ordena malament el LIMIT i l'ORDER BY. Selecciona els 200 més *antics* limitant la visibilitat. Substituir el codi SQL de l'RPC per un que traga els *recent* i després els ordene cronològicament cap amunt.

**4. [P2] Un cos HTTP encallat bloqueja indefinidament totes les renovacions.**  
   Al `auth.js`, si es queda penjat `response.json()`, compta com una descàrrega sense timeout, bloquejant a posteriori totes les crides. Cal moure `controller` fora del try/catch i assegurar la seua neteja per garantir l'alliberament del pany.

**5. [P2] El ReferenceError de Notes escapa dels ErrorBoundary.**  
   A `NotesDataContext.jsx`, en llançar un error de forma asíncrona dins una promesa no gestionada per l'ErrorBoundary (que viuen al nivell de rutes però ací s'està utilitzant a nivell the provider), la UI es penja. L'error s'ha de capturar i propagar a l'estat.

**6. [P2] Renovar el JWT desconnecta els canals i el xat no els reconstrueix.**  
   El polling segueix funcionant, però l'efecte de realtime cau mort perquè el reset del client Supabase elimina els canals vius, i el xat no se n'adona.

**7. [P2/P3] `destroy()` ignora els mètodes de classes en l'adaptador de port.**  
   El bucle de comprovació dels mètodes prototípics del contracte no baixa per l'arbre d'herència correctament al buscar `.destroy()`.

---

## Bloc 3: Auditoria Taxonòmica i Erradicació de Satèl·lits

**Cens i Taxonomia (Tags)**
S'han analitzat 217 documents. S'han trobat 31 tags diferents, molts redundants.
Proposta de consolidació a només 8 TAGS de domini efectius i puros:
1. `arquitectura` (Tècnica i integració)
2. `disseny` (UI, UX, a11y, identitat visual)
3. `govern` (Protocols, regles, procediments, actes)
4. `identitat` (Missió, persona, valors)
5. `legal` (Obligacions i RGPD)
6. `saber` (Coneixement, metodologies, culturals)
7. `seguretat` (Backup, plans d'emergència)
8. `sollutia` (Contracte de backend, proveïdor)

**Tags a Eliminar o Reclassificar:**
- `marmota`, `acta-marmota`, `acta`: Utilitzar només `type: acta`.
- `core`, `escriptori`: Es consideren redundants respecte al camí de fitxer o al valor `core: true` separat.
- `plantilla`, `pla`, `auditoria`: Utilitzar només `type: document` o el títol del fitxer; un tag no és necessari per a les fases.

*(Nota: RAG actualment tampoc està llegint correctament els tags a `build_rag_index.mjs`, s'ha de solucionar).*

**Vincles i Satèl·lits**
El sistema actual d'ancoratge per a evitar orfes té greus fallades (esborranys no controlats, resolució problemàtica de suffixes, enllaços enganyosos dins de code blocks).
S'aporta un pegat extraible per a `validaVincles()` que només verifica enllaços reals vius sota la capçalera exacta `## Vincles`, garantint que l'enllaç apunta a un document diferent a l'actual (evita autoreferències buides) i completament resolt. Aquest control s'hauria de vincular a les petorretas o índexos canònics, obligant-los a complir-lo estretament.
