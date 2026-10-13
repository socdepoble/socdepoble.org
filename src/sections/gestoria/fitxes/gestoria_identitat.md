# Tractor «Gestoria · Fitxa d’identitat i Finestreta»

**Identificador:** `gestoria.identitat` · **Versió:** 1.0.0 · **Dades personals:** sí · **Xarxa:** cap

## Què fa, en una frase

Llig, només en este ordinador, els teus papers d’identitat de la carpeta que tries (01_Identitat_Legal i 03_Burocracia/SUMA), et proposa els camps legals (el NIF, el nom, el domicili, l’afiliació a la Seguretat Social, el RETA, les referències cadastrals i de SUMA, les dades de l’associació i de la representació) perquè els confirmes un a un, en desa xifrats només els que confirmes i te’ls prepara per a copiar-los als tràmits. **No signa ni presenta cap tràmit.**

## Pas a pas

1. **Obris el cofre.** Tota la vista va darrere del cofre xifrat de la Gestoria (el mateix de l’Històric): amb el cofre sense crear o bloquejat no es pinta res més que el títol i la porta del cofre.
2. **Comprova la teua aprovació.** Abans de tocar la carpeta, ni tan sols per a llegir-ne els noms, verifica que l’empremta del seu codi, d’esta fitxa i del seu manifest és la que has aprovat. Si no ho és, s’atura i la pantalla diu «Cal aprovar el tractor»: sense l’aprovació tampoc es mostren la fitxa ni la Finestreta.
3. **Tu tries la carpeta arrel** de la Gestoria amb el selector del sistema (o, si el navegador no en té, amb el botó de pujar una carpeta). Res es puja enlloc.
4. **«Què llegiré i què no».** Abans d’obrir cap paper, decidix pel nom i per la carpeta de cada fitxer què es llig, què no i què cal que marques, i t’ho ensenya en una taula amb el perquè:
   - **Es llegirà:** els papers coneguts i permesos de 01_Identitat_Legal i de 03_Burocracia/SUMA: la vida laboral, la resolució d’afiliació, les resolucions del RETA, l’informe de bases, els rebuts i notificacions de SUMA, la sol·licitud del Kit Digital, l’alta al registre d’associacions, els estatuts i el certificat de representació.
   - **Només si el marques:** els papers amb un nom que no diu què són. Només compta el nom del fitxer, no la carpeta on és. Sense la teua marca no s’obrin.
   - **No s’obrirà mai,** encara que el marques: tot el que és fora de 01_Identitat_Legal i de 03_Burocracia/SUMA; les carpetes 90 (arxiu), de quarantena i de l’Agència Tributària; i, a qualsevol lloc, la llista de vetats.
5. **Llig els permesos i els marcats.** De cada un en calcula l’empremta SHA-256 i en trau el text: el d’un PDF generat per màquina o el d’un fitxer de text pla. L’extractor hi busca les etiquetes de cada tipus de paper i, darrere de cada etiqueta, el primer valor que té la forma i passa el validador del camp (amb la lletra o el dígit de control quan l’identificador en porta). Sense etiqueta no hi ha proposta: cap número solt es pren per un DNI.
6. **Descarta el paper.** Els bytes i el text es deixen anar en acabar cada paper. Només queden les propostes: el camp, el valor, la regla que l’ha trobat, la confiança i la font (la ruta del paper i la seua empremta).
7. **Revises les propostes.** Cap entra sola a la fitxa: la **confirmes**, la **rebutges** o la **corregixes** a mà. Quan dos papers diuen coses diferents, el camp queda «en conflicte» i tries tu. Si un paper nou diu una altra cosa d’un valor ja confirmat, la fitxa t’ho avisa i no el canvia sense tu.
8. **La Finestreta.** Quatre formularis declaratius (la sol·licitud genèrica de la Generalitat, la instància general de l’Ajuntament, la sol·licitud a SUMA i l’acreditació de la representació d’una entitat), cadascun **«A verificar contra el model vigent»**. Només els valors confirmats els omplin, tornats a validar amb el tipus del camp del formulari: un NIF no entra mai en un camp de nom. Cada camp té «Copia» (al porta-retalls, quan prems el botó) i cada formulari un «Esborrany per imprimir».

## La llista de vetats

No s’obrin mai, encara que el nom porte també una paraula permesa (el vetat sempre guanya):

- **Salut:** incapacitat temporal, baixa o part mèdic, comunicats mèdics, discapacitat, pagament directe. Si el text d’un paper permés porta dades de salut, el paper sencer no proposa res.
- **Model 145** (dades familiars i de discapacitat).
- **Banc i cotització:** comptes, titularitat bancària, avisos de càrrec, domiciliacions i mandats SEPA, rebuts de cotització. L’informe de bases de cotització i les resolucions del RETA per compte propi no són papers del banc: es lligen.
- **Credencials:** contrasenyes i claus.
- **Renda i herència.**
- **Formats que no són papers:** signatures electròniques, enllaços i documents d’altres aplicacions.
- **Imatges:** no hi ha reconeixement de text (OCR); les dades d’una foto s’entren a mà.
- **Documents del SEPE i de LABORA,** en una carpeta o en el nom, i els papers de l’atur: fora per defecte.

La fitxa tampoc té on guardar un IBAN, una dada de salut, el codi segur de verificació dels documents ni cap credencial: no hi ha cap camp per a ells, i l’extractor en bloqueja els trams abans de buscar res.

## Què llig

- La carpeta que tries: el nom i la mida de cada fitxer, per a decidir què es llig.
- Dels papers que es lligen (pas 4), els bytes, en la memòria del navegador, el temps de calcular-ne l’empremta i extraure’n el text.
- Amb el cofre obert, la teua fitxa desada: només els valors confirmats.

## Què escriu

- Res durant la lectura: les propostes viuen en la memòria de la pàgina i desapareixen quan la tanques, quan ixes d’esta vista, quan prems «Oblida la carpeta» o quan el cofre es bloqueja.
- Cada valor que **confirmes** o **entres a mà** es desa **xifrat** al cofre d’este navegador (la base `sdp-gestoria-cofre`, col·lecció `identitat`, amb AES-GCM-256 i una clau que només obrin la teua frase de pas o el codi de recuperació), amb la seua font. Mai una proposta sense confirmar, mai el text dels papers. Els titulars de la fitxa porten un identificador opac i un àlies genèric, sense cap dada.
- L’**exportació en clar** del cofre (amb la confirmació escrita i la frase de pas) també porta la fitxa d’identitat, com tot el que hi ha al cofre. Guarda eixe fitxer en un lloc segur i esborra’l quan ja no el necessites.

## Què no fa mai

- **No signa ni presenta cap tràmit.** Preparar, omplir, signar i presentar són operacions separades: la Finestreta només prepara. La signatura, l’exposició, la sol·licitud, el codi de l’òrgan i l’IBAN els escrius sempre tu. Quan copies un camp a la seu electrònica d’un organisme, eixa entrega la fas tu i ja és una transmissió.
- No envia res per la xarxa ni es connecta a cap organisme.
- No posa cap dada legal al perfil social (`public.profiles`), a les metadades del compte, a cap sessió, registre, error ni cua.
- No canvia l’avatar ni la portada: són elecció exclusiva teua.
- No mostra cap valor fins que tu prems l’ull de la barra: ni a les propostes, ni a la fitxa, ni als formularis.
- No posa cap dada a l’adreça de la pàgina: els títols de les seccions no porten mai cap nom de paper ni cap valor.
- No fa reconeixement de text (OCR): un PDF escanejat o xifrat dona un avís i cap proposta.

## Límits honestos

- Les etiquetes i les regles de cada tipus de paper són heurístiques **[A VERIFICAR]** amb els papers reals: un paper amb un format nou pot no donar res, i les dades s’entren a mà.
- Algunes regles de control (el número d’afiliació, la referència cadastral, l’identificador de persona física de la Tresoreria) són les del disseny **[A VERIFICAR]** contra la font oficial.
- Els quatre formularis són aproximacions declaratives **[A VERIFICAR contra el model vigent]**: els codis de l’òrgan i els camps de cada organisme poden canviar.
- Un rebuig no es recorda: tornar a llegir el mateix paper el pot tornar a proposar.
- La lectura s’atura a 60 papers de 10 MB com a molt.

## Com es desenxufa

«Oblida la carpeta» desenxufa la carpeta, buida la taula, la lectura i les propostes, i torna a amagar els valors; els confirmats es queden a la fitxa. També cancel·la la lectura activa: el paper que ja ha començat acaba, però els seus bytes es descarten i no se’n llig cap més. Bloquejar el cofre (el botó «Bloqueja», 10 minuts sense activitat, 5 amb la pestanya amagada, eixir de la pàgina o d’esta vista) fa el mateix i, a més, buida de la memòria la fitxa desxifrada. Revocar l’aprovació al panell de Tractors bloqueja les lectures següents.

## L’aprovació

Aproves esta versió exacta per la seua empremta curta, amb la signatura de Touch ID o d’una clau de pas (la confirmació escrita no basta per a dades personals). Qualsevol canvi en el codi, en el manifest o en esta fitxa la invalida. Caduca als 90 dies. És una aprovació separada de les del full trimestral, del correu, del Tauler i de l’Històric: aprovar la Fitxa d’identitat no aprova cap dels altres.

**Què protegix i què no.** L’aprovació d’este navegador evita l’execució accidental o d’una versió que no has llegit, i el selector de la carpeta exigix un gest teu. No protegix davant d’un programa que ja controle este navegador o el teu perfil. El cofre (la porta, l’autobloqueig, el magatzem i el xifratge) és font d’este tractor: un canvi en el cofre torna l’aprovació a «pendent». També ho són la carpeta (el selector del sistema) i, perquè hi pengen, els lectors del full trimestral i del correu, que esta Fitxa no executa mai. El xifratge protegix el que hi ha desat amb el cofre bloquejat; mentre és obert, el que es pinta viu en la memòria de la pàgina, i el que copies al porta-retalls el poden llegir altres programes d’este ordinador.
