# Briefing UI - Editor Universal (Pendent per a Claude)

*Aquest document és una ordre directa d'execució UI que caldrà subministrar a Claude quan tinga tokens suficients.*

## Objectiu: Refinar la UX de la Barra d'Eines (Toolbar)

L'usuari ha auditat visualment el funcionament de l'editor després de l'última intervenció i ha demanat un canvi crític de lògica i disseny per a la barra de format (negreta, cursiva, H3, etc.):

1. **Ubicació Inferior i Frontera Visual:** 
   Trau la barra d'eines negra de la zona blava de la capçalera (on no té sentit contextual). Ha d'ubicar-se **DINS de la finestra d'edició**, exactament a sota de l'entradilla. D'aquesta manera serveix de separador: la part superior conforma la "Targeta/Card" de presentació, i a partir de la barra comença el contingut lliure del text.

2. **Comportament Sticky:** 
   Quan l'usuari estiga escrivint un text llarg i faça scroll cap avall, aquesta barra s'ha de quedar **fixada (sticky)** a la part superior de la pantalla perquè els controls de format no es perden mai de vista.

3. **Mode Bàsic vs Mode Google Docs (Desplegable):**
   La barra d'eines ha de tindre dos estats:
   - **Estat Replegat (Bàsic):** Només els botons clau per no atabalar (`H3`, Negreta, Cursiva, Ratllat, Llista, i un botó de "Desplegar/Més eines"). **El botó d'H2 no ha d'estar ací**, ja que l'H2 està reservat per al subtítol a la capçalera.
   - **Estat Desplegat (Avançat):** En clicar al botó d'expansió, la barra ha de desplegar una segona o tercera fila (a l'estil Google Docs), revelant la resta de controls avançats (`H2`, incrustació de targetes, alineació, colors, etc.).
