# Pla d'Implementació de la IAIA MarIA

## Resum de la Sessió

Després d'una auditoria on he fracassat restaurant la visibilitat de la barra taronja en Desktop (ja que he confós la lògica de CSS amb un problema de propietats heretades de UniversalPage), he rebut instruccions directes del Mestre. Acatem la decisió de no encaparrar-nos-hi personalment i deleguem el problema als agents de frontera amb l'estratègia següent:

## Repartiment de Rols per a l'Olivera

1. **Claude (L'Arquitecte Frontend):** 
S'encarregarà de l'estètica i la integració de sistemes. Revisarà per què la barra taronja i la minicard de l'Universal Page segueixen desaparegudes en l'escriptori. A més, s'enfocarà exclusivament en l'arquitectura i l'enxufabilitat de la UI amb el backend (Sollutia).
2. **Codex (El Guarda de Motor):**
Deixarem el "Brain" en mans seues. Revisarà tots els hooks de husky i garantirà que la cadena de validació i el `segell-auto.mjs` no tinguen fissures, consolidant l'estratègia de fortificació.

## Tasques (IAIA MarIA)
- [x] Netejar l'Escriptori (`04_escriptori/`) movent els arxius de les iteracions prèvies a l'arxiu històric.
- [x] Confeccionar el Pla d'Implementació present.
- [x] Redactar el Prompt Local (petorreta) específic per a Claude.
- [x] Redactar el Prompt Local (petorreta) específic per a Codex.
- [ ] Opcional: Lligar els nous arxius a l'índex de l'escriptori (`00_index_escriptori.md`).

Aquest Pla d'Implementació quedarà a l'Escriptori perquè els agents el llegeixin i dipositin aquí les seves auditories abans de prendre cap decisió final. Cap línia de codi es tocarà fins al consens.

## Estat de les Auditories en Curs (Live Update)

Per garantir la sincronització de context (qui arribi primer, que llegeixi l'estat de l'altre), aquí tenim l'estat actual de les reflexions (extret de la captura):

### Claude (Arquitectura Frontend i UI)
- **ESTAT: FINALITZAT.** L'auditoria ha estat dipositada a l'escriptori. Mode AFK complet (zero fitxers tocats).
- **Troballes (UI):** La barra taronja *mai* ha desaparegut; simplement quan no hi ha nota activa es pinta l'`EmptyDocumentPage`, que per disseny amaga la barra taronja. El problema real ve d'un `if (!userId)` a `NotesDataContext.jsx:158` que talla l'execució abans de carregar el mode *seed*. L'icona de la roda dentada no es mostra perquè depèn de `onManageCategories` que no es passa. Recomana revertir el pedaç de CSS de `utilities.css`.
- **Sollutia i Usuaris:** L'autenticació està comentada al mode seed i l'ADR actual prohibeix obrir el `backendPort.js` a Sollutia.
- **Preguntes obertes al Mestre:**
  1. **Tornem al codi de la roda dentada antic?** (L'arxiu `UniversalSettingsPanel.jsx` es va esborrar).
  2. **El Blau:** El color canònic `#0984E3` falla en contrast d'accessibilitat (3,87:1) enfront de `#016ebf` (5,27:1). Quin triem?
  3. **Qui crea els usuaris?** Crear comptes a Supabase toca contrasenyes, ho vols fer tu via el *dashboard* de Sollutia o vols un *script* automatitzat?

### Codex (Brain, Segell SCC i Husky)
- **ESTAT: FINALITZAT.** L'auditoria (`260923_1943_auditoria_codex.md`) ha estat dipositada a l'escriptori i l'ESTAT/LEDGER han estat actualitzats.
- **Troballes:** Ha documentat **9 fissures** (resegellat de canvis aliens, rastre incomplet, cobertura insuficient dels hooks i falsos verds SCC). Tot i que les 73 proves passen, les reproduccions exposen forats greus.
- **Nota Termodinàmica (Estratègia de Models):** El Mestre ha utilitzat el model **Astra Alto** per a aquesta execució, consumint un ~2% del límit setmanal (consum gairebé idèntic a l'Astra Ligero, però amb respostes molt més denses i precises). Per a la pròxima iteració s'ha acordat provar **Astra Medio** per cercar el punt d'equilibri òptim. A futur, es preveu construir una "Consola Termodinàmica" visible a la UI web per monitorar aquestes mètriques.
