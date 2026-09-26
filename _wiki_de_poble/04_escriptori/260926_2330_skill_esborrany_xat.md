---
type: skill
status: esborrany
description: Menú a la carta de la lògica, les dades i la UX del mòdul de Xat estil WhatsApp i de la Pàgina d'Usuari, per a decidir què s'implementa.
tags:
  - skills
  - arquitectura
  - disseny
  - supabase
  - identitat
name: "sdp-xat"
triggers_on:
  - "xat"
  - "missatge"
  - "conversa"
  - "whatsapp"
  - "perfil"
version: "0.1.0"
visibility: private
reflex: sdp:torn_a063cf37-f287-4cea-a385-39be03ca28e1:6c66af79-c74e-44d6-b496-81239dd70ae7
---
# Esborrany de skill: Xat (clon de WhatsApp) i Pàgina d'Usuari

**Plantilla ISO:** `skill.md` 2.0.0
**Categoria:** Skill (esborrany a l'Escriptori; nom viu proposat `sdp-xat`)
**Data Modificació:** 2026-09-27

---

<!-- SDP:SECTION skill.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_a063cf37-f287-4cea-a385-39be03ca28e1:6c66af79-c74e-44d6-b496-81239dd70ae7 |
| Versió | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-09-26T21:37:25.020Z |
| Modificació | 2026-09-26T21:37:25.020Z |
| Propietari | agent-local |
| Aprovació humana | pendent |
| Plantilla | _wiki_de_poble/03_actuar/plantilles/skill.md (v2.0.0) |
| Model IA | Claude Opus 5.5 (`claude-opus-5-5`), mode Ultracode, amb subagents de workflow |
| Tokens consumits | Subagents: 3.419.239 (exploració 1.833.056 amb 6 agents; redacció fallida 1.586.183 amb 9 agents sense resultat). Agent principal: el client no n'exposa el recompte. Fricció alta: límit setmanal esgotat a mig torn i hooks que bloquegen la cerca web i les escriptures fora del repositori |

<!-- SDP:SECTION skill.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/03_actuar/plantilles/skill.md; SHA-256 745f16f6f3661ca3cdf9b98b774c7ef391a1e502a8d2c9352c9b9e111323b3d3. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION skill.s3 -->
## Historial

- 2026-09-26T21:37:25.020Z: esborrany creat pel circuit (`document.mjs create`, torn `torn_a063cf37`).
- 2026-09-26 / 2026-09-27: exploració en paral·lel (sis agents: capa de dades, interfície i skills, doctrina, inventari de WhatsApp, arquitectura i perfil). Troballa principal: el Xat v2 i el Perfil privat ja existixen; el document passa de ser una alta a ser una ampliació.
- 2026-09-27: el workflow de redacció i verificació falla pel límit setmanal d'ús. El Mestre afig al pla dos lleis de producte (Zero Fricció i carpetes intel·ligents), que s'integren a tot el menú i al capítol 9. L'agent principal redacta els capítols 5 a 12.
- 2026-09-27: versió 0.1.0 lliurada per a la reunió: 268 elements del xat, 91 del perfil, 66 d'arquitectura, 35 d'interfície i 24 decisions obertes.

<!-- SDP:SECTION skill.s4 -->
## Contingut

### 0. Com es llig i com es respon este document

Este esborrany és un **menú a la carta**. Descriu tot el que fa WhatsApp, i el que fan els millors perfils de xarxa social, traduït a Sóc de Poble, perquè l'equip humà decidisca en una reunió, amb captures de WhatsApp real davant, què s'implementa i què no. No és un pla aprovat ni conté codi executable: els blocs SQL i JS són esbossos per a decidir amb coneixement de causa.

**No partim de zero.** El Xat v2 ja funciona (converses directes, text, lectura) i la Pàgina d'Usuari privada també (`/el-meu-perfil`, amb l'Editor Universal). Cada element diu si ja existix, si existix a mitges o si és nou.

**Llegenda de cada element:**

| Marca | Significat |
| --- | --- |
| `[ ]` | Pendent de decidir (tots naixen així) |
| `[x]` | Aprovat |
| `[-]` | Descartat |
| `[>]` | Ajornat (es tornarà a mirar) |
| Fase `F0` | Fonament: deute del xat actual o requisit de tot el que ve |
| Fase `F1` | Primera versió útil al poble pilot |
| Fase `F2` | Maduresa |
| Fase `F3` | Ambició: app nadiua, xifratge extrem a extrem, federació |
| Fase `FX` | Desaconsellat o fora d'abast; hi és perquè es puga descartar sabent què es descarta |
| Cost `S` · `M` · `L` · `XL` | ≤1 dia · 2-5 dies · 1-3 setmanes · més de 3 setmanes (equip IA + humà, amb espècimen, proves i portes) |
| Repo `existix` · `parcial` · `nou` | Estat al codi, amb `fitxer:línia` quan n'hi ha |

**Famílies d'identificadors:**

- `XAT-A` a `XAT-S` (capítols 5 a 8): el Xat (converses, missatges, lectura, reaccions, cites, adjunts, veu, grups, presència, avisos, cerca, privacitat, trucades, estats, dades personals, accessibilitat, moderació, fedivers i integracions).
- `XAT-T` (capítol 9): la IAIA com a carpeta intel·ligent.
- `PER-A` a `PER-O` (capítol 10): la Pàgina d'Usuari i el perfil.
- `ARQ-*` (capítol 11): decisions d'arquitectura, contracte i model de dades.
- `UX-*` (capítol 12): anatomia visual, espècimens, deute de la interfície actual i full de ruta.
- `DEC-*` (capítol 12): decisions obertes que bloquegen fases senceres. Es decidixen primer.

**Línies de cada element.** «WhatsApp» (o «Referents» al perfil) diu què fa el referent, amb xifres; «Repo», què hi ha ja al codi; «Proposta», què faríem; «Dades», les taules i capacitats del capítol 11; «Atenció», el xoc amb la llei, la doctrina o el navegador; «Depén de» i «Decisió», el que cal abans. Una xifra no verificada porta «(per confirmar)».

**Com tornar la decisió.** Hi ha dos maneres i totes dos valen:

1. Marcar les caselles directament en este fitxer (Obsidian les fa clicables).
2. Respondre amb una llista curta, per exemple: `DEC-01 opció B · XAT-B07 sí · XAT-D01 no · PER-D02 ajornat`.

**Ordre recomanat per a la reunió:** primer les `DEC-*` del capítol 12 (sense elles no es pot començar cap fase), després el deute `F0` i el full de ruta, i a la fi el menú família per família. El capítol 12 inclou un guió de la reunió (`UX-H`).

**Paraula a paraula.** «Conversa» o «fil» és una conversa sencera (taula `xat_fils`). «Cadena de respostes» és el fil de respostes dins d'una conversa. «Cita» és la resposta que cita un missatge.

### 1. Propòsit de la skill

La futura skill `sdp-xat` governa el disseny, l'ampliació i el manteniment de dos peces de Sóc de Poble:

- **El Xat:** la missatgeria privada entre veïns, grups, organitzacions i la IAIA, inspirada en WhatsApp però sotmesa a la doctrina del Mas (privacitat per defecte, Connexió Radical, enxufabilitat, Pedra Seca).
- **La Pàgina d'Usuari:** la fitxa privada que cadascú edita i la fitxa pública que veuen els altres (hui inexistent per a persones reals).

**Dos lleis de producte governen tot el menú** (pla `260926_2330_pla_implementacio.md`):

- **Zero Fricció (Llei del Poble).** La gent no ix de WhatsApp: a l'app de les disfresses només hi van entrar 7 de 70 persones. El xat ha de ser idèntic a WhatsApp en disposició i funcionament perquè ningú haja d'aprendre res. Cada element parteix del comportament exacte de WhatsApp i només se n'aparta quan la llei o la doctrina ho obliguen, i ho diu. «Idèntic» no inclou la marca, el logotip ni els colors de WhatsApp (`UX-A02`).
- **Les IAs com a carpetes intel·ligents.** La gent continuarà enviant centenars de missatges desordenats. La IAIA no els obliga a omplir formularis: escolta de fons on el grup ho accepta i en trau documents ordenats (una llista d'inscrits, una acta, les comandes). Té capítol propi (capítol 9).

S'activa quan una tasca toca `src/sections/xat/`, `src/sections/profile/`, els mètodes del xat o del perfil a `src/data/`, les taules `xat_*` o `profiles`, o quan el Mestre demana una funció de missatgeria o de perfil. Mentre siga esborrany, només servix per a decidir; quan el Mestre l'aprove, els elements marcats `[x]` passen a ser l'especificació vinculant i els `[-]` es lleven del text viu.

### 2. Frontera de confiança

Cap agent pot fer res d'açò sense una ordre explícita del Mestre per a eixe cas concret:

- Tocar `src/data/contracte.js` (marcat `SDP-LOCK`) o moure mètodes entre el nucli i les capacitats.
- Aplicar migracions a cap base de dades real, esborrar taules o columnes, o escriure migracions que no siguen additives.
- Esborrar converses, missatges, adjunts o perfils reals fora del circuit de baixa que ja existix.
- Llegir el contingut de converses privades per a proves, telemetria, registres o una IA externa (Llei 5 de privacitat).
- Instal·lar dependències (`npm install`).
- Canviar l'aparença del Xat o del Perfil sense pla aprovat (Llei del Píxel) i sense l'espècimen previ a DesignSection (Pedra Seca §9).
- Escriure res a Sollutia (Model B).
- Activar service worker, notificacions push, xifratge extrem a extrem, federació o cap pont amb WhatsApp mentre la `DEC-*` corresponent estiga oberta.
- Enviar missatges a tercers amb el bot de WhatsApp de `bot/`.
- Tocar `_wiki_de_poble/04_escriptori/01_produccio/`.

### 3. Instruccions d'execució

Quan un agent reba un encàrrec del Xat o del Perfil:

1. **Efecte Matrix.** Llig esta skill i, si ha de produir un document, la plantilla que indique `.agents/protocolledge.json` amb `node tooling/wiki/document.mjs context`.
2. **Autorització per element.** Localitza l'identificador de l'encàrrec. Si no està marcat `[x]`, o depén d'una `DEC-*` oberta, para i pregunta (Fusible, AGENTS §10). Una prohibició sense substitut també es pregunta.
3. **Dependències.** Comprova la línia «Depén de» i que la fase de les dependències ja estiga feta.
4. **Espècimen primer.** Si hi ha interfície, l'espècimen va abans a DesignSection, amb tokens semàntics, 44 px tàctils i sense `style=`.
5. **Contracte.** Els mètodes nous entren com a CAPACITAT opcional (capítol 11, `ARQ-B`), amb `export` al port (`src/data/backendPort.js`), implementació a l'adaptador de `src/data/supabase/` i consulta amb `teCapacitat()` a la interfície. Mai al nucli.
6. **Dades.** Migració additiva `supabase/migrations/aammdd_hhmm_descripcio.sql`, amb RLS per funcions `private.*` (`SECURITY DEFINER`, `set search_path = ''`). Es revisa, no s'aplica.
7. **Proves i portes.** Vitest de la secció, `node --test`, `npm run porta:enxufe`, `npm run porta:rls` i `npm run porta:persistencia`.
8. **Tancament.** ESTAT, LEDGER i `node tooling/gates/tancament.mjs --check --turn-id ID`.

### 4. Context tècnic actualitzat

Tall: 2026-09-27, branca `backup-notes-publish`, HEAD `51c75c2a` més canvis sense commit a l'arbre de treball. Tot el que diu «existix» s'ha llegit al disc en este torn.

- **Pila.** React 18.3, Vite 7, `@supabase/supabase-js` 2.112, TipTap 3.31, `lucide-react`. L'adaptador Supabase usa dos transports: `fetch` directe a PostgREST i GoTrue (`src/data/supabase/runtime.js`) i `supabase-js` per al xat, Storage i Realtime (`src/data/supabase/config.js`). No hi ha service worker, manifest de PWA ni llibreria d'IndexedDB; Notes usa IndexedDB nadiu.
- **Doctrina vigent.** ADR-2026-08 online-first (Supabase autoritatiu, sense reconciliació en segon pla ni CRDT) i ADR-2026-09 Model B (Sollutia només es llig). Totes dos en estat d'esborrany. La visió d'app nadiua i de treball sense connexió que demana la plantilla de skills xoca amb l'ADR-2026-08: el document la tracta com a decisió oberta, no com a fet.
- **Xat v2.** Quatre taules (`xat_fils`, `xat_participants`, `xat_missatges`, `xat_lectures`), RPC protegides per `private.es_participant`, límit de 15 missatges cada 5 s, sondeig cada 25 s i 5 s (`src/sections/xat/XatContext.jsx`) perquè Realtime no està publicat, enviament optimista només en memòria i sense id de client, historial limitat a 50 missatges sense cursor. Només converses directes i només text.
- **Contracte.** `src/data/contracte.js` té 32 mètodes obligatoris al nucli, 8 dels quals són del xat. Qualsevol backend alternatiu (WordPress, un node local) està obligat hui a implementar el xat sencer. El camí enxufable és el de les capacitats opcionals, que ja usen `compte` i `consentiment`.
- **Perfil.** `profiles` només deixa llegir el perfil propi. La fitxa privada existix; la pública d'una persona real no. El poble real ve de `town_memberships`; `town_name` és text lliure. La migració `260926_2232_copyright_editor.sql` està preparada però no aplicada.
- **Fonts que falten.** Les decisions D1-D13 de la Fase 1 (Identitat i Perfil) no s'han pogut llegir senceres: el pla on eren ja no és a l'Escriptori i l'arxiu històric està fora d'abast. Només consta D1 (sessions) al codi i un resum de D2, D3, D10 i D11 a `.agents/ESTAT.md`.
- **Recerca externa.** L'inventari de WhatsApp s'ha contrastat amb `faq.whatsapp.com`, `blog.whatsapp.com` i WABetaInfo el 26 i 27 de setembre de 2026, amb el navegador integrat. La recerca d'arquitectura i de perfil ve del coneixement del model (tall de juny de 2026), perquè el hook del projecte bloqueja les eines de cerca web; les xifres de Supabase i de navegadors que no s'han pogut confirmar porten «(per confirmar)». La verificació adversarial amb agents no s'ha pogut fer (vegeu «Verificació»).

### 5. Converses, missatges i lectura

Regla de tot el capítol (Zero Fricció): el punt de partida és el comportament exacte de WhatsApp. Un element només se n'aparta quan la llei o la doctrina ho obliga, i ho diu a la línia «Atenció».

#### XAT-A · Converses i safata

- [ ] **XAT-A01 · Conversa directa entre dos persones** · `F0` · `S` · `existix`
  - WhatsApp: xat 1:1; l'altra persona no el veu fins que arriba el primer missatge.
  - Repo: RPC idempotent `crea_fil_directe` (`supabase/migrations/260908_xat_v2_correccions.sql`) i `creaFilDirecte` al nucli del contracte (`src/data/contracte.js:27-34`).
  - Proposta: conservar-la; afegir `xat_fils.tipus = 'directe'` explícit i amagar la conversa buida a l'altra persona.
  - Dades: `xat_fils.tipus`; capacitat `xat`.
- [ ] **XAT-A02 · Conversa amb tu mateix** · `F1` · `S` · `nou`
  - WhatsApp: «Xat amb tu mateix» per a apuntar-se coses; admet missatges temporals.
  - Proposta: `tipus = 'personal'`, un per persona. Els missatges es poden passar al Bloc de Notes amb el Retall.
  - Decisió: tindre-la encara que ja hi haja Notes (Zero Fricció diu que sí: la gent ja la usa a WhatsApp).
- [ ] **XAT-A03 · Conversa amb la IAIA** · `F1` · `M` · `parcial`
  - Repo: la columna `es_ia` existix però el client té vetat escriure-hi (`260908_xat_v2_correccions.sql:418-424`); el «Xat de la IAIA» consta com a collita tancada a `_wiki_de_poble/02_saber/00_full_de_ruta.md:24`.
  - Proposta: `tipus = 'iaia'`; els missatges de la IAIA els escriu el servidor, mai el navegador. Base de les carpetes intel·ligents (capítol 9).
  - Atenció: anonimitzar abans d'enviar res a una IA externa (Llei 5).
- [ ] **XAT-A04 · Parlar en nom d'una organització** · `F2` · `L` · `nou`
  - Referent: WhatsApp Business (compte d'empresa separat).
  - Repo: el xat signa sempre com la persona (`src/sections/xat/XatContext.jsx:9-12`), encara que `IdentitatContext` ja permet actuar com a entitat.
  - Proposta: la persona tria «com qui escric» dins d'una conversa; el bar de «Menjar a casa» o la cuidadora responen com a entitat, amb el nom de qui ho fa visible als altres membres de l'entitat.
  - Dades: `xat_participants.com_org_id`, `xat_fils.org_id`; comprovació amb `organization_memberships`.
- [ ] **XAT-A05 · Iniciar una conversa des de Connectar** · `F0` · `S` · `existix`
  - Repo: `?targetUserId=` obri un fil directe (`src/sections/connectar/ConnectarSection.jsx`).
  - Proposta: conservar; el botó «Connectar» de qualsevol targeta porta ací (acció primària única de la Connexió Radical).
- [ ] **XAT-A06 · Iniciar una conversa des del directori del poble** · `F1` · `S` · `parcial`
  - Repo: `membres_del_poble` només mostra qui ha donat el consentiment RGPD. `carregaMembres` s'empassa els errors i filtra amb `ilike` després del límit de 100, sense escapar `%` ni `_` (`src/data/supabase/xat.js:181-191`).
  - Proposta: cerca al servidor (`p_cerca`), error honest i directori que respecta la privacitat del perfil (capítol 10, `PER-G`).
- [ ] **XAT-A07 · Iniciar per enllaç o codi QR personal** · `F2` · `M` · `nou`
  - WhatsApp: QR de contacte; amb nom d'usuari, una «clau» opcional per al primer contacte (reserva des de juny de 2026).
  - Proposta: enllaç i QR revocables (lligat a `PER-I`); útil per al cartell del forn o del bar.
- [ ] **XAT-A08 · Converses amb gent d'un altre poble i amb la família de fora** · `F1` · `M` · `parcial`
  - Situació: el poble (`tenant_id`) delimita el directori; els fills i nets que viuen a la ciutat no són del padró.
  - Proposta: una conversa directa pot unir persones de pobles diferents si una de les dos convida l'altra (enllaç o QR); el directori continua sent del poble.
  - Decisió: qui pot escriure a qui fora del poble (lligat a `XAT-L04`).
- [ ] **XAT-A09 · Fila de la llista de converses idèntica a WhatsApp** · `F0` · `M` · `parcial`
  - WhatsApp: foto, nom, hora de l'últim missatge, previsualització (amb l'autor en els grups), marques del meu últim missatge, comptador de no llegits i icones de silenciat i fixat. Ordre per últim missatge.
  - Repo: `xat_fils_meus` ja torna nom, últim missatge i no llegits, però la fila no pinta els no llegits ni la foto (`avatar_url: null` a `XatContext.jsx:118`).
  - Proposta: fila idèntica en disposició i informació; espècimen previ a DesignSection (`UX-B01`).
- [ ] **XAT-A10 · Comptador de no llegits** · `F0` · `S` · `parcial`
  - Repo: `noLlegits` existix a `XatContext.jsx:122` i no es pinta.
  - Proposta: número dins d'una pastilla (mai només un punt de color), total a la icona de la secció i al títol de la pestanya del navegador.
  - Dades: `xat_fils.ultim_seq − xat_participants.llegit_fins_seq` (`ARQ-A03`).
- [ ] **XAT-A11 · Esborranys per conversa** · `F1` · `S` · `nou`
  - WhatsApp: etiqueta «Esborrany:» a la llista, amb el text començat.
  - Proposta: guardar el text a mig escriure per conversa i mostrar-lo a la llista.
  - Atenció: és estat de la interfície, no dada de negoci; es guarda al navegador amb una mida màxima i s'esborra en tancar la sessió.
- [ ] **XAT-A12 · Previsualització de mitjans a la llista** · `F2` · `S` · `nou`
  - WhatsApp: icona i text («Foto», «Nota de veu 0:12»), i miniatura des d'agost de 2026.
  - Proposta: icona més text descriptiu; la miniatura, més avant.
- [ ] **XAT-A13 · Arxivar converses** · `F1` · `S` · `nou`
  - WhatsApp: l'arxivada no torna a la llista encara que arriben missatges («Mantín els xats arxivats»); només avisa amb una «@» si et mencionen o et responen.
  - Dades: `xat_participants.arxivat_al`.
- [ ] **XAT-A14 · Fixar converses a dalt** · `F1` · `S` · `nou`
  - WhatsApp: màxim 3 (20 amb la subscripció de pagament).
  - Dades: `xat_participants.fixat_al`; màxim 3 comprovat al servidor.
- [ ] **XAT-A15 · Silenciar una conversa** · `F1` · `S` · `nou`
  - WhatsApp: 8 hores, 1 setmana o sempre; les mencions i les respostes travessen el silenci.
  - Repo: l'opció ja apareix al menú del fil però no fa res (`src/sections/xat/XatSection.jsx:461-480`).
  - Dades: `xat_participants.silenciat_fins_al`.
- [ ] **XAT-A16 · Marcar com a no llegida** · `F1` · `S` · `nou`
  - Dades: `xat_participants.no_llegit_manual`; es desfà en obrir la conversa.
- [ ] **XAT-A17 · Filtres Tot, No llegits, Preferits i Grups** · `F0` · `S` · `parcial`
  - WhatsApp: estos quatre per defecte.
  - Repo: els filtres es pinten però no filtren (`XatSection.jsx:64, 98-102, 225-228`); hi ha a més Gent, Empreses, Institucions i IAIES.
  - Proposta: els quatre de WhatsApp com a filtres fixos; els propis de Sóc de Poble com a llistes predefinides (`XAT-A19`).
- [ ] **XAT-A18 · Preferits** · `F2` · `S` · `nou`
  - Dades: marca per participant (`xat_participants.preferit_al`, nom nou).
- [ ] **XAT-A19 · Llistes personalitzades** · `F2` · `M` · `nou`
  - WhatsApp: des d'octubre de 2024; una llista sencera es pot silenciar.
  - Dades: `xat_llistes`, `xat_llistes_fils`.
- [ ] **XAT-A20 · Bloqueig de xat amb codi secret** · `F3` · `M` · `nou`
  - WhatsApp: carpeta amagada darrere de l'autenticació del dispositiu o d'un codi; la notificació només diu «1 missatge nou».
  - Atenció: al navegador no hi ha biometria sense WebAuthn i un PIN local no protegix res davant de qui té la sessió oberta. Té sentit en l'app nadiua.
- [ ] **XAT-A21 · Buidar una conversa** · `F1` · `S` · `nou`
  - WhatsApp: esborra el contingut per a mi, opcionalment conservant els destacats; des de març de 2026, també només els mitjans.
  - Proposta: amaga per a mi tot fins al `seq` actual; no toca l'altra persona.
  - Dades: `xat_participants.buidat_fins_seq` (nom nou).
- [ ] **XAT-A22 · Esborrar una conversa** · `F1` · `S` · `nou`
  - Proposta: en una directa, l'amaga per a mi fins que arribe un missatge nou; en un grup, cal eixir-ne primer (`XAT-H09`).
- [ ] **XAT-A23 · Historial sencer amb paginació** · `F0` · `M` · `parcial`
  - Repo: el client demana 200 missatges i el servidor en torna 50, sense cursor (`src/data/supabase/xat.js:92-95` contra `supabase/migrations/260920_0600_xat_limit_correccio.sql:39`). Els missatges vells no es poden veure.
  - Proposta: paginació per `seq` cap arrere en fer scroll amunt, amb botó «Carrega'n més» com a alternativa accessible.
  - Dades: RPC `xat_historial` (`ARQ-E02`); capacitat `xatHistorial`.
- [ ] **XAT-A24 · Missatges al moment, sense esperar** · `F0` · `L` · `parcial`
  - WhatsApp: el missatge apareix a l'instant.
  - Repo: sondeig cada 25 s (llista) i 5 s (conversa oberta) perquè Realtime no està publicat (`XatContext.jsx:21-28, 53-54`).
  - Proposta: temps real per canals privats (`ARQ-F`) i el sondeig com a camí de reserva.
  - Dades: capacitat `xatTempsReal`.
- [ ] **XAT-A25 · Enviament fiable sense duplicats** · `F0` · `M` · `nou`
  - Repo: s'envia sense identificador de client; un reintent pot duplicar el missatge (`xat.js:66-70`).
  - Proposta: identificador UUIDv7 generat al navegador, que el servidor accepta una sola vegada.
  - Dades: `xat_missatges.id` (`ARQ-A02`).

#### XAT-B · Missatges

- [ ] **XAT-B01 · Compositor de diverses línies** · `F0` · `S` · `parcial`
  - Repo: és un `<input type="text">` (`XatSection.jsx:554-562`) mentre que l'espècimen demana un `<textarea>` (`src/sections/disseny/cataleg/detalls/EspecimenXat.jsx`).
  - Proposta: `textarea` que creix fins a 6 línies; a l'escriptori Retorn envia i Maj+Retorn fa salt de línia; al mòbil Retorn fa salt i s'envia amb el botó, com a WhatsApp.
- [ ] **XAT-B02 · Format de text a l'estil WhatsApp** · `F1` · `M` · `nou`
  - WhatsApp: `*negreta*`, `_cursiva_`, `~ratllat~`, tres accents greus per a monoespai, codi en línia, llistes amb `-` o `1.` i cita amb `>`.
  - Proposta: la mateixa sintaxi, interpretada al client sense HTML (mai `innerHTML`); no s'usa l'Editor Universal dins del xat.
  - Atenció: prova de seguretat contra XSS obligatòria.
- [ ] **XAT-B03 · Longitud màxima del missatge** · `F0` · `S` · `nou`
  - WhatsApp: 65.536 caràcters (per confirmar).
  - Proposta: 4.096 caràcters amb un `check` a la base de dades; per a textos llargs, compartir una Nota.
- [ ] **XAT-B04 · Emojis** · `F1` · `S` · `nou`
  - Proposta: el teclat del sistema; un selector propi només si el Mestre el demana (sense dependència nova).
- [ ] **XAT-B05 · Enllaços clicables i segurs** · `F0` · `S` · `nou`
  - Proposta: detectar URL, obrir-les amb `rel="noopener noreferrer"`, mostrar el domini i avisar dels dominis amb caràcters enganyosos (punycode).
- [ ] **XAT-B06 · Previsualització d'enllaços** · `F2` · `M` · `nou`
  - WhatsApp: la genera el dispositiu que envia; es pot desactivar.
  - Atenció: el navegador no pot llegir webs alienes (CORS). Fer-ho al servidor obri un risc de SSRF (peticions a xarxes internes) i fa que el servidor visite l'enllaç.
  - Proposta: una funció del servidor amb llista de ports i adreces prohibides, límit de temps i de mida, que només llig les etiquetes `og:`; desactivable per persona.
  - Decisió: activar-la o no en F2.
- [ ] **XAT-B07 · Editar un missatge enviat** · `F1` · `M` · `nou`
  - WhatsApp: durant 15 minuts, només text, amb l'etiqueta «editat», sense notificació nova.
  - Proposta: igual.
  - Dades: `xat_missatges.editat_al`; `xat_edicions` només si es vol conservar la versió anterior.
  - Decisió: conservar o no les versions anteriors (moderació contra minimització de dades).
- [ ] **XAT-B08 · Esborrar per a mi** · `F1` · `S` · `nou`
  - WhatsApp: sense límit de temps.
  - Dades: `xat_amagats` (usuari, missatge; nom nou).
- [ ] **XAT-B09 · Esborrar per a tothom** · `F1` · `M` · `nou`
  - WhatsApp: durant 2 dies; queda «S'ha esborrat este missatge»; si falla, no s'avisa.
  - Proposta: igual, però amb avís si falla (error honest). El text i els adjunts s'esborren de veres; la làpida conserva el `seq`.
  - Dades: `xat_missatges.esborrat_al`, `esborrat_per`; `text = null`; esborrat dels fitxers per l'API de Storage (`ARQ-G05`).
- [ ] **XAT-B10 · Esborrat per l'administració d'un grup** · `F2` · `S` · `nou`
  - WhatsApp: els administradors poden esborrar missatges d'altres durant 2 dies; es mostra quin administrador ho ha fet.
  - Depén de: `XAT-H03`.
- [ ] **XAT-B11 · Reenviar** · `F1` · `M` · `nou`
  - WhatsApp: fins a 5 converses alhora; a partir de 5 reenviaments en cadena, etiqueta «Reenviat moltes vegades» i només a 1 conversa.
  - Proposta: igual; els adjunts es reutilitzen per referència, sense duplicar el fitxer.
  - Dades: `xat_missatges.reenviat`, `reenviaments`.
- [ ] **XAT-B12 · Copiar el text** · `F0` · `S` · `nou`
  - Proposta: al menú del missatge (premuda llarga o clic dret).
- [ ] **XAT-B13 · Selecció de diversos missatges** · `F1` · `M` · `nou`
  - Proposta: per a copiar, reenviar, esborrar o destacar diversos alhora, i per a fer un Retall.
- [ ] **XAT-B14 · Destacar missatges** · `F2` · `S` · `nou`
  - Dades: `xat_destacats`; vista «Missatges destacats» (`XAT-K07`).
- [ ] **XAT-B15 · Fixar missatges dins d'una conversa** · `F2` · `M` · `nou`
  - WhatsApp: fins a 4 (abans 3), durant 24 hores, 7 dies o 30 dies; als grups, l'administració decidix qui pot; genera un missatge de sistema.
  - Dades: `xat_fixats` (fil, missatge, `fins_al`).
- [ ] **XAT-B16 · Mencions @nom** · `F1` · `M` · `nou`
  - WhatsApp: només als grups; la menció travessa el silenci.
  - Proposta: suggeriments en escriure `@`; la menció es guarda per identificador, no per nom.
  - Dades: `xat_mencions`.
- [ ] **XAT-B17 · Menció a tothom (@tots)** · `F2` · `S` · `nou`
  - WhatsApp (agost de 2026): amb 32 membres o menys, qualsevol; amb més, només l'administració; cada membre la pot silenciar.
  - Depén de: `XAT-B16`.
- [ ] **XAT-B18 · Informació del missatge** · `F1` · `S` · `nou`
  - WhatsApp: lliurat, llegit i reproduït, amb hora, per persona.
  - Dades: derivat de les marques per `seq` (`ARQ-A03`) i de `xat_reproduccions`.
- [ ] **XAT-B19 · Respondre en privat des d'un grup** · `F1` · `S` · `nou`
  - Proposta: obri la conversa directa amb la cita del missatge del grup.
- [ ] **XAT-B20 · Missatges de sistema** · `F0` · `S` · `nou`
  - Exemples: algú s'ha unit, ha eixit, ha canviat el nom del grup, ha fixat un missatge.
  - Dades: `xat_missatges.tipus = 'sistema'` amb una clau i18n i paràmetres a `metadades`, mai text escrit.
- [ ] **XAT-B21 · Traduir un missatge** · `F2` · `M` · `nou`
  - WhatsApp: traducció dins del dispositiu des de setembre de 2025.
  - Proposta: l'acció «Traduir» usa el Traductor de la barra blava.
  - Decisió: on es tradueix (un servei extern veu el text: Llei 5).
- [ ] **XAT-B22 · Dictat de veu a text** · `F2` · `S` · `nou`
  - Proposta: confiar en el micròfon del teclat del sistema, que ja funciona a iOS i Android. L'API de reconeixement de veu del navegador no existix a Firefox.
- [ ] **XAT-B23 · Retall cap a Notes** · `F0` · `S` · `existix`
  - Repo: `src/sections/xat/retall.js` escapa i saneja abans de crear la nota.
  - Proposta: conservar-lo; és la versió manual de les carpetes intel·ligents (capítol 9).
- [ ] **XAT-B24 · Límit de freqüència contra l'abús** · `F0` · `S` · `existix`
  - Repo: 15 missatges cada 5 s (`260908_xat_v2_correccions.sql:387-416`).
  - Proposta: conservar-lo amb un missatge d'error clar en valencià.
- [ ] **XAT-B25 · Enviament fallit i reintent** · `F0` · `M` · `parcial`
  - WhatsApp: rellotge mentre no s'envia i avís si falla.
  - Repo: l'enviament optimista es desfà si falla (`XatContext.jsx:410-468`) i el missatge desapareix.
  - Proposta: la bombolla es queda amb «No s'ha enviat · Torna-ho a provar».
- [ ] **XAT-B26 · Missatges programats** · `FX` · `M` · `nou`
  - WhatsApp: no en té per a comptes personals.
  - Proposta: no fer-ho (trencaria la paritat amb WhatsApp sense demanda).

#### XAT-C · Lliurament i lectura

- [ ] **XAT-C01 · Pendent (rellotge)** · `F0` · `S` · `parcial`
  - Proposta: icona de rellotge amb text accessible «Pendent».
- [ ] **XAT-C02 · Enviat (✓)** · `F0` · `S` · `nou`
  - Proposta: una marca quan el servidor confirma el missatge i li assigna el `seq`.
- [ ] **XAT-C03 · Rebut (✓✓)** · `F1` · `M` · `nou`
  - WhatsApp: lliurat al telèfon o a algun dispositiu vinculat.
  - Proposta: el navegador de la destinatària confirma que l'ha rebut quan el baixa (per temps real o sondeig).
  - Dades: `xat_participants.rebut_fins_seq`, actualitzat amb moderació (una escriptura cada pocs segons com a màxim).
- [ ] **XAT-C04 · Llegit (✓✓ blau)** · `F0` · `S` · `parcial`
  - Repo: `xat_lectures` i `marcaLlegit` existixen, però la interfície no ho mostra.
  - Proposta: el blau sempre acompanyat d'una diferència de forma i d'un text per al lector de pantalla («Llegit»).
  - Dades: `xat_participants.llegit_fins_seq` (`ARQ-A03`).
- [ ] **XAT-C05 · Reproduït (veu i vídeo)** · `F2` · `S` · `nou`
  - WhatsApp: micròfon blau quan s'ha escoltat; no es pot desactivar.
  - Dades: `xat_reproduccions` (nom nou).
- [ ] **XAT-C06 · Marques als grups** · `F1` · `S` · `nou`
  - WhatsApp: ✓✓ quan tothom l'ha rebut i blau quan tothom l'ha llegit.
  - Dades: mínim de les marques dels membres actius.
- [ ] **XAT-C07 · Desactivar les confirmacions de lectura** · `F1` · `S` · `nou`
  - WhatsApp: activades per defecte; qui les desactiva tampoc veu les dels altres; no afecta els grups ni les notes de veu.
  - Proposta: igual (Zero Fricció).
  - Decisió: valor per defecte (WhatsApp: activades; Llei 5: triar-ho en el moment).
- [ ] **XAT-C08 · Marcar com a llegit només quan es veu** · `F0` · `S` · `parcial`
  - Proposta: només si la pestanya és visible i el missatge ha entrat a la pantalla (`IntersectionObserver`, compatible amb el baseline).
- [ ] **XAT-C09 · Separador «N missatges no llegits»** · `F1` · `S` · `nou`
  - Proposta: en obrir, salta al primer no llegit amb un separador, com a WhatsApp.
- [ ] **XAT-C10 · Error visible** · `F0` · `S` · `nou`
  - Proposta: icona d'avís vermella amb text («No enviat») i acció de reintent; mai només color.

#### XAT-D · Reaccions

Les reaccions xoquen amb la Connexió Radical (sense cors ni polzes com a mètrica pública). Zero Fricció demana tindre-les, perquè la gent ja reacciona a WhatsApp. Lectura proposada: la Connexió Radical prohibix mètriques de vanitat en targetes públiques; una reacció dins d'una conversa privada és un gest de conversa, no una mètrica. La decisió és del Mestre (capítol 12).

- [ ] **XAT-D01 · Reaccionar amb un emoji** · `F1` · `M` · `nou`
  - WhatsApp: una reacció per persona i missatge, amb qualsevol emoji; safata ràpida de 6; es pot canviar o llevar.
  - Proposta: igual, visible només dins de la conversa.
  - Dades: `xat_reaccions` amb clau (missatge, usuari).
  - Decisió: reaccions sí o no.
- [ ] **XAT-D02 · Doble toc per a reaccionar** · `F2` · `S` · `nou`
  - WhatsApp: des de gener de 2025 (quin emoji posa per defecte: per confirmar).
  - Atenció: cal una alternativa sense gest (menú del missatge).
- [ ] **XAT-D03 · Sumar-se a una reacció** · `F2` · `S` · `nou`
  - WhatsApp: tocant la reacció d'un altre (abril de 2025).
- [ ] **XAT-D04 · Veure qui ha reaccionat** · `F1` · `S` · `nou`
- [ ] **XAT-D05 · Avís a l'autor quan reaccionen** · `F2` · `S` · `nou`
  - WhatsApp: només rep l'avís l'autor; si la reacció es lleva, no hi ha avís; es pot desactivar.
- [ ] **XAT-D06 · Reacció «m'apunte» que alimenta una llista** · `F2` · `M` · `nou`
  - Proposta pròpia: una reacció acordada (per exemple ✋) compta com a inscripció a la carpeta intel·ligent del grup (`XAT-T04`). Dona ordre sense formularis.
- [ ] **XAT-D07 · Reaccions animades** · `FX` · `S` · `nou`
  - Proposta: no fer-ho (soroll, i reducció de moviment).

#### XAT-E · Cites i cadenes de respostes

- [ ] **XAT-E01 · Citar un missatge** · `F1` · `M` · `nou`
  - WhatsApp: lliscant el missatge cap a la dreta o amb «Respon».
  - Proposta: igual, amb l'opció al menú i una drecera de teclat com a alternativa al gest.
  - Dades: `xat_missatges.resposta_a`.
- [ ] **XAT-E02 · Saltar a l'original tocant la cita** · `F1` · `M` · `nou`
  - Proposta: si l'original és molt amunt, es carrega l'historial del voltant.
  - Dades: RPC `xat_missatges_al_voltant` (`ARQ-E03`).
- [ ] **XAT-E03 · Cita d'un missatge esborrat o caducat** · `F1` · `S` · `nou`
  - WhatsApp: la cita d'un missatge temporal pot sobreviure-li.
  - Proposta: la cita mostra «Missatge esborrat»; mai conserva el text d'un missatge esborrat o caducat.
- [ ] **XAT-E04 · Cadena de respostes («N respostes»)** · `F2` · `M` · `nou`
  - WhatsApp: tocant «N respostes» es veu tota la cadena d'un missatge.
  - Dades: `xat_missatges.cadena_arrel`.
- [ ] **XAT-E05 · Subconverses separades a l'estil Slack** · `FX` · `L` · `nou`
  - Proposta: no fer-ho; trenca la paritat amb WhatsApp i la gent no les usaria.

#### XAT-K · Cerca i organització

- [ ] **XAT-K01 · Cerca global de converses i missatges** · `F1` · `M` · `nou`
  - Proposta: cerca al servidor, que respecta la RLS; resultats agrupats per conversa.
  - Dades: índex de text a `xat_missatges` (`ARQ-C`); capacitat `xatCerca`.
  - Atenció: amb xifratge extrem a extrem la cerca només podria ser local (`XAT-L02`).
- [ ] **XAT-K02 · Cerca dins d'una conversa** · `F1` · `M` · `nou`
  - Proposta: fletxes amunt i avall entre coincidències.
- [ ] **XAT-K03 · Anar a una data** · `F2` · `S` · `nou`
- [ ] **XAT-K04 · Filtres per tipus** · `F2` · `M` · `nou`
  - WhatsApp: fotos, GIF, enllaços, vídeos, documents, àudio, no llegits, adhesius i enquestes.
- [ ] **XAT-K05 · Cerca que ignora accents i majúscules** · `F1` · `S` · `nou`
  - Proposta: «que» troba «què» i «ela geminada» funciona escrita amb punt volat o amb punt normal.
- [ ] **XAT-K06 · Galeria de la conversa** · `F2` · `M` · `nou`
  - WhatsApp: «Mitjans, enllaços i documents» a la informació del contacte o del grup.
- [ ] **XAT-K07 · Vista de missatges destacats** · `F2` · `S` · `nou`
  - Depén de: `XAT-B14`.
- [ ] **XAT-K08 · Grups en comú** · `F2` · `S` · `nou`
  - Proposta: només la intersecció (grups on estem tots dos), mai la llista de grups de l'altra persona.
- [ ] **XAT-K09 · Buscar persones per a escriure'ls** · `F1` · `S` · `parcial`
  - Depén de: `XAT-A06`.

### 6. Multimèdia, veu, grups, presència i avisos

Punt de partida: avui el xat només envia text. El bucket privat que existix (`mitjans_privats`) només deixa llegir la ruta pròpia (`supabase/migrations/260920_0300_blindatge_storage_i_contingut.sql`), així que l'altra persona no podria veure cap adjunt; `uploadToStorage` només l'admet per a Notes (`src/data/supabase/storage.js:103-123`). Tota la família F depén d'un bucket nou amb permís per pertinença a la conversa (`ARQ-G`).

#### XAT-F · Adjunts i continguts rics

- [ ] **XAT-F01 · Enviar fotos** · `F1` · `M` · `nou`
  - WhatsApp: qualitat estàndard o HD; fins a 100 elements per enviament.
  - Proposta: el navegador redimensiona i recodifica la foto abans de pujar-la; això també elimina l'EXIF i el GPS (una foto feta a casa porta les coordenades de casa).
  - Atenció: Safari no codifica WebP amb `toBlob` i torna PNG: cal comprovar el tipus i caure a JPEG.
  - Dades: `xat_adjunts` (ruta, MIME, mida, amplada, alçada, `thumbhash`); capacitat `xatMitjans`.
- [ ] **XAT-F02 · Qualitat HD** · `F2` · `S` · `nou`
  - Proposta: opció per foto; en connexions lentes, estàndard per defecte.
- [ ] **XAT-F03 · Àlbums (diverses fotos en un missatge)** · `F1` · `M` · `nou`
  - WhatsApp: peu compartit i reacció a tot l'àlbum o a cada foto (juny de 2025).
  - Dades: diversos `xat_adjunts` per missatge, amb `ordre` (nom nou).
- [ ] **XAT-F04 · Peu de foto** · `F1` · `S` · `nou`
- [ ] **XAT-F05 · Previsualització borrosa mentre carrega** · `F1` · `S` · `nou`
  - Proposta: ThumbHash (uns 25 bytes per imatge) guardat amb l'adjunt.
  - Atenció: dependència nova (cal aprovació) o implementació pròpia de poques línies.
- [ ] **XAT-F06 · Visor a pantalla completa** · `F1` · `M` · `nou`
  - Proposta: galeria amb lliscament i fletxes de teclat, i botó de tancar de 44 px.
- [ ] **XAT-F07 · Enganxar i arrossegar imatges** · `F1` · `S` · `nou`
- [ ] **XAT-F08 · Fer una foto des del xat** · `F1` · `S` · `nou`
  - Proposta: `<input capture>` obri la càmera del mòbil sense cap permís extra.
- [ ] **XAT-F09 · Retallar i girar abans d'enviar** · `F2` · `M` · `nou`
  - WhatsApp: també dibuixar, text i adhesius sobre la foto.
  - Proposta: només retallar i girar; la resta, `FX`.
- [ ] **XAT-F10 · Vídeos** · `F2` · `L` · `nou`
  - WhatsApp: per defecte 100 MB i 720p amb bona connexió i 64 MB i 480p amb connexió lenta (la mateixa FAQ es contradiu: per confirmar).
  - Atenció: el navegador del baseline no pot recomprimir vídeo (WebCodecs arriba a Safari 16.4) i les funcions del servidor tampoc (sense ffmpeg). Cal un límit de mida i una pujada per trossos per damunt de 6 MB (`ARQ-G03`).
  - Decisió: límit de mida del vídeo.
- [ ] **XAT-F11 · Documents (PDF, fulls de càlcul, textos)** · `F1` · `M` · `nou`
  - WhatsApp: fins a 2 GB.
  - Proposta: llista blanca de tipus, límit propi (per exemple, 25 MB), icona, nom i mida; es descarreguen, mai s'executen.
- [ ] **XAT-F12 · Veure un PDF sense descarregar-lo** · `F3` · `M` · `nou`
- [ ] **XAT-F13 · Escanejar un document** · `FX` · `M` · `nou`
  - Proposta: no fer-ho; l'escàner del sistema ja ho resol.
- [ ] **XAT-F14 · Enviar la ubicació** · `F2` · `M` · `nou`
  - Proposta: permís de localització demanat en el moment; es mostren les coordenades i un botó «Obri al mapa».
  - Decisió: si es mostra un mapa, de quin proveïdor (qualsevol mapa extern veu l'adreça IP de qui el mira).
- [ ] **XAT-F15 · Ubicació en directe** · `F3` · `L` · `nou`
  - WhatsApp: durant un temps triat, xifrada.
  - Atenció: és la dada més sensible del menú. Només té sentit per a cures (llavor «Alerta anticaigudes») i amb consentiment explícit i caducitat curta.
- [ ] **XAT-F16 · Compartir la fitxa d'una persona o entitat** · `F2` · `S` · `nou`
  - Proposta: en lloc de la targeta de contacte del telèfon, la targeta del perfil de Sóc de Poble.
- [ ] **XAT-F17 · Enquestes** · `F2` · `M` · `nou`
  - WhatsApp: pregunta de fins a 255 caràcters, fins a 12 opcions de 100, vot únic o múltiple; des d'agost de 2026, votants ocults, hora de tancament i edició de la pregunta durant 15 minuts.
  - Dades: `xat_enquestes`, `xat_vots`; capacitat `xatEnquestes`.
- [ ] **XAT-F18 · Esdeveniments** · `F2` · `M` · `nou`
  - WhatsApp: títol, descripció, hora d'inici i de fi, lloc, enllaç de trucada; respostes «Vaig», «Potser», «No vaig», un acompanyant i recordatoris.
  - Proposta: igual, amb opció d'enviar-lo a l'Agenda del poble.
  - Dades: `xat_esdeveniments`, `xat_assistencies`.
- [ ] **XAT-F19 · Adhesius** · `F3` · `M` · `nou`
  - WhatsApp: paquets, adhesius propis a partir d'una foto, adhesius de text.
  - Proposta: un paquet propi del poble il·lustrat; adhesius personals més avant.
- [ ] **XAT-F20 · GIF animats** · `FX` · `M` · `nou`
  - Atenció: els cercadors de GIF (GIPHY i similars) són tercers que reben què busca cada persona. Només es podria fer amb un catàleg propi.
- [ ] **XAT-F21 · Visualització única** · `FX` · `M` · `nou`
  - WhatsApp: s'ha d'obrir en 14 dies; no es pot reenviar ni fer-ne captura (a l'app).
  - Atenció: al navegador no es poden impedir les captures; prometre-ho seria enganyar. Només en l'app nadiua (`F3`).
- [ ] **XAT-F22 · Descàrrega automàtica** · `F2` · `S` · `nou`
  - WhatsApp: per tipus i per xarxa (dades mòbils, wifi, itinerància).
  - Atenció: el navegador de Safari i de Firefox no sap si està en wifi. Proposta: «Descarrega sempre / Pregunta'm», amb la mida visible abans de baixar.
- [ ] **XAT-F23 · Progrés i cancel·lació de la pujada** · `F1` · `S` · `nou`
- [ ] **XAT-F24 · Límits de mida i tipus al servidor** · `F0` · `S` · `parcial`
  - Repo: el límit privat és `25242880` bytes (`storage.js:116`), probablement una errada per `26214400` (25 MiB).
  - Proposta: límit i tipus declarats al bucket, no només al client.
- [ ] **XAT-F25 · Compartir des d'altres apps cap al xat** · `F3` · `M` · `nou`
  - Atenció: al web necessita una app instal·lada amb manifest (no n'hi ha). Encaixa amb l'app nadiua.

#### XAT-G · Veu i vídeo

- [ ] **XAT-G01 · Gravar una nota de veu mantenint premut** · `F1` · `L` · `nou`
  - WhatsApp: mantindre premut el micròfon, soltar per enviar, lliscar per cancel·lar.
  - Proposta: igual, i a més «toca per a començar, toca per a enviar» per a qui no pot mantindre el dit (accessibilitat).
  - Atenció: Safari grava AAC en MP4; Chrome i Firefox graven Opus en WebM. Que una nota gravada en Chrome es reproduïsca en un iPhone amb iOS 16 és per confirmar; cal una matriu de proves real abans d'aprovar el format.
  - Decisió: si cal un servei que convertisca el format al servidor.
- [ ] **XAT-G02 · Bloquejar la gravació lliscant amunt** · `F1` · `S` · `nou`
- [ ] **XAT-G03 · Pausa i escolta abans d'enviar** · `F2` · `M` · `nou`
- [ ] **XAT-G04 · Forma d'ona** · `F1` · `S` · `nou`
  - Proposta: calculada mentre es grava (uns 64 valors) i guardada amb l'adjunt.
  - Dades: `xat_adjunts.forma_ona`, `durada_ms`.
- [ ] **XAT-G05 · Reproductor amb cursor i velocitats** · `F1` · `S` · `nou`
  - WhatsApp: 1×, 1,5× i 2×; el cursor es mou per l'ona.
- [ ] **XAT-G06 · Reproducció encadenada** · `F2` · `S` · `nou`
  - Proposta: en acabar una nota, comença la següent de la mateixa persona.
- [ ] **XAT-G07 · Permís del micròfon en el moment** · `F1` · `S` · `nou`
  - Proposta: una frase explica per a què abans de demanar-lo; a iOS cal un gest de la persona.
- [ ] **XAT-G08 · Transcripció de notes de veu** · `F2` · `L` · `nou`
  - WhatsApp: es fa dins del dispositiu, desactivada per defecte i només la veu qui rep.
  - Proposta: útil per a persones sordes i per a la carpeta intel·ligent (capítol 9).
  - Atenció: al servidor, un servei de transcripció escolta la veu de tercers (Llei 5).
  - Decisió: on es transcriu i si la IAIA la pot usar.
- [ ] **XAT-G09 · Nota de veu d'una sola escolta** · `FX` · `S` · `nou`
  - Atenció: mateix problema que `XAT-F21`.
- [ ] **XAT-G10 · Notes de vídeo rodones** · `F3` · `L` · `nou`
  - WhatsApp: fins a 60 s, en bucle i sense so a la conversa; només l'autor les pot reenviar.
- [ ] **XAT-G11 · Llegir els missatges en veu alta** · `F2` · `M` · `nou`
  - Proposta pròpia per a gent gran: botó «Escolta» a cada missatge amb la veu del sistema (compatible amb el baseline).
  - Atenció: la disponibilitat de veu en valencià depén del dispositiu (per confirmar). Lligat a la llavor «Població Ràdio TTS».
- [ ] **XAT-G12 · Mode de poca cobertura** · `F2` · `M` · `nou`
  - Proposta: notes de veu a poca taxa de bits, imatges només en tocar-les i mida visible abans de baixar (llavor «Nano Banana», connexions 2G del camp).
- [ ] **XAT-G13 · Continuar escoltant en canviar de conversa** · `F3` · `S` · `nou`

#### XAT-H · Grups, comunitats, canals i difusió

Avui no hi ha cap RPC per a crear un grup ni per a afegir-hi gent, i `xat_participants` no té permís d'inserció ni d'esborrat (`supabase/migrations/260908_xat_v2.sql:88-89`).

- [ ] **XAT-H01 · Crear un grup** · `F1` · `M` · `nou`
  - WhatsApp: nom de fins a 100 caràcters, descripció de fins a 2.048, foto.
  - Dades: `xat_fils.tipus = 'grup'`, `descripcio`, `imatge_url`; RPC `xat_crea_grup`; capacitat `xatGrups`.
- [ ] **XAT-H02 · Afegir i treure membres** · `F1` · `M` · `nou`
  - Depén de: `XAT-H03`, `XAT-L05` (qui em pot afegir a grups).
- [ ] **XAT-H03 · Rols: propietat, administració i membres** · `F1` · `M` · `nou`
  - WhatsApp: administració i membres; si l'únic administrador ix, se'n tria un a l'atzar.
  - Proposta: igual, però la propietat no pot eixir sense cedir-la.
  - Dades: `xat_participants.rol`; funció `private.es_admin_del_fil`.
- [ ] **XAT-H04 · Permisos del grup** · `F2` · `M` · `nou`
  - WhatsApp: qui edita la informació, qui envia, qui afig, qui convida, aprovació d'entrada i qui envia l'historial; en grups creats amb menys de 33 membres tothom pot afegir; per damunt de 256, editar la informació és només de l'administració.
  - Dades: `xat_fils.permisos` (jsonb).
- [ ] **XAT-H05 · Invitació per enllaç o QR** · `F1` · `M` · `nou`
  - Proposta: enllaç que es pot restablir (l'antic deixa de funcionar), amb caducitat i usos màxims opcionals.
  - Dades: `xat_invitacions`.
- [ ] **XAT-H06 · Aprovació d'entrada** · `F2` · `S` · `nou`
  - Dades: `xat_sollicituds`.
- [ ] **XAT-H07 · Límit de membres** · `F1` · `S` · `nou`
  - WhatsApp: 1.024.
  - Proposta: el mateix límit, comprovat al servidor.
- [ ] **XAT-H08 · Pantalla d'informació del grup** · `F1` · `M` · `nou`
  - Proposta: nom, foto, descripció, membres amb rol, mitjans, silenciar, eixir i denunciar.
- [ ] **XAT-H09 · Eixir d'un grup** · `F1` · `S` · `nou`
  - Proposta: qui ix conserva l'historial fins al moment d'eixir i ja no rep res.
  - Dades: `xat_participants.eixit_al`.
- [ ] **XAT-H10 · Expulsar un membre** · `F1` · `S` · `nou`
- [ ] **XAT-H11 · Mode anuncis (només l'administració escriu)** · `F1` · `S` · `nou`
  - Proposta: ideal per a l'Ajuntament o l'associació; els membres poden reaccionar si les reaccions s'aproven.
- [ ] **XAT-H12 · Historial per als membres nous** · `F2` · `M` · `nou`
  - WhatsApp (febrer de 2026): l'administració pot enviar de 25 a 100 missatges als nous, amb un missatge de sistema; no inclou missatges temporals ni d'una sola visualització.
  - Proposta: per defecte, qui entra veu des que entra; compartir historial és una acció explícita.
- [ ] **XAT-H13 · Etiqueta per membre dins d'un grup** · `F3` · `S` · `nou`
  - WhatsApp: gener de 2026 (per exemple, «tresorera»).
  - Dades: `xat_participants.etiqueta`.
- [ ] **XAT-H14 · Veure els canvis de membres** · `F3` · `S` · `nou`
  - WhatsApp: altes, baixes i canvis de nom dels últims 60 dies.
- [ ] **XAT-H15 · Grup del poble** · `F2` · `M` · `nou`
  - Proposta pròpia: un grup en mode anuncis per a cada poble.
  - Atenció: entrar-hi ha de ser una invitació acceptada, no una inscripció automàtica (Llei 5).
- [ ] **XAT-H16 · Grups d'una organització** · `F2` · `M` · `nou`
  - Proposta: grup lligat a l'entitat; les altes i baixes de l'entitat se sincronitzen amb el grup.
  - Dades: `xat_fils.org_id`.
- [ ] **XAT-H17 · Cercle de cures** · `F2` · `M` · `nou`
  - Proposta pròpia (cas d'ús de cuidadores): plantilla de grup amb la persona gran, la família de fora i la cuidadora, amb una carpeta intel·ligent de torns i incidències (`XAT-T08`).
- [ ] **XAT-H18 · Comunitats** · `F2` · `L` · `nou`
  - WhatsApp: fins a 100 grups més un grup d'anuncis, fins a 2.000 membres.
  - Proposta: el poble i les associacions grans com a comunitats.
  - Dades: `xat_fils.tipus = 'comunitat'`, `comunitat_id`.
- [ ] **XAT-H19 · Canals** · `F3` · `L` · `nou`
  - WhatsApp: difusió d'una sola direcció; els seguidors no es veuen entre ells.
  - Atenció: se solapa amb el Mur.
  - Decisió: canals al xat o el Mur com a canal.
- [ ] **XAT-H20 · Llistes de difusió** · `FX` · `M` · `nou`
  - WhatsApp: fins a 256 persones; només reben el missatge qui t'ha desat.
  - Proposta: no fer-ho; el grup en mode anuncis ho cobrix sense enviaments massius.
- [ ] **XAT-H21 · Missatge de benvinguda** · `F3` · `S` · `nou`
- [ ] **XAT-H22 · Crear un grup semblant** · `F3` · `S` · `nou`
- [ ] **XAT-H23 · Sala de veu dins d'un grup** · `FX` · `XL` · `nou`
  - WhatsApp: xats de veu de grup, de qualsevol mida, des de maig de 2025.
  - Depén de: la infraestructura de trucades (`XAT-M`).

#### XAT-I · Presència

- [ ] **XAT-I01 · «Escrivint…»** · `F1` · `M` · `nou`
  - WhatsApp: només el veu qui té la conversa oberta.
  - Proposta: senyal efímer pel canal de la conversa oberta, limitat a un cada pocs segons; no es guarda enlloc.
  - Dades: topic `xat:f:<fil_id>`; capacitat `xatPresencia`.
- [ ] **XAT-I02 · «Gravant àudio…»** · `F2` · `S` · `nou`
  - WhatsApp: per confirmar a la FAQ vigent.
- [ ] **XAT-I03 · «En línia»** · `F2` · `M` · `nou`
  - Proposta: només dins de la conversa oberta; no s'emet a tot el poble.
- [ ] **XAT-I04 · Última connexió** · `F2` · `M` · `nou`
  - WhatsApp: «Tots», «Contactes», «Contactes excepte…» o «Ningú»; és recíproca.
  - Atenció: revela hàbits (quan dorm una persona gran que viu sola). Signal no en té.
  - Decisió: tindre-la, i amb quin valor per defecte.
- [ ] **XAT-I05 · Comptador «N en línia» als grups** · `F3` · `S` · `nou`
- [ ] **XAT-I06 · Frase d'estat breu al capdamunt de la conversa** · `F2` · `S` · `nou`
  - WhatsApp: «Info» renovada (novembre de 2025): emoji i frase que caduca en un dia.
  - Depén de: `PER-F01`.

#### XAT-J · Avisos

- [ ] **XAT-J01 · Avís dins de l'app** · `F0` · `S` · `parcial`
  - Repo: `NotificationContext.jsx` ja fa avisos flotants dins de l'app.
  - Proposta: avís quan arriba un missatge i la persona és en una altra secció.
- [ ] **XAT-J02 · Comptador a la icona i al títol de la pestanya** · `F0` · `S` · `nou`
- [ ] **XAT-J03 · So en arribar un missatge** · `F1` · `S` · `nou`
  - Atenció: el navegador només deixa sonar després d'un gest de la persona.
- [ ] **XAT-J04 · Notificació del sistema amb la pestanya oberta** · `F2` · `S` · `nou`
  - Proposta: l'API de notificacions sense push, que funciona mentre la pestanya estiga oberta; permís demanat en el moment.
- [ ] **XAT-J05 · Notificacions push al navegador** · `F3` · `L` · `nou`
  - Atenció: necessita service worker i manifest (avui no n'hi ha, i la doctrina diu «sense service worker»). A iPhone només funciona des d'iOS 16.4 i amb l'app afegida a la pantalla d'inici.
  - Dades: `xat_subscripcions_avis`; capacitat `xatAvisos`.
  - Decisió: push al web o només en l'app nadiua.
- [ ] **XAT-J06 · Notificacions de l'app nadiua** · `F3` · `L` · `nou`
  - Proposta: Capacitor amb APNs i FCM reaprofitaria el React actual (dependència nova: cal aprovació).
- [ ] **XAT-J07 · Notificació sense contingut** · `F3` · `S` · `nou`
  - Proposta: «Missatge nou de Pepa» o només «Missatge nou»; Apple i Google no han de veure el text.
- [ ] **XAT-J08 · Només mencions i respostes en un grup** · `F2` · `S` · `nou`
  - WhatsApp: «Notifica per: Destacats» (abril de 2025).
  - Dades: `xat_participants.avisos`.
- [ ] **XAT-J09 · Hores de silenci** · `F2` · `S` · `nou`
  - Proposta pròpia: respectar el ritme del camp i el descans (per exemple, de 22 a 7 h).
- [ ] **XAT-J10 · Resum per correu o SMS** · `F3` · `M` · `nou`
  - Proposta: per a qui no obri l'app (cas d'ús dels llauradors). Els SMS són simulats fins que el Mestre n'aprove el cost (skill `sdp-calendari-agricola`).
- [ ] **XAT-J11 · Insígnia numèrica a la icona de l'app** · `F3` · `S` · `nou`
  - Atenció: al web, només amb l'app instal·lada (iOS 16.4 o posterior).

### 7. Privacitat, seguretat, trucades, estats i dades personals

Ací Zero Fricció topa més sovint amb la Llei 5 de privacitat. El criteri proposat: la interfície és la de WhatsApp, però els valors per defecte els decidix el Mestre element per element, i cap dada sensible es comparteix sense un consentiment demanat en el moment.

#### XAT-L · Privacitat i seguretat

- [ ] **XAT-L01 · Model d'amenaça del poble** · `F0` · `S` · `nou`
  - Proposta: una pàgina que diga de qui ens protegim (el veí curiós amb el mòbil compartit, una exparella, qui administra el node, un atacant de fora, el proveïdor d'allotjament) i què protegim (el contingut, amb qui parla cadascú, la ubicació, els horaris d'una persona gran que viu sola).
  - Atenció: el Genotip (llei 6) prohibix declarar obligatori cap algoritme sense este cas d'ús. Decidix `XAT-L02`.
- [ ] **XAT-L02 · Xifratge extrem a extrem** · `F3` · `XL` · `nou`
  - WhatsApp: per defecte, amb el protocol Signal, en missatges, mitjans, veu, estats i trucades.
  - Atenció: amb ell, el servidor no pot buscar, moderar, fer carpetes intel·ligents, fer el Retall al servidor ni demostrar una purga. No hi ha versió oficial de la llibreria de Signal per a navegador, i les corbes X25519 no arriben al baseline (Safari 17): caldria una dependència nova (cal aprovació).
  - Proposta: no a la primera versió; reservar ja la columna `xat_missatges.versio_xifrat` perquè més avant hi puga haver converses xifrades a demanda (amb MLS, RFC 9420), on la IAIA no entraria.
  - Decisió: xifratge extrem a extrem sí o no, i quan.
- [ ] **XAT-L03 · Xifratge en trànsit i en repòs** · `F0` · `S` · `existix`
  - Proposta: HTTPS i connexions segures ja hi són; el xifratge en repòs depén del pla de Supabase (per confirmar).
- [ ] **XAT-L04 · Qui em pot escriure** · `F1` · `M` · `nou`
  - WhatsApp: qualsevol que tinga el número; des de 2026, clau opcional per al primer contacte amb nom d'usuari.
  - Proposta: «Tot el poble», «Només veïns amb qui tinc relació» o «Ningú nou»; la gent de fora del poble, només per invitació (`XAT-A08`).
  - Dades: preferència de perfil (`perfil_privacitat`); comprovació dins de `crea_fil_directe`.
- [ ] **XAT-L05 · Qui em pot afegir a grups** · `F1` · `S` · `nou`
  - WhatsApp: «Tots», «Contactes» o «Contactes excepte…».
  - Proposta: per defecte, només veïns amb relació; la resta rep una invitació.
- [ ] **XAT-L06 · Sol·licituds de missatge de desconeguts** · `F1` · `M` · `nou`
  - Proposta: el primer missatge d'algú desconegut va a una safata de «Sol·licituds»; es pot acceptar, bloquejar o denunciar sense que l'altra persona sàpia si s'ha llegit.
- [ ] **XAT-L07 · Bloquejar una persona** · `F1` · `M` · `nou`
  - WhatsApp: la persona bloquejada no pot escriure ni trucar ni veure la teua última connexió; no se l'avisa.
  - Proposta: bloqueig privat (mai públic, al contrari que Bluesky).
  - Dades: `xat_bloquejos`; capacitat `xatModeracio`.
  - Decisió: què passa dins dels grups que compartiu (WhatsApp hi continua mostrant els missatges).
- [ ] **XAT-L08 · Denunciar** · `F1` · `M` · `nou`
  - WhatsApp: la denúncia envia a revisió fins als 5 últims missatges.
  - Proposta: qui denuncia tria els missatges (fins a 5 i el seu context); van a la cua de moderació (`XAT-Q03`). És el mecanisme de notificació i acció que exigix la DSA (art. 16) a tot servei d'allotjament.
  - Dades: `xat_denuncies`.
- [ ] **XAT-L09 · Límit de converses noves amb desconeguts** · `F2` · `S` · `nou`
  - WhatsApp: límit mensual de converses noves amb qui no respon (la xifra, per confirmar).
  - Proposta: contra l'spam, un límit diari de converses noves sense resposta.
- [ ] **XAT-L10 · Missatges temporals** · `F2` · `M` · `nou`
  - WhatsApp: 24 hores, 7 dies o 90 dies; temporitzador per defecte per a converses noves; es pot «conservar» un missatge concret.
  - Proposta: igual; l'esborrat el fa el servidor per lots, i els fitxers s'esborren per l'API de Storage.
  - Dades: `xat_fils.temporal_segons`, `xat_missatges.caduca_al` (`ARQ-J02`).
  - Atenció: una carpeta intel·ligent no pot conservar dades de missatges temporals (`XAT-T12`).
- [ ] **XAT-L11 · Privacitat avançada d'una conversa** · `F2` · `S` · `nou`
  - WhatsApp (abril de 2025): impedix exportar la conversa, desar els mitjans automàticament i usar la IA dins del xat; en grups l'activa l'administració.
  - Proposta: impedix exportar, fer Retalls i activar la IAIA o una carpeta intel·ligent.
- [ ] **XAT-L12 · Bloqueig de l'app amb PIN o biometria** · `F3` · `M` · `nou`
  - Proposta: només en l'app nadiua; al navegador no protegiria res.
- [ ] **XAT-L13 · Verificació en dos passos** · `F2` · `M` · `nou`
  - Proposta: codis d'un sol ús (TOTP) de Supabase Auth; és un ajust del compte (`PER-K04`).
- [ ] **XAT-L14 · Claus d'accés (passkeys)** · `F3` · `M` · `nou`
  - WhatsApp: més de 1.000 milions de persones les usen; se'n poden tindre diverses.
  - Atenció: el suport de Supabase Auth, per confirmar.
- [ ] **XAT-L15 · Avís d'enllaços sospitosos** · `F2` · `S` · `nou`
  - Depén de: `XAT-B05`.
- [ ] **XAT-L16 · Metadades mínimes** · `F0` · `S` · `nou`
  - Proposta: cap adreça IP amb els missatges, registres curts, cap contingut a la telemetria de la Consola ni als missatges d'error.
- [ ] **XAT-L17 · Codi de seguretat de la conversa** · `FX` · `S` · `nou`
  - WhatsApp: 60 dígits o QR per verificar el xifratge.
  - Depén de: `XAT-L02` (sense xifratge extrem a extrem no té sentit).
- [ ] **XAT-L18 · Comptes de menors gestionats per la família** · `F3` · `M` · `nou`
  - WhatsApp: comptes gestionats per pares (març de 2026), només amb missatges i trucades.
  - Depén de: `XAT-O10`.

#### XAT-M · Trucades

Els botons de trucada i de videotrucada ja es pinten però estan desactivats (`src/sections/xat/XatSection.jsx:456-457`).

- [ ] **XAT-M01 · Amagar els botons de trucada mentre no funcionen** · `F0` · `S` · `existix`
  - Proposta: una interfície que promet el que no fa és un error; s'amaguen fins que `XAT-M03` estiga aprovat i fet.
- [ ] **XAT-M02 · «Truca per telèfon»** · `F2` · `S` · `nou`
  - Proposta pràctica per a gent gran: si la persona comparteix el telèfon al perfil (amb la seua audiència), el botó obri el marcador del mòbil.
- [ ] **XAT-M03 · Trucada de veu entre dos persones** · `F3` · `XL` · `parcial`
  - Atenció: cal WebRTC, un servidor de retransmissió (TURN) amb cost d'ample de banda i un canal de senyalització.
- [ ] **XAT-M04 · Videotrucada entre dos persones** · `F3` · `XL` · `nou`
  - Depén de: `XAT-M03`.
- [ ] **XAT-M05 · Missatge de trucada perduda** · `F3` · `S` · `nou`
  - WhatsApp (desembre de 2025): deixar una nota de veu o de vídeo amb un toc.
- [ ] **XAT-M06 · Trucades de grup** · `FX` · `XL` · `nou`
  - WhatsApp: fins a 32 participants.
  - Atenció: necessita un servidor de mescla (SFU), fora de l'abast d'un node de poble.
- [ ] **XAT-M07 · Enllaços de trucada, sala d'espera i compartir pantalla** · `FX` · `XL` · `nou`
  - WhatsApp: l'enllaç caduca si no s'usa en 30 dies; sala d'espera de fins a 128 persones (juliol de 2026).

#### XAT-N · Estats (històries de 24 hores)

- [ ] **XAT-N01 · Estats de text, foto, vídeo i veu** · `F3` · `L` · `nou`
  - WhatsApp: duren 24 hores; vídeo de fins a 90 s i veu de fins a 30 s.
  - Atenció: se solapa amb el Mur.
  - Decisió: estats al xat, o una alternativa pròpia (`XAT-N05`).
  - Dades: `xat_estats`, `xat_estats_vistes`.
- [ ] **XAT-N02 · Audiència dels estats** · `F3` · `S` · `nou`
  - WhatsApp: no admet «Tots»; només contactes, contactes excepte… o una llista.
- [ ] **XAT-N03 · Respondre i fer «m'agrada» en privat** · `F3` · `S` · `nou`
  - WhatsApp: el «m'agrada» no té comptador públic; només el veu l'autor.
  - Atenció: compatible amb la Connexió Radical, perquè no hi ha mètrica pública.
- [ ] **XAT-N04 · Qui ha vist el meu estat** · `F3` · `S` · `nou`
  - Atenció: lligat a les confirmacions de lectura (`XAT-C07`); al perfil és un patró fosc (`PER-O03`).
- [ ] **XAT-N05 · Taulell del poble** · `F2` · `M` · `nou`
  - Proposta pròpia: en lloc d'estats personals, avisos curts amb caducitat al Mur («Hui hi ha peix a la plaça»).
- [ ] **XAT-N06 · Mencions, música i adhesius interactius als estats** · `FX` · `M` · `nou`

#### XAT-O · Dispositius, exportació i dades personals

- [ ] **XAT-O01 · Diversos dispositius alhora** · `F0` · `S` · `existix`
  - WhatsApp: fins a 4 dispositius vinculats més el telèfon.
  - Repo: com que el servidor és la font de veritat, cada navegador amb sessió ja veu les mateixes converses (sessió per pestanya, D1, `src/data/identitat.js`).
- [ ] **XAT-O02 · Llegit en un dispositiu, llegit en tots** · `F1` · `S` · `nou`
  - Dades: les marques viuen al servidor; s'avisa pel canal personal `xat:u:<uid>`.
- [ ] **XAT-O03 · Exportar una conversa** · `F2` · `M` · `nou`
  - WhatsApp: amb o sense mitjans; no es pot tornar a importar.
  - Proposta: text llegible i JSON, només del que la persona pot veure; respecta la privacitat avançada (`XAT-L11`).
- [ ] **XAT-O04 · Descarregar totes les meues dades** · `F0` · `S` · `existix`
  - Repo: `exporta_les_meues_dades` ja inclou converses, missatges propis i lectures (`supabase/migrations/260926_1500_identitat_perfil_f1.sql`, fitxer encara sense versionar).
  - Proposta: afegir-hi els adjunts propis i les reaccions quan existisquen.
- [ ] **XAT-O05 · Importar una exportació de WhatsApp** · `F2` · `L` · `nou`
  - Proposta pròpia (Zero Fricció): portar l'historial d'un grup de WhatsApp (el `.txt` que genera «Exporta el xat») a una conversa nova, marcat com a «importat».
  - Atenció: conté missatges de tercers; només té sentit si el grup es trasllada sencer i els membres ho saben. El format de data canvia segons l'idioma del telèfon.
  - Decisió: permetre-ho i amb quin consentiment.
- [ ] **XAT-O06 · Còpies de seguretat** · `F0` · `S` · `existix`
  - Proposta: amb el servidor com a font de veritat, les còpies són del node (pla de Supabase, per confirmar); cap persona ha de fer-ne.
- [ ] **XAT-O07 · Donar-se de baixa sense esborrar la meitat de les converses dels altres** · `F0` · `M` · `parcial`
  - Repo: la purga esborra l'usuari i els seus missatges cauen en cascada (`supabase/migrations/260908_xat_v2.sql:27`); les converses que es queden sense ningú s'esborren. L'altra persona perd la meitat de la conversa.
  - Proposta: làpida dels missatges propis (sense text ni adjunts), autor pseudonimitzat com a «Veïna que se n'ha anat» (el mateix text que ja usa la baixa) i conservació dels missatges dels altres.
  - Dades: `ARQ-J04`.
- [ ] **XAT-O08 · Dret d'accés i de rectificació** · `F1` · `S` · `parcial`
  - Proposta: exportació (`XAT-O04`) i edició del perfil ja hi són; falta explicar-ho al text de privacitat.
- [ ] **XAT-O09 · Informació de privacitat del xat** · `F1` · `S` · `parcial`
  - Repo: la taula `politiques_privacitat` ja existix.
  - Proposta: una política que explique què fa el servidor amb els missatges, la IAIA i les carpetes intel·ligents.
- [ ] **XAT-O10 · Edat mínima** · `F1` · `S` · `nou`
  - Proposta: 14 anys a l'Estat espanyol (LOPDGDD, art. 7); hi ha una llei en tràmit que la pujaria a 16 (per confirmar).
  - Decisió: edat mínima del xat.
- [ ] **XAT-O11 · Consentiment en el moment d'enviar** · `F0` · `S` · `nou`
  - Proposta: la primera vegada que s'envia una foto o la ubicació a un grup, una frase clara: «Esta foto la veuran 43 persones». És l'exemple literal de la Llei 5.
- [ ] **XAT-O12 · Llegir sense connexió el que ja s'ha baixat** · `F2` · `M` · `nou`
  - Proposta: memòria cau local dels últims missatges de cada conversa, només per a llegir.
  - Atenció: compatible amb l'ADR-2026-08, que admet una memòria cau opcional i no autoritativa.
- [ ] **XAT-O13 · Escriure sense connexió (cua d'eixida local)** · `F3` · `L` · `nou`
  - Proposta: els missatges escrits sense cobertura esperen al dispositiu i s'envien en tornar la xarxa, sense duplicats (`XAT-A25`).
  - Atenció: contradiu l'ADR-2026-08 vigent i requerix una ADR nova. Safari pot esborrar les dades d'un web no visitat en 7 dies (no les d'una app afegida a l'inici); en l'app nadiua no passa.
  - Decisió: formalitzar la visió d'app nadiua amb treball sense connexió (acta `260926_2350_acta_marmota.md`) en una ADR nova.
- [ ] **XAT-O14 · Dos comptes al mateix dispositiu** · `FX` · `M` · `nou`
  - WhatsApp: dos comptes a iOS des de març de 2026.

### 8. Accessibilitat, convivència, fedivers i integracions

#### XAT-P · Accessibilitat i idioma

- [ ] **XAT-P01 · Nivell d'accessibilitat objectiu** · `F0` · `S` · `nou`
  - Situació: l'ADR-2026-08 diu WCAG 2.2 AA; la memòria d'aprenentatges parla d'AAA per a les fitxes de llista. Està pendent de decisió a `.agents/ESTAT.md`.
  - Decisió: AA o AAA per al xat.
- [ ] **XAT-P02 · Objectius tàctils de 44 px** · `F0` · `S` · `parcial`
  - Repo: els botons de la capçalera del xat fan 36 px (`src/css/modules.css:2403-2414`).
  - Proposta: 44 px, i 48 px en el mode de lletra gran.
- [ ] **XAT-P03 · Lector de pantalla** · `F1` · `M` · `nou`
  - Proposta: la conversa és una llista amb autor, hora i estat llegibles; els missatges nous s'anuncien de manera educada (sense interrompre) i agrupats, no un per un.
- [ ] **XAT-P04 · Cap estat només per color** · `F0` · `S` · `nou`
  - Proposta: marques de lectura, no llegits, errors i silenciat sempre amb forma o text a més del color.
- [ ] **XAT-P05 · Lletra gran** · `F2` · `M` · `nou`
  - Proposta: mode de 28 px per a persones de més de 80 anys (llavor «Pedra Seca 28px» del full de ruta).
- [ ] **XAT-P06 · Alternativa a tots els gestos** · `F1` · `S` · `nou`
  - Proposta: lliscar per citar, premuda llarga i doble toc tenen sempre el mateix al menú del missatge i amb el teclat (WCAG 2.5.7).
- [ ] **XAT-P07 · Tot amb el teclat** · `F1` · `M` · `nou`
  - Proposta: canviar de conversa, obrir el menú del missatge i tancar amb Esc; el focus sempre visible i mai tapat per la barra mòbil (WCAG 2.4.11).
- [ ] **XAT-P08 · Contrast suficient** · `F0` · `S` · `nou`
  - Proposta: 4,5:1 també sobre el fons de mapa del xat (`public/assets/system/ui/xat-bg-map-v2.jpg`) i en mode fosc.
- [ ] **XAT-P09 · Reducció de moviment** · `F1` · `S` · `nou`
  - Proposta: sense animacions si el sistema ho demana.
- [ ] **XAT-P10 · Tots els textos a i18n** · `F0` · `M` · `parcial`
  - Repo: `XatSection.jsx` té textos escrits a mà (`:184, 225-228, 560`), encara que les claus `section.xat.*` ja existixen a `src/config/i18n.js` en 5 llengües.
- [ ] **XAT-P11 · Hores i dates en valencià** · `F1` · `S` · `nou`
  - Proposta: «ara», «fa 5 min», «ahir», «dilluns» i separadors de dia, amb les funcions de format del navegador (dins del baseline).
- [ ] **XAT-P12 · Mode fàcil per a gent gran** · `F2` · `M` · `nou`
  - Proposta: menys opcions visibles, botons grans, confirmacions clares i «Desfés» després d'esborrar.
- [ ] **XAT-P13 · Historial sense desorientar** · `F1` · `S` · `nou`
  - Proposta: separadors de dia i botó «Carrega'n més» a més del scroll (criteri del document `a11y_seo_trellat.md` de la Wiki: evitar l'scroll infinit quan impedix orientar-se).
- [ ] **XAT-P14 · Proves amb persones grans del poble pilot** · `F1` · `M` · `nou`
  - Proposta: cap fase es dona per bona sense que tres persones grans de La Torre de les Maçanes hagen enviat una foto i una nota de veu soles.

#### XAT-Q · Moderació i convivència

Avui no hi ha cap doctrina de moderació a la Wiki.

- [ ] **XAT-Q01 · Normes de convivència del poble** · `F1` · `S` · `nou`
  - Proposta: un text curt i clar, visible des de la informació de cada grup.
- [ ] **XAT-Q02 · Rols de moderació** · `F1` · `M` · `nou`
  - Proposta: l'administració de cada grup modera el seu grup; la moderació del node (rol de superadministració que ja existix, `private.es_superadmin`) només actua sobre denúncies.
- [ ] **XAT-Q03 · Cua de denúncies i resolució motivada** · `F1` · `M` · `nou`
  - Proposta: estats «rebuda», «en revisió», «resolta» i «desestimada»; la persona afectada rep el motiu (DSA, art. 17).
  - Dades: `xat_denuncies.estat`.
- [ ] **XAT-Q04 · La moderació només veu el que s'ha denunciat** · `F1` · `S` · `nou`
  - Proposta: la RLS dona accés a la moderació als missatges denunciats i al seu context immediat, mai a la conversa sencera.
- [ ] **XAT-Q05 · Accions de moderació** · `F2` · `M` · `nou`
  - Proposta: esborrar un missatge, silenciar un membre durant un temps, expulsar-lo del grup i, al node, suspendre un compte.
- [ ] **XAT-Q06 · Registre de moderació sense contingut** · `F1` · `S` · `nou`
  - Proposta: qui ha fet què i quan, sense copiar el text dels missatges.
- [ ] **XAT-Q07 · Apel·lació** · `F2` · `S` · `nou`
- [ ] **XAT-Q08 · Protecció contra estafes** · `F2` · `M` · `nou`
  - WhatsApp: alerta d'estafa en proves (agost de 2026).
  - Proposta: avís quan un desconegut demana diners o envia un enllaç, pensat per a gent gran; es calcula al navegador de qui rep.
- [ ] **XAT-Q09 · La IAIA com a ajuda de moderació** · `F3` · `M` · `nou`
  - Atenció: només sobre contingut denunciat o en grups que ho activen; mai llegint-ho tot (Llei 5).
- [ ] **XAT-Q10 · Filtre automàtic de paraules** · `FX` · `S` · `nou`
  - Atenció: falsos positius amb el parlar del poble i paternalisme.

#### XAT-R · Fedivers i interoperabilitat

- [ ] **XAT-R01 · El xat privat no es federa** · `F0` · `S` · `nou`
  - Motiu: els «missatges directes» d'ActivityPub no són privats: els llegix l'administració de cada servidor, una menció nova afig destinataris i l'esborrat és només una petició.
  - Proposta: principi fix de la skill.
- [ ] **XAT-R02 · Federar el que és públic** · `F3` · `L` · `nou`
  - Proposta: el Mur, l'Agenda i el perfil públic (`PER-L`) sí que poden anar al fedivers; el xat, no.
- [ ] **XAT-R03 · Xat entre dos nodes de Sóc de Poble** · `F3` · `XL` · `nou`
  - Decisió: si els pobles compartixen servidor o si cal federar el xat entre servidors.
- [ ] **XAT-R04 · Pont amb Matrix** · `F3` · `XL` · `nou`
  - Proposta: a llarg termini, la via més madura per a xat privat entre servidors diferents.
- [ ] **XAT-R05 · Interoperabilitat oficial amb WhatsApp (DMA)** · `FX` · `XL` · `nou`
  - Motiu: l'oferta de Meta exigix el protocol Signal, un acord signat i connectar-se als seus servidors; els primers socis (BirdyChat i Haiket, novembre de 2025) són empreses de missatgeria.
- [ ] **XAT-R06 · Pont amb els grups de WhatsApp de la família** · `F3` · `L` · `parcial`
  - Situació: llavor «Pont WhatsApp amb fills i nets» (2026-Q4) del full de ruta. El bot de `bot/` usa Baileys, un client no oficial; WhatsApp expulsa comptes que usen apps no oficials i en setembre de 2026 provava un avís específic.
  - Proposta: els missatges d'un grup de WhatsApp apareixen en una conversa de Sóc de Poble i al revés, amb el consentiment de tot el grup.
  - Decisió: Baileys (risc d'expulsió) o l'API oficial de WhatsApp Business (si admet grups, per confirmar).
- [ ] **XAT-R07 · Identitat federada** · `F3` · `M` · `nou`
  - Depén de: `PER-L01`.

#### XAT-S · Integracions amb Sóc de Poble

- [ ] **XAT-S01 · «Comentar» obri el xat privat amb l'autor** · `F1` · `S` · `parcial`
  - Repo: la skill `sdp-universal-page` ho mana, però la `UniversalPage` només navega a `/xat` sense dir amb qui (`src/components/universal/UniversalPage.jsx:23`).
- [ ] **XAT-S02 · Compartir una Nota o una Pàgina Universal com a targeta** · `F2` · `M` · `nou`
  - Proposta: targeta amb imatge, títol i entradilla; qui no té permís de lectura només veu el títol.
- [ ] **XAT-S03 · Tocar un nom obri el seu perfil** · `F1` · `S` · `nou`
  - Depén de: `PER-N01`.
- [ ] **XAT-S04 · Mercat: parlar amb qui ven** · `F2` · `M` · `nou`
  - Proposta: la conversa s'obri amb la targeta del producte com a primera cita (llavor «Virtual Store»).
- [ ] **XAT-S05 · Menjar a casa: comandes al bar** · `F2` · `M` · `nou`
  - Proposta: les comandes es fan xarrant amb el bar; la carpeta intel·ligent en fa la llista (`XAT-T06`).
- [ ] **XAT-S06 · Agenda** · `F2` · `S` · `nou`
  - Situació: la secció Agenda està en quarantena (`src/config/sections.js:3-8`).
  - Depén de: `XAT-F18`.
- [ ] **XAT-S07 · Avisos del Calendari agrícola com a missatges de la IAIA** · `F3` · `M` · `nou`
  - Depén de: `XAT-A03`.
- [ ] **XAT-S08 · Telemetria de la Consola només amb comptadors** · `F1` · `S` · `nou`
  - Proposta: nombre de missatges i de converses actives per dia, mai contingut ni noms.
- [ ] **XAT-S09 · El xat en mode incrustat** · `F2` · `M` · `nou`
  - Proposta: quan Sóc de Poble s'incrusta en un WordPress o un Joomla (`src/host.js`), el xat funciona si el backend té la capacitat `xat` i s'amaga si no.
- [ ] **XAT-S10 · El cercador general troba converses** · `F2` · `S` · `nou`
  - Depén de: `XAT-K01`.

### 9. La IAIA com a carpeta intel·ligent

**Per què.** La gent no deixa WhatsApp ni omple formularis: a l'app de les disfresses només hi van entrar 7 de 70 persones. El grup continuarà enviant centenars de missatges desordenats («jo també», «compteu amb mi i la meua dona», «al final no puc»). En lloc de prohibir-ho, la IAIA fa d'oient de fons: llig la conversa on el grup ho ha acceptat i manté al dia un document ordenat (una llista d'inscrits, una acta, les comandes) sense demanar cap esforç a ningú.

**Sis regles que fan que siga acceptable** (proposta; cada una és un element de baix):

1. Mai escolta d'amagat: el grup ho accepta i ho veu tot el temps (`XAT-T01`, `XAT-T02`).
2. Cada dada de la carpeta porta al missatge d'on ix (`XAT-T14`).
3. La IAIA proposa i les persones disposen: el que edita una persona, la IAIA no ho torna a tocar (`XAT-T14`).
4. Mai inventa: si no ho té clar, ho marca com a dubte o pregunta en privat a qui organitza (`XAT-T15`).
5. Només extrau el que la plantilla demana, i res de missatges temporals ni de qui no vol (`XAT-T12`, `XAT-T13`).
6. La carpeta és una Nota normal del Bloc de Notes: es llig, s'edita i s'exporta com qualsevol altra (`XAT-T21`).

#### XAT-T · Carpetes intel·ligents

- [ ] **XAT-T01 · Activar una carpeta en una conversa** · `F2` · `M` · `nou`
  - Proposta: l'administració d'un grup (o qualsevol de les dos persones en una directa) tria una plantilla i l'activa; un missatge de sistema ho anuncia a tothom.
  - Dades: `xat_carpetes` (fil, plantilla, `nota_id`, mode, qui l'ha activada, `ultim_seq_processat`; nom nou); capacitat `xatCarpetes` (nom nou).
  - Decisió: consentiment de cada membre o de l'administració amb dret d'oposició (`XAT-T13`).
- [ ] **XAT-T02 · Avís permanent que la IAIA està endreçant** · `F2` · `S` · `nou`
  - Proposta: una icona fixa a la capçalera de la conversa («La IAIA endreça este grup: Llista d'inscrits»), que en tocar-la obri la carpeta i explica què llig.
- [ ] **XAT-T03 · Plantilles de carpeta** · `F2` · `M` · `nou`
  - Proposta: llista d'inscrits, acta de la conversa, comandes, torns i incidències, compra conjunta, objectes perduts, preguntes pendents i calendari d'activitats. Cada plantilla definix quins camps busca la IAIA, i res més.
- [ ] **XAT-T04 · Llista d'inscrits que es fa sola** · `F2` · `M` · `nou`
  - Proposta: la IAIA entén «m'apunte», «jo també», «som tres», «+2» i «al final no puc», i manté qui ve, quants i les observacions. La reacció acordada «m'apunte» (`XAT-D06`) també compta.
  - Exemple: sopar de festes, excursió, torneig de truc.
- [ ] **XAT-T05 · Acta o resum de la conversa** · `F2` · `M` · `nou`
  - Proposta: acords, decisions i pendents d'un període, amb enllaç als missatges; és el Retall (`XAT-B23`) fet sol.
- [ ] **XAT-T06 · Comandes** · `F3` · `M` · `nou`
  - Proposta: «2 tàpers de fideuà per a dijous» es convertix en una fila per persona i dia; el bar ho confirma. Cas d'ús «Menjar a casa» (`XAT-S05`).
- [ ] **XAT-T07 · Dates i quedades detectades** · `F3` · `M` · `nou`
  - Proposta: la IAIA detecta «dissabte a les 7 a la plaça» i proposa crear l'esdeveniment (`XAT-F18`); mai el crea sola.
- [ ] **XAT-T08 · Quadern de torns i incidències d'un cercle de cures** · `F3` · `M` · `nou`
  - Proposta: «hui he vingut a les 9, ha dinat bé, s'ha pres la pastilla» alimenta un quadern que la família de fora consulta (`XAT-H17`).
  - Atenció: són dades de salut (art. 9 RGPD): consentiment explícit de la persona cuidada o de qui la representa.
  - Decisió: si esta plantilla entra, i amb quin consentiment.
- [ ] **XAT-T09 · Encàrrecs amb responsable** · `F3` · `M` · `nou`
  - Proposta: «ja porte jo les cadires» es convertix en «Cadires: Pepe», i «qui porta el gel?» queda com a pendent sense responsable.
- [ ] **XAT-T10 · Preguntar a la carpeta dins del xat** · `F2` · `M` · `nou`
  - Proposta: «@iaia quants som?» i la IAIA respon al grup amb la dada i l'enllaç a la carpeta; només respon quan se la menciona.
  - Depén de: `XAT-B16`, `XAT-A03`.
- [ ] **XAT-T11 · «Què m'he perdut?»** · `F3` · `M` · `nou`
  - WhatsApp: resums privats de missatges no llegits amb IA (juny de 2025, mercats seleccionats).
  - Proposta: resum només per a qui el demana, que no es guarda.
- [ ] **XAT-T12 · El que la IAIA no llig mai** · `F2` · `S` · `nou`
  - Proposta: missatges temporals (`XAT-L10`), d'una sola visualització, de persones que s'han oposat i converses amb privacitat avançada (`XAT-L11`).
- [ ] **XAT-T13 · «Els meus missatges, no»** · `F2` · `S` · `nou`
  - Proposta: qualsevol membre pot oposar-se; la IAIA deixa de llegir els seus missatges en eixa conversa, i si s'apunta a alguna cosa, algú l'haurà d'afegir a mà.
  - Dades: `xat_carpeta_exclusions` (nom nou).
- [ ] **XAT-T14 · Traçabilitat i correcció humana** · `F2` · `M` · `nou`
  - Proposta: cada fila de la carpeta enllaça als missatges d'origen; una persona pot corregir qualsevol fila, i el que edita una persona queda bloquejat per a la IAIA.
  - Dades: `xat_carpeta_fonts` (element de la carpeta, missatge d'origen; nom nou).
- [ ] **XAT-T15 · Dubtes a qui organitza, no a tot el grup** · `F3` · `S` · `nou`
  - Proposta: «Pepa ha dit "venim uns quants": quants apunte?» arriba en privat a qui organitza, agrupat en un sol missatge, mai al grup.
- [ ] **XAT-T16 · Avís de canvis a la carpeta** · `F3` · `S` · `nou`
  - Proposta: un resum al dia com a màxim, mai un avís per canvi.
- [ ] **XAT-T17 · Oient continu o només a demanda** · `F2` · `S` · `nou`
  - Proposta: el mode «a demanda» (botó «Endreça ara» o «@iaia endreça») és més barat i més privat; el continu és el que demana la visió.
  - Decisió: mode per defecte.
- [ ] **XAT-T18 · On es processa i amb quin model** · `F2` · `L` · `nou`
  - Proposta: al servidor, mai al navegador; els noms es substituïxen per pseudònims abans d'enviar el text a un model extern i es restauren en tornar (Llei 5); sense entrenament ni conservació per part del proveïdor.
  - Repo: el bot ja usa Gemini i un RAG propi (`bot/cervell.mjs`).
  - Decisió: model extern amb pseudonimització o model local.
- [ ] **XAT-T19 · Cost i límits** · `F2` · `S` · `nou`
  - Proposta: processar per lots (cada N missatges o cada pocs minuts), amb una quota diària per poble; si s'acaba, la carpeta s'atura i ho diu.
  - Atenció: a la Consola només arriben comptadors de consum, mai contingut.
- [ ] **XAT-T20 · Carpetes als grups de WhatsApp reals** · `F3` · `L` · `nou`
  - Proposta: la versió màxima de Zero Fricció: la gent no ix de WhatsApp i la IAIA endreça allí mateix, a través del pont (`XAT-R06`).
  - Atenció: el client no oficial pot fer perdre el número del bot, i el consentiment de tot el grup de WhatsApp és igual d'obligatori.
  - Decisió: si esta és la primera via (abans que el xat propi) per a provar el concepte al poble pilot.
- [ ] **XAT-T21 · Exportar i imprimir la carpeta** · `F2` · `S` · `nou`
  - Proposta: PDF o full de càlcul per al bar, l'associació o el tauler de l'Ajuntament.
- [ ] **XAT-T22 · Publicar una carpeta** · `F3` · `S` · `nou`
  - Proposta: una carpeta (per exemple, el programa de festes) es pot publicar al Mur amb una acció explícita; per defecte és privada de la conversa.

### 10. Pàgina d'Usuari i perfil

**Punt de partida.** La fitxa privada existix a `/el-meu-perfil` (`src/sections/profile/PerfilShell.jsx`) i s'edita amb l'Editor Universal: H1 = `full_name`, H2 = `bio`, entradilla = `lema`, cos = `presentacio_html`, més `avatar_url`, `hero_url` i `copyright` (`src/sections/profile/perfilCamps.js:17-26`). Hi ha exportació de dades, baixa amb 30 dies de gràcia i consentiment RGPD demostrable. El que no existix és la pàgina pública d'una persona real: `profiles` només deixa llegir el perfil propi, `is_public` no el fa servir cap política i la ruta `/gent/:id` pinta personatges de mostra (`src/sections/profile/ProfileSection.jsx`).

**Criteri.** Els referents són WhatsApp (per Zero Fricció), Signal i Mastodon (per privacitat i federació). La línia «Referents» diu d'on ve cada idea.

#### PER-A · Identitat i noms

- [ ] **PER-A01 · Identificador intern que no canvia mai** · `F0` · `S` · `existix`
  - Proposta: la identitat és l'UUID del compte, no el nom; canviar de nom no trenca res.
- [ ] **PER-A02 · Nom d'usuari públic (@nom)** · `F2` · `M` · `nou`
  - Referents: WhatsApp (reserva de noms d'usuari des de juny de 2026), Discord, Mastodon.
  - Proposta: identificador curt en minúscules i sense accents, separat del nom visible; servix per a enllaços, mencions i la futura federació (`PER-L01`). El poble no forma part del nom (si canvies de poble, no canvia).
- [ ] **PER-A03 · Nom visible lliure** · `F0` · `S` · `existix`
  - Repo: `full_name` d'1 a 120 caràcters.
  - Proposta: sense obligar a «nom i cognoms»: noms compostos, partícules i un sol mot són vàlids.
- [ ] **PER-A04 · Malnom o «com et coneixen»** · `F1` · `S` · `nou`
  - Proposta pròpia: «Ca la Tia Pepa», «el de la ferreteria». És com es distingix la gent al poble; visible per defecte només al propi poble.
- [ ] **PER-A05 · Homònims sense números** · `F1` · `S` · `nou`
  - Proposta: quan dos persones es diuen igual, es mostren amb el malnom i el poble, mai amb «Pepa Garcia (2)».
- [ ] **PER-A06 · Historial de canvis de nom** · `F2` · `S` · `nou`
  - Referents: Instagram («Sobre aquest compte»).
  - Proposta: «abans es deia…» visible als qui ja parlaven amb la persona; protegix contra la suplantació.
  - Dades: `perfil_historial_noms`.
- [ ] **PER-A07 · Pronoms** · `F3` · `S` · `nou`
  - Referents: Discord, Slack. Opcionals.
- [ ] **PER-A08 · Pronunciació del nom** · `FX` · `S` · `nou`
  - Referents: Slack (àudio breu).

#### PER-B · Imatges

- [ ] **PER-B01 · Foto de perfil** · `F0` · `S` · `existix`
  - Repo: `avatar_url` amb filtre d'origen segur; en esborrar-la també es lleva la foto de Google (`src/data/identitat.js`).
- [ ] **PER-B02 · Retallar la foto sense haver d'arrossegar** · `F1` · `M` · `nou`
  - Proposta: botons de zoom i de moure i tecles de fletxa, a més d'arrossegar (WCAG 2.5.7).
- [ ] **PER-B03 · Inicials quan no hi ha foto** · `F0` · `S` · `nou`
  - Proposta: el color ix de l'identificador (no del nom, perquè no canvie si et reanomenes) amb contrast de 4,5:1; les inicials respecten lletres com «À».
  - Atenció: la funció del navegador que separa lletres (`Intl.Segmenter`) arriba a Firefox 125, fora del baseline; cal una alternativa senzilla.
- [ ] **PER-B04 · Text alternatiu de la foto** · `F0` · `S` · `nou`
  - Proposta: buit quan la foto va al costat del nom (seria repetir-lo); «Foto de perfil de Pepa» quan va sola.
- [ ] **PER-B05 · Imatge de portada** · `F1` · `S` · `existix`
  - Repo: `hero_url`. Per al poble, una foto del paisatge o de la plaça.
- [ ] **PER-B06 · Fotos sense ubicació amagada** · `F0` · `S` · `nou`
  - Proposta: recodificar la foto en pujar-la per llevar-ne l'EXIF i el GPS.
- [ ] **PER-B07 · Denunciar una foto de perfil** · `F2` · `S` · `nou`
  - Depén de: `XAT-Q03`.

#### PER-C · Presentació

- [ ] **PER-C01 · Bio curta** · `F0` · `S` · `existix`
  - Repo: `bio`, el H2 de l'Editor Universal.
- [ ] **PER-C02 · Lema** · `F0` · `S` · `existix`
  - Repo: `lema`, l'entradilla, fins a 120 caràcters.
- [ ] **PER-C03 · Presentació llarga amb l'Editor Universal** · `F0` · `S` · `existix`
  - Repo: `presentacio_html`, fins a 20.000 caràcters i sense `<script`.
- [ ] **PER-C04 · Drets d'autor del contingut** · `F1` · `S` · `parcial`
  - Repo: selector de copyright amb consentiment CC0 (`CopyrightSelector.jsx`); la migració `260926_2232_copyright_editor.sql` no està aplicada i el consentiment CC0 només es guarda al navegador, sense registre al servidor.
- [ ] **PER-C05 · Fins a quatre camps lliures** · `F2` · `M` · `nou`
  - Referents: Mastodon (quatre parells etiqueta-valor).
  - Proposta: «Ofici: fuster», «Horari: matins».
  - Dades: `perfil_camps`.
- [ ] **PER-C06 · Enllaços verificats** · `F3` · `M` · `nou`
  - Referents: Mastodon i IndieWeb (`rel="me"`): si la web enllaçada torna l'enllaç, es marca com a verificat.
- [ ] **PER-C07 · Publicacions fixades al perfil** · `F3` · `S` · `nou`
  - Referents: Mastodon (fins a 5).
- [ ] **PER-C08 · Presentació en veu** · `F3` · `M` · `nou`
  - Proposta: per a qui escriu amb dificultat; sempre amb transcripció (WCAG 1.2.1).

#### PER-D · Arrels i territori

- [ ] **PER-D01 · «Sóc de…» (poble d'arrel)** · `F1` · `M` · `nou`
  - Proposta pròpia: el poble d'on és la persona, amb la seua audiència.
- [ ] **PER-D02 · «Visc a…» (poble de residència)** · `F1` · `M` · `parcial`
  - Repo: hi ha un sol `town_name` de text lliure (per defecte «La Torre de les Maçanes»), mentre que el poble real ve de `town_memberships`.
  - Proposta: separar arrel i residència, cadascuna amb la seua audiència.
- [ ] **PER-D03 · «Al poble:»** · `F2` · `S` · `nou`
  - Proposta pròpia: tot l'any, caps de setmana, estiu o festes; pensat per als fills del poble que viuen a la ciutat.
- [ ] **PER-D04 · Pertinença al poble confirmada** · `F1` · `M` · `parcial`
  - Proposta: distingir el poble declarat del poble confirmat (`town_memberships`), que és el que obri el directori i els grups del poble.
- [ ] **PER-D05 · Quinta** · `F3` · `S` · `nou`
  - Proposta pròpia: l'any de la quinta, opcional.

#### PER-E · Sabers i ajuda mútua

- [ ] **PER-E01 · «Et puc ajudar amb…»** · `F2` · `M` · `nou`
  - Referents: les habilitats de LinkedIn, sense recomanacions quantificades.
  - Proposta: llista curta (poda, empelt, matança, papers de la PAC, reparar el motocultor, portar gent a l'hospital, cures) més text lliure.
  - Dades: `perfil_sabers`.
- [ ] **PER-E02 · «Necessite ajuda amb…»** · `F2` · `S` · `nou`
  - Proposta: el recíproc; funciona com un banc del temps.
- [ ] **PER-E03 · Llengües que parle i que entenc** · `F2` · `S` · `nou`
  - Proposta: ajuda a acollir temporers i gent nouvinguda.
  - Dades: `perfil_llengues` (codis ISO 639).
- [ ] **PER-E04 · Disponibilitat de les cuidadores** · `F2` · `M` · `nou`
  - Proposta: dies, hores i tasques (cas d'ús de `sdp-casos-us-essencials`).
- [ ] **PER-E05 · Cultius i avisos del calendari agrícola** · `F3` · `M` · `nou`
  - Atenció: privat per defecte; revela patrimoni i quan no hi ha ningú a casa.
- [ ] **PER-E06 · Telèfon per a SMS i «Truca per telèfon»** · `F2` · `S` · `nou`
  - Proposta: opcional, amb consentiment explícit i audiència pròpia (`XAT-M02`).

#### PER-F · Estat i disponibilitat

- [ ] **PER-F01 · Estat que caduca** · `F2` · `S` · `nou`
  - Referents: «Info» de WhatsApp (novembre de 2025: emoji i frase que caduca en un dia) i l'estat de Slack.
  - Proposta: «Al camp fins a les 14 h», «De verema fins al 15».
  - Dades: `perfil_estat`.
- [ ] **PER-F02 · Sense «en línia» al perfil** · `F0` · `S` · `nou`
  - Proposta: el perfil no mostra mai si algú està connectat; la presència, si s'aprova, només viu dins de la conversa (`XAT-I04`).
- [ ] **PER-F03 · Hores en què no contesta** · `F3` · `S` · `nou`
  - Depén de: `XAT-J09`.

#### PER-G · Privacitat per camp

- [ ] **PER-G01 · Audiència per a cada camp** · `F1` · `L` · `nou`
  - Referents: WhatsApp i Telegram (una audiència per camp, amb excepcions).
  - Proposta: sis nivells: «Tothom, també el fedivers», «Sóc de Poble», «El meu poble», «Veïns», «Veïns excepte…» i «Només jo».
  - Dades: `perfil_privacitat`; funció `private.pot_veure_camp`; capacitat `perfilPrivacitat`.
- [ ] **PER-G02 · Per defecte, el més restrictiu raonable** · `F0` · `S` · `nou`
  - Motiu: art. 25 RGPD (protecció de dades per defecte) i Llei 5.
- [ ] **PER-G03 · «Veure com a…»** · `F2` · `M` · `nou`
  - Proposta: previsualitzar el perfil tal com el veu cada audiència.
- [ ] **PER-G04 · Relació de veïnatge** · `F2` · `M` · `nou`
  - Proposta: dos persones s'accepten com a «veïns» (com els contactes de WhatsApp); és la base de l'audiència «Veïns».
  - Dades: `perfil_relacions` (nom nou).
- [ ] **PER-G05 · Aparéixer al directori del poble** · `F0` · `S` · `existix`
  - Repo: `membres_del_poble` només mostra qui ha donat el consentiment i no està de baixa.
- [ ] **PER-G06 · Ajustos de contacte al perfil** · `F1` · `S` · `nou`
  - Proposta: «Qui em pot escriure» i «Qui em pot afegir a grups» es trien des del perfil.
  - Depén de: `XAT-L04`, `XAT-L05`.

#### PER-H · Confiança i verificació

- [ ] **PER-H01 · Verificació per una organització** · `F2` · `M` · `nou`
  - Referents: els verificadors de confiança de Bluesky (abril de 2025).
  - Proposta: l'Ajuntament o l'associació verifica els seus; la insígnia diu qui verifica.
  - Dades: `perfil_verificacions`.
- [ ] **PER-H02 · Aval veïnal** · `F3` · `M` · `nou`
  - Proposta pròpia: diverses persones ja verificades avalen una persona nova.
  - Dades: `perfil_avals`.
- [ ] **PER-H03 · La verificació cau si canvia el nom** · `F2` · `S` · `nou`
  - Referents: Bluesky. Contra la suplantació.
- [ ] **PER-H04 · «Sobre este compte»** · `F2` · `S` · `nou`
  - Proposta: data d'alta, poble confirmat, canvis de nom i verificacions.
- [ ] **PER-H05 · Identitat digital del padró** · `F3` · `XL` · `nou`
  - Situació: llavor «Verificació SSI, DIDs dels veïns del Padró» (beta) del full de ruta.

#### PER-I · Relacions i seguretat

- [ ] **PER-I01 · Escriure, bloquejar, silenciar i denunciar des del perfil** · `F1` · `S` · `nou`
  - Depén de: `XAT-L07`, `XAT-L08`.
- [ ] **PER-I02 · Grups i mitjans en comú** · `F2` · `S` · `nou`
  - Depén de: `XAT-K06`, `XAT-K08`.
- [ ] **PER-I03 · Codi QR i enllaç del perfil** · `F2` · `M` · `nou`
  - Referents: Signal (enllaç i QR que es poden revocar).
  - Proposta: imprimible per al cartell del forn o del bar; mai porta el telèfon.
- [ ] **PER-I04 · Els bloquejos són privats** · `F0` · `S` · `nou`
  - Motiu: a Bluesky són públics, i això posa en risc qui bloqueja.

#### PER-J · Organitzacions i identitats

- [ ] **PER-J01 · Perfil d'organització** · `F1` · `M` · `parcial`
  - Repo: `organizations` ja té `lema`, `presentacio_html`, `logo_url`, `hero_url` i `copyright`; la fitxa pública està pendent fins a I7 (`src/sections/profile/PerfilContext.jsx:67-69`).
- [ ] **PER-J02 · Diverses persones gestionen l'entitat** · `F1` · `M` · `parcial`
  - Repo: `organization_memberships` i `private.can_manage_organization`.
  - Proposta: rols delegats, sense compartir contrasenyes.
- [ ] **PER-J03 · Horari i ubicació de l'entitat** · `F2` · `S` · `nou`
  - Referents: perfils d'empresa de WhatsApp i Telegram.
- [ ] **PER-J04 · Canviar d'identitat** · `F0` · `S` · `existix`
  - Repo: `SelectorIdentitat.jsx` a la barra taronja.
  - Depén de: `XAT-A04` per a xatejar com a entitat.
- [ ] **PER-J05 · Afiliacions sensibles** · `F1` · `S` · `nou`
  - Proposta: sindicat agrari o confraria revelen dades de l'art. 9 RGPD; per defecte «Només jo» i avís en afegir-les.

#### PER-K · Compte, sessions i dades

- [ ] **PER-K01 · Correu i contrasenya** · `F0` · `S` · `existix`
  - Repo: `DetallCompte.jsx`; contrasenya de 10 caràcters com a mínim.
- [ ] **PER-K02 · Sessions i dispositius oberts** · `F1` · `M` · `parcial`
  - Repo: el servidor ja revoca la sessió local, totes o les altres (`src/data/supabase/auth.js`), però no hi ha cap llista a la vista.
  - Proposta: llista de sessions amb «Tanca-la» (mòbils compartits a casa).
- [ ] **PER-K03 · Tancar la sessió per inactivitat** · `F2` · `S` · `nou`
  - Referents: Telegram.
- [ ] **PER-K04 · Verificació en dos passos** · `F2` · `M` · `nou`
  - Depén de: `XAT-L13`.
- [ ] **PER-K05 · Descarregar les meues dades** · `F0` · `S` · `existix`
  - Repo: JSON des de «Privacitat i dades» (`DetallPrivacitat.jsx`).
  - Proposta futura: també en format ActivityStreams per a poder-se'n anar a un altre servidor (`PER-L06`).
- [ ] **PER-K06 · Donar-se de baixa** · `F0` · `S` · `existix`
  - Repo: 30 dies de gràcia i anonimització immediata.
  - Depén de: `XAT-O07` (no esborrar la meitat de les converses dels altres).
- [ ] **PER-K07 · Desactivar temporalment** · `F2` · `M` · `nou`
  - Referents: Facebook i Instagram. Amaga el perfil sense perdre res.
- [ ] **PER-K08 · Contacte de llegat i compte commemoratiu** · `F3` · `M` · `nou`
  - Motiu: dret al testament digital (LOPDGDD, art. 96); llavor «Ghost Memorial Crypt» del full de ruta.
- [ ] **PER-K09 · Consentiments demostrables** · `F0` · `S` · `existix`
  - Repo: registre de només afegir amb empremtes (capacitat `consentiment`).

#### PER-L · Fedivers

Tot este bloc depén d'una decisió prèvia: ara mateix cap ADR autoritza escriure a servidors aliens (Model B).

- [ ] **PER-L01 · Identitat federada (@nom@node)** · `F3` · `L` · `nou`
  - Referents: Mastodon (WebFinger i Actor d'ActivityPub).
- [ ] **PER-L02 · Només es federen els camps «Tothom»** · `F3` · `S` · `nou`
  - Motiu: l'Actor d'ActivityPub és públic i no admet audiències per camp; la resta de camps no ha d'eixir mai del node.
- [ ] **PER-L03 · Mode «només poble» per defecte** · `F3` · `S` · `nou`
  - Proposta: sense activar-ho, el perfil no respon a cap servidor extern.
- [ ] **PER-L04 · Fora dels cercadors i dels suggeriments per defecte** · `F3` · `S` · `nou`
  - Referents: `discoverable` i `indexable` de Mastodon; són peticions que els altres servidors poden no respectar.
- [ ] **PER-L05 · Aprovar a mà qui em seguix des de fora** · `F3` · `S` · `nou`
- [ ] **PER-L06 · Emportar-se el compte a un altre servidor** · `F3` · `M` · `nou`
  - Referents: migració de Mastodon; els seguidors es redirigixen i les publicacions no.
- [ ] **PER-L07 · Avís honest sobre l'esborrat federat** · `F3` · `S` · `nou`
  - Proposta: «El que has publicat al fedivers pot quedar copiat en altres servidors».

#### PER-M · Preferències i accessibilitat

- [ ] **PER-M01 · Tema clar o fosc** · `F0` · `S` · `existix`
- [ ] **PER-M02 · Idioma de la interfície** · `F0` · `S` · `existix`
  - Repo: cinc llengües a `src/config/i18n.js`.
- [ ] **PER-M03 · Mida de lletra** · `F2` · `S` · `nou`
  - Depén de: `XAT-P05`.
- [ ] **PER-M04 · Preferències de notificació** · `F2` · `M` · `nou`
  - Depén de: `XAT-J`.
- [ ] **PER-M05 · Formularis que s'omplin sols** · `F1` · `S` · `nou`
  - Proposta: `autocomplete` als camps del perfil (WCAG 1.3.5).
- [ ] **PER-M06 · Alta amb dos dades i la resta quan calga** · `F1` · `S` · `nou`
  - Proposta: en registrar-se, només el nom i el poble; la resta s'oferix quan aporta alguna cosa, sense insistir.

#### PER-N · Pàgina pública

- [ ] **PER-N01 · Pàgina pública d'una persona real** · `F1` · `L` · `nou`
  - Proposta: una `UniversalPage` (H1 nom, H2 bio, entradilla lema, cos presentació) alimentada per una vista o una RPC que només torna els camps que l'audiència de qui mira pot veure.
  - Dades: capacitat `perfilPublic`; es construïx com la vista `organization_directory`, que ja existix.
- [ ] **PER-N02 · «Connectar» i «Comentar» porten al xat** · `F1` · `S` · `nou`
  - Depén de: `XAT-S01`, `XAT-A05`.
- [ ] **PER-N03 · Fora dels cercadors per defecte** · `F1` · `S` · `nou`
  - Proposta: `noindex` fins que la persona diga el contrari.
- [ ] **PER-N04 · Pàgina pública d'una organització** · `F1` · `M` · `nou`
  - Depén de: `PER-J01`.
- [ ] **PER-N05 · Targeta del perfil al Cercador** · `F2` · `S` · `nou`
  - Referent intern: l'arquitectura del perfil universal (`_wiki_de_poble/02_saber/architecture/260913_0635_arquitectura_perfil_universal.md`).
- [ ] **PER-N06 · Adreça estable i llegible** · `F2` · `S` · `nou`
  - Proposta: `/gent/@nom` quan hi haja nom d'usuari (`PER-A02`).

#### PER-O · Patrons foscos que no es faran

Estan escrits perquè ningú no els proposa sense saber-ho. Les directrius 03/2022 de l'EDPB descriuen estos patrons en xarxes socials.

- [ ] **PER-O01 · Barra de «completa el teu perfil»** · `FX` · `S` · `nou`
- [ ] **PER-O02 · Comptadors públics de seguidors** · `FX` · `S` · `nou`
- [ ] **PER-O03 · «Qui ha vist el teu perfil»** · `FX` · `S` · `nou`
- [ ] **PER-O04 · Ratxes i avisos per a tornar a entrar** · `FX` · `S` · `nou`
- [ ] **PER-O05 · Pujar l'agenda del telèfon per a suggerir contactes** · `FX` · `S` · `nou`
- [ ] **PER-O06 · Laberints per a donar-se de baixa** · `FX` · `S` · `nou`
  - Nota: la baixa actual és directa; cal conservar-la així.

### 11. Arquitectura, contracte i model de dades

Este capítol és el mapa tècnic que sosté el menú. Cada decisió tècnica també porta casella: l'equip pot aprovar el menú i discutir una peça d'arquitectura per separat. L'SQL i el JS són esbossos per a decidir, no migracions llestes: cap s'aplica sense ordre (frontera de confiança, §2).

#### ARQ-A · Principis

- [ ] **ARQ-A01 · El servidor és la font de veritat** · `F0` · `S` · `existix`
  - Motiu: ADR-2026-08. El navegador mostra i envia; l'ordre, els permisos i la història els decidix el servidor.
- [ ] **ARQ-A02 · Identificador del missatge generat al navegador** · `F0` · `S` · `nou`
  - Proposta: UUIDv7 (RFC 9562: porta el temps i és ordenable) creat abans d'enviar. És la clau d'idempotència: si el missatge arriba dos vegades, el servidor el guarda una. També permet pujar els adjunts a la seua ruta abans que el missatge existisca.
  - Atenció: generat amb una funció pròpia sobre `crypto.getRandomValues`, sense dependència nova. Complix la llei L3 de `tractor-persistencia.mjs` (identificadors UUID, mai `Date.now()`).
- [ ] **ARQ-A03 · Número d'ordre per conversa (`seq`) i marques d'aigua** · `F0` · `M` · `nou`
  - Proposta: el servidor numera els missatges de cada conversa (1, 2, 3…) dins de la mateixa transacció que els guarda. Cada participant té tres marques: fins on ha rebut, fins on ha llegit i des d'on veu. No llegits = `ultim_seq − llegit_fins_seq`.
  - Motiu: ordenar per hora falla quan dos transaccions confirmen en ordre diferent; una marca per persona és una sola fila, mentre que una confirmació per missatge i persona fa créixer la taula sense límit (un grup de 500 amb 1.000 missatges al dia serien 500.000 files diàries).
  - Decisió: substituir `xat_lectures` (marca per hora) per `llegit_fins_seq`, amb un període de convivència.
- [ ] **ARQ-A04 · Làpides en lloc d'esborrats físics** · `F0` · `S` · `nou`
  - Proposta: un missatge esborrat perd el text i els adjunts però conserva el `seq`, perquè les cites, la paginació i les marques continuen funcionant.
- [ ] **ARQ-A05 · Totes les escriptures passen per RPC** · `F0` · `M` · `parcial`
  - Repo: avui el navegador pot inserir directament a `xat_missatges` (`supabase/migrations/260908_xat_v2.sql:93`).
  - Proposta: retirar eixe permís i enviar sempre per `xat_envia` (`ARQ-E01`), on es comproven pertinença, permisos del grup, bloquejos i límit de freqüència.
- [ ] **ARQ-A06 · El temps real només avisa; les dades es demanen** · `F0` · `S` · `nou`
  - Proposta: un avís pel canal vol dir «hi ha missatges nous a partir del `seq` X»; el navegador els demana al servidor. Així un avís fals d'un altre client no pot injectar cap missatge.

#### ARQ-B · Contracte i capacitats

- [ ] **ARQ-B01 · Traure el xat del nucli del contracte** · `F0` · `M` · `nou`
  - Situació: els 8 mètodes del xat són obligatoris al nucli (`src/data/contracte.js:27-34`); un backend de WordPress o un node local que no tinga xat no és vàlid.
  - Proposta, en este ordre: (1) ordre del Mestre, perquè el fitxer està marcat `SDP-LOCK`; (2) moure els 8 mètodes sense canviar-los a `CAPACITATS.xat` (un backend que ja els té continua sent vàlid, i un que no en té cap també); (3) decidir què es fa amb `appendChatMessages` (`contracte.js:7`), que crida `enviaMissatge`; (4) protegir `XatProvider` i `ConnectarSection` amb `teCapacitat('xat')` i amagar la secció si és fals; (5) mantindre els `export` al port perquè `tractor-enxufe.mjs` (regla E2) continue verd.
  - Decisió: autoritzar el moviment.
- [ ] **ARQ-B02 · Capacitats noves, cadascuna completa o absent** · `F1` · `M` · `nou`
  - Proposta: `xatHistorial`, `xatTempsReal`, `xatGrups`, `xatMitjans`, `xatInteraccio`, `xatEnquestes`, `xatPresencia`, `xatAvisos`, `xatModeracio`, `xatCerca`, `xatCarpetes`, `xatXifrat`, `xatFedivers`, `perfilPublic`, `perfilPrivacitat` i `perfilFedivers`. La interfície pregunta `teCapacitat()` abans de mostrar cada botó.
- [ ] **ARQ-B03 · Contracte neutre, sense objectes de Supabase** · `F1` · `S` · `parcial`
  - Repo: `subscribeToXat` retorna el canal de Supabase i s'ha de tornar a `unsubscribeFromXat` (`src/data/supabase/xat.js:43-55`); les signatures no són homogènies (`carregaMembres(text, config)` contra `loadFils(config)`).
  - Proposta: la subscripció retorna una funció per a donar-se de baixa, i els paràmetres van en un objecte. Els noms antics conviuen una fase i després es retiren.

Esbós de les signatures (tipus neutres, sense res de Supabase):

```js
// CAPACITATS.xat — els 8 mètodes actuals, amb paràmetres homogenis en la fase F1
loadFils({ cursor, limit }, config)                       // → { converses: Conversa[], cursor }
loadMissatges(filId, { abansDeSeq, limit }, config)       // → { missatges: Missatge[], hiHaMes }
enviaMissatge({ id, filId, tipus, text, respostaA, adjunts, metadades }, config) // → Missatge (idempotent per id)
marcaLlegit(filId, { llegitFinsSeq, rebutFinsSeq }, config)
creaFilDirecte(altreUsuariId, config)                     // → Conversa
carregaMembres({ cerca, limit }, config)                  // → Persona[]

// CAPACITATS.xatTempsReal
escoltaXat({ filId }, onAvis)          // → () => void. filId null = safata personal
// onAvis({ tipus: 'nous' | 'marca' | 'escrivint' | 'canvi', filId, seq })

// Tipus
// Conversa { id, tipus, titol, imatge, ultimSeq, llegitFinsSeq, noLlegits,
//            silenciatFins, arxivat, fixat, preferit, ultimMissatge }
// Missatge { id, filId, seq, autor: { id, nom, avatar, comOrg }, tipus, text,
//            respostaA, cadenaArrel, adjunts, reaccions, editatAl, esborrat,
//            caducaAl, creatAl, estat: 'pendent'|'enviat'|'rebut'|'llegit'|'error' }
```

#### ARQ-C · Esquema de dades (migracions additives sobre el Xat v2)

- [ ] **ARQ-C01 · Converses** · `F0` · `S` · `nou`

```sql
alter table public.xat_fils
  add column if not exists tipus text not null default 'directe'
    check (tipus in ('directe','grup','comunitat','canal','personal','iaia')),
  add column if not exists ultim_seq bigint not null default 0,
  add column if not exists descripcio text check (char_length(descripcio) <= 2048),
  add column if not exists imatge_url text,
  add column if not exists permisos jsonb not null default '{}'::jsonb,
  add column if not exists temporal_segons integer
    check (temporal_segons in (86400, 604800, 7776000)),       -- 24 h, 7 d, 90 d
  add column if not exists comunitat_id uuid references public.xat_fils(id) on delete set null,
  add column if not exists org_id uuid references public.organizations(id) on delete set null;
alter table public.xat_fils
  add constraint xat_fils_titol_llarg check (char_length(titol) <= 100) not valid;
```

- [ ] **ARQ-C02 · Participants** · `F0` · `S` · `nou`
  - Nota: `creat_al` ja fa de data d'entrada. Els camps personals només els canvia la mateixa persona i el rol només l'administració, sempre per RPC.

```sql
alter table public.xat_participants
  add column if not exists rol text not null default 'membre'
    check (rol in ('propietari','admin','membre')),
  add column if not exists eixit_al timestamptz,
  add column if not exists visible_des_de_seq bigint not null default 0, -- historial per a qui entra
  add column if not exists visible_fins_seq bigint,                     -- null = membre actiu
  add column if not exists llegit_fins_seq bigint not null default 0,
  add column if not exists rebut_fins_seq bigint not null default 0,
  add column if not exists buidat_fins_seq bigint not null default 0,
  add column if not exists silenciat_fins_al timestamptz,
  add column if not exists arxivat_al timestamptz,
  add column if not exists fixat_al timestamptz,
  add column if not exists preferit_al timestamptz,
  add column if not exists no_llegit_manual boolean not null default false,
  add column if not exists avisos text not null default 'tots'
    check (avisos in ('tots','destacats','cap')),
  add column if not exists etiqueta text check (char_length(etiqueta) <= 30),
  add column if not exists com_org_id uuid references public.organizations(id) on delete set null;
create index if not exists xat_participants_usuari_idx
  on public.xat_participants (usuari_id, fil_id);
```

- [ ] **ARQ-C03 · Missatges** · `F0` · `M` · `nou`
  - Nota: els missatges existents reben el `seq` amb un `row_number()` per conversa ordenat per `creat_al, id`; després `seq` passa a `not null`. `text` deixa de ser obligatori (làpides i missatges només amb adjunt).

```sql
alter table public.xat_missatges
  alter column text drop not null,
  add column if not exists seq bigint,
  add column if not exists tipus text not null default 'text'
    check (tipus in ('text','imatge','video','veu','nota_video','document','ubicacio',
                     'contacte','enquesta','esdeveniment','adhesiu','sistema')),
  add column if not exists resposta_a uuid references public.xat_missatges(id) on delete set null,
  add column if not exists cadena_arrel uuid references public.xat_missatges(id) on delete set null,
  add column if not exists reenviat boolean not null default false,
  add column if not exists reenviaments smallint not null default 0,
  add column if not exists editat_al timestamptz,
  add column if not exists esborrat_al timestamptz,
  add column if not exists esborrat_per uuid references auth.users(id) on delete set null,
  add column if not exists caduca_al timestamptz,
  add column if not exists metadades jsonb not null default '{}'::jsonb,
  add column if not exists versio_xifrat smallint not null default 0;
alter table public.xat_missatges
  add constraint xat_missatges_text_llarg check (char_length(text) <= 4096) not valid;
create unique index if not exists xat_missatges_seq_uq on public.xat_missatges (fil_id, seq);
create index if not exists xat_missatges_caduca_idx on public.xat_missatges (caduca_al)
  where caduca_al is not null and esborrat_al is null;

-- El número d'ordre s'assigna en la mateixa transacció (el bloqueig de la fila de
-- la conversa serialitza els enviaments d'eixa conversa, i només d'eixa).
create or replace function private.xat_assigna_seq() returns trigger
language plpgsql security definer set search_path = '' as $$
declare v_temporal integer;
begin
  update public.xat_fils
     set ultim_seq = ultim_seq + 1, actualitzat_al = now()
   where id = new.fil_id
  returning ultim_seq, temporal_segons into new.seq, v_temporal;
  new.creat_al := now();
  if v_temporal is not null then
    new.caduca_al := now() + make_interval(secs => v_temporal);
  end if;
  return new;
end $$;
drop trigger if exists on_nou_missatge on public.xat_missatges;   -- ja no cal
create trigger xat_missatges_seq before insert on public.xat_missatges
  for each row execute function private.xat_assigna_seq();
```

- [ ] **ARQ-C04 · Interacció: reaccions, mencions, fixats, destacats, amagats i reproduccions** · `F1` · `S` · `nou`

```sql
create table if not exists public.xat_reaccions (
  missatge_id uuid not null references public.xat_missatges(id) on delete cascade,
  usuari_id   uuid not null references auth.users(id) on delete cascade,
  emoji       text not null check (char_length(emoji) between 1 and 16),
  creat_al    timestamptz not null default now(),
  primary key (missatge_id, usuari_id));                  -- una reacció per persona
create table if not exists public.xat_mencions (
  missatge_id uuid not null references public.xat_missatges(id) on delete cascade,
  usuari_id   uuid not null references auth.users(id) on delete cascade,
  primary key (missatge_id, usuari_id));
create table if not exists public.xat_fixats (
  fil_id uuid not null references public.xat_fils(id) on delete cascade,
  missatge_id uuid not null references public.xat_missatges(id) on delete cascade,
  fixat_per uuid references auth.users(id) on delete set null,
  fins_al timestamptz not null,
  primary key (fil_id, missatge_id));                     -- màxim 4 per conversa, comprovat a l'RPC
create table if not exists public.xat_destacats (
  usuari_id uuid not null references auth.users(id) on delete cascade,
  missatge_id uuid not null references public.xat_missatges(id) on delete cascade,
  creat_al timestamptz not null default now(),
  primary key (usuari_id, missatge_id));
create table if not exists public.xat_amagats (            -- «esborrar per a mi»
  usuari_id uuid not null references auth.users(id) on delete cascade,
  missatge_id uuid not null references public.xat_missatges(id) on delete cascade,
  primary key (usuari_id, missatge_id));
create table if not exists public.xat_reproduccions (
  missatge_id uuid not null references public.xat_missatges(id) on delete cascade,
  usuari_id uuid not null references auth.users(id) on delete cascade,
  al timestamptz not null default now(),
  primary key (missatge_id, usuari_id));
-- xat_edicions (missatge_id, versio, text_anterior, editat_al) només si s'aprova conservar versions (XAT-B07).
```

- [ ] **ARQ-C05 · Adjunts** · `F1` · `S` · `nou`
  - Nota: `fil_id` es repetix a l'adjunt perquè la RLS no haja de fer joins.

```sql
create table if not exists public.xat_adjunts (
  id uuid primary key default gen_random_uuid(),
  missatge_id uuid not null references public.xat_missatges(id) on delete cascade,
  fil_id uuid not null references public.xat_fils(id) on delete cascade,
  ordre smallint not null default 0,
  ruta text not null,        -- <tenant_id>/<fil_id>/<missatge_id>/<uuid>.<ext> al bucket xat_adjunts
  mime text not null,
  mida_bytes bigint not null check (mida_bytes > 0),
  amplada int, alcada int, durada_ms int,
  thumbhash text,
  forma_ona smallint[] check (cardinality(forma_ona) <= 128),
  nom_original text check (char_length(nom_original) <= 255),
  peu text check (char_length(peu) <= 1024),
  creat_al timestamptz not null default now());
create index if not exists xat_adjunts_fil_idx on public.xat_adjunts (fil_id, creat_al desc);
```

- [ ] **ARQ-C06 · Enquestes i esdeveniments** · `F2` · `S` · `nou`

```sql
create table if not exists public.xat_enquestes (
  missatge_id uuid primary key references public.xat_missatges(id) on delete cascade,
  pregunta text not null check (char_length(pregunta) <= 255),
  opcions jsonb not null check (jsonb_array_length(opcions) between 2 and 12),
  multiple boolean not null default true,
  votants_ocults boolean not null default false,
  tanca_al timestamptz);
create table if not exists public.xat_vots (
  missatge_id uuid not null references public.xat_enquestes(missatge_id) on delete cascade,
  usuari_id uuid not null references auth.users(id) on delete cascade,
  opcio smallint not null check (opcio between 0 and 11),
  primary key (missatge_id, usuari_id, opcio));
create table if not exists public.xat_esdeveniments (
  missatge_id uuid primary key references public.xat_missatges(id) on delete cascade,
  titol text not null check (char_length(titol) <= 100),
  descripcio text check (char_length(descripcio) <= 2048),
  comenca_al timestamptz not null, acaba_al timestamptz, lloc text,
  cancelat_al timestamptz);
create table if not exists public.xat_assistencies (
  missatge_id uuid not null references public.xat_esdeveniments(missatge_id) on delete cascade,
  usuari_id uuid not null references auth.users(id) on delete cascade,
  resposta text not null check (resposta in ('vaig','potser','no')),
  acompanyants smallint not null default 0 check (acompanyants between 0 and 1),
  primary key (missatge_id, usuari_id));
```

- [ ] **ARQ-C07 · Grups: invitacions i sol·licituds** · `F1` · `S` · `nou`

```sql
create table if not exists public.xat_invitacions (
  id uuid primary key default gen_random_uuid(),
  fil_id uuid not null references public.xat_fils(id) on delete cascade,
  codi text not null unique check (char_length(codi) >= 22),   -- aleatori, no endevinable
  creat_per uuid references auth.users(id) on delete set null,
  caduca_al timestamptz, usos_max integer, usos integer not null default 0,
  revocada_al timestamptz,
  creat_al timestamptz not null default now());
create table if not exists public.xat_sollicituds (
  fil_id uuid not null references public.xat_fils(id) on delete cascade,
  usuari_id uuid not null references auth.users(id) on delete cascade,
  estat text not null default 'pendent' check (estat in ('pendent','acceptada','rebutjada')),
  resolt_per uuid references auth.users(id) on delete set null,
  creat_al timestamptz not null default now(),
  primary key (fil_id, usuari_id));
```

- [ ] **ARQ-C08 · Seguretat i moderació** · `F1` · `S` · `nou`

```sql
create table if not exists public.xat_bloquejos (
  usuari_id uuid not null references auth.users(id) on delete cascade,
  bloquejat_id uuid not null references auth.users(id) on delete cascade,
  creat_al timestamptz not null default now(),
  primary key (usuari_id, bloquejat_id),
  check (usuari_id <> bloquejat_id));
create table if not exists public.xat_denuncies (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.towns(id) on delete cascade,
  denunciant_id uuid references auth.users(id) on delete set null,
  denunciat_id uuid references auth.users(id) on delete set null,
  fil_id uuid references public.xat_fils(id) on delete set null,
  missatges uuid[] not null check (cardinality(missatges) between 0 and 5),
  motiu text not null check (motiu in ('estafa','assetjament','odi','violencia','menors','spam','altres')),
  comentari text check (char_length(comentari) <= 1000),
  estat text not null default 'rebuda' check (estat in ('rebuda','en_revisio','resolta','desestimada')),
  resolucio text, resolt_per uuid references auth.users(id) on delete set null,
  creat_al timestamptz not null default now(), resolt_al timestamptz);
```

- [ ] **ARQ-C09 · Organització personal, avisos i carpetes** · `F2` · `S` · `nou`

```sql
create table if not exists public.xat_llistes (
  id uuid primary key default gen_random_uuid(),
  usuari_id uuid not null references auth.users(id) on delete cascade,
  nom text not null check (char_length(nom) <= 40), ordre smallint not null default 0);
create table if not exists public.xat_llistes_fils (
  llista_id uuid not null references public.xat_llistes(id) on delete cascade,
  fil_id uuid not null references public.xat_fils(id) on delete cascade,
  primary key (llista_id, fil_id));
create table if not exists public.xat_subscripcions_avis (       -- només si s'aprova XAT-J05/J06
  id uuid primary key default gen_random_uuid(),
  usuari_id uuid not null references auth.users(id) on delete cascade,
  plataforma text not null check (plataforma in ('web','apns','fcm')),
  endpoint text not null unique, claus jsonb,
  creat_al timestamptz not null default now(), ultim_us_al timestamptz);
create table if not exists public.xat_carpetes (                 -- capítol 9
  id uuid primary key default gen_random_uuid(),
  fil_id uuid not null references public.xat_fils(id) on delete cascade,
  plantilla text not null,
  nota_id uuid references public.notes(id) on delete set null,
  mode text not null default 'demanda' check (mode in ('continu','demanda')),
  estat text not null default 'activa' check (estat in ('activa','pausada','aturada')),
  activada_per uuid references auth.users(id) on delete set null,
  activada_al timestamptz not null default now(),
  ultim_seq_processat bigint not null default 0);
create table if not exists public.xat_carpeta_fonts (
  carpeta_id uuid not null references public.xat_carpetes(id) on delete cascade,
  element text not null,
  missatge_id uuid not null references public.xat_missatges(id) on delete cascade,
  primary key (carpeta_id, element, missatge_id));
create table if not exists public.xat_carpeta_exclusions (
  carpeta_id uuid not null references public.xat_carpetes(id) on delete cascade,
  usuari_id uuid not null references auth.users(id) on delete cascade,
  primary key (carpeta_id, usuari_id));
-- xat_estats i xat_estats_vistes, només si s'aprova XAT-N01.
```

- [ ] **ARQ-C10 · Perfil** · `F1` · `M` · `nou`
  - Nota: els camps nous de `profiles` (`nom_usuari` únic en minúscules, `malnom`, `poble_arrel_id` i `poble_residencia_id` cap a `towns`, `al_poble`, `quinta`, `envia_confirmacions`, `qui_escriu`, `qui_afig`) són noms nous.

```sql
create table if not exists public.perfil_privacitat (
  usuari_id uuid not null references auth.users(id) on delete cascade,
  camp text not null,
  audiencia text not null default 'jo'
    check (audiencia in ('fedivers','sdp','poble','veins','veins_excepte','jo')),
  excepcions uuid[] not null default '{}',
  primary key (usuari_id, camp));
create table if not exists public.perfil_camps (
  usuari_id uuid not null references auth.users(id) on delete cascade,
  ordre smallint not null check (ordre between 1 and 4),
  etiqueta text not null check (char_length(etiqueta) <= 40),
  valor text not null check (char_length(valor) <= 255),
  verificat_al timestamptz,
  primary key (usuari_id, ordre));
-- Mateixa forma: perfil_sabers (usuari, saber, ofereix|necessita, detall),
-- perfil_llengues (usuari, codi ISO 639, parle|entenc), perfil_estat (usuari, emoji, text ≤80, caduca_al),
-- perfil_historial_noms, perfil_verificacions (usuari, org_id, verificat_per, revocat_al),
-- perfil_avals (usuari, avalador) i perfil_relacions (usuari_a, usuari_b, estat) — nom nou.
```

#### ARQ-D · Seguretat a la base de dades (RLS)

- [ ] **ARQ-D01 · Qui veu quins missatges** · `F0` · `M` · `nou`
  - Proposta: una funció nova diu si un `seq` és visible per a mi: soc o he sigut membre, és posterior a quan vaig entrar i al que vaig buidar, i anterior a quan vaig eixir. `private.es_participant` es conserva per a les RPC existents, però ha de passar a exigir `visible_fins_seq is null` (membre actiu): si no, qui ix d'un grup continuaria llegint-lo sencer pels canals, els fitxers i les RPC antigues.

```sql
create or replace function private.seq_visible(p_fil_id uuid, p_seq bigint)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.xat_participants p
     where p.fil_id = p_fil_id and p.usuari_id = (select auth.uid())
       and p_seq > greatest(p.visible_des_de_seq, p.buidat_fins_seq)
       and (p.visible_fins_seq is null or p_seq <= p.visible_fins_seq));
$$;
create or replace function private.es_admin_del_fil(p_fil_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.xat_participants p
     where p.fil_id = p_fil_id and p.usuari_id = (select auth.uid())
       and p.visible_fins_seq is null and p.rol in ('propietari','admin'));
$$;
drop policy if exists "xat_missatges_lectura" on public.xat_missatges;
create policy "xat_missatges_lectura" on public.xat_missatges for select to authenticated
  using (private.seq_visible(fil_id, seq) and (caduca_al is null or caduca_al > now()));
revoke insert on table public.xat_missatges from authenticated;  -- s'envia per xat_envia
```

- [ ] **ARQ-D02 · Temps real només per a membres** · `F1` · `S` · `nou`
  - Proposta: els canals privats es validen amb polítiques sobre `realtime.messages`; el nom del canal es comprova amb una expressió regular abans de convertir-lo a UUID.

```sql
create policy "xat_rebre" on realtime.messages for select to authenticated using (
  realtime.messages.extension in ('broadcast','presence') and (
    (realtime.topic() ~ '^xat:f:[0-9a-f-]{36}$'
       and private.es_participant(split_part(realtime.topic(), ':', 3)::uuid))
    or realtime.topic() = 'xat:u:' || (select auth.uid())::text));
create policy "xat_escrivint" on realtime.messages for insert to authenticated with check (
  realtime.messages.extension in ('broadcast','presence')
  and realtime.topic() ~ '^xat:f:[0-9a-f-]{36}$'
  and private.es_participant(split_part(realtime.topic(), ':', 3)::uuid));
```

- [ ] **ARQ-D03 · Fitxers només per a membres** · `F1` · `S` · `nou`

```sql
create policy "xat_adjunts_llegir" on storage.objects for select to authenticated using (
  bucket_id = 'xat_adjunts'
  and private.es_participant(((storage.foldername(name))[2])::uuid));
create policy "xat_adjunts_pujar" on storage.objects for insert to authenticated with check (
  bucket_id = 'xat_adjunts'
  and private.es_participant(((storage.foldername(name))[2])::uuid));
-- Els antics membres i els historials parcials reben URL signades des d'una RPC que comprova seq_visible.
```

- [ ] **ARQ-D04 · Moderació limitada al que s'ha denunciat** · `F1` · `S` · `nou`
  - Proposta: una funció `private.missatge_denunciat(id)` deixa llegir a la moderació del node només els missatges d'una denúncia oberta i els dos del voltant.
- [ ] **ARQ-D05 · Revisió amb la porta de RLS** · `F0` · `S` · `existix`
  - Repo: `npm run porta:rls` (`tooling/gates/tractor-rls.mjs`) revisa les regles R1-R8; totes les migracions noves hi han de passar.

#### ARQ-E · Funcions del servidor (RPC)

- [ ] **ARQ-E01 · Enviar, idempotent** · `F0` · `M` · `nou`
  - `xat_envia(p_id, p_fil, p_tipus, p_text, p_resposta_a, p_adjunts, p_metadades)` → `{id, seq, creat_al}`. Fa `insert … on conflict (id) do nothing`; si ja existia i és meu, el torna; si és d'una altra persona, error. Comprova pertinença activa, mode anuncis, bloquejos en converses directes, longitud i que els adjunts ja són a la seua ruta.
- [ ] **ARQ-E02 · Historial per cursor** · `F0` · `S` · `nou`
  - `xat_historial(p_fil, p_abans_de_seq, p_limit)` → missatges amb `seq < cursor`, de 50 en 50 (màxim 100), sense els amagats per a mi. Substituïx `xat_missatges_del_fil`.
- [ ] **ARQ-E03 · Missatges al voltant d'un altre** · `F1` · `S` · `nou`
  - `xat_missatges_al_voltant(p_fil, p_seq, p_marge)`, per a saltar a una cita o a un resultat de cerca.
- [ ] **ARQ-E04 · Recuperar el que ha arribat mentre no hi era** · `F0` · `S` · `nou`
  - `xat_nous(p_fil, p_despres_de_seq)`, que es crida en tornar la connexió o en rebre un avís.
- [ ] **ARQ-E05 · Marcar rebut i llegit** · `F0` · `S` · `parcial`
  - `xat_marca(p_fil, p_rebut_fins, p_llegit_fins)` amb `greatest()`: una marca mai retrocedix. Substituïx `xat_marca_llegit`.
- [ ] **ARQ-E06 · Llista de converses** · `F0` · `S` · `parcial`
  - `xat_fils_meus` ampliat amb cursor `(actualitzat_al, id)`, tipus, foto, `ultim_seq`, marques i ajustos personals.
- [ ] **ARQ-E07 · Grups** · `F1` · `M` · `nou`
  - `xat_crea_grup`, `xat_gestiona_membre(p_fil, p_usuari, p_accio)`, `xat_ix`, `xat_invitacio_crea`, `xat_invitacio_usa`, `xat_invitacio_revoca`, `xat_sollicitud_resol`.
- [ ] **ARQ-E08 · Ajustos personals** · `F1` · `S` · `nou`
  - `xat_ajust_personal(p_fil, p_camp, p_valor)` per a arxivar, fixar, silenciar, preferit, no llegit, avisos i buidar.
- [ ] **ARQ-E09 · Interacció** · `F1` · `M` · `nou`
  - `xat_reacciona`, `xat_edita` (finestra de 15 min), `xat_esborra(p_missatge, p_abast)` (per a mi o, durant 2 dies, per a tothom), `xat_fixa`, `xat_destaca`, `xat_vota`, `xat_respon_esdeveniment`.
- [ ] **ARQ-E10 · Seguretat** · `F1` · `S` · `nou`
  - `xat_bloqueja`, `xat_desbloqueja`, `xat_denuncia`, `xat_resol_denuncia` (només moderació).
- [ ] **ARQ-E11 · Codis d'error** · `F0` · `S` · `nou`
  - Proposta: `SDP-XAT-NNN` en la línia dels codis `SDP-<ÀMBIT>-NNN` que ja usa el projecte (quins números ja usa el xat, per confirmar): no participant, límit de freqüència, finestra d'edició tancada, permís de grup, bloquejat, massa llarg, identificador d'una altra persona, límit de membres, invitació no vàlida. Cada codi té un text en valencià a i18n.

#### ARQ-F · Temps real

- [ ] **ARQ-F01 · Avisos des de la base de dades per canals privats** · `F0` · `L` · `nou`
  - Proposta: un disparador envia l'avís «nous a partir del `seq` X» al canal de la conversa (`xat:f:<fil_id>`) amb l'emissió des de la base de dades de Supabase Realtime, que llig el canvi una vegada i no avalua la RLS per cada subscriptor.
  - Motiu: el mètode actual (canvis de Postgres, `src/data/supabase/xat.js:33-41`) comprova la RLS per a cada subscriptor i cada canvi, i Supabase el desaconsella per a xats a escala.
- [ ] **ARQ-F02 · Canal personal i límit de canals** · `F1` · `M` · `nou`
  - Proposta: el canal personal `xat:u:<uid>` avisa de canvis a qualsevol conversa (converses directes i grups petits); per als grups grans, la llista es refresca per sondeig. El client només obri el canal de la conversa que té davant.
  - Motiu: Supabase admet 100 canals per connexió (xifra de la documentació, per confirmar); un canal per conversa no escala.
- [ ] **ARQ-F03 · El sondeig continua com a xarxa de seguretat** · `F0` · `S` · `existix`
  - Repo: el sondeig actual (`XatContext.jsx`) es conserva, més espaiat quan el temps real funciona.
- [ ] **ARQ-F04 · Pestanyes en segon pla** · `F1` · `S` · `nou`
  - Atenció: el navegador alenteix els temporitzadors de les pestanyes amagades; en tornar a la pestanya, `xat_nous` recupera el que falte.
- [ ] **ARQ-F05 · Senyals efímers** · `F1` · `S` · `nou`
  - Proposta: «escrivint» i «en línia» viatgen pel canal de la conversa sense guardar-se enlloc, com a màxim un cada 3 segons per persona.

#### ARQ-G · Fitxers (Storage)

- [ ] **ARQ-G01 · Bucket privat per al xat** · `F1` · `S` · `nou`
  - Proposta: `xat_adjunts`, privat, amb límit de mida i llista de tipus declarats al mateix bucket.
  - Decisió: límit per fitxer (25 MiB proposat; el pla gratuït de Supabase admet 50 MB per fitxer, per confirmar).
- [ ] **ARQ-G02 · Ruta que porta la conversa i el missatge** · `F1` · `S` · `nou`
  - Proposta: `<tenant_id>/<fil_id>/<missatge_id>/<uuid>.<ext>`: la política es decidix llegint la ruta, sense consultar taules.
- [ ] **ARQ-G03 · Pujada per trossos per damunt de 6 MB** · `F2` · `M` · `nou`
  - Proposta: el protocol TUS de Supabase (trossos de 6 MB, reprén una pujada tallada); per davall, pujada normal.
  - Atenció: el client TUS seria una dependència nova (cal aprovació).
- [ ] **ARQ-G04 · Enllaços temporals per a veure** · `F1` · `S` · `parcial`
  - Repo: ja s'usen URL signades d'una hora per al bucket privat (`src/data/supabase/storage.js:143-150`).
- [ ] **ARQ-G05 · Esborrar fitxers per l'API** · `F1` · `S` · `nou`
  - Atenció: Supabase no deixa esborrar objectes de Storage des d'SQL (per confirmar); les làpides i les caducitats criden una funció del servidor que els esborra per l'API.
- [ ] **ARQ-G06 · Neteja de pujades òrfenes** · `F2` · `S` · `nou`
  - Proposta: fitxers pujats a una ruta de missatge que mai s'ha enviat s'esborren passades 24 hores.
- [ ] **ARQ-G07 · Corregir el límit del bucket privat actual** · `F0` · `S` · `existix`
  - Repo: `25242880` bytes a `storage.js:116` (probablement volia ser `26214400`).

#### ARQ-H · El navegador

- [ ] **ARQ-H01 · Estat del xat en un sol proveïdor** · `F0` · `M` · `parcial`
  - Repo: `XatProvider` és global (`src/app/App.jsx:446`) i depén de `useNotesData().workspaceKey` (`XatSection.jsx:20-22`), una dependència creuada que cal tallar.
- [ ] **ARQ-H02 · Estat d'enviament honest** · `F0` · `S` · `parcial`
  - Proposta: la bombolla apareix a l'instant amb el rellotge (llei L4 de `tractor-persistencia.mjs`: la interfície abans que la xarxa) i només passa a ✓ quan el servidor confirma (`self_repair.md`: no es dona per guardat el que el servidor no ha confirmat).
- [ ] **ARQ-H03 · Reintents amb espera creixent** · `F0` · `S` · `nou`
  - Proposta: reintent automàtic amb espera exponencial i component aleatori, sempre amb el mateix identificador (`ARQ-A02`); en tornar la xarxa (`online`) o la pestanya (`visibilitychange`), es reprén.
- [ ] **ARQ-H04 · Diverses pestanyes** · `F1` · `S` · `nou`
  - Proposta: Web Locks tria quina pestanya envia i BroadcastChannel avisa les altres (tots dos dins del baseline).
- [ ] **ARQ-H05 · Memòria cau local de lectura** · `F2` · `M` · `nou`
  - Proposta: IndexedDB guarda els últims missatges de cada conversa per a obrir-la a l'instant i llegir-la sense cobertura; mai és font de veritat i es buida en tancar la sessió.
  - Depén de: `XAT-O12`.
- [ ] **ARQ-H06 · Cua d'eixida local persistent** · `F3` · `L` · `nou`
  - Proposta: els missatges escrits sense connexió es guarden al dispositiu i s'envien quan torna la xarxa; la reconciliació és trivial perquè el servidor numera i l'identificador evita duplicats. No cal cap CRDT: un missatge té un sol autor i l'ordre el posa el servidor.
  - Atenció: requerix una ADR nova (`XAT-O13`).

#### ARQ-I · Estats de cada peça

| Peça | Estats | Transicions clau |
| --- | --- | --- |
| Missatge propi | esborrany → pendent → enviat → rebut → llegit; o error; o esborrat | pendent→enviat quan l'RPC torna el `seq`; →rebut i →llegit quan les marques de tots (o de l'altra persona) el passen; error→pendent en reintentar |
| Adjunt | preparant → pujant → pujat → enviat; o error | preparant = redimensionar, llevar l'EXIF, calcular la previsualització; pujat abans de cridar `xat_envia` |
| Nota de veu | gravant → en pausa → escoltant → enviada; o descartada | la gravació es descarta si dura menys d'1 s |
| Participant | convidat → actiu → eixit; o expulsat | eixit i expulsat fixen `visible_fins_seq` |
| Carpeta intel·ligent | activa → en pausa → aturada | s'atura sola si s'esgota la quota o s'activa la privacitat avançada |

#### ARQ-J · Retenció, esborrat i dades personals

- [ ] **ARQ-J01 · Esborrar per a tothom** · `F1` · `S` · `nou`
  - Proposta: `text = null`, `esborrat_al`, `esborrat_per`, adjunts esborrats per l'API, reaccions i mencions esborrades; el `seq` queda.
- [ ] **ARQ-J02 · Missatges temporals** · `F2` · `M` · `nou`
  - Proposta: la política ja amaga el que ha caducat (`caduca_al > now()`); un treball programat (pg_cron) cada minut convertix en làpida per lots de mil i demana l'esborrat dels fitxers.
- [ ] **ARQ-J03 · Buidar i esborrar per a mi** · `F1` · `S` · `nou`
  - Proposta: no esborren res del servidor; mouen `buidat_fins_seq` o afigen files a `xat_amagats`.
- [ ] **ARQ-J04 · Baixa sense trencar les converses dels altres** · `F0` · `M` · `nou`
  - Proposta: canviar la clau forana de l'autor de `on delete cascade` a `on delete set null` (i `usuari_id` passa a admetre nul); abans de la purga, els missatges propis es convertixen en làpida i els adjunts s'esborren; la interfície mostra «Veïna que se n'ha anat». Les converses directes on només quedava ella es poden esborrar com ara.
  - Atenció: canviar la clau forana és l'únic canvi no additiu del capítol.
- [ ] **ARQ-J05 · Exportació** · `F1` · `S` · `parcial`
  - Proposta: `exporta_les_meues_dades` hi afig adjunts propis (enllaços temporals), reaccions, vots i carpetes que he activat.
- [ ] **ARQ-J06 · Registres mínims** · `F0` · `S` · `nou`
  - Proposta: cap contingut de missatge als registres de les funcions del servidor ni als errors.

#### ARQ-K · Rendiment i límits

- [ ] **ARQ-K01 · Índexs** · `F0` · `S` · `nou`
  - Proposta: `(fil_id, seq)` únic, `(usuari_id, fil_id)` a participants, `(fil_id, creat_al)` als adjunts i un índex de text per a la cerca (`to_tsvector('simple', unaccent(text))`: Postgres no porta configuració de català).
- [ ] **ARQ-K02 · Límit de freqüència** · `F0` · `S` · `existix`
  - Repo: 15 missatges cada 5 s per persona; es conserva dins de `xat_envia`.
- [ ] **ARQ-K03 · Contenció per conversa** · `F1` · `S` · `nou`
  - Proposta: el bloqueig de la fila de la conversa serialitza els enviaments d'eixa conversa; amb grups de fins a 1.024 persones és acceptable.
- [ ] **ARQ-K04 · Quotes de Supabase** · `F1` · `S` · `nou`
  - Atenció: connexions simultànies, missatges per segon i mida dels avisos de Realtime depenen del pla (xifres volàtils, per confirmar abans de decidir el pla del poble pilot).

#### ARQ-L · Proves i portes

- [ ] **ARQ-L01 · Proves per fase** · `F0` · `M` · `parcial`
  - Repo: ja hi ha `XatContext.test.jsx`, `XatSection.test.jsx` i `xat.test.js`.
  - Proposta: cada element aprovat entra amb la seua prova (Vitest); les RPC i la RLS, amb proves de `node --test` contra una base de dades local.
- [ ] **ARQ-L02 · Portes obligatòries** · `F0` · `S` · `existix`
  - Proposta: `npm run porta:enxufe`, `npm run porta:rls`, `npm run porta:persistencia` i el `design_guard` de Pedra Seca en verd abans de tancar cada torn.
- [ ] **ARQ-L03 · Criteris d'acceptació de F0** · `F0` · `S` · `nou`
  - Proposta: (1) un missatge enviat dos vegades es guarda una; (2) un missatge vell de fa mesos es pot llegir fent scroll; (3) el comptador de no llegits és correcte en dos navegadors alhora; (4) un error de xarxa es veu i es pot reintentar; (5) una baixa no fa desaparéixer els missatges de l'altra persona; (6) un backend sense la capacitat `xat` arrenca i amaga la secció.

#### Traçabilitat del menú a les dades

| Família | Taules i columnes | RPC | Capacitat |
| --- | --- | --- | --- |
| `XAT-A` | `xat_fils` (`tipus`, `ultim_seq`), `xat_participants` (ajustos personals), `xat_llistes*` | `xat_fils_meus`, `xat_ajust_personal`, `crea_fil_directe` | `xat`, `xatHistorial`, `xatTempsReal` |
| `XAT-B` | `xat_missatges`, `xat_amagats`, `xat_destacats`, `xat_fixats`, `xat_mencions`, `xat_edicions` | `xat_envia`, `xat_edita`, `xat_esborra`, `xat_fixa`, `xat_destaca` | `xat`, `xatInteraccio` |
| `XAT-C` | `xat_participants` (`rebut_fins_seq`, `llegit_fins_seq`), `xat_reproduccions`, `profiles.envia_confirmacions` | `xat_marca` | `xat` |
| `XAT-D` | `xat_reaccions` | `xat_reacciona` | `xatInteraccio` |
| `XAT-E` | `xat_missatges` (`resposta_a`, `cadena_arrel`) | `xat_missatges_al_voltant` | `xatInteraccio` |
| `XAT-F`, `XAT-G` | `xat_adjunts`, `xat_enquestes`, `xat_vots`, `xat_esdeveniments`, `xat_assistencies`; bucket `xat_adjunts` | `xat_envia`, `xat_vota`, `xat_respon_esdeveniment` | `xatMitjans`, `xatEnquestes` |
| `XAT-H` | `xat_fils` (`permisos`, `comunitat_id`, `org_id`), `xat_participants` (`rol`, `visible_*`), `xat_invitacions`, `xat_sollicituds` | `xat_crea_grup`, `xat_gestiona_membre`, `xat_ix`, `xat_invitacio_*` | `xatGrups` |
| `XAT-I` | cap (senyals efímers) | cap | `xatPresencia` |
| `XAT-J` | `xat_participants` (`avisos`, `silenciat_fins_al`), `xat_subscripcions_avis` | funció del servidor d'enviament | `xatAvisos` |
| `XAT-K` | índex de text a `xat_missatges` | `xat_cerca` | `xatCerca` |
| `XAT-L`, `XAT-Q` | `xat_bloquejos`, `xat_denuncies`, `perfil_privacitat` | `xat_bloqueja`, `xat_denuncia`, `xat_resol_denuncia` | `xatModeracio` |
| `XAT-O` | columnes de retenció, clau forana de l'autor | `exporta_les_meues_dades` | `compte` (existent) |
| `XAT-T` | `xat_carpetes`, `xat_carpeta_fonts`, `xat_carpeta_exclusions`, `notes` | funció del servidor de la IAIA | `xatCarpetes` |
| `PER-*` | `profiles` (camps nous), `perfil_*` | vista o RPC del perfil públic | `perfilPublic`, `perfilPrivacitat`, `perfilFedivers` |

### 12. Experiència d'usuari, full de ruta i decisions

#### UX-A · Anatomia del Xat

Canviar la disposició del xat actual és un redisseny (Llei del Píxel): necessita ordre del Mestre, pla aprovat i espècimens previs.

- [ ] **UX-A01 · Cada cosa on està a WhatsApp** · `F0` · `S` · `nou`
  - Proposta: la regla de disseny del xat és que qui sap usar WhatsApp el sap usar sense aprendre res: mateixa disposició, mateixos gestos, mateixos noms de les accions en valencià.
- [ ] **UX-A02 · Identitat pròpia, no la de WhatsApp** · `F0` · `S` · `nou`
  - Proposta: colors Pedra Seca (blau per a l'acció, taronja per a la marca), tipografia i icones pròpies. Cap logotip, nom, icona ni verd de WhatsApp.
  - Motiu: «idèntic» vol dir en disposició i funcionament; copiar la marca seria un risc legal (marca i imatge comercial de Meta) i confondria la gent.
- [ ] **UX-A03 · Escriptori: tres zones com WhatsApp Web** · `F1` · `L` · `parcial`
  - Proposta: sobre UniversalWorkspace: a l'esquerra el rail d'icones plegat (Converses, Grups, Carpetes, Ajustos), com la barra estreta de WhatsApp Web; al centre la llista amb la cerca i els filtres dalt; a la dreta la conversa. El botó CREAR del centre és «Conversa nova».
  - Repo: hui el xat té una disposició pròpia (`.xat-layout`, `src/sections/xat/XatSection.jsx:174-363`) fora d'AppGridShell.
  - Decisió: migrar a UniversalWorkspace o conservar la disposició pròpia.
- [ ] **UX-A04 · Informació de la conversa en un panell a la dreta** · `F1` · `M` · `nou`
  - Proposta: com a WhatsApp Web, el panell s'obri a la dreta de la conversa; es fa amb el calaix que ja existix (`Dialeg` amb `costat="dreta"`), perquè la graella no té una quarta columna.
- [ ] **UX-A05 · Mòbil: llista i conversa a pantalla completa** · `F0` · `M` · `parcial`
  - Proposta: primer la llista; en tocar una conversa, ocupa tota la pantalla amb la fletxa d'arrere, i la barra mòbil flotant s'amaga dins de la conversa (WhatsApp amaga les pestanyes).
  - Atenció: probablement AppGridShell perd el panell inicial en mode estret (`src/components/layout/AppGridShell.jsx:96-102`) i no deixa mostrar primer la llista; cal una prova i la correcció abans.
- [ ] **UX-A06 · Capçalera de la conversa** · `F0` · `S` · `parcial`
  - Proposta: foto, nom i una línia davall (estat, membres o «Toca per a veure la informació», que ha de funcionar de veres); accions a la dreta.
- [ ] **UX-A07 · Bombolles** · `F0` · `M` · `parcial`
  - Proposta: les pròpies a la dreta i les dels altres a l'esquerra; hora i marques dins de la bombolla a baix a la dreta; als grups, el nom de l'autor escrit (no només un color); separadors de dia.
- [ ] **UX-A08 · Compositor** · `F0` · `S` · `parcial`
  - Proposta: emoji i adjunt a l'esquerra, text al centre, i a la dreta el micròfon, que es convertix en «Envia» quan hi ha text.
- [ ] **UX-A09 · Fons de la conversa** · `F1` · `S` · `existix`
  - Repo: fons de mapa (`public/assets/system/ui/xat-bg-map-v2.jpg`), l'equivalent del fons de WhatsApp.
  - Proposta: opció de fons llis per a qui necessita més contrast.

#### UX-B · Espècimens a DesignSection abans de programar

Pedra Seca §9: cap funció sense espècimen previ. Ja existixen «Xat i missatgeria» (bombolles i compositor) i «Avatar» (`src/sections/disseny/cataleg/manifest.js`).

- [ ] **UX-B01 · Fila de la llista de converses** · `F0` · `S` · `nou`
  - Proposta: una variant de la «Llei de la Fitxa» per al xat (hui les fitxes fan 96 px; Notes ja té una variant de 86 px).
- [ ] **UX-B02 · Bombolla en totes les variants** · `F0` · `M` · `parcial`
  - Proposta: pròpia, aliena, de sistema, esborrada, editada, amb cita, amb adjunt, amb error.
- [ ] **UX-B03 · Compositor amb `textarea`** · `F0` · `S` · `parcial`
- [ ] **UX-B04 · Capçalera de conversa i panell d'informació** · `F1` · `S` · `nou`
- [ ] **UX-B05 · Comptador de no llegits i marques d'estat accessibles** · `F0` · `S` · `nou`
- [ ] **UX-B06 · Gravadora i reproductor de veu** · `F1` · `M` · `nou`
- [ ] **UX-B07 · Targeta d'adjunt i de document** · `F1` · `S` · `nou`
- [ ] **UX-B08 · Menú contextual del missatge** · `F1` · `S` · `nou`
- [ ] **UX-B09 · Safata de reaccions** · `F1` · `S` · `nou`
  - Depén de: `DEC-06`.
- [ ] **UX-B10 · Avís de carpeta intel·ligent** · `F2` · `S` · `nou`
- [ ] **UX-B11 · Targeta de perfil públic** · `F1` · `S` · `nou`

#### UX-C · Gestos i alternatives

- [ ] **UX-C01 · Menú del missatge** · `F1` · `S` · `nou`
  - Proposta: premuda llarga al mòbil; clic dret i un botó «⋯» que apareix en passar per damunt, a l'escriptori.
- [ ] **UX-C02 · Lliscar per citar** · `F1` · `S` · `nou`
  - Proposta: amb la mateixa acció al menú i amb el teclat.
- [ ] **UX-C03 · Dreceres de teclat** · `F2` · `S` · `nou`
  - Proposta: buscar, tancar amb Esc, passar a la conversa següent i anterior.
- [ ] **UX-C04 · Tornar arrere del mòbil** · `F0` · `S` · `nou`
  - Proposta: el botó i el gest d'arrere del sistema tornen de la conversa a la llista, sense eixir de l'app.

#### UX-D · Deute de la interfície actual

- [ ] **UX-D01 · Filtres que no filtren** · `F0` · `S` · `existix`
  - Repo: `XatSection.jsx:64, 98-102, 225-228`. Depén de: `XAT-A17`.
- [ ] **UX-D02 · No llegits invisibles** · `F0` · `S` · `existix`
  - Depén de: `XAT-A10`.
- [ ] **UX-D03 · Menú de la conversa sense accions** · `F0` · `S` · `existix`
  - Repo: «Info. del contacte», «Cercar», «Silenciar» i la resta no fan res (`XatSection.jsx:461-480`). Proposta: amagar el que no funcione fins que funcione.
- [ ] **UX-D04 · Capçalera que promet i no fa** · `F0` · `S` · `existix`
  - Repo: «Prem ací per a més informació» no es pot prémer (`XatSection.jsx:453`).
- [ ] **UX-D05 · Estils del xat fora de lloc** · `F0` · `M` · `existix`
  - Repo: tot l'estil del xat viu dins de `@layer legacy` (`src/css/modules.css:2183-2640`) amb radis escrits a mà (12, 20 i 24 px) i botons de 36 px.
  - Proposta: passar-lo a la capa de components amb tokens.
- [ ] **UX-D06 · Mode fosc sense el cas incrustat** · `F1` · `S` · `existix`
  - Repo: `[data-theme="dark"] .xat-main::before` (`modules.css:2352`) no té la variant `:host(...)` que usen la resta de fitxers.
- [ ] **UX-D07 · Quatre punts de tall diferents** · `F1` · `S` · `existix`
  - Repo: 720, 768, 1023 i 1024 px conviuen entre el xat, AppGridShell i la closca.
- [ ] **UX-D08 · Botó d'arrere del mòbil que no apareix** · `F0` · `S` · `existix`
  - Repo: probablement les classes `.d-mobile-only` i `.d-desktop-only` que usa el xat (`XatSection.jsx:176, 339, 447`) només s'activen dins d'AppGridShell (`AppGridShell.css:241-243`); cal verificar-ho a 375 px.

#### UX-E · Anatomia de la Pàgina d'Usuari

- [ ] **UX-E01 · Fitxa privada** · `F0` · `S` · `existix`
  - Repo: `PerfilShell` en tres columnes (persona i entitats, apartats, fitxa); es conserva.
- [ ] **UX-E02 · Fitxa pública** · `F1` · `M` · `nou`
  - Proposta: una `UniversalPage`: barra blava, portada, barra taronja amb foto, nom i poble, títol, i la presentació; el botó «Connectar» porta al xat.
- [ ] **UX-E03 · La informació d'un contacte al xat és la seua targeta** · `F1` · `S` · `nou`
  - Proposta: el panell d'informació d'una conversa directa reutilitza la targeta de perfil (`UX-B11`) amb les accions escriure, silenciar, bloquejar, denunciar, grups i mitjans en comú.

#### UX-F · Full de ruta per fases

Els elements marcats `existix` que ja funcionen no surten ací: es conserven. Cada fase només comença quan les decisions que la bloquegen (UX-G) estan preses.

**Ja existix i es conserva:** `XAT-A01`, `XAT-A05`, `XAT-B23`, `XAT-B24`, `XAT-L03`, `XAT-O01`, `XAT-O04`, `XAT-O06`; `PER-A01`, `PER-A03`, `PER-B01`, `PER-B05`, `PER-C01`, `PER-C02`, `PER-C03`, `PER-G05`, `PER-J04`, `PER-K01`, `PER-K05`, `PER-K06`, `PER-K09`, `PER-M01`, `PER-M02`; `ARQ-A01`, `ARQ-D05`, `ARQ-F03`, `ARQ-K02`, `ARQ-L02`; `UX-A09`, `UX-E01`.

**F0 · Fonament** (bloquejat per `DEC-01` a `DEC-04`; estimació agregada: 4-6 setmanes)

- Xat: `XAT-A09`, `XAT-A10`, `XAT-A17`, `XAT-A23`, `XAT-A24`, `XAT-A25`, `XAT-B01`, `XAT-B03`, `XAT-B05`, `XAT-B12`, `XAT-B20`, `XAT-B25`, `XAT-C01`, `XAT-C02`, `XAT-C04`, `XAT-C08`, `XAT-C10`, `XAT-F24`, `XAT-J01`, `XAT-J02`, `XAT-L01`, `XAT-L16`, `XAT-M01`, `XAT-O07`, `XAT-O11`, `XAT-P01`, `XAT-P02`, `XAT-P04`, `XAT-P08`, `XAT-P10`, `XAT-R01`.
- Perfil: `PER-B03`, `PER-B04`, `PER-B06`, `PER-F02`, `PER-G02`, `PER-I04`.
- Arquitectura: `ARQ-A02` a `ARQ-A06`, `ARQ-B01`, `ARQ-C01` a `ARQ-C03`, `ARQ-D01`, `ARQ-E01`, `ARQ-E02`, `ARQ-E04`, `ARQ-E05`, `ARQ-E06`, `ARQ-E11`, `ARQ-F01`, `ARQ-G07`, `ARQ-H01` a `ARQ-H03`, `ARQ-J04`, `ARQ-J06`, `ARQ-K01`, `ARQ-L01`, `ARQ-L03`.
- Interfície: `UX-A01`, `UX-A02`, `UX-A05` a `UX-A08`, `UX-B01` a `UX-B03`, `UX-B05`, `UX-C04`, `UX-D01` a `UX-D05`, `UX-D08`.
- Criteri de sortida: `ARQ-L03`.

**F1 · Primera versió útil al poble pilot** (estimació agregada: 8-12 setmanes)

- Converses i missatges: `XAT-A02`, `XAT-A03`, `XAT-A06`, `XAT-A08`, `XAT-A11`, `XAT-A13`, `XAT-A14`, `XAT-A15`, `XAT-A16`, `XAT-A21`, `XAT-A22`, `XAT-B02`, `XAT-B04`, `XAT-B07`, `XAT-B08`, `XAT-B09`, `XAT-B11`, `XAT-B13`, `XAT-B16`, `XAT-B18`, `XAT-B19`.
- Lectura, reaccions, cites i cerca: `XAT-C03`, `XAT-C06`, `XAT-C07`, `XAT-C09`, `XAT-D01`, `XAT-D04`, `XAT-E01`, `XAT-E02`, `XAT-E03`, `XAT-K01`, `XAT-K02`, `XAT-K05`, `XAT-K09`.
- Multimèdia i veu: `XAT-F01`, `XAT-F03` a `XAT-F08`, `XAT-F11`, `XAT-F23`, `XAT-G01`, `XAT-G02`, `XAT-G04`, `XAT-G05`, `XAT-G07`.
- Grups i presència: `XAT-H01` a `XAT-H03`, `XAT-H05`, `XAT-H07` a `XAT-H11`, `XAT-I01`, `XAT-J03`.
- Privacitat, dades i convivència: `XAT-L04` a `XAT-L08`, `XAT-O02`, `XAT-O08` a `XAT-O10`, `XAT-P03`, `XAT-P06`, `XAT-P07`, `XAT-P09`, `XAT-P11`, `XAT-P13`, `XAT-P14`, `XAT-Q01` a `XAT-Q04`, `XAT-Q06`, `XAT-S01`, `XAT-S03`, `XAT-S08`.
- Perfil: `PER-A04`, `PER-A05`, `PER-B02`, `PER-C04`, `PER-D01`, `PER-D02`, `PER-D04`, `PER-G01`, `PER-G06`, `PER-I01`, `PER-J01`, `PER-J02`, `PER-J05`, `PER-K02`, `PER-M05`, `PER-M06`, `PER-N01` a `PER-N04`.
- Arquitectura: `ARQ-B02`, `ARQ-B03`, `ARQ-C04`, `ARQ-C05`, `ARQ-C07`, `ARQ-C08`, `ARQ-C10`, `ARQ-D02` a `ARQ-D04`, `ARQ-E03`, `ARQ-E07` a `ARQ-E10`, `ARQ-F02`, `ARQ-F04`, `ARQ-F05`, `ARQ-G01`, `ARQ-G02`, `ARQ-G04`, `ARQ-G05`, `ARQ-H04`, `ARQ-J01`, `ARQ-J03`, `ARQ-J05`, `ARQ-K03`, `ARQ-K04`.
- Interfície: `UX-A03`, `UX-A04`, `UX-B04`, `UX-B06` a `UX-B09`, `UX-B11`, `UX-C01`, `UX-C02`, `UX-D06`, `UX-D07`, `UX-E02`, `UX-E03`.

**F2 · Maduresa**

- Xat: `XAT-A04`, `XAT-A07`, `XAT-A12`, `XAT-A18`, `XAT-A19`, `XAT-B06`, `XAT-B10`, `XAT-B14`, `XAT-B15`, `XAT-B17`, `XAT-B21`, `XAT-B22`, `XAT-C05`, `XAT-D02`, `XAT-D03`, `XAT-D05`, `XAT-D06`, `XAT-E04`, `XAT-K03`, `XAT-K04`, `XAT-K06` a `XAT-K08`, `XAT-F02`, `XAT-F09`, `XAT-F10`, `XAT-F14`, `XAT-F16` a `XAT-F18`, `XAT-F22`, `XAT-G03`, `XAT-G06`, `XAT-G08`, `XAT-G11`, `XAT-G12`, `XAT-H04`, `XAT-H06`, `XAT-H12`, `XAT-H15` a `XAT-H18`, `XAT-I02` a `XAT-I04`, `XAT-I06`, `XAT-J04`, `XAT-J08`, `XAT-J09`, `XAT-L09` a `XAT-L11`, `XAT-L13`, `XAT-L15`, `XAT-M02`, `XAT-N05`, `XAT-O03`, `XAT-O05`, `XAT-O12`, `XAT-P05`, `XAT-P12`, `XAT-Q05`, `XAT-Q07`, `XAT-Q08`, `XAT-S02`, `XAT-S04` a `XAT-S06`, `XAT-S09`, `XAT-S10`.
- Carpetes intel·ligents: `XAT-T01` a `XAT-T05`, `XAT-T10`, `XAT-T12` a `XAT-T14`, `XAT-T17` a `XAT-T19`, `XAT-T21`.
- Perfil: `PER-A02`, `PER-A06`, `PER-B07`, `PER-C05`, `PER-D03`, `PER-E01` a `PER-E04`, `PER-E06`, `PER-F01`, `PER-G03`, `PER-G04`, `PER-H01`, `PER-H03`, `PER-H04`, `PER-I02`, `PER-I03`, `PER-J03`, `PER-K03`, `PER-K04`, `PER-K07`, `PER-M03`, `PER-M04`, `PER-N05`, `PER-N06`.
- Arquitectura i interfície: `ARQ-C06`, `ARQ-C09`, `ARQ-G03`, `ARQ-G06`, `ARQ-H05`, `ARQ-J02`, `UX-B10`, `UX-C03`.

**F3 · Ambició**

- Xat: `XAT-A20`, `XAT-F12`, `XAT-F15`, `XAT-F19`, `XAT-F25`, `XAT-G10`, `XAT-G13`, `XAT-H13`, `XAT-H14`, `XAT-H19`, `XAT-H21`, `XAT-H22`, `XAT-I05`, `XAT-J05` a `XAT-J07`, `XAT-J10`, `XAT-J11`, `XAT-L02`, `XAT-L12`, `XAT-L14`, `XAT-L18`, `XAT-M03` a `XAT-M05`, `XAT-N01` a `XAT-N04`, `XAT-O13`, `XAT-Q09`, `XAT-R02` a `XAT-R04`, `XAT-R06`, `XAT-R07`, `XAT-S07`.
- Carpetes intel·ligents: `XAT-T06` a `XAT-T09`, `XAT-T11`, `XAT-T15`, `XAT-T16`, `XAT-T20`, `XAT-T22`.
- Perfil: `PER-A07`, `PER-C06` a `PER-C08`, `PER-D05`, `PER-E05`, `PER-F03`, `PER-H02`, `PER-H05`, `PER-K08`, `PER-L01` a `PER-L07`.
- Arquitectura: `ARQ-H06`.

**FX · Desaconsellat:** `XAT-B26`, `XAT-D07`, `XAT-E05`, `XAT-F13`, `XAT-F20`, `XAT-F21`, `XAT-G09`, `XAT-H20`, `XAT-H23`, `XAT-L17`, `XAT-M06`, `XAT-M07`, `XAT-N06`, `XAT-O14`, `XAT-Q10`, `XAT-R05`; `PER-A08`, `PER-O01` a `PER-O06`.

#### UX-G · Decisions obertes

Cada decisió porta una recomanació; qui decidix és el Mestre, llevat que es diga una altra cosa.

- [ ] **DEC-01 · Fins on arriba «idèntic a WhatsApp»** · bloqueja `F0`
  - Opcions: (A) idèntic en disposició, gestos i funcionament, amb la identitat visual de Pedra Seca; (B) també els colors i la iconografia de WhatsApp; (C) estil propi.
  - Recomanació: A. B té risc legal de marca i C trenca Zero Fricció. Afecta `UX-A01`, `UX-A02`.
- [ ] **DEC-02 · Disposició del xat** · bloqueja `F1`
  - Opcions: (A) UniversalWorkspace amb el rail plegat, que reproduïx WhatsApp Web; (B) conservar la disposició pròpia actual.
  - Recomanació: A, perquè el rail de UniversalWorkspace ja és la barra estreta de WhatsApp Web i s'aprofita la closca comuna; abans cal corregir `UX-A05`. Afecta `UX-A03`.
- [ ] **DEC-03 · Traure el xat del nucli del contracte** · bloqueja `F0`
  - Opcions: (A) moure'l a `CAPACITATS.xat` ara; (B) deixar-lo al nucli.
  - Recomanació: A. Sense això, cap WordPress ni node local pot usar Sóc de Poble sense implementar un xat sencer. `contracte.js` està marcat `SDP-LOCK`: només amb ordre expressa. Afecta `ARQ-B01`.
- [ ] **DEC-04 · Marques de lectura per número d'ordre** · bloqueja `F0`
  - Opcions: (A) `llegit_fins_seq` a `xat_participants` i retirar `xat_lectures` després d'una fase de convivència; (B) conservar `xat_lectures` per hora.
  - Recomanació: A (exacte i barat). Afecta `ARQ-A03`, `XAT-C*`.
- [ ] **DEC-05 · Treball sense connexió i app nadiua** · bloqueja `F3` (i condiciona `F2`)
  - Situació: la visió del Mestre (acta `260926_2350_acta_marmota.md` i plantilla `skill.md`) és una app nadiua que funcione sense connexió; l'ADR-2026-08 vigent diu el contrari.
  - Opcions: (A) mantindre l'ADR per ara, fer només la memòria cau de lectura (`XAT-O12`) i redactar una ADR nova per a F3; (B) ADR nova ja; (C) renunciar-hi.
  - Recomanació: A. El model de dades ja està preparat (identificador del client i número d'ordre fan trivial la cua d'eixida quan s'aprove). Afecta `XAT-O12`, `XAT-O13`, `ARQ-H05`, `ARQ-H06`.
- [ ] **DEC-06 · Reaccions i Connexió Radical**
  - Opcions: (A) reaccions com a WhatsApp dins de les converses privades; (B) només senyals propis sense comptador; (C) cap.
  - Recomanació: A. La Connexió Radical prohibix mètriques de vanitat en targetes públiques; una reacció dins d'una conversa privada és un gest de conversa. Afecta `XAT-D*`, `UX-B09`.
- [ ] **DEC-07 · Valors per defecte de la privacitat de conversa**
  - Opcions per a les confirmacions de lectura (`XAT-C07`): activades com a WhatsApp o triades en el moment. Per a l'última connexió (`XAT-I04`): «Veïns», «Ningú» o no tindre-la.
  - Recomanació: confirmacions activades amb un avís clar la primera vegada; última connexió desactivada per defecte (en un poble revela quan dorm o ix de casa una persona gran que viu sola), apartant-se de WhatsApp per un motiu explícit.
- [ ] **DEC-08 · Notificacions push**
  - Opcions: (A) F1 només avisos dins de l'app i comptador a la pestanya, i push amb l'app nadiua a F3; (B) service worker i Web Push al web ja; (C) cap push.
  - Recomanació: A. B contradiu la doctrina «sense service worker» i a iPhone només funciona amb l'app afegida a l'inici. Afecta `XAT-J*`.
- [ ] **DEC-09 · Xifratge extrem a extrem**
  - Opcions: (A) no a la primera versió, amb la columna reservada, i revisar-ho després del model d'amenaça; (B) opcional per conversa a F3; (C) obligatori.
  - Recomanació: A i després B. C inutilitza la IAIA, les carpetes, la cerca, la moderació i la purga verificable. Afecta `XAT-L01`, `XAT-L02`.
- [ ] **DEC-10 · Botigues d'aplicacions**
  - Opcions: (A) app nadiua a l'App Store i Google Play (Capacitor); (B) només web instal·lable; (C) tots dos.
  - Situació: el full de ruta parlava d'evitar les botigues corporatives; la visió nova parla d'app nadiua. Afecta `XAT-J06`, `XAT-A20`, `XAT-L12`.
- [ ] **DEC-11 · Fedivers i Model B**
  - Proposta: confirmar que el xat privat no es federa mai (`XAT-R01`) i que federar el perfil i el contingut públic necessita una ADR (`PER-L*`, `XAT-R02`).
- [ ] **DEC-12 · Pont amb WhatsApp i carpetes dins de WhatsApp**
  - Opcions: (A) no fer pont; (B) API oficial de WhatsApp Business (si admet grups, per confirmar); (C) el bot actual amb Baileys, amb risc de perdre el número.
  - Pregunta afegida: si les carpetes intel·ligents s'han de provar primer dins dels grups de WhatsApp reals (`XAT-T20`), que és on ja està la gent.
  - Afecta `XAT-R06`, `XAT-T20`.
- [ ] **DEC-13 · Carpetes intel·ligents**
  - Preguntes: consentiment de cada membre o de l'administració amb dret d'oposició (`XAT-T01`); mode per defecte continu o a demanda (`XAT-T17`); model extern amb pseudonimització o model local (`XAT-T18`); si entra el quadern de cures amb dades de salut (`XAT-T08`); i si una primera carpeta mínima (llista d'inscrits a demanda) puja a F1 com a element distintiu del producte.
  - Recomanació: administració amb avís i dret d'oposició, mode a demanda per defecte, pseudonimització obligatòria i llista d'inscrits a F1.
- [ ] **DEC-14 · Nivell d'accessibilitat** · bloqueja `F0`
  - Opcions: WCAG 2.2 AA o AAA. Recomanació: AA general i AAA en contrast i mida de text del xat (gent gran). Afecta `XAT-P01`.
- [ ] **DEC-15 · Límits**
  - Preguntes: longitud del missatge (`XAT-B03`, 4.096 proposats), mida per fitxer (`ARQ-G01`, 25 MiB proposats), vídeo (`XAT-F10`) i membres per grup (`XAT-H07`, 1.024 proposats).
- [ ] **DEC-16 · Qui pot escriure a qui**
  - Preguntes: valor per defecte de `XAT-L04` i `XAT-L05`, converses amb gent d'un altre poble (`XAT-A08`) i entrada al grup del poble per invitació (`XAT-H15`).
- [ ] **DEC-17 · Edat mínima i menors** · decidix el Mestre amb assessoria legal
  - Afecta `XAT-O10`, `XAT-L18`.
- [ ] **DEC-18 · Conservar versions editades**
  - Opcions: no conservar-ne (minimització) o conservar-les 30 dies per a moderació. Afecta `XAT-B07`, `ARQ-C04`.
- [ ] **DEC-19 · Serveis externs que veuen el contingut**
  - Preguntes: previsualització d'enllaços (`XAT-B06`), traducció (`XAT-B21`) i transcripció (`XAT-G08`): quins s'activen i amb quin proveïdor, sabent que tots veuen el text o la veu (Llei 5).
- [ ] **DEC-20 · Canals i estats contra el Mur**
  - Opcions: fer canals i estats al xat (`XAT-H19`, `XAT-N01`) o usar el Mur i el taulell del poble (`XAT-N05`). Recomanació: el Mur.
- [ ] **DEC-21 · Importar historials de WhatsApp**
  - Afecta `XAT-O05`: permetre-ho i amb quin consentiment dels altres membres.
- [ ] **DEC-22 · Format de les notes de veu**
  - Proposta: decidir després d'una matriu de proves real entre Safari/iOS 16, Chrome i Firefox; si no es reproduïxen creuades, cal un servei de conversió al servidor. Afecta `XAT-G01`.
- [ ] **DEC-23 · Mapa per a la ubicació**
  - Afecta `XAT-F14`: sense mapa, amb un proveïdor extern o amb un servidor de mapes propi.
- [ ] **DEC-24 · Moderació**
  - Pregunta: qui fa de moderació del node al poble pilot i amb quines normes (`XAT-Q01`, `XAT-Q02`). Decidix l'equip humà.

#### UX-H · Guió de la reunió

1. **Abans.** Imprimir o obrir este document al costat d'un mòbil amb WhatsApp. Tindre a mà una persona gran del poble pilot si és possible.
2. **Primer, les decisions que bloquegen** (15 minuts): `DEC-01`, `DEC-02`, `DEC-03`, `DEC-04` i `DEC-14`. Sense elles no es pot començar F0.
3. **Recorregut per pantalles de WhatsApp** (una hora): llista de xats → conversa → menú d'un missatge → adjunts → nota de veu → informació d'un grup → ajustos de privacitat → perfil. A cada pantalla, buscar la família corresponent (`XAT-A`, `XAT-B`, `XAT-F`, `XAT-G`, `XAT-H`, `XAT-L`, `PER-*`) i marcar les caselles.
4. **Carpetes intel·ligents** (20 minuts): agafar un grup real de WhatsApp del poble (amb permís), llegir-ne 50 missatges i decidir quina carpeta hauria fet la IAIA (`XAT-T03`, `DEC-13`).
5. **La resta de decisions** (`DEC-05` a `DEC-24`), les que no s'hagen resolt pel camí.
6. **Tornar el resultat a l'agent:** el fitxer amb les caselles marcades, o una llista del tipus `DEC-01 A · XAT-B07 sí · XAT-D01 sí · PER-D02 ajornat`. Amb això s'escriu la versió viva de la skill (§14) i el pla de F0.

### 13. Capçalera proposada per a la skill viva

Quan el Mestre aprove el menú, el `SKILL.md` viu portarà esta capçalera. Les claus `name`, `triggers_on` i `version` les exigix la plantilla ISO (§2) i les admet `tooling/wiki/schema.json`; `version` va entre cometes perquè el YAML es llig amb `JSON_SCHEMA` i un número sense cometes fallaria. Les etiquetes són de la llista tancada de l'esquema (no n'hi ha cap de `xat` ni de `perfil`).

```yaml
---
type: skill
status: canonic
description: "Governa el Xat de Sóc de Poble (missatgeria privada estil WhatsApp) i la Pàgina d'Usuari: què està aprovat, com s'implementa i què està prohibit."
name: "sdp-xat"
triggers_on:
  - "xat"
  - "missatge"
  - "conversa"
  - "whatsapp"
  - "grup"
  - "perfil"
  - "pàgina d'usuari"
version: "1.0.0"
tags: [skills, arquitectura, disseny, supabase, identitat]
---
```

### 14. Com es promou a skill viva

1. **Reunió.** Es marquen les caselles i es resolen les `DEC-*`.
2. **Depuració.** Un agent fa la versió viva: lleva els elements `[-]`, conserva els `[x]`, mou els `[>]` a una secció d'ajornats i escriu dins de cada element la decisió presa. El menú deixa de ser menú i passa a ser especificació.
3. **Ubicació.** La skill viu a `.agents/skills/sdp-xat/SKILL.md`. `.agents/` és una ruta de governança: només s'hi escriu amb `tooling/gates/executor-mutacio.mjs` i una lease (`tooling/gates/mutation-policy.mjs`).
4. **Cens de skills.** La llista de skills viu en diversos llocs que s'han d'actualitzar junts: el router cognitiu, els enllaços de `.claude/skills/` i el segell `.agents/SKILLS_SEAL.json`. Després cal resegellar.
5. **Paraules vetades.** Si alguna part es copia a `_wiki_de_poble/`, s'ha de passar `porta:psicopatia`, que veta «Offline-First» i «Local-First».
6. **Skills germanes.** Cal revisar alhora `sdp-universal-page` («Comentar» ha d'obrir el xat privat amb l'autor), `sdp-app-grid-shell` (el §2 està desfasat respecte del codi), `sdp-pedra-seca` (espècimens nous) i `sdp-casos-us-essencials` (bars, cuidadores i llauradors).

<!-- SDP:SECTION skill.s5 -->
## Verificació

**Què s'ha comprovat:**

- **Contracte del document.** `node tooling/wiki/document.mjs check --file _wiki_de_poble/04_escriptori/260926_2330_skill_esborrany_xat.md` en acabar (resultat al LEDGER del torn).
- **Cobertura del full de ruta.** Cada identificador dels capítols 5 a 11 apareix exactament una vegada a `UX-F` (o a «Ja existix»), amb la mateixa fase que diu l'element. Revisat a mà element per element.
- **Referències creuades.** Cada «Depén de» apunta a un identificador que existix; dos referències equivocades (`XAT-H10` per `XAT-H09` i el fitxer dels permisos de `xat_participants`) es van corregir durant la redacció.
- **Repo.** Llegits directament en este torn: `supabase/migrations/260908_xat_v2.sql` (esquema real sobre el qual es fan els `alter table`: `creat_al` de participants, `text not null`, autor en cascada a la línia 27, permís d'inserció directa a la línia 93), `src/components/universal/UniversalPage.jsx:23`, `tooling/wiki/schema.json` i `.agents/protocolledge.json`. La resta de cites de fitxer i línia vénen de sis informes d'agents que van llegir el disc en este torn; una ruta que no existia (`a11y_seo_trellat.md`) es va detectar i corregir.
- **WhatsApp.** Les xifres vénen de l'inventari contrastat amb el navegador integrat a `faq.whatsapp.com`, `blog.whatsapp.com` i WABetaInfo el 26 i 27 de setembre de 2026. On la FAQ es contradiu (mida dels vídeos, dispositius vinculats), el document ho diu.

**Què NO s'ha pogut comprovar:**

- **La verificació adversarial amb agents no s'ha fet.** El workflow que havia de redactar i verificar cada capítol amb tres lents (fets, repo i tècnica) va fallar sencer quan el compte va arribar al límit setmanal d'ús; cap agent va tornar resultat. Els capítols els ha redactat l'agent principal directament a partir de la recerca. Recomanació: una auditoria creuada de Codex a la Reunió de l'Olivera abans d'aprovar F0, centrada en l'SQL del capítol 11 i en les xifres marcades «(per confirmar)».
- **Xifres de Supabase i de navegadors** (límits de Realtime i de Storage per pla, esborrat de Storage des d'SQL, reproducció creuada d'Opus i AAC a iOS 16, veus en valencià): del coneixement del model, sense verificar al web, perquè el hook bloqueja la cerca web.
- **Decisions D1-D13 de la Fase 1.** El pla on eren ja no és a l'Escriptori; el document no les contradiu conscientment, però no les ha pogut llegir senceres.
- **L'SQL no s'ha executat** contra cap base de dades: no hi ha PostgreSQL local ni staging.

**Com es verificarà la skill quan siga viva:** els criteris d'acceptació de F0 (`ARQ-L03`), les portes `porta:enxufe`, `porta:rls` i `porta:persistencia`, i la prova amb persones grans del poble pilot (`XAT-P14`).

<!-- SDP:SECTION skill.s6 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
