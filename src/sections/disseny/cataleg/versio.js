/**
 * versio.js — la versió del catàleg Pedra Seca (Disseny), amb data i hora.
 *
 * T51 · Regla del Mestre (260928): cap document existeix sense data; en
 * lectura, la de creació o la de l'última versió (editorial.js ·
 * dataDeDocument). Els espècimens encara no porten data pròpia al manifest,
 * i la data real d'un espècimen és la de la versió del catàleg on viu: la
 * pastilla de la barra taronja de cada espècimen (DesignSection.jsx) pinta
 * esta constant.
 *
 * ⚠ QUI EDITE EL CATÀLEG (manifest.js, registre.js, detailRegistry.jsx,
 * Especimen.jsx, Llinatge.jsx o qualsevol fitxer de detalls/) HA DE POSAR-LA AL DIA en el
 * mateix canvi: la darrera modificació real d'eixos fitxers, en hora de
 * València amb la seua zona (`ls -lT src/sections/disseny/cataleg
 * src/sections/disseny/cataleg/detalls`, sense comptar les proves ni este
 * fitxer). Una versió que no és la darrera és una data falsa a la pastilla.
 *
 * Darrera posada al dia: manifest.js i detalls/EspecimenIdentitat.jsx, 2026-11-23T23:04:02+01:00, v1.2.23 · integració
 * (necessitats de G6 i G7 del Gauntlet R2): la descripció de Composició ja no diu «amplada de lectura» sinó «contenidor a
 * tota l’amplada» (R2E-07), i el contracte de CalaixIdentitats diu que el Xat i la barra negra (useIdentitatDeLaBarra)
 * passen els textos fixos en la llengua de la interfície (R2E-04); només esta mostra pinta el valencià de sempre.
 * Versió anterior: detalls/EspecimenComposicio.jsx, 2026-11-23T22:42:46+01:00, v1.2.23 · R2E-07 (Gauntlet R2,
 * grup G7): l'espècimen de Composició ja no diu que Centre és l'amplada de lectura ni que el paràgraf no passa mai de
 * l'amplada de lectura. Des de R32.47 (lot 01 de Gemini) .sdp-centre és width: 100% amb box-sizing: border-box i no
 * aplica --sdp-measure (components.css): la fila Centre del contracte diu «Contenidor neutre a tota l’amplada de la
 * columna», el títol de la mostra és «Centre (amplada completa)» i el paràgraf diu que el contenidor ocupa tota l’amplada.
 * Versió anterior: detalls/EspecimenXatRail.jsx i detalls/EspecimenIdentitat.jsx, 2026-11-23T20:21:44+01:00, v1.2.23 ·
 * L5-02, L5-05 i L5-06 (Gauntlet R1, carril XR): el contracte de CalaixIdentitats a l'espècimen d'identitat nomena les props
 * noves dels textos fixos del calaix (etiquetaTitol, etiquetaDescripcio, etiquetaLlista, etiquetaActiva i etiquetaRol), que
 * el Xat passa en la llengua del peu; la barra negra i la mostra continuen en valencià. L'espècimen del rail del Xat ja no passa onAlterna a RailXat, que no el llig des de la R32.46 (el plec és del títol
 * «Xats ▸», BotoTitolSeccioXat), i el contracte de RailXat ja no el nomena. La descripció i la capçalera ja no diuen que
 * el Control del xat s'obri des d'una targeta «Ajustos del xat» del Panell de Control, que no existix: el Control del
 * xat (/control-xat) no té cap entrada visible i només s'hi arriba per l'adreça.
 * Versió anterior: registre.js i detalls/EspecimenControlsBarra.jsx, 2026-11-23T19:58:31+01:00, v1.2.23 · integració (portes C1 i
 * C2 del Catàleg): el registre compta EditIcon (PedraSeca/atoms/icones.jsx, pàgina fonaments), la icona del botó
 * «Editar» de la BarraBlava que ha portat l'edició des de la pàgina (Gemini R32.44), i la fila d'icones de l'espècimen
 * dels controls de barra la mostra darrere de PinIcon.
 * Versió anterior: detalls/EspecimenEnquadrament.jsx, 2026-11-23T19:21:58+01:00, v1.2.23 · Carril T, segona
 * passada (ordre del Mestre del 23-11-2026, IDEA-331): la fila ofereixConservarExif diu ara que l'avís «Este contingut
 * conserva la ubicació per a situar-lo al territori.» és tota la descripció de l'interruptor «Amaga el lloc»
 * (aria-describedby) i que, si la foto també porta la data, la diu una línia a banda just davall: «També es publicarà
 * la data de la foto.». Producció ja no afig la data dins de l'avís (CasellaExif, DialegEnquadrament.jsx).
 * Versió anterior: detalls/EspecimenEnquadrament.jsx, 2026-11-23T18:36:28+01:00, v1.2.23 · Carril T (ordre del
 * Mestre del 23-11-2026, IDEA-331): l'espècimen del retallador diu l'interruptor de producció. La fila
 * ofereixConservarExif del contracte afig que, amb una ubicació que es pot conservar, la casella és l'interruptor
 * «Amaga el lloc» (role="switch", apagat de sèrie; nom llarg «Publicar sense geolocalització») amb l'avís «Este
 * contingut conserva la ubicació per a situar-lo al territori.» i, si la foto també porta la data, «També es publicarà
 * la data de la foto.»; encés, «Ubicació amagada» i la foto ix neta; i que qui desa abans que acabe la lectura llig
 * «Esta foto porta dades que es publicarien amb ella. Revisa «Amaga el lloc» i torna a desar.». La descripció ja no
 * diu que la casella «Conserva la ubicació i la data de la foto» conserva de sèrie la ubicació: ho fa l'interruptor,
 * i la casella queda per a les fotos que només porten la data. Els textos són les constants de DialegEnquadrament.jsx.
 * Versió anterior: manifest.js, detalls/EspecimenDretsAutor.jsx, detalls/EspecimenXat.jsx,
 * detalls/EspecimenXatAjustos.jsx i detalls/EspecimenXatRail.jsx, 2026-11-23T17:17:15+01:00, v1.2.23 · Carril K5 (ordre
 * del Mestre del 23-11-2026): el Catàleg torna a dir el que fa producció. La nota d'accessibilitat de Drets d'autor diu
 * que el títol de la vista és un h3 (IDEA-319, R32.47 de Gemini, CopyrightPage.jsx). L'espècimen del rail del Xat passa
 * onIdentitats a RailXat com ClosCaXat (IDEA-327 v2) i un selector «Sessió de la mostra» ensenya els dos peus: amb
 * sessió, el selector d'identitat «{nom}: Amb qui actues?», que obri el calaix, on l'«Eixir» pregunta abans si queden
 * canvis sense desar (preparaEixida); sense sessió (el Foraster, sense id ni nom), «Tu: ajustos»; i en tots dos la fila
 * «Ajustos del xat», que obri el full. L'espècimen del full «Ajustos» i el manifest (xat-rail i xat-ajustos) diuen que
 * l'obri eixa fila i que «Tu» al peu és el peu sense sessió. La mostra de la ubicació del Xat ensenya l'avís i
 * l'interruptor de producció (IDEA-331, ControlsAdjunt.jsx): «Este contingut conserva la ubicació per a situar-lo al
 * territori (38,5892°, -0,4214°)» amb la icona MapPin, «Amaga el lloc» (title «Publicar sense geolocalització») i, amagat,
 * «Ubicació amagada» amb «Conserva el lloc», en lloc del text de R32.8 «📍 S’inclourà la ubicació on s’ha fet», que ja
 * no existix; el contracte de ControlsAdjunt ho diu. Cap espècimen del Catàleg descriu el Mode Bancal amb «10:1»: el del
 * Panell llig la descripció de textosModeSenior.js.
 * Versió anterior: dades/atles2dDades.js, manifest.js, detalls/atles2dComu.jsx i
 * detalls/EspecimenAtles2dPobleVirtual.jsx, 2026-11-22T22:44:34+01:00, v1.2.22 · Gauntlet R2 (M4-03, M4-05, M4-06 i
 * M4-07): l'evidència de DOL-31 cita el bloc «MODE BANCAL» de tokens.css pel nom, i no el tram 810-817, que el mateix
 * canvi ha donat al Mode Sènior; la fila de rutes_reals de l'Ajuntament separa la línia de 8749aa810 (App.jsx:1348) de
 * la Route d'ara, citada pel seu path, i la nota de la seua cel·la de rutes diu que navigation.js:450 és de 8749aa810;
 * el pas 4 del Motor promet la intenció i les objeccions reals només si s'ha fet el contrast humà (la Fase 2,
 * opcional), sempre separades de la lectura simulada; la xifra de la Presentació compta els perfils simulats en les
 * rondes que en tenen (num_perfils > 0), com el Motor, i nomena la V2, que no en té cap; el Poble virtual titula «Els
 * 15 perfils simulats de veïns» i diu «Tria un perfil»; i l'entradeta i la cerca del Panell de Disseny al manifest
 * descriuen el sol interruptor del «Mode Bancal · Sol i Lletra Gran» (el del xip i dels Ajustos, amb dianes d'acció de
 * 56 px com a mínim) i els tres graons d'ombra, amb el botó per a tornar a l'ombra de sempre, en lloc del contrast, les
 * ombres i la lletra Noto Sans per separat i de «restablir els valors».
 * Versió anterior: manifest.js, dades/atles2dDades.js, detalls/EspecimenPanell.jsx,
 * detalls/EspecimenAtles2dPresentacio.jsx, detalls/EspecimenAtles2dPobleVirtual.jsx i
 * detalls/EspecimenAtles2dMotorEstudis.jsx, 2026-11-22T21:06:53+01:00, v1.2.22 · Gauntlet R1 (L3-01, L2-01, L3-05,
 * L2-02, L3-03, L3-04, L3-06, L3-07 i L4-08): el Panell de Disseny porta un sol interruptor, «Mode Bancal · Sol i
 * Lletra Gran», que diu el mode com el xip i no esborra la tria «Segons el sistema» (fora el segon interruptor
 * «Mode Sènior / Lectura Gran», mort dins de l'app); l'entradeta i la cerca del Motor al manifest diuen les
 * decisions del Mestre; la capçalera de les dades i meta.fonts.mercat declaren que el bloc mercat es reescriu amb
 * D-ATLES-MOTOR; la nota de DOL-31 torna la reserva sobre la mesura del 39 % i del 64 % (d'abans de la costura de
 * R32.41) i diu que la capçalera no canvia; «On encaixaria» obri l'entrada també al perfil de l'Usuari; la
 * Presentació i el Poble virtual diuen «perfils simulats», amb una nota per a les «veus» de les cites de les
 * rondes; i les tres frases de l'Ajuntament diuen en passat que /ajuntament/:id no tenia cap emissor i qui l'emet
 * des de la v1.2.22. Arreplega també els canvis de les 19:27:02 a dades/atles2dDades.js i detalls/atles2dComu.jsx
 * (Gauntlet R1, L3-08): meta.posat_al_dia és una llista de passades, DOL-31 es tanca amb IDEA-323.4 a la passada de la
 * v1.2.22 i NotaDatacio pinta una frase per passada. A les 21:06:53, la nota de la cel·la de rutes de l'Ajuntament diu que
 * seed.sql no porta cap city_hall, que a Producció no s'ha comprovat i que la migració que en sembra no s'ha aplicat.
 * Versió anterior: dades/atles2dDades.js, detalls/atles2dComu.jsx i detalls/EspecimenAtles2dMotorEstudis.jsx,
 * 2026-11-22T19:22:33+01:00, v1.2.22 · D-ATLES-MOTOR (decisions del Mestre del 22-11-2026, pla 261122_1502 §2.1): el Motor
 * d'estudis diu les cinc decisions en lloc de les preguntes (qualsevol persona, cap «llum verda» ni mínim de veïns, el
 * contrast humà opcional i voluntari, l'informe privat amb l'opció de compartir-lo, i els perfils simulats al Node 0 a
 * 0 €), «perfils simulats» en lloc de «veus sintètiques» i la maqueta sense semàfor.
 * Versió anterior: manifest.js, dades/atles2dDades.js, detalls/atles2dComu.jsx,
 * detalls/EspecimenAtles2dPresentacio.jsx, detalls/EspecimenAtles2dPobleVirtual.jsx, detalls/EspecimenAtles2dXarxesMon.jsx,
 * detalls/EspecimenAtles2dMapaEntitats.jsx, detalls/EspecimenAtles2dMotorEstudis.jsx i detalls/EspecimenInventariGlobal.jsx,
 * 2026-11-22T17:10:02+01:00, v1.2.21 · IDEA-319 (ordre del Mestre del 22-11-2026, captura 261122_1412): seccions en h3 i
 * fitxes en h4, cap h2 al cos, la prosa a tota l'amplada i a mida de cos (sense .sdp-atles__dos-col ni --sdp-measure),
 * els títols de la maqueta mòbil fora de l'Índex, l'avís de datació que diu els huit dolors repassats contra la v1.2.21
 * (Llei 0: només DOL-29 resolt, DOL-51 en la decisió del Mestre i sis oberts) i el títol de les Xarxes (Orkut, 10
 * referents i Nextdoor com a antimodel), amb dues rondes de Gauntlet.
 * Versió anterior: detalls/atles2dComu.jsx, detalls/EspecimenAtles2dPresentacio.jsx,
 * detalls/EspecimenAtles2dPobleVirtual.jsx, detalls/EspecimenAtles2dXarxesMon.jsx, detalls/EspecimenAtles2dMapaEntitats.jsx
 * i detalls/EspecimenAtles2dMotorEstudis.jsx, 2026-11-22T03:09:53+01:00, v1.2.19 · Gauntlet R2 de l'Atles 2D (troballes
 * L4R2-01 a L4R2-08): les cerques de les Xarxes i del Poble virtual no distingixen accents (normalizeSearchText);
 * la Presentació, el Poble virtual i el Mapa diuen a la vista de quina data i de quina versió del codi són les dades
 * (NotaDatacio, en passat; la data de verificació del Mapa, en valencià); les cel·les fora del ressalt del Mapa
 * s'aplanen en compte d'esvair-se i ho diuen al lector de pantalla («fora del filtre»); cada eslògan de les Xarxes
 * porta la seua llengua (lang); i el Motor compta les rondes igual que les nomena (amb veus i sense). El full
 * diferit-atles-2d.css (fora d'esta regla) enganxa la cantonada del Mapa, no partix els noms curts a l'iPad i posa
 * els :hover dins de la guarda de la Fase B.
 * Versió anterior: detalls/atles2dComu.jsx, detalls/EspecimenAtles2dPobleVirtual.jsx, detalls/EspecimenAtles2dXarxesMon.jsx
 * i detalls/EspecimenAtles2dMapaEntitats.jsx, 2026-11-22T01:33:29+01:00, reparació 1 de l'Atles 2D (verificació escèptica del
 * 22-11-2026): la cerca de les xarxes llig el text de les fitxes i no les claus de la dada, «Vore els seus dolors (n)»
 * lleva la resta de filtres perquè se'n vegen n, el Mapa porta la vista «Per entitat» i noms d'entitat curts quan la
 * caixa de la graella és estreta (iPad), i la columna «Entitat» de les rutes reals diu el nom i no l'id de la matriu.
 * Versió anterior: manifest.js, detailRegistry.jsx, detalls/atles2dComu.jsx, detalls/EspecimenAtles2dPresentacio.jsx,
 * detalls/EspecimenAtles2dPobleVirtual.jsx, detalls/EspecimenAtles2dXarxesMon.jsx, detalls/EspecimenAtles2dMapaEntitats.jsx
 * i detalls/EspecimenAtles2dMotorEstudis.jsx, 2026-11-22T00:56:14+01:00, Atles 2D (ordre del Mestre del 21-11-2026 a les 23:28,
 * pla 261121_2335, Carril 1, Tram 1, punts a i b; integrat el 22-11-2026): la carpeta «Inventari» es diu «Recursos»
 * (l'id inventari i les URL no canvien) i la carpeta nova «Atles 2D» (atles-2d, 🗺️) porta les cinc pàgines d'estudi
 * de la maqueta ATLES_2D_SOC_DE_POBLE_MERCAT_I_ENTITATS.html (presentació, poble virtual, xarxes del món, mapa de les
 * 5 entitats i motor d'estudis), amb les dades a dades/atles2dDades.js i el full diferit diferit-atles-2d.css, tot a
 * demanda. Arreplega també els fitxers del catàleg que les versions v1.2.11–v1.2.18 van tocar sense posar-la al dia
 * (segons git diff 34ffb539a..d50ef6c95): AssignacioEmoji.jsx, registre.js, detalls/EspecimenAcollidaForasterXat.jsx,
 * detalls/EspecimenBandaBetaMicroApp.jsx, detalls/EspecimenColor.jsx, detalls/EspecimenPanell.jsx i
 * detalls/EspecimenXatRail.jsx.
 * Versió anterior: detalls/EspecimenUniversalCard.jsx i detalls/EspecimenXat.jsx, 2026-11-19T01:59:30+01:00,
 * Onada v1.2.10 (integració del 19-11-2026 dels ítems del Llibre Mestre): el contracte de la UniversalCard diu què
 * fa la data al Mur segons l'arquetip (arquetipDeData.js, P0-77) i documenta etiquetaData, i la conversa d'espill
 * del Xat marca la llista mentre hi ha una capa flotant oberta (onCapaFlotantCanvia).
 * Versió anterior: Especimen.jsx, Llinatge.jsx, i18nControlsBarra.js, manifest.js,
 * detalls/EspecimenControlsBarra.jsx, detalls/EspecimenEmoticonaBarra.jsx, detalls/EspecimenTraspasCopublicacio.jsx
 * i detalls/EspecimenBandaBetaMicroApp.jsx, 2026-11-18T20:57:20+01:00, dos canvis del mateix dia reunits a
 * l'arbre r26-fusio: l'Onada R32.12 de Gemini (pla 261118_1937, Lot 01, fet a les 20:20 i integrat després de
 * v1.2.9) porta la paritat 5 llengües (ca, es, en, eu, gl), la jerarquia H3 + negretes d'escaneig (Llei 35) i la
 * Llei 32 a fonaments-controls-barra, la documentació viva de BarraNegra, BarraBlava amb MenuTraduir, BarraTaronja
 * amb PaginaEmojis i el peu de la UniversalCard, i el co-publicador de mostra Oli de La Torre; i la revisió de la
 * crònica de v1.2.9 (20:57): l'Avisador ja no munta la banda de fase beta ni té manifest amb avisBeta, i l'espècimen
 * de la banda i les paraules clau del manifest deixen de nomenar-lo.
 * Versió anterior: detalls/EspecimenBandaBetaMicroApp.jsx, detalls/EspecimenEnquadrament.jsx,
 * detalls/EspecimenMenu.jsx, detalls/EspecimenPantallaCompleta.jsx, detalls/EspecimenXat.jsx i manifest.js,
 * 2026-11-18T20:21:21+01:00, Onada v1.2.9 (integració dels lots de Gemini R32.10 i R32.11 a l'arbre r26-fusio):
 * l'espècimen de la banda beta tria la variant declarativa del manifest («general» o «fiscal»), el del menú diu
 * la navegació per fletxes, l'Escape i el retorn del focus, els d'enquadrament i de pantalla completa adopten els
 * seus fulls diferits i les dues mostres del Xat passen a regions amb nom.
 * Versió anterior: detalls/EspecimenXat.jsx, 2026-11-17T20:07:00+01:00,
 * Onada R32.8 (P0-125a/d i P0-126): mostra viva a l'espècimen del Xat del xip clicable «Veure al mapa»
 * dins de Bombolla amb coordenades GPS, la píndola activa per defecte «Ubicació inclosa · Amaga el lloc»
 * a la previsualització de ControlsAdjunt i el botó accessible ✕ per a tancar qualsevol avís o alerta.
 * Versió anterior: detalls/EspecimenCopiaSeguretatXat.jsx i manifest.js, 2026-11-15T05:37:27+01:00,
 * Onada R28 (pla 261115_0135; correccions de la revisió adversarial de Claude, troballes copia-xat-03, copia-xat-04,
 * copia-xat-07 i veu-editorial-07): l'espècimen de la «Còpia de seguretat» del Xat mostra el nom d'arxiu que produïx
 * nomArxiuCopiaSeguretatXat, l'avís de quan no hi ha cap missatge carregat i el d'un navegador que no pot xifrar
 * (prop nova `cripto` al contracte); manifest.js diu el que fa el salt de paràgraf del reproductor de veu (la lectura
 * es reprén des del bloc triat) i que la barra seu a baix de la pantalla, centrada sobre el panell de lectura.
 * Versió anterior: detalls/EspecimenCopiaSeguretatXat.jsx, manifest.js i detailRegistry.jsx, 2026-11-15T03:45:24+01:00,
 * Onada R28 (pla 261115_0135, Lot C3; skill sdp-clon-whatsapp §4.4, «Primer l'espècimen»): l'espècimen nou de les
 * dos pàgines «Còpia de seguretat» dels Ajustos del Xat (superposicions/xat-copia-seguretat, 💾), «Desa una còpia
 * xifrada» i «Comprova una còpia», amb el cos de producció CosCopiaSeguretatXat, dades inventades i un motor de
 * mostra que no xifra res, no llig ni desa cap arxiu i no obri cap full de compartir: cap mostra no passa pel motor
 * de veres (copiaSeguretatPortatil.js) ni llig les converses de qui mira. Les dues descripcions, el no facis de Desa
 * i el fes de Comprova diuen que restaurar dins de l'app encara no és possible. La pàgina ja estava cablejada a FullAjustos:
 * l'espècimen arriba després, no abans com demana la regla.
 * Versió anterior: Especimen.jsx, manifest.js, registre.js i detalls/EspecimenBarraReproductorVeu.jsx, 2026-11-15T02:21:28+01:00,
 * Onada R28 (ordre del Mestre del 15-11-2026: IDEA-268 i D-R27-1, integració del kit R27 de Gemini amb la revisió
 * adversarial de Claude): BarraReproductorVeu es consolida com a reproductor universal de so, centrat sobre el
 * panell de lectura actiu en mòbil (damunt de nav.mobile-nav, sense tapar el botó ↑) i en escriptori amb barra
 * lateral (--barra-veu-inici i --barra-veu-fi, propietats locals mesurades amb ResizeObserver), amb el contracte
 * fontSo (tipus 'lectura' | 'audio') preparat per a la futura Ràdio de Poble i pistes de mostra reals del Node 0;
 * Especimen.jsx adopta el full diferit diferit-especimens.css en muntar-se (D-R27-1, opció b); registre.js hi porta
 * el SelectorOpcionsDesplegable de R26.2/R26.3 (fusió de Claude R27). El botó de Google Play de l'espècimen de
 * respiració que proposava el kit no hi entra: era un logotip redibuixat a mà, i el distintiu oficial serà un recurs.
 * Versió anterior: EspecimenRespiracioBotons.jsx, EspecimenSelectorOpcionsDesplegable.jsx i EspecimenBoto.jsx, 2026-11-14T23:09:55+01:00,
 * Onada R26.3 (ordre del Mestre del 14-11-2026, revisió de Gemini §1.B): el botó de l'App Store de
 * l'espècimen de respiració és l'àtom Boto amb la prop nova marca="apple" (EspecimenBoto.jsx en documenta
 * la fila); el contracte del selector documenta resum com Array<ReactNode>, sense tall ni title, el ràdio
 * marcat a 3:1 o més sobre la píndola activa i píndola i detall en una sola caixa.
 * Versió anterior: SelectorOpcionsDesplegable i espècimens R26.2, 2026-11-14T20:45:33+01:00,
 * revelació adjacent i resum compacte accessible.
 * Versió anterior: manifest.js, detailRegistry.jsx, registre.js i EspecimenBarraReproductorVeu.jsx, 2026-11-14T02:55:00+01:00,
 * Onada R23 (IDEA-255, 14-11-2026): BarraReproductorVeu i EspecimenBarraReproductorVeu (superposicions/barra-reproductor-veu),
 * el mini-reproductor flotant universal de veu que PageFrame munta en diferit sota l'entradilla de totes les pàgines de lectura.
 * Versió anterior: manifest.js i EspecimenXat.jsx, 2026-11-12T23:04:01+01:00,
 * Gauntlet 261112 dels kits R21 (regressio_ui_xat-07, versions_i_portes-02): EspecimenXat.jsx
 * passa nivellTitol={5} a les tres capçaleres de mostra (CapcaleraConversa), perquè
 * /disseny/fonaments/xat no pinte cap H1 de mostra, i el contracte en documenta la prop;
 * manifest.js nomena el directori (ProfileSection i EntitatsDelPoble) entre els consumidors
 * d'UniversalCard en lloc de SectionItemCard, retirada perquè ja no la muntava ningú.
 * Arreplega EspecimenGraellaTargetes.jsx (encapcalamentDeTargeta a les targetes de mostra)
 * i EspecimenUniversalCard.jsx (PortaDePagina secundària), tocats pels kits R21 sense posar-la al dia.
 * Abans (22:41, carril T1b): EspecimenContracte.jsx,
 * Gauntlet 261112 de l'Onada R21 (T1b, verificador): /page/fediversity ja és una UniversalPage sense
 * CatalegWorkspace, i la columna 3 dels ajustos (section.disseny.contracte.modals.columna3.text, cinc
 * llengües) ja no nomena Fediversity i nomena els Arbres monumentals, que sí que en són. Només text: cap
 * espècimen ni entrada de manifest nous. Arreplega també els fitxers del catàleg tocats des de la versió
 * anterior sense posar-la al dia (segons git log): EspecimenEnquadrament.jsx (R16a), EspecimenBotiguesSistema.jsx
 * i EspecimenContracte.jsx (R16b), destinsEmoji.js, detailRegistry.jsx, EspecimenControlsBarra.jsx,
 * EspecimenSelectorVisibilitat.jsx, EspecimenTraspasCopublicacio.jsx, EspecimenUniversalWorkspace.jsx i
 * manifest.js (R21 COMMIT 1), EspecimenResumConnexio.jsx (R21 COMMIT 2), i EspecimenGraellaTargetes.jsx i
 * EspecimenUniversalCard.jsx (kit R21.6 de Codex).
 * Versió anterior: registre.js, 2026-11-09T22:21:01+01:00,
 * Onada R15b (porta Catàleg): CandidatsAlergens, la revisió dels al·lèrgens candidats de la fitxa de recepta
 * (kit R15.2), registrada com a «extern» fins que tinga espècimen a detalls/.
 * Versió anterior: EspecimenTaula.jsx, 2026-11-09T03:51:29+01:00,
 * pla 261109: traça editorial de la variant R56 i conservació de les mostres prèvies.
 * Versió anterior: EspecimenTaula.jsx, 2026-11-08T10:39:48+01:00,
 * R56: variant de lectura d’identificadors llargs, abans del consumidor.
 * Versió anterior: EspecimenPouNeu3D.jsx, manifest.js i detailRegistry.jsx, 2026-11-07T00:56:59+01:00,
 * IDEA-143 R31: anatomia 3D del pou de neu amb set assemblatges i model didàctic.
 * Versió anterior: EspecimenUniversalWorkspace.jsx i EspecimenColumnes.jsx, 2026-11-04T23:55:00+01:00,
 * pla 261104_1636 (AH-16, ordre directa del Mestre): unificació de collapsibleNavigation={false} a totes les pàgines
 * UniversalWorkspace, caixa geomètrica uniforme de 48×48 px per a les icones de capçalera d'AppGridColumn i
 * commutador dual simètric d'icones ([Icona Col 1] [Icona Col 2] + [|<]) en mòbil a les Columnes 1 i 2.
 * Versió anterior: EspecimenBlocAmbit.jsx, EspecimenClassificacio.jsx, manifest.js, registre.js i
 * detailRegistry.jsx, 2026-11-02T22:50:06+01:00, Onada 4 nocturna (O4-CLAUDE-1, ordre del Mestre de la captura
 * 261102_2121; correcció A1-06 de l'àrbitre): l'espècimen nou EspecimenBlocAmbit, el bloc «On es publica?» REAL
 * en línia dins de l'«Edició avançada» (abans una finestra modal sense espècimen), amb una nota del Mur i una
 * fitxa de Compartir cotxe incompleta després de PUBLICAR; registrat a registre.js (BlocAmbit, viu, fora), amb
 * l'ítem formularis/ambit, l'emoji 📍 i el node bloc-ambit de l'arbre a manifest.js i el seu carregador a
 * detailRegistry.jsx. A EspecimenClassificacio.jsx i a manifest.js, la classificació nomena el grup Àmbit, que
 * ja no obri cap diàleg.
 * Versió anterior: EspecimenEnquadrament.jsx, EspecimenXatSeguretat.jsx i manifest.js, 2026-11-02T04:12:00+01:00,
 * Gauntlet 261102 de la marató 261101_2143: M24-B7h (IDEA-42) afig a EspecimenEnquadrament.jsx la targeta 16:9
 * amb punt focal i el cartell sencer de l'Aplec; M02-B2b-UI afig a EspecimenXatSeguretat.jsx l'espècimen
 * AvisClauCanviada (canvi fort pendent, verificat i canviat, suau, alarma de la clau pròpia i bifurcació) i la
 * mostra del número pendent, maqueta darrere de la bandera E2EE apagada; manifest.js el nomena al subtítol.
 * Versió anterior: EspecimenXatSeguretat.jsx, 2026-11-01T16:21:27+01:00, pla 261101_1246 (T7b, corrector del
 * Gauntlet, T7b-G02/G08): el contracte de CosPersonesConfianca afig la fila teRecuperacio (si la recuperació ja
 * està activa en este node; avui sempre fals) i el «Fes» diu que el bloc avisa que encara no ho està. Només text:
 * cap espècimen ni entrada de manifest nous.
 * Versió anterior: EspecimenXatSeguretat.jsx, 2026-11-01T15:42:07+01:00, pla 261101_1246 (T7 · S7; P1-12
 * pas 17 i IDEA-48): l'espècimen nou EspecimenXatSeguretat, maqueta darrere de la bandera E2EE apagada (el xat,
 * avui, no és xifrat), amb les peces CosSeguretatXat (l'estat del xifratge per conversa i el número de seguretat
 * amb «Marca com a verificat») i CosPersonesConfianca (el bloc previ a F7 de Privacitat i dades), muntades amb
 * dades inventades i cada mostra titulada «Maqueta · …»; registrades a registre.js (estat maqueta), amb l'ítem
 * superposicions/xat-seguretat i l'emoji 🔐 a manifest.js i el seu carregador a detailRegistry.jsx
 * (15:32:42). Arreplega EspecimenBarraEines.jsx (2026-11-01T07:02:49, marató nocturna del 01-11, IDEA-59 /
 * P1-72: les ranures noves de la barra de l'editor), tocat sense posar-la al dia.
 * Versió anterior: EspecimenTipografia.jsx, 2026-10-31T02:53:15+01:00, Gauntlet 261031 (f10, corrector,
 * F10-C4; Llei de llistes, ordre del Mestre del 31-10-2026): la taula de ritme vertical afig la fila li (marge
 * inferior --sdp-li-gap, 4px) i el «Fes» diu que els ítems d'una ul o d'una ol van sempre més junts que els
 * paràgrafs, només amb el marge del li i mai amb un gap afegit. Només text: cap espècimen ni entrada de manifest
 * nous.
 * Versió anterior: EspecimenQuadreDeComandament.jsx, manifest.js, registre.js i detailRegistry.jsx,
 * 2026-10-31T01:52:41+01:00, ordre del Mestre del 31-10-2026 (prompt 2208, T3.1; Gauntlet f8, F8-CRIT-03):
 * l'espècimen nou QuadreDeComandament, el motlle de tauler compacte, amb dades inventades (un tauler de visites
 * com el de /legal, la caixa del dia d'un TPV i el resultat de cada mes d'una gestoria, que pot ser negatiu),
 * registrat a manifest.js, registre.js i detailRegistry.jsx. Nota posada pel corrector f10, que va trobar la
 * versió sense posar al dia.
 * Versió anterior: EspecimenUniversalWorkspace.jsx, 2026-10-30T19:44:39+01:00, Gauntlet 261030 (f4,
 * corrector de l'àrea workspace, cataleg-obridorALaLlista-retirada-amb-railEsquerra; decisió 4 del Mestre del
 * 30-10-2026): fora la fila obridorALaLlista del contracte. La prop ja no existix (l'espai no la llig i el Bloc de
 * Notes ja no la passa), i la fila descrivia el rail fix de la navegació en «mitja» (railEsquerra), retirat amb la
 * decisió 4. Només text: cap espècimen ni entrada de manifest nous.
 * Versió anterior: EspecimenColumnes.jsx i EspecimenUniversalWorkspace.jsx, 2026-10-30T17:48:24+01:00, ordre
 * del Mestre del 30-10-2026 (~15:00, restes de l'ordre d'usabilitat de les icones de columna): a EspecimenColumnes.jsx,
 * la fila replegaTotaCapcalera i l'avís de la mostra «Replegable sencera» diuen que la fila sencera com a botó només
 * és al Xat, i que als espais de treball pleguen la icona de l'esquerra i el [|<], amb el títol fix i l'acordió de
 * paraula i chevron apegat (abans: «tota la fila és el botó (Disseny, en ample)»); a EspecimenUniversalWorkspace.jsx,
 * la fila de tagFilter, collapsibleNavigation i sortable ja no nomena replegaTotaCapcalera, que l'espai no llig, i
 * diu el mateix. Només text: cap espècimen ni entrada de manifest nous.
 * Versió anterior: EspecimenImatgeApaisada.jsx i manifest.js, 2026-10-30T15:27:24+01:00, Gauntlet 261030
 * (cicle 4, corrector de l'àrea vocab, C4-V-02): la migració dels CSS de secció va esborrar pecesApps.css i
 * catalegColleccio.css, i l'espècimen «Imatge apaïsada 16:9» encara els anomenava. El rètol de fitxer diu ara
 * «src/css/modules.css, bloc catalegColleccio» i l'entradilla del manifest, «els blocs pecesApps i
 * catalegColleccio de src/css/modules.css». Només text: cap CSS, cap espècimen ni entrada de manifest nous.
 * Versió anterior: EspecimenControlsBarra.jsx, 2026-10-30T05:51:18+01:00, Gauntlet 261030 (cicle 2,
 * corrector de l'àrea traductor-client, especimen-menu-traduir-text-fals): el paràgraf del menú Traduir
 * nomena les sis llengües que el menú pinta (Castellà, Gallec, Basc, Anglés, Francés i Alemany), diu que
 * «Veure l'original» torna el focus a Traduir i que les marques van com a marques locals, sense que mai
 * entre HTML del proveïdor (abans: quatre llengües i «mai HTML»). Cap espècimen ni entrada de manifest nous.
 * Versió anterior: EspecimenPage.jsx, 2026-10-29T00:01:53+01:00, pla 261028_1526 (Bloc H, P1-68;
 * revisió adversarial final del 29-10-2026, R1): el contracte de peuDePagina diu que l'editor de la fitxa del
 * Perfil hi porta ara l'identificador i el poble (IdentitatAlPoble), dins del contenidor que fa
 * scroll, i ja no germà de l'editor, que es quedava sense alçada als telèfons. Cap espècimen ni
 * entrada de manifest nous.
 * Versió anterior: EspecimenUniversalCard.jsx i EspecimenXat.jsx, 2026-10-28T22:26:58+01:00,
 * pla 261028_1526 (Bloc H: IDEA-40 i P1-66; decisions del Mestre en xat): a EspecimenUniversalCard.jsx,
 * el quadrat de l'espècimen 7 (la targeta explicativa de la Consola) porta el semàfor de les seues
 * etiquetes com la TargetaConsola de veres («Cal reparar» el pinta roig, amb data-semafor, i el nom
 * del quadrat diu l'estat); a EspecimenXat.jsx, la barra única del compositor (el + amb el menú
 * d'adjunts, la carona dins del camp i el botó redó que fa de micròfon, d'atura o d'envia), amb el
 * contracte, l'accessibilitat i el «no facis» al dia. Cap espècimen ni entrada de manifest nous.
 * Versió anterior: manifest.js, EspecimenEnquadrament.jsx i EspecimenXatCerca.jsx,
 * 2026-10-28T19:14:50+01:00, pla 261028_1526 (P1-60, P1-64 i P1-36; decisions del Mestre en xat): el
 * manifest porta el copy editorial nou de Disseny (H2 simplificats de deu fitxes conceptuals i dues
 * carpetes, «Diàlegs i calaixos» i «Estats i avisos»; els subtítols tècnics passen als termes de cerca;
 * mateixos ids); EspecimenEnquadrament.jsx documenta que l'avatar ja no oferix la casella de la
 * ubicació i que avisaGpsEliminat pinta l'avís de privacitat quan la foto en portava; i a
 * EspecimenXatCerca.jsx el ⊗ «Tanca la cerca» hi és sempre, com a la cerca oberta amb la lupa. Cap
 * espècimen ni entrada de manifest nous.
 * Versió anterior: AssignacioEmoji.jsx, EspecimenXatLlista.jsx i EspecimenUniversalWorkspace.jsx,
 * 2026-10-26T23:12:37+01:00, pla 261026_2130 (ordre del Mestre 261026_2126, P1-36; revisió del torn):
 * els destins d'AssignacioEmoji.jsx són files senzilles (sdp-xat-fila--senzilla) i conserven els 72px
 * d'abans, no la targeta de conversa de 96 px (Llei del Píxel); el contracte de FilaConversa i de
 * FilaComunitat a EspecimenXatLlista.jsx porta premuda ({ handlers, consumeix, pista }); i el
 * d'EspecimenUniversalWorkspace.jsx, la fila obridorALaLlista (pla 261026_1615 §6: amb false, la
 * carpeta de la llista es lleva només en «mitja», on el rail fix de la navegació és una porta a la
 * vista; en «estret» i en compacte es queda). Cap espècimen ni entrada de manifest nous.
 * Versió anterior: EspecimenXatLlista.jsx, EspecimenXat.jsx, manifest.js i registre.js,
 * 2026-10-26T22:16:03+01:00, pla 261026_2130 (ordre del Mestre 261026_2126, P1-36): el «…» inventat
 * de la fila de títol de la llista de converses (MenuLlista) es retira del producte, del registre i
 * de l'espècimen; la seua mostra oberta passa a ser una llista on la pulsació llarga, el clic dret o
 * Maj+F10 sobre una fila diu que entraria en «Seleccionar xats» amb eixa fila triada, i el contracte
 * i l'accessibilitat ho expliquen. La descripció d'EspecimenXat.jsx diu la fila nova: 96 px amb
 * l'avatar de 76 px. Cap espècimen nou; l'entrada del manifest canvia el text, no l'id.
 * Versió anterior: EspecimenGestor.jsx, EspecimenUniversalWorkspace.jsx i EspecimenInventariGlobal.jsx,
 * 2026-10-25T07:16:15+01:00, Gauntlet 261025_0545 (P1-16; DF-04, C2-04 i G0200-R2-01): cap taula
 * nua a la columna del detall. Les quatre taules del Gestor, la de les variants d'UniversalWorkspace
 * i el registre de l'Inventari es desplacen dins de la seua caixa a qualsevol amplada (la de les
 * taules de contingut, .sdp-taula-prosa), i la caixa és una regió amb el nom de la llegenda i
 * tabIndex=0, com el contracte. A 1280px ja no en vessa cap ni l'overflow:hidden del detall en talla
 * res; a 375px es veuen igual que abans. Cap espècimen ni entrada de manifest nous.
 * Versió anterior: Especimen.jsx, EspecimenContracte.jsx, EspecimenDialeg.jsx, EspecimenConfirmacio.jsx i
 * EspecimenCalaix.jsx, 2026-10-25T04:51:24+01:00, pla 261025_0200 (IDEA-26 i IDEA-27, ordre del Mestre; auditories
 * Gemini G0200-01 i Codex C0200-05, i la revisió adversarial del torn): el bloc d'accions
 * canònic, Accions (PedraSeca/composicio, entrada nova al registre i mostra a EspecimenComposicio),
 * va després del paràgraf que l'explica a EspecimenSelectorVisibilitat.jsx, EspecimenIdentitat.jsx,
 * EspecimenShell.jsx, EspecimenEnquadrament.jsx (també les seues tres files d'accions, i el pla
 * 261025_0045 del retall compacte, que ja hi era), EspecimenXat.jsx, EspecimenToast.jsx i
 * EspecimenDetallArticle.jsx; els casos embolicats en un <div> nu (EspecimenResumConnexio.jsx,
 * EspecimenEstatDesament.jsx i els de dalt) són Fragments i l'h4 recupera els
 * 32px de dalt; els diàlegs tancats van fora de la caixa de mostra; la taula de ritme
 * d'EspecimenTipografia diu --sdp-mb-h4 16px; Boto i EspecimenBoto diuen 48 i 58px. A
 * Especimen.jsx (observacions del Mestre del mateix torn), el capçal respira 16px fins al
 * text i la taula del contracte es desplaça dins de la seua caixa (una regió amb el nom del
 * contracte i de la fitxa), amb els noms sencers; a EspecimenContracte.jsx el bloc de codi
 * d'UniversalWorkspace es desplaça dins de la seua caixa i s'hi arriba amb el teclat. Cap
 * espècimen ni entrada de manifest nous.
 * Versió anterior: EspecimenIdentitat.jsx, 2026-10-24T14:14:07+02:00, pla 261024_1315 (T6a,
 * IDEA-14; auditoria Gemini 261024, G-04): administrar no és connectar. La mostra 'pot-connectar'
 * amb revisió diu «Pot demanar administrar-la (amb revisió)», com el botó «Demanar administrar-la»
 * de TargetaAdministrar, i el «No facis» deixa de dir «connectar» a administrar una organització
 * (connectar és el MAS; formar-ne part, un altre camí). La posa al dia la integració del mateix pla:
 * l'espècimen es va tocar després de la versió de T4. Cap espècimen ni entrada de manifest nous.
 * Versió anterior: EspecimenVisorImatges.jsx, 2026-10-24T14:10:56+02:00, pla 261024_1315 (T4,
 * P1-06; auditoria Gemini 261024, G-01): «Tancar» del visor és la ✕ i un clic al fons fosc buit
 * també tanca (motiu 'vel'); la capçalera, la descripció, la fila obert / onTanca del contracte i
 * la primera regla d'accessibilitat ho diuen. Cap espècimen ni entrada de manifest nous.
 * Versió anterior: EspecimenCercaFiltres.jsx, 2026-10-22T22:48:40+02:00, pla 261022_1955
 * (Cercador Universal, T3): la mostra «Una font ha fallat» és ara una font que no ha respost a
 * temps (el directori d'entitats), perquè el padró tancat d'un foraster (SDP-XAT-003) ja no pinta
 * cap avís. Cap espècimen ni entrada de manifest nous.
 * Versió anterior: EspecimenPage.jsx, 2026-10-22T03:46:55+02:00, Gauntlet 261022_0225 (Tasca 2,
 * PERF-2): el text de l'avatarAutor, la regla «fes», el bloc del títol i la primera mostra ja no
 * ensenyen l'avatar de 300px a la fitxa d'una persona, pública o en lectura (la seua cara viu a la
 * barra taronja). Abans, 2026-10-22T02:45:11+02:00, EspecimenXat.jsx: la mostra nova dels adjunts
 * del xat (ControlsAdjunt amb un servei de mostra que no puja res). Cap espècimen ni entrada de
 * manifest nous.
 * Versió anterior: EspecimenXat.jsx, 2026-10-20T22:42:54+02:00, Fase E (261020, tasca 3; pla 261020_2045
 * «El Comú»): la bombolla de grup amb tipus 'llista_comu', que munta la llista viva
 * (TargetaLlistaComu, memoritzada) en lloc del text, i la mateixa en el mode de selecció (només
 * lectura), amb dades de mostra; les files actorLlista i onMutaLlista al contracte de Bombolla i la
 * fila nova TargetaLlistaComu. Cap espècimen ni entrada de manifest nous.
 * Versió anterior: EspecimenUniversalListCard.jsx, 2026-10-20T21:36:58+02:00, Fase E (261020,
 * tasca 2; pla 261020_2045 «El Comú»): l'organisme nou UniversalListCard (la llista viva dels sis
 * modes: Rebost, Bar · TPV, Colla · Cens, Banda · Eixida, Loteria · Dipòsit i Escola · Educand),
 * registrat a registre.js i amb el seu carregador a detailRegistry.jsx (21:28:42), l'ítem
 * estructura/llista-comu i l'emoji 🧺 a manifest.js (21:28:52), i l'espècimen nou
 * EspecimenUniversalListCard.jsx (21:36:58), que el munta de veres en els sis modes amb dades de
 * mostra, «Qui toca» (qui l'ha creada o un veí) i el marc d'una bombolla de 375 px.
 * Versió anterior: EspecimenControlsBarra.jsx, 2026-10-20T17:07:16+02:00, Fase D (261020,
 * tasca 2; pla 261020_1300 · App Store 1.2 i Google Play UGC): «Més opcions» (⋮) de la boina,
 * l'organisme nou Moderacio.jsx (BotoModeracio i MenuModeracio, denunciar i bloquejar), registrat a
 * registre.js (17:05:48) i mostrat a EspecimenControlsBarra.jsx (el menú obert i quiet, només
 * denunciar i denunciar i bloquejar, i el ⋮ a la barra taronja, amb les files BotoModeracio,
 * MenuModeracio i BarraTaronja.accioModeracio al contracte), i la fila ambModeracio (boolean, false)
 * al contracte d'EspecimenUniversalCard.jsx (17:05:57). Cap espècimen ni entrada de manifest nous.
 * Versió anterior: EspecimenIdentitat.jsx, 2026-10-17T19:28:57+02:00, Revisió del Gauntlet
 * 261017 (ID4; relleu 3: mai «Foraster» mentre la sessió és vàlida): la fila
 * BotoIdentitatActiva.pendent (bool, false) al contracte de l'espècimen, la prop nova que, sense
 * sessió i mentre la sessió recordada es comprova, pinta només un estat ocupat per al lector de
 * pantalla en lloc d'«Entrar».
 * Versió anterior: EspecimenPublicacionsDeLActor.jsx, 2026-10-17T17:34:22+02:00, Gauntlet
 * 261017 (WP7a, el que els paquets paral·lels no van arribar a tocar): F30 a tota l'app, el
 * DialegEmoticona d'EspecimenClassificacio.jsx i d'EspecimenEmoticonaBarra.jsx porta el catàleg
 * Emojis XL (carregaCatalegEmojis, de notes/canalEmojis.js), amb carregaCataleg a la fila del
 * contracte d'EspecimenClassificacio.jsx (17:31:53); les files de contracte que faltaven, onCarrega
 * a EspecimenVisorImatges.jsx (C05) i onObri i etiquetes.obri a EspecimenCarruselImatges.jsx (C04,
 * 17:33:05); i els textos de F45 (Gauntlet 261016, Bloc 3.9) que encara deien que l'històric de
 * l'actor va davall de l'editor del Bloc: ara, només davall d'una publicació oberta
 * (PublicacioDetall), al lead de publicacions-actor de manifest.js (17:34:01), a la fila
 * peuDePagina d'EspecimenPage.jsx (17:34:09) i a la descripció, la fila exclouId i el «Fes»
 * d'EspecimenPublicacionsDeLActor.jsx (17:34:22).
 * Versió anterior: EspecimenXatRail.jsx, 2026-10-17T16:50:40+02:00, Gauntlet 261017
 * (Bloc 3.1, terminologia neutra de la missatgeria; troballa C12 de l'auditoria de Codex): els
 * textos visibles del catàleg ja no nomenen cap marca aliena ni diuen que el Xat en siga una
 * còpia; parlen del patró estàndard de missatgeria que la gent ja coneix. Toca els leads de
 * manifest.js (16:40:29: la llista, el rail i el full «Ajustos», i el comentari d'este últim), la
 * descripció i les regles d'EspecimenXatAjustos.jsx, i les descripcions d'EspecimenXatCerca.jsx i
 * EspecimenXatLlista.jsx (16:40:56); EspecimenXatRail.jsx (16:50:40: la descripció, el contracte
 * de textosDeVista i «el verd d'una marca aliena»); la taula d'EspecimenGestor.jsx i el paràgraf
 * d'EspecimenControlsBarra.jsx («com a les apps de missatgeria», 16:44:46); i els comentaris
 * d'AssignacioEmoji.jsx (16:44:46), destinsEmoji.js i EspecimenXat.jsx (16:44:55). Arreplega
 * EspecimenVisorImatges.jsx (16-10, 22:04:04), tocat després de la versió anterior sense
 * posar-la al dia.
 * Versió anterior: detailRegistry.jsx, manifest.js i registre.js, 2026-10-16T18:11:39+02:00,
 * Onada 0.3 (Gauntlet 261016, pla 261016_1530: «visor modal / Lightbox natiu a pantalla completa
 * sobre fons fosc»): l'organisme nou VisorImatges, el visor de fotos de l'Arxiu visual
 * (/multimedia), registrat a registre.js, amb l'ítem superposicions/visor-imatges i l'emoji 📸 a
 * manifest.js, el seu carregador a detailRegistry.jsx i l'espècimen nou EspecimenVisorImatges.jsx
 * (18:11:11), que el munta de veres sobre la graella de cel·les-botó de /multimedia. Arreplega els
 * tocats esta vesprada sense posar-la al dia: AssignacioEmoji.jsx i destinsEmoji.js (18:03:31,
 * Gauntlet 261016, Bloc 3.4: el grup de la Wiki i la carpeta `maquinaria`) i EspecimenXatAjustos.jsx
 * (17:43:06).
 * Versió anterior: EspecimenEnquadrament.jsx, 2026-10-16T03:02:33+02:00, Gauntlet nocturn
 * 261016 (pla 261016_0015), Bloc 1 (Llei del Quadrat): la sortida exacta de cada enquadrament
 * (l'avatar, 400 × 400; el logotip, 600 × 600; la capçalera, 1.200 × 1.200 i quadrada, com la
 * targeta) i, Bloc 1.2, la casella ofereixConservarExif amb la seua fila al contracte. Arreplega els
 * tocats esta nit sense posar-la al dia: EspecimenDretsAutor.jsx (01:50:47, Bloc 3.1: l'àmbit
 * «compte» i els textos opcionals de l'ajust de drets d'«El compte»), EspecimenTargetaViva.jsx
 * (00:54:38) i manifest.js (00:54:55), del Bloc 3.4: cap editor munta ja la targeta viva ni el seu
 * xip. I els que quedaven endarrerits: EspecimenUniversalCard.jsx (15-10, 19:50:21, Directiva de
 * Dignitat Humana, pla 261015_1900: la targeta d'una persona no porta drets ni categories),
 * EspecimenPaginaApp.jsx (14-10, 21:40:28, ordre del Mestre del 14-10: l'avatar sdp-media://
 * resolt pel port i accionsInoperatives), EspecimenShell.jsx (14-10, 05:34:08) i
 * EspecimenCalendari.jsx (14-10, 00:34:36). La posa al dia el front F3 del Gauntlet, amb la guarda
 * de versio.test.js, que ara reconeix també les marques «Gauntlet aammdd» i «pla aammdd».
 * Versió anterior: EspecimenCamp.jsx, 2026-10-13T17:17:21+02:00, ordre del Mestre del
 * 13-10-2026 (pla 261013_1405, front D): la fila CampFitxer.nomsVisibles al contracte de l'espècimen,
 * la prop opt-in de la privacitat de formulari.jsx (en fals, la línia d'estat només diu el recompte
 * dels fitxers triats, mai els seus noms). La posa al dia la revisió adversarial 13-10-2026, troballa
 * ORD-2: l'espècimen es va tocar després de la versió del front B i la pastilla deia una data falsa.
 * Versió anterior: EspecimenPaginaApp.jsx i manifest.js, 2026-10-13T15:47:43+02:00, ordre del
 * Mestre del 13-10-2026 (pla 261013_1405, front B: «A la part dreta de la barra taronja, SEMPRE la data
 * i l'hora vives»): l'àtom nou RellotgeViu, registrat a registre.js (15:47:12) i pintat de veres a
 * EspecimenControlsBarra.jsx (15:47:29), amb la seua fila al contracte; les props rellotgeViu i
 * rellotge (i barActions, que hi faltava) al contracte d'EspecimenPaginaApp.jsx; i a manifest.js, el
 * subtítol de controls-barra i les paraules de cerca.
 * Versió anterior: EspecimenTornarADalt.jsx, 2026-10-12T22:08:14+02:00, revisió adversarial
 * (261012) de l'ordre del Mestre del vespre: el botó «Tornar a dalt» no es pinta al final del
 * recorregut (taparia l'última fila) ni amb un peu ancorat a baix («Desar autoria», el compositor del
 * Xat), i EspecimenNavMobil.jsx (22:08:13) diu que amb un peu ancorat la barra inferior es queda.
 * Versió anterior: EspecimenNavMobil.jsx, 2026-10-12T21:11:26+02:00, ordre del Mestre (261012,
 * vespre): les barres acompanyen el scroll en compacte i el botó «Tornar a dalt» damunt de «Pobles»
 * (Pedra Seca §9). L'espècimen nou EspecimenTornarADalt.jsx (21:10:44), amb les entrades noves de
 * manifest.js (navegacio/tornar-dalt, l'emoji 🔝 i el node de l'arbre universal, 21:10:58), de
 * detailRegistry.jsx i registre.js (BotoTornarADalt, 21:11:08); EspecimenNavMobil.jsx deroga el «No
 * facis: amagar-la en fer scroll» i diu com acompanya el scroll.
 * Versió anterior: EspecimenXatLlista.jsx, 2026-10-10T13:05:23+02:00, Onada 10 (261010; revisió
 * de l'Onada): la mostra de la llista que no carrega diu el text nou de SDP-XAT-003 («Mode Foraster»).
 * Arreplega EspecimenUniversalCard.jsx (13:04:54, Onada 10: el contracte d'`accio` diu que la Consola i
 * el Cervell porten «Obrir…» només a la seua pàgina) i els tocats el 261009 després de les 16:43 sense
 * posar-la al dia: AssignacioEmoji.jsx (18:14:40), destinsEmoji.js (18:14:48) i, a les 18:29:55-56,
 * EspecimenArticles.jsx, EspecimenAvatar.jsx, EspecimenCalendari.jsx, EspecimenControlsBarra.jsx,
 * EspecimenEmoticonaBarra.jsx, EspecimenEstatDesament.jsx, EspecimenPaginaApp.jsx, EspecimenRajola.jsx,
 * EspecimenTargetaViva.jsx i EspecimenXat.jsx.
 * Versió anterior: EspecimenTargetaViva.jsx, 2026-10-09T16:43:08+02:00, Onada 8 (front 8A,
 * revisió adversarial): la boina de la targeta viva porta al perfil de qui signa (autor.ruta). Arreplega
 * els espècimens del mateix front tocats sense posar-la al dia: EspecimenPage.jsx (15:25:02),
 * EspecimenPaginaApp.jsx (15:25:07), EspecimenControlsBarra.jsx (15:25:17) i EspecimenUniversalCard.jsx
 * (15:29:42), la boina de Sóc de Poble al seu perfil i el menú «En privat» amb l'autor; i registre.js
 * (06:37:25), tocat el 261009 sense posar-la al dia.
 * Versió anterior: EspecimenXatLlista.jsx, 2026-10-09T04:59:44+02:00, Onada 6 (front «xat»,
 * revisió 261009): el peu «Informa d'un error» de la llista de converses (LlistaConverses `peu` i
 * BotoInformaDUnError), fora de la <ul>, davall de l'avís d'una llista que no carrega i amb la reserva
 * (copiar l'informe o enviar-lo per correu). Arreplega també EspecimenCalendari.jsx (04:44:01, Onada 6,
 * front «calendari»), tocat sense posar-la al dia.
 * Versió anterior: EspecimenAvatar.jsx, 2026-10-09T04:13:12+02:00, Onada 6 (tasca 12): la
 * variant additiva `enquadrament` d'Avatar, amb la cara de la IAIA a «Festa del Poble» (sm, md, lg i xl).
 * Arreplega també EspecimenPestanyes.jsx (04:01:46, Onada 6, front «pobles»: la variant `centrades`
 * de Pestanyes, la de la pàgina d'un poble).
 * Versió anterior: manifest.js, 2026-10-09T01:00:28+02:00, Onada 5 (ordre del Mestre, 261008):
 * la barra inferior mòbil passa a Xat, Mur, el Panell de Control, Mercat i Pobles, en cinc pistes
 * d'ample igual (EspecimenNavMobil.jsx a les 01:00:27 i l'entrada nav-mobil de manifest.js).
 * Arreplega també els tocats el 261008 sense posar-la al dia: manifest.js (14:46:58),
 * EspecimenImpressio.jsx (14:06:17), EspecimenEnquadrament.jsx (14:39:15),
 * EspecimenTargetaViva.jsx (14:46:38), EspecimenDretsAutor.jsx (14:55:34), EspecimenPage.jsx i
 * EspecimenEstatDesament.jsx (15:26:40).
 * Versió anterior: AssignacioEmoji.jsx, 2026-10-08T00:17:37+02:00, el relleu 261007 (Onada 3,
 * peça «netes»): l'espècimen nou EspecimenPublicacionsDeLActor (l'històric de l'actor), amb les
 * entrades noves de registre.js (PublicacionsDeLActor, VistaPublicacionsDeLActor i TargetaDelMercat),
 * manifest.js (fonaments/publicacions-actor) i detailRegistry.jsx; EspecimenPage (la ranura
 * peuDePagina i etiquetaPeuDePagina al contracte); EspecimenUniversalCard (imatgePrivada també a les
 * targetes del Mur i dels actes, Decisió 3 del Mestre); EspecimenCarruselImatges (el munta
 * portadaDElement per a /mercat/:id i el lector del MAS); i AssignacioEmoji (la Wiki compilada va
 * en un tros a demanda del paquet trossejat, Decisió 5 del Mestre). Arreplega també destinsEmoji.js
 * (10:28:53) i guardaEmojisSafari16.js (09:43:20), tocats el 261007 sense posar-la al dia.
 * Versió anterior: EspecimenCarruselImatges.jsx, 2026-10-07T09:37:33+02:00, la marató 261007:
 * l'espècimen del carrusel; EspecimenUniversalCard (drets en una línia i sempre enllaç, l'acció gran,
 * targetes de pàgina de veritat i emojis XL al quadrat), EspecimenControlsBarra (Comentar en
 * privat o en públic), EspecimenEmojisXL (Assignar), EspecimenUniversalWorkspace (la roda dentada),
 * EspecimenOpcions, manifest.js (un emoji propi per espècimen) i registre.js (CarruselImatges,
 * PortaDePagina, BotoComentar i MenuComentar). Arreplega també els tocats el 261007 sense posar-la
 * al dia (detailRegistry.jsx a les 01:42).
 * Versió anterior: EspecimenNavMobil.jsx, 2026-10-06T05:16:25+02:00, retirada de la regla de noFacis sobre Telefonades que no havia dictat el Mestre.
 * Versió anterior: EspecimenNavMobil.jsx i manifest.js, 2026-10-06T04:42:10+02:00, la barra mòbil de cinc caselles: Telefonades n'ix per decisió del Mestre (261006).
 * Versió anterior: EspecimenEmojisXL.jsx, 2026-10-05T01:05:16+02:00, catàleg Unicode 18.0 complet i còpia accessible.
 * Versió anterior: EspecimenEmojisXL.jsx, 2026-10-04T23:38:33+02:00, marató A1 i Emojis XL.
 * Versió anterior: EspecimenPage.jsx, 04-10-2026 15:38:35 (+02:00,
 * hora d'estiu), correcció del verificador del tancament de la nit 261004:
 * la segona mostra de l'avatar s'obri a pantalla completa (PantallaCompleta)
 * per a vore'l a la mida de veres, i el text de les mostres diu que dins de
 * la columna del catàleg s'encongix i quina és la mida de veres.
 * L'anterior, EspecimenPage.jsx, 04-10-2026 15:20:48 (+02:00,
 * hora d'estiu), tancament de la nit 261004 (Pedra Seca §9): el bloc del
 * títol de PageFrame amb tres mostres de veres (l'avatar redó d'una persona
 * o la IA, el mateix amb onCanvia i el logotip de l'entitat que signa) i la
 * prop avatarAutor al contracte. Arreplega també els espècimens tocats entre
 * les 00:43 i les 15:20 sense posar-la al dia (EspecimenCamp.jsx,
 * EspecimenIdentitat.jsx, EspecimenTipografia.jsx i el mateix
 * EspecimenPage.jsx a les 11:50).
 * La d'abans, EspecimenUniversalCard.jsx, 04-10-2026 00:43:56
 * (+02:00, hora d'estiu), Onada 4 · P6 (directriu 261003_2325 del Mestre):
 * les mostres de doble acció porten el peu blau i cap etiqueta, l'autor va al
 * xat corporatiu resolt (xatCorporatiu.js), el preu va al quadrat fosc (amb
 * una mostra de preu llarg) i el contracte documenta `price`. L'anterior,
 * 03-10-2026 23:42:30 (manifest.js i registre.js, ESMENA 261003 22:34:
 * la targeta de doble acció estàndard), i abans 22:37:08 (P5), que ja
 * arreplegava EspecimenEnquadrament.jsx i els espècimens tocats entre el
 * 30-09 i el 03-10.
 * Quan el manifest porte `creat` i `modificat` per espècimen, manaran eixos
 * camps i esta constant només farà de versió del conjunt.
 */
export const VERSIO_CATALEG = '2026-11-23T23:04:02+01:00';
