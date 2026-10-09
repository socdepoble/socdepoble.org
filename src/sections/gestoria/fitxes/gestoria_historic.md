# Tractor «Gestoria · Històric del banc i despesa en IA»

**Identificador:** `gestoria.historic` · **Versió:** 1.0.0 · **Dades personals:** sí · **Xarxa:** cap

## Què fa, en una frase

Llig, només en este ordinador, els extractes del banc que tu tries (de l'1 de gener de l'any passat al final del trimestre passat), classifica cada moviment per categoria i proveïdor sense guardar-ne el text, i en calcula l'històric per mes, trimestre i any, la despesa en intel·ligència artificial, una estimació dels impostos i el llibre de càlcul per a la gestora.

## Pas a pas

1. **Obris el cofre.** Tota la vista va darrere del cofre xifrat de la Gestoria: amb el cofre sense crear o bloquejat no es pinta res més que el títol i la porta del cofre (ni l'aprovació, ni el selector, ni cap xifra, regla o classificació). L'obris amb la teua frase de pas o, si l'has oblidada, amb el codi de recuperació.
2. **Comprova la teua aprovació.** Abans de llegir res verifica que l'empremta del seu codi, d'esta fitxa i del seu manifest és la que has aprovat. Si no ho és, s'atura i la pantalla diu «Cal aprovar el tractor».
3. **Tu tries els fitxers.** Fins a 60 extractes de 10 MB com a molt: Norma 43 (`.n43`, `.aeb`, `.c43`, `.q43`, `.txt` o `.dat`) o el CSV de moviments del banc, triats amb el selector del sistema.
4. **Classifica dins.** Per a cada moviment llig el text dels conceptes, el comerç de la targeta i el creditor del rebut SEPA, i hi busca la categoria (IA, allotjament i dominis, programari, telefonia i internet, energia, comissions bancàries, impostos, quota d'autònoms, transferències i nòmines, traspàs entre comptes propis, ingressos de clients, altres o per revisar) i el proveïdor (Anthropic, OpenAI, Gemini, Copilot, Perplexity, Mistral, xAI, Kimi, DeepSeek, Z.ai, Qwen, fal.ai, ElevenLabs, Replicate, OpenRouter, Midjourney, Cursor, Vercel, Supabase…). Primer manen les teues regles. Google o Microsoft sense dir el producte van a «per revisar»: Gemini no és Workspace.
5. **En guarda només el que necessiten les xifres.** De cada compte: l'entitat, els quatre últims dígits, la moneda, les dates i els saldos. De cada moviment: les dates, l'import, l'import en dòlars si el banc el porta, la categoria, el proveïdor, la confiança, un codi del motiu i un identificador opac (una empremta de les dates i l'import, per a recordar les teues reclassificacions). El text dels conceptes, el comerç, les referències, el número de document i les dades del rebut SEPA es descarten en acabar de classificar.
6. **Calcula l'històric.** Unix els extractes del mateix compte extracte a extracte: un dia que ja cobrix un extracte no torna a comptar en cap altre, encara que un siga anual i l'altre trimestral. Un període és «complet» només si tots els teus comptes el cobrixen sencer; si en falta algun dia d'algun compte (un forat entre extractes, o un compte amb menys extractes), és «parcial» i un avís diu les dates; si cap extracte el cobrix, no té xifra. Els traspassos entre comptes propis van a part; una eixida d'un compte i una entrada d'un altre amb el mateix import i tres dies de diferència com a molt es marquen com a traspàs probable, per revisar.
7. **Estima els impostos.** El 303 i el 130 de cada trimestre, el 390 i una renda orientativa, amb paràmetres que pots canviar (també les escales i la minoració, tram a tram) i que diuen d'on ixen. Un trimestre sense extractes no té ni 303 ni 130. Tot és una estimació per a revisar amb la gestoria, mai una declaració.

## Què llig

- Els extractes del banc que tries: els llig sencers en la memòria del navegador, però en guarda només el que diu el pas 5.
- El selector mostra el nom dels fitxers triats. Dins de la lectura, el nom només es guarda en l'avís d'un fitxer que no s'ha pogut llegir.
- Amb el cofre obert, la teua configuració desada: les regles, les reclassificacions, els paràmetres, les suposicions i l'escenari.

## Què escriu

- Res durant la lectura. Les xifres viuen en la memòria de la pàgina i desapareixen quan la tanques, quan ixes d'esta vista o quan el cofre es bloqueja.
- Si ho demanes i ho confirmes, el llibre XLSX per a la gestora, descarregat. Abans de descarregar-lo, la pantalla avisa que ix **sense xifrar** i en mostra l'empremta SHA-256. El llibre no porta el text dels conceptes del banc.
- Cada canvi de les teues regles, reclassificacions, paràmetres, suposicions i escenaris es desa **xifrat** al cofre d'este navegador (la base `sdp-gestoria-cofre`, col·lecció `historic`, amb AES-GCM-256 i una clau que només obrin la teua frase de pas o el codi de recuperació). Mai la lectura del banc: els moviments es tornen a llegir dels extractes. Les reclassificacions es guarden per l'identificador opac de cada moviment, una empremta curta (32 bits) de les dates i l'import que es podria desfer provant combinacions: per això només es desen dins del cofre.

## Què no fa mai

- No es connecta al teu banc ni a cap servei: treballa amb els fitxers que descarregues tu.
- No envia res per la xarxa.
- No mostra cap xifra fins que tu prems l'ull: ni a les targetes, ni a les taules, ni als recomptes, ni als gràfics (l'alçada de les barres també és una xifra: amb l'ull tancat, el gràfic no es pinta).
- No posa cap dada a l'adreça de la pàgina.

## Límits honestos

- La classificació és per patrons: un comerç amb un nom estrany va a «altres» o a «per revisar». Les regles i les reclassificacions ho corregixen.
- El país de cada proveïdor, i per tant el tractament de l'IVA, és una suposició [NO VERIFICAT]: mana la factura.
- El banc no diu la base ni l'IVA: la simulació els suposa (21 % per defecte) i cada despesa necessita la seua factura per a deduir-se.
- Les escales, els mínims, els límits i els terminis són dades [NO VERIFICAT] per a revisar cada any amb la gestoria.
- La renda només compta l'activitat econòmica: cap altra renda, reducció ni deducció.

## Com es desenxufa

«Oblida les dades» buida la lectura, deixa anar els fitxers triats i torna a amagar totes les xifres. També cancel·la la lectura activa: el fitxer que ja ha començat acaba, però els seus bytes es descarten i no se'n llig cap més. Bloquejar el cofre (el botó «Bloqueja», 10 minuts sense activitat, 5 amb la pestanya amagada, eixir de la pàgina o d'esta vista) fa el mateix i, a més, buida de la memòria la configuració desxifrada: per a tornar a vore res cal la frase de pas i tornar a triar els extractes. Revocar l'aprovació al panell de Tractors bloqueja les lectures següents.

## L'aprovació

Aproves esta versió exacta per la seua empremta curta, amb la signatura de Touch ID o d'una clau de pas (la confirmació escrita no basta per a dades personals). Qualsevol canvi en el codi, en el manifest o en esta fitxa la invalida. Caduca als 90 dies. És una aprovació separada de les del full trimestral, del correu i del Tauler: aprovar l'Històric no aprova cap dels altres tres.

**Què protegix i què no.** L'aprovació d'este navegador evita l'execució accidental o d'una versió que no has llegit, i el selector de fitxers exigix un gest teu. No protegix davant d'un programa que ja controle este navegador o el teu perfil. El cofre (la porta, l'autobloqueig, el magatzem i el xifratge) és font d'este tractor: un canvi en el cofre torna l'aprovació a «pendent». El xifratge protegix el que hi ha desat amb el cofre bloquejat; mentre és obert, el que es pinta viu en la memòria de la pàgina. El llibre XLSX l'escriu una utilitat comuna de l'app (els fulls de càlcul: quatre fitxers, l'escriptor, el model, el ZIP i el descompressor), que no és font d'este tractor: només rep les xifres ja reduïdes, i una prova de privacitat comprova que cap dels quatre té xarxa ni emmagatzematge.
