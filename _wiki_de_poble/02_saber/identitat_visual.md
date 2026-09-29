---
type: document
status: canonic
description: Defineix la identitat visual accessible, rural i coherent de Sóc de Poble.
tags:
  - core
  - genoma
  - identitat
---
# Manual d'Identitat Visual i Narrativa (Sóc de Poble)

La marca de Sóc de Poble es construïx amb quatre colors del paisatge mediterrani, la tipografia Noto Sans i il·lustracions d'estil Bruguera a sang. Tot es pensa per a l'alt contrast: horts a ple sol i ulls cansats, no despatxos foscos.

## 1. Identitat Arrel i Narrativa
"[[el_projecte|Sóc de Poble]]" no és només una marca, és una declaració d'intencions, un acte de sobirania digital i una defensa del coneixement generacional ("El Trellat"). La nostra identitat gràfica ha d'infondre familiaritat, robustesa i calidesa rústica, allunyant-se del corporativisme algorítmic asèptic.

Sense excepció, tota comunicació visual o interfície ha d'obeir els principis d'accessibilitat d'alt contrast (pensats per a entorns solars, horts i mirades d'edat avançada), no per a despatxos foscos amb monitors HDR.

## 2. La Paleta Canònica (Pilars Escolars)
El sistema visual respon a 4 elements inalterables inspirats en el paisatge mediterrani:
- **Taronja Corporatiu Sóc de Poble:** L'argila, la teula a l'estiu, el color d'accent càlid de l'activitat humana ("La Boina").
- **Blau Normatiu / Blau Sky:** El cel obert i clar ("El Seny"), aplicat a entitats de la IA (IAIA) i elements digitals propis de sistema fred o de nit.
- **Negre Fons (Nit):** La sobrietat, l'escriptura sòlida.
- **Blanc Paper (Llum):** La calç de la paret, el llenç immaculat.

A la interfície, el taronja canònic (`#FF7300`) i el blau canònic (`#0984E3`) naixen a `src/config/design-tokens.json` i els components només els usen a través de tokens semàntics: el blau és el color de l'acció (`--sdp-accio`) i el taronja el de la identitat de marca (`--sdp-accent`). El reglament exacte és a la skill `sdp-pedra-seca`.

> [!IMPORTANT]
> És una regla biològica de la marca l'ús exclusiu d'aquests colors en la major i estricta densitat. "No mesclem ciment amb taronges". Alt contrast, contorns evidents, formes robustes.

## 3. Llei de l'Orgull Rural
- El logotip oficial (la composició tipogràfica amb o sense l'isotip) s'ha de mantenir protegit amb marges de respir ("Aires").
- Mai s'ha d'amagar o fer minúscul per motius d'estètica "minimalista" o "molt neta" (Clean Design extrem). Sentim orgull i ho mostrem en targetes principals, peus de document i capçaleres d'activació.

## 4. Tipografia de Front
Utilitzarem **Noto Sans** universalment. Va ser dissenyada per abraçar milers de caràcters de tota la humanitat, igual que l'aplicació pretén abastar les veus del camp. És un caràcter segur, gruixut a peses 700 i estable ('olivera fortificada') per a títols, i àgil a 400 per al text rutinari. Les serifs estan rebutjades fora del logotip primari de "cartell antic".

## 5. Il·lustració i Composició (Estil NANO / Bruguera)
Aquesta secció governa la creació d'il·lustracions al·legòriques de sistema. La base referencial és l'Estil "Escola Bruguera" (Ibáñez/Vázquez) combinat amb l'absurd costumista ("Berlanga").

### 5.1 Directrius Compositives Universals
- **Concepte Foto (A Sang / Sense Marcs):** Totes les il·lustracions s'han de tractar amb "concepte foto", omplint tot el llenç ("a sang"). **ESTRICTAMENT PROHIBIT afegir marcs blancs o vores estil vinyeta de còmic.** Açò trencaria l'harmonia del sistema en barrejar-se amb fotos reals.
- **Línia i Contorn:** Línia de tinta fosca ("Inked border"), traç dinàmic, imperfeccions artesanals. Sense degradats digitals de renderització 3D ("zero plàstic").
- **Densitat Bruguera + Humor Berlanga:** Els espais secundaris poden contenir gags o artefactes que reforcen el missatge. L'humor ha de ser una barreja entre l'estil Ibáñez/Vázquez (Escola Bruguera) i l'humor costumista i absurd de Luis García Berlanga.
- **Perspectiva Teatral:** Els personatges tenen pes ("cauen sobre la terra"), plenes cares expressives i deformacions còmiques en els moments d'alta intensitat d'acció de l'app.
- **Puresa Localista:** No s'acceptaran referències globals tipus "downtown urbà" nord-americà. Els mons pertanyen a un territori d'alqueries, esmorzars (entrepans macissos), i bancals.

### 5.2 El Prompt Mestre "Nano" (Límit de Vies Roges)
L'ús de la visió de màquina/IA Generativa de dades (Imatge) al projecte Sóc de Poble ha de seguir regles estrictes de text i enquadrament.

**L'algoritme estructural per Prompting (Només Valors):**
1. **[TÈCNICA]:** Dibuix a tinta còmic estil Ibáñez (Escola Bruguera) amb tocs d'humor de Berlanga. Imatge a sang (full bleed), sense vores blanques ni marcs de còmic. Colors plans tipus gouache, límit CMYK limitat (no fosforescents).
2. **[SUBJECTE]:** Agricultor o Iaia valenciana de 80 anys vestida amb jupetí rebec/davantal de treball.
3. **[ACCIÓ]:** [Acció descriptiva detallada, ex: muntant un mur de pedra seca damunt de servidors lluminosos].
4. **[REGLA ESTRICTA DE TEXT]:** Si s'afegeixen paraules, deuen estar **ÚNICA I EXCLUSIVAMENT EN VALENCIÀ**. Si no es pot garantir, millor NO incloure text (Zero Text Rule). Marge: NO s'accepten vores blanques.

### 5.3 Gestió de Casos Visuals (Successos, Èxits, Càrrega)
A l'hora d'incorporar aquests estats en les interfícies:
- **Estat de Càrrega (Espera):** Evitar cercles tristos rodant. Preferim un tractor o una mula, línies clàssiques.
- **Error (Empty State):** Un "bancal assedegat" o una cadira buida davant del portal.
- **Èxit de Subvenció/Treball:** Un gran esmorzar a taula llest, colors ataronjats vitals ("Taronja Sóc de Poble").

> [!WARNING]
> La "Signatura Gràfica". Tota imatge corporativa d'ús final deu contindre en la segona capa o postproducció el Logotip Sóc de Poble. Un segell d'aigua de confiança i denominació d'origen.

## 6. La Barra Taronja: data, emoticona i icones (Pedra Seca)

Regles dictades pel Mestre el 28-09-2026 per a totes les barres taronja (pàgina, editor i caputxa de targeta):

- **La pastilla de data és sempre present i sempre plena.** Cap document existix sense data: tot té una data de creació. En **mode lectura** la pastilla mostra la data de creació o, si el document s'ha modificat o versionat, la data d'eixa última versió. En **mode edició** mostra la data i l'hora d'ara. No hi ha guionets ni pastilles buides, perquè la data mai no falta.
- **L'espai central és l'emoticona del document.** En mode edició sempre hi ha un botó: si no s'ha triat cap emoticona, mostra la ploma blanca perquè es puga punxar i triar-ne una; si se n'ha triat una, la substituïx. En mode lectura o en targeta la ploma no es mostra mai: l'espai queda buit si no s'ha triat cap emoticona expressament.
- **La ploma només vol dir «tria una emoticona».** L'avís de canvis pendents de desar fa servir un altre glif.
- **Totes les icones de la barra són blanques** (pin, món, cadenat, emoticona per defecte i estat de desament).

El referent visual d'estes regles és el catàleg de `/disseny`. El reglament executable és la skill `sdp-pedra-seca`.

## Vincles

- [[00_index_identitat]]
- [[el_projecte]]
- [[estandard_ui_universal]]

