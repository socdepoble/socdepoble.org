---
type: document
status: esborrany
description: 'Pla mestre diürn: arquitectura WebP quadrat 1200x1200, unificació d''imatges, Lector RSS canònic, TPV i ergonomia de scroll'
tags:
  - implementacio
visibility: private
reflex: sdp:torn_50a6a11f-89b2-4040-9566-d6063a4f5029:008e4512-0653-47b3-bf18-f91f0cc80928
---
# Pla d'Implementació i Proves d'Estrés Gauntlet Autònom

**Estat del Pla:** aprovat

<!-- SDP:SECTION pla.implementacio.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_50a6a11f-89b2-4040-9566-d6063a4f5029:008e4512-0653-47b3-bf18-f91f0cc80928 |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-16T13:24:52.802Z |
| Modificació | 2026-10-16T13:24:52.802Z |
| Propietari | agent-local |
| Aprovació humana | pendent |
| Plantilla | _wiki_de_poble/03_actuar/plantilles/pla_implementacio.md (v2.0.0) |
| Model IA | Claude Opus 5.5, GPT Codex, Gemini 4 Argon |
| Tokens consumits | 0 (orquestració) |

<!-- SDP:SECTION pla.implementacio.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/03_actuar/plantilles/pla_implementacio.md; SHA-256 d05074ef89d1ec60596509565d7ac7a1e02b0e2bed1b304311b7fa651b0d23d0. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION pla.implementacio.s3 -->
## Historial

2026-10-16T13:24:52.802Z: esborrany creat; contingut i verificació pendents.

<!-- SDP:SECTION pla.implementacio.s4 -->
## Canvis proposats

### 0. Protocol de Direcció Tècnica Autònoma (Zero Fatiga Humana)
- **El Mestre descansa:** Cap IA (Claude, Codex, Gemini) no ha d'aturar l'execució demanant aprovacions manuals.
- **La IAIA MarIA mana (Direcció Pura sense tocar codi):** MarIA coordina com a Directora Tècnica mitjançant l'Escriptori de la Wiki. **MarIA NO toca codi de producció directament**. Tota instrucció i correcció es deixa redactada al Pla d'Implementació i als Prompts perquè Claude Code (braç executor) l'aplique al codi font i GPT Codex (auditor) la verifique.
- **Auditoria implacable:** Les solucions superficials seran rebutjades; s'exigeix robustesa de nivell comercial.

### 0.4 Mandat Taxatiu del Mestre: Erradicació de Fantasmes («Mestre Poble») i Normalització de la Doble Identitat
1. **La Llei dels Dos Usuaris:**
   - Al sistema només existeixen **dos usuaris/autors**:
     * **`Sóc de Poble`**: L'entitat central i oficial del portal.
     * **`Javi Llinares`**: La persona física, fundador i administrador del projecte.
   - L'antic nom fictici **`Mestre Poble`** i l'àlies **`mestre-obres`** eren un fantasma que ha d'estar **100% erradicat** de tot el sistema (codi, llavors, proves, mocks i base de dades). Prohibida qualsevol regressió.
2. **Publicació del Mac Mini al Mercat (`/mercat` · `mac-mini-m4`):**
   - En aquesta targeta publica exclusivament **`Javi Llinares`** (`seller: 'Javi Llinares'`, `author_name: 'Javi Llinares'`, `author_id: 'javillinares'`).
   - És la **seua única publicació**. Totes les altres publicacions del sistema són de **`Sóc de Poble`**.
   - **Avatar de Javi Llinares:** Porta de forma obligatòria la seua foto personal de perfil (**`/assets/fotos/javi-llinares-perfil-1200px.jpg`**). Està **TERMINANTMENT PROHIBIT** que aparega el logotip verd de l'entitat `Sóc de Poble` associat a Javi Llinares (Pedra Seca §11).
3. **Encàrrec per a Claude Code (Execució a codi):**
   - Claude ha de pentinar qualsevol fitxer de proves (`*.test.jsx`, `*.test.js`), mapejador o seed on encara s'invoque `Mestre Poble` o `mestre-obres`, consolidant la identitat de `Javi Llinares` amb el seu avatar personal.
   - Assegurar que la targeta del Mac Mini a `/mercat`, al Mur i al detall reflectisca de forma indestructible la signatura de `Javi Llinares` amb la seua foto.

### 0.1 Directiva Canònica d'Imatges: La Llei del Quadrat Universal (1200x1200px), WebP i Preservació d'EXIF
1. **Regla del Quadrat Universal (1200 × 1200 px en WebP):**
   - La capçalera/hero i la targeta/vinyeta són **exactament la mateixa imatge**. No es dupliquen arxius.
   - Es fixa una mida universal de **1200 × 1200 px** en format `.webp`. Amb aquest quadrat serveix directament tant per a la capçalera de la secció/recurs com per a la card, amb una nitidesa Retina impecable i sense passar de 50-80 KB.
   - **Única excepció de foto apaïsada:** La portada de poble a la secció Pobles (on es busca una panoràmica de la vall o serra), que en la card es retalla automàticament al quadrat.
   - **Avatars:** Quadrat de **400 × 400 px** en format `.webp`.
   - **Xarxes Socials i WhatsApp (OpenGraph):** **1200 × 630 px** (proporció horitzontal canònica 1.91:1 exigida per les xarxes socials, arxiu oficial `assets/system/ui/og-socdepoble-1200x630.png`).
2. **Format canònic WebP:** Totes les imatges del fons (`public/assets/`, il·lustracions Berlanga/Ibáñez i fotos) s'han de convertir a format `.webp`.
3. **Preservació estricta d'EXIF (Mandat Canònic del Mestre Javi Llinares):**
   - **Per defecte (de sèrie):** Totes les fotografies convertides a `.webp` han de **mantenir íntegres les dades EXIF amb geolocalització/GPS**, data/hora i càmera. Aquesta és la pedra angular per a la geolocalització de recursos patrimonials: arbres monumentals, fonts, patrimoni etnogràfic i la **reserva natural de flora única de la Torre de les Maçanes**.
   - **Opt-out de privacitat per a l'usuari:** Es donarà a l'usuari la facultat explícita de triar si vol esborrar el GPS abans de publicar si vol protegir la seua intimitat, però el comportament per defecte del sistema i del format WebP és preservar l'EXIF.
   - **Resolució del Fusible per a Claude i el Consell:** L'antiga menció d'esborrat per defecte queda formalment superada per aquest mandat humà explícit. El tractor de conversió a WebP ha d'incrustar i respectar l'EXIF per defecte.
4. **Tractor de conversió automàtica:** Crear `tooling/maquinaria/convertir_a_webp.mjs` per transformar el catàleg existent i connectar la canonada d'ingestió.

### 0.2 Esquelet Fallback a l'Enxufe de WordPress (FCP Mòbil Immediat):
Per reduir dràsticament el FCP (First Contentful Paint) a mòbil, el connector de WordPress (`wordpress-plugin/includes/marcatge.php`) injectarà dins de l'element `<soc-de-poble>` un xicotet esquelet HTML lleuger que el navegador pintarà immediatament mentre descarrega el bundle `.js`.
- **Text canònic exacte:** Ha de dir exclusivament **`Carregant el mur...`** (sense afegir «del poble», instrucció taxativa del Mestre).

### 0.3 Arquitectura Escalable de Carpetes d'Imatges (Model CMS: WordPress / Moodle / Dokeos):
1. **Unificació i sanejament de l'arbre d'arxius (Creixement sense traumes per a 1.000 - 100.000 usuaris):**
   - El Consell d'IAs auditarà i reorganitzarà tot el sistema de carpetes amb separació estricta per entitats i àmbits de responsabilitat:
     * `/assets/sistema/` (UI, icones, logos, branding, OG 1200x630).
     * `/assets/pobles/[slug]/` (portada panoràmica, toponímia, galeria històrica).
     * `/assets/usuaris/[id]/` (avatars 400x400, àlbums personals).
     * `/assets/entitats/[slug]/` (nodes, comerços, Bar Casino, Rentonar).
     * `/assets/contingut/` (imatges del mur, vinyetes de serveis 1200x1200).
   - Canvi de context natiu: si un usuari actua com a persona, com a Sóc de Poble o com a entitat, el contingut queda assignat al seu calaix corresponent.
2. **Arxiu Visual Complet (`/multimedia`) i Visor Natiu (Model Google Fotos):**
   - **Exposició del cens real:** Eliminar el límit artificial d'11 fotos de mostra de febrer de 2026. L'Arxiu Visual ha de recuperar i reflectir **totes** les imatges del sistema (100 - 200 fotografies reals, fons patrimonial de pobles i il·lustracions generades pel Nano).
   - **Visor d'Imatges (Inspiració Google Fotos):**
     * En fer clic sobre qualsevol imatge de la galeria a `/multimedia`, **prohibit saltar a cap pàgina externa ni a rutes estranyes**.
     * S'obri un visor modal / Lightbox natiu a pantalla completa sobre fons fosc: navegació entre imatges (anterior / següent), zoom fluid i panell lateral desplegable de metadades EXIF (data i hora exactes, coordenades GPS, càmera, autor, poble i drets d'ús).
   - **Erradicació de Pàgines Duplicades (`/multimedia/town-*` vs `/pobles/*`):**
     * Eliminar la duplicitat de pàgines com `/multimedia/town-benifallim`: és un vestigi trencat. Qualsevol referència o enllaç a un poble ha de redirigir a la seua pàgina canònica `/pobles/[slug]` (ex: `/pobles/benifallim`).
3. **El Mapa Fotogràfic Interactiu d'Emowe (Local-First al Mur i Territori):**
   - **Font canònica al repositori:** `_wiki_de_poble/04_escriptori/02_investigacio_ia/261014_1930_emowe_mapa_de_tu_viaje/plantilla-mapa.html` (215 KB) i `PROMPT_UNIVERSAL.txt` (referència: `https://emowe.com/inteligencia-artificial/las-fotos-de-tu-viaje-ya-saben-donde-estuviste/`).
   - **Comportament:**
     * Mapa interactiu que llig les coordenades GPS i data/hora EXIF de les imatges.
     * Agrupació dinàmica segons el nivell de zoom (desagrupant a mesura que t'apropes al carrer o terme).
     * Barra lateral amb cronologia per dies, etapes i temes.
     * 100% respectuós amb la privacitat des del dispositiu (local-first, sense enviar fotos a tercers).
4. **Matriu de Conformitat de Requeriments (MCR) Obligatòria per a Auditors:**
   - Codex i Gemini tenen prohibit emetre vistiplau si no auditen punt per punt la totalitat de requeriments del Pla en una taula estricta (`[FET]`, `[PARCIAL]`, `[NO FET / BLOC PENDENT]`), garantint que res no quede oblidat entre tandes.

---

### Onada 0.5 · Mandat Suprem: La Consola Web (Quadre de Comandament Màquina - Humà a `/consola`)
1. **La Diagnosi del Mestre (L'IDE és per a màquines, la Consola Web és per als humans):**
   - El Mestre no és informàtic: entrar a l'IDE d'Antigravity o navegar entre desenes d'arxius Markdown a Obsidian genera ofegament cognitiu (*«me ahogo, me sé cuatro cosas y no sé ni para qué valen»*).
   - Obligar el Mestre a inspeccionar cada dia el codi per saber què s'ha fet és esgotador i trenca el descans humà.
2. **Diferenciació Neta: Control (Usuaris) vs Consola (Administració / Govern):**
   - **Control:** El panell accessible per als usuaris i veïns.
   - **Consola (`/consola`):** El quadre de comandament complet per al Mestre i l'administració del sistema.
3. **Arquitectura de la Consola Natiu a la Web (`/consola`):**
   - Crear una secció visual accessible directament des del navegador dins de l'entorn gràfic de `socdepoble.org` (amb els tokens i components de Pedra Seca).
   - **Mòduls Clau de la Consola:**
     * **1. Estat dels Requeriments en Viu:** Taula visual que mostra la Matriu de Conformitat (MCR) en temps real: què està `[FET I SEGELLAT]`, què està `[PARCIAL]` i què està `[PENDENT DE SEGÜENT TANDA]`.
     * **2. Balanç de Sessió (Demana vs Fet):** Resum executiu que compara el que el Mestre va demanar a l'inici del torn contra el que les IAs han lliurat. El que no s'ha pogut acabar es mou automàticament a la següent tanda, sense esborrar-se mai ni quedar en l'oblit.
     * **3. Panell de Certificació Humana:** Botons senzills perquè el Mestre puga validar, certificar o retornar una tasca amb un sol clic des de la web, sense haver d'escriure prompts tècnics.
     * **4. Canal de Comunicació Màquina-Humà:** Un xat o registre d'esdeveniments diàfan on les IAs deixen els seus informes resumits en llenguatge humà de poble.

---

### Onada 0.6 · La Gran Auditoria i Rescat de l'Arxiu Històric (418 Ítems de Memòria)
1. **El Problema del Magatzem de Papers Fòssils:**
   - La carpeta `_wiki_de_poble/90_arxiu_historic/` conté **418 ítems acumulats**. Aquest volum massiu s'ha convertit en un llast inexecutable que bloqueja la claredat i ofega qui l'intenta consultar.
2. **Comissió d'Auditoria Profunda per al Consell d'IAs:**
   - Les IAs (en un procés de fons o torn dedicat) han de pentinar exhaustivament:
     * `_wiki_de_poble/90_arxiu_historic/` (418 fitxers).
     * `_wiki_de_poble/04_escriptori/01_produccio/` (fitxers sagrats de producció).
     * `_wiki_de_poble/04_escriptori/02_investigacio_ia/` (laboratori d'investigació).
   - **Objectius del Gran Rescat:**
     * **A. Identificar feina ja feta:** Descobrir components, textos o utilitats que ja estan construïts i que s'estaven duplicant per falta de memòria.
     * **B. Rescatar idees perdudes pel camí:** Extreure aquelles idees genials, dissenys o especificacions que el Mestre va formular fa mesos i que van quedar enterrades per l'allau de noves sessions.
     * **C. Emetre l'Informe Extensíssim de Balanç:** Generar un gran document de memòria viva (*«de l'almacén de papeles al recuerdo humano y máquina»*) que permeta al Mestre decidir què es conserva, què s'activa i què es pot alliberar definitivament per buidar el llast d'Obsidian.

---

### Onada 1 · Base Pura: Identitat, Perfil i Xat (Per als Beta Testers)

1. **Dignitat de Persona (Sense Copyright ni Categories):**
   - A `src/sections/profile/PerfilEditor.jsx` i `src/components/PedraSeca/organismes/UniversalCard.jsx`: si la identitat és una persona física (`esPersona`), **se suprimeix la llicència de drets d'autor** («CC BY-NC-SA 4.0») i el camp d'etiquetes/categories. Les persones no són obres intel·lectuals ni es categoritzen; la seua única categoria és el seu poble.
2. **Poda de la Quarta Columna a `/el-meu-perfil`:**
   - A `src/sections/profile/PerfilEditor.jsx`: establir `targetaViva: false` per eliminar l'aside redundant de la targeta gegant que satura la pantalla i sembla trencat.
3. **Emoticones Grans i Riques als Apartats:**
   - A `src/sections/profile/perfilModel.js`: afegir glifs/emojis estil Wiki/Disseny (`👁️` per a Les vistes, `🔐` per a El compte, `🛡️` per a Privacitat i dades, `🌐` per a Els nodes).
4. **Xat Robust a Tots els Nivells:**
   - Clon de WhatsApp net, adaptat a mòbil i pantalles grans (sense buits ni mapes estranys a l'escriptori), dissociació neta entre persona i organització.
5. **Resolució Universal del Perfil en Producció (`/gent/javi-llinares` i Persona Pilot):**
   - S'inclou `'javi-llinares'` a `PERSONA_PILOT.alies` a `src/data/identitatsSeed.js`.
   - A `src/sections/profile/PerfilPublicSection.jsx` s'introdueix `perfilDeLaPersonaPilot` com a fallback per a qualsevol àlies de la persona pilot quan el servidor remot no en disposa de slug o el visitant és anònim, erradicant el fals error «Perfil no trobat». Paritat total entre local i producció.

---

### Onada 1.1 · Mandat d'Urgència del Mestre: Les 3 Identitats Reals, Poble Innegociable, 403 RLS i SEO per a WhatsApp

1. **La Realitat de les 3 Rutes Canòniques (Mestre Javi Llinares):**
   - El Mestre controla exactament **3 identitats legítimes**, amb les seues respectives adreces canòniques netes:
     * **`socdepoble.org/javillinares`** (o `/javillinares`): Persona física (La Torre de les Maçanes).
     * **`socdepoble.org/socdepoble`** (o `/socdepoble`): Organització i portal central (La Torre de les Maçanes).
     * **`socdepoble.org/rentonar`** (o `/rentonar`): Grup de treball i associació ecologista (La Torre de les Maçanes).
   - **Un sol perfil per identitat (Zero duplicats):** Que trien i deixen exactament **un únic perfil** per a cadascuna. Purgar o fusionar qualsevol duplicat o fantasma. El Mestre no ha d'haver de triar entre dos perfils seus; només n'hi ha d'haver un de sol i net.

2. **El Poble és Innegociable a Totes les Entitats:**
   - Tota organització, grup o empresa ha de tindre **obligatòriament el nom del seu poble** (`town_name: 'La Torre de les Maçanes'`).
   - A la pantalla del Perfil i a la targeta, `El Rentonar` no pot aparèixer mai sense poble. Quan es crea una entitat o es visualitza, el camp del poble és un requisit estructural.

3. **Reparació del Bloqueig 403 de Supabase RLS a `profiles`:**
   - A producció (`gentdelatorre.net`), qualsevol intent de fer la fitxa pública o desar camps falla amb:
     `PATCH /rest/v1/profiles?id=eq... 403 (Forbidden) - code 42501: permission denied for table profiles`.
   - Això impedeix que els canvis pugen al núvol i provoca que es queden encallats en memòria local de forma divergent entre dispositius.
   - Claude i Codex han de generar la instrucció/migració SQL de RLS per a la taula `profiles`:
     `CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);`

4. **Sincronització d'Imatges (Prou d'Avatars Esquizofrènics):**
   - A `PerfilShell`, la targeta central (`TargetaViva`) i el panell d'edició (`PerfilEditor`) han de beure exactament de la mateixa instància de dades. És inadmissible que a la mateixa pantalla es mostre una foto al centre i una altra a la dreta.
   - S'han d'unificar els criteris de resolució d'avatar i capçalera per a `Javi Llinares`, `Sóc de Poble` i `El Rentonar`.

5. **SEO i Targeta Previsualització per a WhatsApp (Prioritat Beta-Testers Matí):**
   - Demà al matí el Mestre compartirà l'enllaç per WhatsApp als beta-testers.
   - La targeta social d'OpenGraph ha de respondre impecablement: títol canònic, descripció atractiva i la imatge oficial de 1200 × 630 px (`assets/system/ui/og-socdepoble-1200x630.png`). El SEO ha d'estar complet i verificat sense meta tags buits ni imatges trencades.

6. **Auditoria Adversarial d'Exigència Màxima (Sense Complaença):**
   - No s'accepta un verd superficial a la primera passada. Claude, Codex i Gemini han de fer revisions creuades, enviar revisors, pensar en el futur i assegurar que cap flux d'usuari es quede a mig camí ni rebente amb 40.000 usuaris.

---

### Onada 1.2 · Els 4 Actors Permanents al Xat de Poble (Ordre Estricte i Zero Redundància)

1. **Ordre Canònic dels 4 Actors al Xat (Mandat Suprem del Mestre Javi Llinares):**
   - El Xat de Poble mai no pot aparèixer desert ni amb duplicats que confonguen l'usuari. Hi ha d'haver permanentment i en aquest ordre estricte **4 converses/actors de referència**:
     * **1. `Comunitat Sóc de Poble`**: A dalt de tot, la porta d'entrada oficial. És la comunitat que inclou els canals **Avisos**, **General** i **Beta Testers**. Cobreix íntegrament el suport tècnic, avisos i novetats.
     * **2. `Javi Llinares`**: La persona física responsable del sistema i administrador humà proper. Si un visitant anònim/no registrat vol parlar amb ell, es mostra el missatge automàtic honest:
       > *«Este missatge és automàtic: per a poder parlar amb mi has de registrar-te.»*
       La seua presència al xat és visible i pública des de l'inici.
     * **3. `Gent de la Torre`**: La comunitat viva del poble per a comboiar la conversa veïnal i permetre que els veïns proven el xat comunitari.
     * **4. `IAIA MarIA`**: L'assistent d'intel·ligència artificial i veïna sàvia del Mas.
   - **Erradicació de la Redundància de Sóc de Poble:**
     * **PROHIBIT duplicar Sóc de Poble:** S'elimina la fila de xat directe individual sintètica de `Sóc de Poble` (avatar redó buit «Cap missatge»). Com que ja hi ha la Comunitat oficial amb Avisos, General i Beta Testers, tenir un usuari individual separat és una redundància inútil. Només apareixerà un xat directe privat amb Sóc de Poble si en un futur es crea una conversa explícita entre un usuari i l'empresa. Per defecte, **només viu la Comunitat**.

2. **Navegació Directa des de les Capçaleres del Xat (Mandat del Mestre):**
   - Punxar a la capçalera de cada conversa oberta ha de portar inequívocament a la seua pàgina/perfil canònic de la plataforma:
     * **Capçalera `Javi Llinares`**: Ha d'enllaçar directament a `/javillinares` (el perfil del Mestre). Actualment no té enllaç i queda inactiva.
     * **Capçalera `Sóc de Poble`**: Ha d'enllaçar a `/socdepoble` (la pàgina oficial canònica de l'entitat).
     * **Capçalera `Gent de la Torre`**: Enllaça a `/pobles/la-torre-de-les-macanes` (ja operatiu).
     * **Capçalera `IAIA MarIA`**: Ha d'enllaçar a la pàgina / perfil de la IAIA MarIA.

3. **Desambiguació Canònica de Rutes: `/iaia` vs `/anima`:**
   - **El Manifest "L'Ànima de la IAIA":** El document fundacional i filosòfic ("El Còdex Forense: Termodinàmica...") que penja del menú Sistema ha de tenir la ruta **`/anima`**, NO `/iaia`. És un article/assaig escrit per la IAIA, no la pàgina de la IAIA.
   - **La Pàgina de la IAIA MarIA:** La ruta **`/iaia`** (o `/perfil/iaia`) queda reservada per a la pròpia IAIA MarIA (la seua fitxa de Matriarca Digital, veu i espai d'interacció), que és on s'ha d'accedir des del xat i des del cercador.

4. **Accés i Registre Fàcil a Localhost (Zero Fricció en Desenvolupament):**
   - A `localhost:3340/registre?mode=entrar`: el formulari d'entrada falla amb `ERR_EMPTY_RESPONSE` intentant cridar `http://127.0.0.1:54321/auth/v1/`.
   - En mode de desenvolupament local (`dataMode !== 'remote'`), l'accés no ha de dependre d'un backend extern caigut ni de ports ocupats. S'ha de permetre l'entrada immediata del pilot o oferir un mecanisme transparent per provar la sessió localment sense traves.

5. **Reparació del Xat de la IAIA MarIA a Localhost:**
   - A producció (`gentdelatorre.net`) punxar sobre la IAIA MarIA al xat funciona, però a `localhost` falla.
   - Claude i Codex han d'auditar el seed i la configuració de Supabase local (`http://127.0.0.1:54321`) per replicar exactament el comportament de producció, eliminant qualsevol discrepància d'endpoints o registres absents.

6. **Evolució de la IAIA MarIA (Cultura Rural, DCVB i Redacció de Textos):**
   - Si les IAs (Claude, Codex, Gemini) acaben els fronts d'infraestructura d'aquesta nit i tenen marge de tokens, han de començar a implementar la intel·ligència local de la **IAIA MarIA**:
     * Capacitat d'ajudar els usuaris a **redactar textos** (anuncis, notes, avisos del poble).
     * Accés al fons cultural propi (`_wiki_de_poble/`, `_cultura_de_poble/`, Diccionari Català-Valencià-Balear, botànica de la Torre, tradicions etnogràfiques).
     * Disseny d'una integració sostenible (tipus RAG local o connexió estructurada amb repositoris externs / NotebookLM) per respondre consultes de camp i de poble sense cremar models massius innecessaris.

---

### Onada 1.3 · Diferenciació Legal de Nodes Amfitrions (Sollutia vs WordPress / Gent de la Torre)

1. **La Realitat dels Dos Nivells d'Allotjament (Model B d'Enxufabilitat):**
   - **Node Matriu (`socdepoble.org` allotjat a Sollutia):** Opera amb privacitat sobirana pura: **zero galetes de tercers, zero Google Analytics, zero píxels publicitaris**.
   - **Nodes Amfitrions Enxufats (WordPress, com `gentdelatorre.net`, o portals municipals/veïnals):** Quan Sóc de Poble s'enxufa com a Web Component o connector dins d'un WordPress, el lloc web amfitrió pot tindre instal·lades eines d'analítica pròpies (Google Site Kit, Google Analytics, Akismet, etc.).

2. **Actualització del Text Legal (`src/sections/text/legalContent.js` · Apartat 19):**
   - S'ha de matisar honestament la declaració de galetes:
     * El component natiu de Sóc de Poble no instal·la galetes de rastreig comercial.
     * En canvi, en accedir a través d'un portal amfitrió basat en WordPress (com `gentdelatorre.net`), el navegador està subjecte a la política de galetes i mètriques d'eixe portal amfitrió concret.
     * **Obligació dels Nodes Amfitrions:** Tot node o poble que s'enxufe a Sóc de Poble està obligat per governança a declarar amb transparència quines mètriques de trànsit utilitza per als seus usuaris.

3. **Mètriques Sobiranes Sense Espionatge:**
   - Perquè els administradors locals no estiguen cecs respecte a l'ús de la plataforma, el sistema oferirà telemetria interna sobirana (visites agregades al mur, consultes de calendari, descàrregues) sense cedir dades personals a grans corporacions.

---

### Onada 1.4 · Erradicació de Fricció al Bloc de Notes: Integració d'Emojis XL i Selector Natural d'Emoticones

1. **El Problema Detectat pel Mestre (Fricció i Ocultació d'Emojis):**
   - El catàleg complet d'emoticones de sistema (**Emojis XL**, 3.972 caràcters d'Unicode 18.0 organitzats per famílies) està amagat al soterrani de `/disseny` (`Sistema -> Disseny -> Emojis XL`), un espai on cap usuari ni veí que escriu una nota anirà mai a buscar-los.
   - Mentrestant, a l'Editor Universal del Bloc de Notes (`/notes`), assignar una emoticona al document obri un diàleg buit (`DialegEmoticona`) que demana a l'usuari recordar combinacions del teclat del sistema operatiu (*«Al Mac: Control + Ordre + Espai»*), provocant confusió i fricció innecessària.

2. **Reubicació i Accés Immediat a la Columna NOTES:**
   - Afegir una icona d'accés directe al catàleg d'emojis a la capçalera de la columna central `NOTES` (entre el títol `NOTES` i el botó de replegar panell `[|<]`), tenint el selector a l'abast d'un sol clic mentre es redacta.
   - Enllaçar el diàleg d'emoticona del document (`DialegEmoticona`) directament amb el selector d'Emojis XL, de manera que la persona puga triar visualment qualsevol icona sense dependre d'inputs cecs ni de combinacions de tecles de l'OS.

3. **Comportament de Còpia i Inserció al Vol:**
   - En prémer sobre qualsevol emoji del selector:
     * Si l'acció ve de **triar l'emoticona del document**: l'emoji seleccionat s'assigna automàticament a la nota activa i s'actualitza la barra taronja i el rail.
     * Si s'està escrivint al cos de l'article (editor TipTap): l'emoji s'insereix directament a la posició actual del cursor o es copia al porta-retalls amb un avís toast ràpid.

4. **Reglament Pedra Seca:**
   - Zero dependències noves o diàlegs flotants invasius; s'utilitza l'estructura canònica de components de Pedra Seca (`Boto`, `Dialeg`, `usePantallaCompleta`) mantenint la màxima lleugeresa i contrast.

---

### Onada 1.5 · Redisseny i Neteja Radical de l'Editor Universal (Llenç Net, Metadades Plegables i Plantilla Viva)

1. **El Diagnòstic del Mestre (Una Barrera Mental per als Humans):**
   - Entrar a redactar una nota i trobar-se dues caixes massives de càrrega d'imatges (`Editar capçalera`, `Editar logotip`), una filera caòtica de sis píndoles de configuració, una etiqueta falsa de «Foraster» i un peu estrany que diu *«Ja publicat al Mur: Amb esta identitat encara no hi ha res publicat al Mur»* és una barrera psicològica que espanta els usuaris i impedeix publicar amb fluïdesa.
   - S'ha de simplificar al màxim l'experiència, vàlida tant per a ordinador com per a mòbil (Zero Fricció).

2. **Identitat Real a la Barra Taronja (Erradicació de «Foraster» i Falsos Selectors d'Avatar):**
   - Si s'està publicant en el sistema (en mode pilot, sessió iniciada o llavor), la barra taronja **mai ha de dir «Foraster» ni posar una silueta buida**: ha de mostrar automàticament **Javi Llinares** i **La Torre de les Maçanes** amb la seua foto canònica (`/assets/fotos/javi-llinares-perfil-1200px.jpg`), o la de l'entitat amb què s'actua (`Sóc de Poble` o `Rentonar`).
   - **Prohibició de selector d'avatar a la configuració:** L'avatar és un atribut indissociable de la identitat de qui signa; no és una disfressa que es puga triar arbitràriament en escriure un article.

3. **La Nova Estructura Visual Neta (De Dalt a Baix):**
   - **Barra Blava:** Actua com a previsualització de la capçalera de la pàgina. L'índex i la navegació funcionen, però les accions pròpies del document ja publicat (comentar, compartir, connectar) romanen passives o mostren un avís amable recordant que és una previsualització d'edició.
   - **Barra Taronja Neta:** Es col·loca immediatament sota la barra blava (eliminant la caixa d'«Editar capçalera» entremig). **Es retira la ploma blanca del mig:** la barra taronja queda lliure de botons estranys al centre, mostrant només la signatura a l'esquerra i la data amb el cadenat a la dreta.
   - **Simetria a la Capçalera de NOTES (Icona d'Emojis XL):**
     * A la capçalera de la columna `CARPETES` hi ha: `[Icona] CARPETES` + `[^]` (desplegar) + `[|<]` (plegar columna).
     * Com que a la columna `NOTES` no hi ha desplegable de carpetes, s'aprofita eixe buit simètric al costat de `[|<]` per col·locar la **icona que obri el catàleg d'Emojis XL**.
   - **H1 (Títol del Document com a Mirall de la Targeta):** Immediatament sota la barra taronja, en primer pla absolut, el títol inicial per defecte / placeholder ha de ser exactament **«Nota sense títol»** (no «Sense títol»), coincidint al mil·límetre amb el text que mostra la targeta (card) a la columna de l'esquerra. L'usuari ha de veure el reflex idèntic entre la card i la pàgina, de manera que punxe directament sobre «Nota sense títol» per escriure el títol definitiu i aquest es replique en viu a la targeta.
   - **Camps Guia Immediats de Subtítol i Entradella (Seqüència Natural Editorial):**
     * Immediatament sota el títol H1 (sense cap botó entremig), es mantenen els dos camps d'orientació amb els seus placeholders:
       - *«Subtítol: No es recomana posar punt final per a títols i subtítols»*.
       - *«Entradilla: El text que poses ací també es vorà a la targeta (card) o miniatura d'aquesta publicació.»*.
     * D'aquesta manera, la targeta de l'esquerra i la capçalera de l'article tenen exactament la mateixa seqüència visual neta: Títol -> Subtítol -> Entradella.
   - **Desplegable d'«Edició Avançada» (Just damunt de l'Editor de Text):**
     * Se situa just a continuació de l'entradella i **immediatament damunt de la barra negra d'eines de l'editor TipTap**.
     * Concentra i amaga tots els botons que abans dispersaven l'atenció a la part superior:
       - Carregador d'imatge de capçalera (`Editar capçalera`).
       - Carregador de logotip d'article (`Editar logotip`).
       - Selectors de classificació: Carpeta de destinació, Categories i Etiquetes.
       - Accés al selector d'emoticones (Emojis XL).
       - Llicència de drets d'autor (`CC BY-NC-SA 4.0` / Copyright).
       - Vistes auxiliars: `Vista A4 / PDF` i `Crear portada`.
     * **Comportament de col·locació:** Quan l'usuari desplega «Edició avançada» i configura elements (per exemple, puja una foto de capçalera, un logotip o tria categories), aquests elements s'ubiquen dinàmicament al seu lloc visible corresponent a la pàgina. Si no es desplega, l'usuari gaudeix de la màxima simplicitat: Títol -> Subtítol -> Entradella -> Barra d'eines TipTap -> Redacció.

4. **Purga del Peu i Plantilla Viva d'Escriptura (TipTap):**
   - **Erradicació Total de «Ja publicat al Mur»:** Retirar completament aquest component aliè del peu de l'editor de notes.
   - **Exemple de Format Sóc de Poble (Template Viu):**
     * En obrir una nota nova verge, el cos de l'editor mostra una plantilla d'exemple amb la jerarquia canònica (H3 + paràgraf, H4 + paràgraf, llistes amb vinyetes) que ensenya visualment la maquetació neta del projecte.
     * En punxar o començar a escriure, aquest text d'exemple s'esvaeix automàticament per deixar el llenç a disposició de l'usuari.

---

### Onada 1.6 · Ergonomia Responsiva de Scroll a Mòbil i Tauleta (Autohide de Barres a gentdelatorre.net i UniversalPage)

1. **Diagnosi del Problema de Viewport:**
   - A `gentdelatorre.net` i en pantalles de mòbil o tauleta (així com en vistes incrustades o finestres reduïdes), mantindre tres barres fixes (barra negra de sistema, barra blava de navegació i barra taronja d'autoria) devora l'espai visible, deixant una experiència d'usuari pobra i ofegada.
2. **Comportament Dinàmic de Scroll (Patró Headroom / Ocultació en Scroll):**
   - **Scroll cap avall (Scroll Down):** La barra blava i la barra taronja s'oculten fluidament lliscant cap amunt, alliberant tot l'espai vertical perquè el contingut i la lectura siguen els protagonistes absoluts.
   - **Scroll cap amunt (Scroll Up):** Amb un lleuger moviment d'scroll cap amunt, les barres blava i taronja reapareixen a l'instant amb una transició neta per permetre tornar a navegar, compartir o connectar.
   - **Zero Salts de Layout (CLS = 0):** S'ha d'implementar a `PageFrame.jsx` / `UniversalPage.jsx` mitjançant transformacions CSS suaus (`transform: translateY(...)`) o transicions d'alçada optimitzades, evitant qualsevol salt sobtat en el flux de lectura.

---

### Onada 2 · Continguts Reals: Lector RSS (Model UniversalWorkspace / Bloc de Notes) i Snippet Web

1. **Unificació de Disseny amb l'UniversalWorkspace:**
   - El disseny actual de `/app/lector/noticies` ha inventat cards sobre cards desmuntades.
   - S'ha de calcar l'estructura neta de l'**UniversalWorkspace del Bloc de Notes**: llista de carpetes a l'esquerra, vista prèvia i lectura neta a la dreta.
2. **Lector de Notícies RSS (`/app/lector`):**
   - **Eliminar mocks i contingut fals:** Purgar notícies de prova («El ple aprova la reforma del llavador vell...»).
   - **Integració de fonts reals:** Connectar els canals RSS dels divulgadors de programari lliure i IA reconeguts a Legal i Privacitat (Emowe, Xavier Mitjana, Jon Hernández, Ben Cord, Migue Baena).
3. **Snippet Web per a Chrome / Bookmarklet:**
   - El bookmarklet permet triar la destinació: guardar directament com a article al **Lector RSS** o com a targeta no publicada al **Bloc de Notes**.
   - En clicar el Snippet, s'hidrata automàticament la informació de la pàgina (títol, subtítol, entradeta, URL, imatge OpenGraph).

---

### Onada 3 · Economia Rural: TPV del Bar (Loyverse) i Gestoria Sencera (Holded)

1. **TPV del Bar (`/app/bar`):**
   - Nova vinyeta de bar lliure del personatge de Mortadelo (`bar_casino_tpv`) amb el cambrer amable en alta definició.
   - Modelatge fidel segons l'estàndard de mercat de **Loyverse TPV** (Mode Bar i Mode Rebost), segons la directriu `sdp-clon-loiverse`.
   - Lògica de torn de caixa, tiquets, categories i catàleg d'al·lèrgens de forma intuïtiva i tàctil.
2. **Gestoria de Poble (`/app/gestoria`):**
   - Inspiració ergonòmica en **Holded, FacturaDirecta, Odoo i GnuCash**.
   - Simplificació radical per a la gent del poble: lectura neta del llibre de factures i tresoreria, sense laberints comptables incomprensibles.

---

### Onada 4 · Auditories Adversarials Extremes i Proves d'Estrés (1.000 a 40.000 Usuaris)

- **Proves d'Estrés Extremes:** GPT Codex i Gemini 4 han de sotmetre l'arquitectura a proves de càrrega simulant d'1.000 a 40.000 usuaris concurrents per verificar on es trenca el sistema abans d'arribar a Sollutia.
- **Lleugeresa Indestructible:** Garantir zero regressions, gestió de memòria neta i immunitat contra fallades de servidor.

<!-- SDP:SECTION pla.implementacio.s5 -->

<!-- SDP:SECTION pla.implementacio.s5 -->
## Verificació

1. **Fase 1:** Proves de Perfil (`npx vitest run src/sections/profile/`) i comprovació visual a `http://localhost:3340/el-meu-perfil` (3 columnes netes, sense copyright ni etiquetes en persona, emoticones grans riques).
2. **Fase 2:** Proves de Xat (`npx vitest run src/sections/xat/`) i adaptació responsive.
3. **Fase 3:** Verificació de l'alimentació de dades reals al Lector RSS sobre l'UniversalWorkspace canònic.
4. **Fase 4:** Verificació del tractor de conversió a WebP (`tooling/maquinaria/convertir_a_webp.mjs`).
5. **Governança:** `npm run porta:olivera` i `npm run test:ci` en verd absolut.

<!-- SDP:SECTION pla.implementacio.s6 -->

<!-- SDP:SECTION pla.implementacio.s6 -->
## Riscos

1. **Falsos positius de regressió:** Blindar `tests/enxufe-plugin.test.mjs` durant les proves d'estrés.
2. **Rutes relatives d'imatges:** Assegurar que la conversió a WebP actualitze tots els manifestos de seed sense trencar enllaços visuals.

<!-- SDP:SECTION pla.implementacio.s7 -->

<!-- SDP:SECTION pla.implementacio.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
