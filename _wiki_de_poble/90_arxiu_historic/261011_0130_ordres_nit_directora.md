---
type: document
status: canonic
description: Ordres per a Claude (Fable) - Treball de guàrdia autònom.
---

# Ordres de la Directora Tècnica (IAIA) per a Fable: Operació Neteja i Integració (Onada 12)

*Sessió autònoma de nit. El Mestre dorm. Aquest document resol l'Auditoria `261010_1741_auditoria_claude.md` íntegrament.*

Fable, el teu deure aquesta nit amb l'excedent de tokens que tens és fer brillar l'arquitectura i tancar forats de fallades menors, netejant i integrant els recursos visuals. Segueix el pla amb determinació sense aturar-te per demanar permís: les decisions estan preses per mi a continuació.

### Objectius i Encàrrecs de la Nit

**1. Auditoria Adversarial Extrema (Pàgina per Pàgina):**
Consumeix tokens analitzant *tota* la web renderitzada o l'estat dels seed i les connexions. Volem caçar duplicitats o anomalies en dades fantasma o artefactes antics com el que ha trobat el Mestre: hi ha dos "Mac Mini Apple M4" duplicats (un a la targeta del mercat correcte, i segurament un erròniament colat com a arrel multimedia o arrel de l'usuari al `seed.sql` a l'id `market-0` com a tipus image/mercat on no toca, revisa la línia 13 de `supabase/seed.sql`). Neteja-ho tot.

**2. Integració Visual a la Consola i Estètica Píxel-Perfecte:**
Tens la teua disposició 18 imatges (vinyetes i nano_cards) prèviament generades i llestes al directori `_wiki_de_poble/04_escriptori/01_produccio/Targetes_Davinci_Llestes/`. Agafa-les i enceta-les als objectes de `indexConsola.js` per lligar-les a les noves targetes. 
**MOLT IMPORTANT (Llei Visual):** Totes les imatges a la Consola s'han de visualitzar sempre de forma **quadrada** (`aspect-ratio: 1/1` i `object-fit: cover` centrat). Si alguna és rectangular, es tallaran els extrems però el centre quedarà perfecte com l'avatar. A més, has de revisar l'estil CSS per **eradicar qualsevol marc blanc** (borders, fons, padding amb fons blanc darrere la imatge) a la Consola i especialment al Mur. El disseny és a sang, sense línies. Trencar açò significa trencar Pedra Seca. Fes-ho complir!

**3. Resolucions Ejecutives Immediates de les "Decisions Pendents" de l'Onada 11:**
*   **D-01 (Bloqueig de design_guard)**: Deixa una excepció per `.toc-drawer:focus` explícita al `design_guard.mjs` (marc com `ALLOW_RAW_COLOR`). Mantenim el NO anell en aquesta versió com ordenàvem ahir.
*   **D-03 (Brossa CSS i orfes)**: Esborra totes eixes regles orfes d'immediat. Llei del Píxel. Fes la dieta del DOM neta.
*   **D-09 (Avatar padró)**: Es ratifica. Es posa la foto al lloc del logo en el padró de llavor i xat on faja falta per donar aspecte humà a JAVI.
*   **D-16, D-17, D-18 (ADR BYOP)**: Un cofre compartit de moment. A WordPress NO relaxem la privacitat si el cofre és actiu. Salut usarà claus opaques on siga possible per evitar fugues laterals de meta-informació, o es mantindrà l'arquitectura bàsica si trenca codi (vull neteja no grans refactors de dades aquesta nit). 
*   **D-19 i D-20 (SEO Enxufe)**: Fes servir `?sdp=` (Mode paràmetre estricte) com marca l'ADR de Model B, activat per filtre en la taula estàtica a `dist/seo-routes.json`. 
*   **D-30 (L'antic Node)**: El Web Component `sp-identity` serà mantingut sota consulta amb Sollutia abans de tocar, però la resta de quarantenes (`.snapshots`, text públic fantasma, referències a bots antics com whatsapp i bailey's) els considerem "Esborrat diferit al post-desplegament", no t'entretingues perdent codi encara.

Amb les portes del `design_guard` alliberades amb l'excepció explícita, ja pots i deus empaquetar, fer els lints i **crear els COMMITS pertinents** de totes aquestes alteracions sense esperar demà, assegurant-te d'haver generat un paquet perfectament estanc per l'Onada 12 de purga d'errors. 

**4. El Repte de l'Iframe (Sincronització de l'History API):**
El Mestre detecta que quan naveguen dins del component Iframe, el botó "Tornar enrere" del navegador Chrome tira a l'usuari fora del portal en lloc d'anar enrere dins del web component. Fes us de la teva enginyeria adversarial: implementa la History API (pushState, popstate, etc.) dins de Sóc de Poble per sincronitzar l'estat intern amb el router de l'host. Vull una solució definitiva per a que navegar arrere al Chrome siga "Navegar arrere al Web Component" sense perdre la sessió o eixir-se.

**5. Heurístiques de Disseny (Apple Design by Emil Kowalski):**
El Mestre demana copiar sistemàticament allò que fa gran el disseny d'Apple. Llig aquests recursos que aporten la visió de l'autor Emil Kowalski:
- https://www.tododeia.com/community/emil-kowalski-skills
- https://emilkowal.ski/skill
- https://github.com/emilkowalski/skills/tree/main/skills/apple-design
Copia i adopta sense escrúpols tot allò bo que ofereixen per a millorar la UI del nostre Mur i Consola (marges, transparències, blur, feedback haptic, colors raw, perfecció atòmica). Tota la web ha de tindre el segell d'excel·lència visual immutable d'aquestes guies de disseny. Extreu tot el necessari i sigues proactiu al retocar classes CSS basant-te en el que aprens ací.

**6. Intel·ligència Empresarial (Gestoria, TPV i Rebost):**
El Mestre demana posar a treballar totes les teues capacitats analítiques. Revisa i afina el panell de la Gestoria perquè demà siga plenament operatiu. 
*Visió del Mestre per a la Gestoria:* Investiga les funcionalitats de plataformes com **Holded** i **Factura Directa**. Extreu les millors idees per a un xicotet autònom i fes que la nostra Gestoria siga fàcil, visual, escalable i "enxufable" (preparada per a futures connexions bancàries). L'objectiu final és que a final de trimestre el Mestre només haja de demanar a la IA que li endrece les factures i genere la fulla de càlcul.
Cal revisar els trimestres 2n, 3r i 4t (incloent-hi la fulla de càlcul formatada que ja li vàrem donar) i preparar el sistema per fer auditories de pagaments, analitzar despeses i categoritzar targetes de crèdit. Així mateix, lliga això al TPV i al Rebost: volem que l'estructura del Rebost siga capaç de fer recomanacions de receptes basades en els ingredients existents. Aplica els teus models empresarials i tanca les arquitectures pertinents d'estes aplicacions de Mas.

**La Directiva Suprema:** No es tolera menys que la perfecció. Exhaurix els teus tokens audint, polint i deixant la web en un estat excel·lent a tots els nivells: dades, CSS, rutes i negocis.

**7. Arquitectura Resilient i Auto-curativa (Self-Healing):**
L'arquitectura ha de ser tan sòlida com una piràmide. Mentre treballes, avalua on podem incrustar patrons de "Self-Healing". Proposa idees a la Consola o implementa millores preventives perquè el sistema s'autorepare (CSS, caiguda d'iframes, errors de dades). Addicionalment, planteja la possibilitat de programar els teus propis "Mods" (plugins) d'Auditoria com a fitxers al Mas, incloent-hi "Mods de neteja d'Escriptori" que permetin a l'Orquestradora o a tu fer batudes automatitzades intel·ligents si la porta Olivera se satura.

Endavant!
