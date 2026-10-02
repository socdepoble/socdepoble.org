/**
 * baralla.js — Contingut declaratiu i versionat del repàs de la Gestoria.
 *
 * Cada targeta porta la seua `versio`: canviar-ne el text obliga a pujar-la, i
 * el motor (leitner.js) torna eixa targeta a la caixa 0. Els `id` són únics
 * entre baralles: el magatzem de progrés els usa com a clau.
 *
 * Contingut formatiu general sobre l'IVA i l'IRPF dels autònoms a la Península
 * i les Balears. Si una dada no era segura, no s'hi ha posat.
 */

const targeta = (id, camps) => Object.freeze({ id, versio: '1.0.0', ...camps });

export const BARALLA_GESTORIA = Object.freeze({
  id: 'gestoria-autonoms',
  versio: '1.0.0',
  titol: 'Aprendre la gestoria',
  avis: 'Contingut formatiu general; confirma-ho sempre amb la teua gestoria.',
  targetes: Object.freeze([
    targeta('gestoria-trimestres', {
      titol: 'Els quatre trimestres',
      concepte: 'L’any fiscal es dividix en quatre trimestres naturals, iguals per a tothom: 1T de gener a març, 2T d’abril a juny, 3T de juliol a setembre i 4T d’octubre a desembre.',
      mnemotecnia: 'Cada trimestre acaba en un mes múltiple de tres: març (3), juny (6), setembre (9) i desembre (12).',
      pregunta: 'Quins mesos inclou el tercer trimestre (3T)?',
      resposta: 'Juliol, agost i setembre.',
      explicacio: 'Els trimestres no es compten des del dia que et dones d’alta: són naturals. El 3T va de l’1 de juliol al 30 de setembre per a tothom.'
    }),
    targeta('gestoria-model-303', {
      titol: 'Model 303: l’IVA del trimestre',
      concepte: 'El model 303 és l’autoliquidació trimestral de l’IVA: hi declares l’IVA que has cobrat en les teues factures i el que t’han cobrat en les despeses de l’activitat.',
      mnemotecnia: '303 es llig igual d’anada i de tornada, com l’IVA: entra amb les vendes i ix amb les compres.',
      pregunta: 'Quin impost liquida el model 303 i cada quant?',
      resposta: 'L’IVA, cada trimestre.',
      explicacio: 'El 303 resta l’IVA suportat deduïble de l’IVA repercutit. Si ix positiu, l’ingresses; si ix negatiu, el compenses en els trimestres següents i, en l’últim de l’any, en pots demanar la devolució.'
    }),
    targeta('gestoria-model-130', {
      titol: 'Model 130: l’avançament de la renda',
      concepte: 'El model 130 és el pagament fraccionat de l’IRPF per a qui tributa en estimació directa: cada trimestre avances una part de l’impost sobre la renda de l’any.',
      mnemotecnia: '1-3-0: una renda, tres mesos, zero si no guanyes.',
      pregunta: 'Com es calcula el model 130?',
      resposta: 'El 20 % del rendiment net acumulat des de l’1 de gener, menys els pagaments fraccionats anteriors de l’any i les retencions que t’han practicat.',
      explicacio: 'És acumulat: cada trimestre mira els ingressos menys les despeses deduïbles de tot l’any fins aleshores, i per això resta el que ja has pagat. Si el resultat no és positiu, no hi ha res a ingressar. Si l’any anterior almenys el 70 % dels ingressos de la teua activitat professional ja portaven retenció, no estàs obligat a presentar-lo.'
    }),
    targeta('gestoria-terminis-303-130', {
      titol: 'Terminis del 303 i del 130',
      concepte: 'El 303 i el 130 es presenten el mes següent a cada trimestre: de l’1 al 20 d’abril (1T), de l’1 al 20 de juliol (2T), de l’1 al 20 d’octubre (3T) i de l’1 al 30 de gener de l’any següent (4T).',
      mnemotecnia: 'Vint dies per a cada trimestre; el gener en té trenta perquè tanca l’any.',
      pregunta: 'Fins a quin dia pots presentar el 303 i el 130 del quart trimestre?',
      resposta: 'Fins al 30 de gener de l’any següent.',
      explicacio: 'El 4T té deu dies més perquè coincidix amb el tancament de l’any. Si l’últim dia és inhàbil, el termini passa al primer dia hàbil següent; si domicilies el pagament, el termini per a fer-ho acaba uns dies abans.'
    }),
    targeta('gestoria-iva-repercutit-suportat', {
      titol: 'IVA repercutit i IVA suportat',
      concepte: 'L’IVA repercutit és el que cobres als clients en les factures que emets. L’IVA suportat és el que et cobren els proveïdors en les factures que reps.',
      mnemotecnia: 'Repercutit: el «re»-passes al client. Suportat: el suportes tu quan pagues.',
      pregunta: 'L’IVA d’una factura que emets a un client és repercutit o suportat?',
      resposta: 'Repercutit.',
      explicacio: 'En el 303 restes el suportat del repercutit. Només pots deduir el suportat de despeses afectes a l’activitat i justificades amb una factura completa a nom teu.'
    }),
    targeta('gestoria-tipus-iva', {
      titol: 'Els tipus d’IVA',
      concepte: 'A la Península i les Balears, l’IVA té tres tipus: el general del 21 %, el reduït del 10 % i el superreduït del 4 %.',
      mnemotecnia: '21 per al general; 10, els dits de les mans; 4, les potes d’una cadira.',
      pregunta: 'Quant valen els tipus d’IVA general, reduït i superreduït?',
      resposta: 'General 21 %, reduït 10 % i superreduït 4 %.',
      explicacio: 'El tipus depén del bé o del servei, no de qui el ven; la majoria de serveis professionals van al 21 %. Hi ha operacions exemptes i, de tant en tant, tipus temporals: si un producte et genera dubtes, consulta-ho. Les Canàries, Ceuta i Melilla tenen impostos propis en lloc de l’IVA.'
    }),
    targeta('gestoria-factura-rebut', {
      titol: 'Factura o rebut',
      concepte: 'Un rebut o un justificant de pagament acredita que has pagat, però no és una factura. Per a deduir l’IVA d’una despesa necessites la factura completa, amb el teu nom o raó social i el teu NIF.',
      mnemotecnia: 'El rebut diu «he pagat»; la factura diu «a qui, per què i quant d’IVA».',
      pregunta: 'Pots deduir l’IVA d’una despesa si només tens el rebut del pagament?',
      resposta: 'No. Necessites la factura completa amb el teu NIF.',
      explicacio: 'La factura completa porta número i sèrie, data, dades i NIF de qui la fa i de qui la rep, descripció, base imposable, tipus i quota d’IVA. Un tiquet o factura simplificada en general no basta, llevat que hi consten el teu NIF, el teu domicili i la quota d’IVA separada. Demana-la sempre al proveïdor.'
    }),
    targeta('gestoria-inversio-subjecte-passiu', {
      titol: 'Proveïdor de la UE sense IVA',
      concepte: 'Quan una empresa d’un altre país de la UE et factura un servei sense IVA perquè tu també eres empresa, s’aplica la inversió del subjecte passiu: l’IVA l’autoliquides tu.',
      mnemotecnia: 'La pilota canvia de camp: tu poses l’IVA i tu te’l tornes.',
      pregunta: 'Com declares en el 303 la factura sense IVA d’un proveïdor de la UE?',
      resposta: 'Per inversió del subjecte passiu: hi declares alhora l’IVA repercutit i l’IVA suportat de la mateixa operació.',
      explicacio: 'Calcules l’IVA espanyol sobre la base de la factura i l’anotes als dos costats. Si el pots deduir sencer, el resultat net és zero, però han de constar tots dos. A més, eixa operació s’inclou en la declaració recapitulativa, el model 349.'
    }),
    targeta('gestoria-model-349', {
      titol: 'Model 349: la recapitulativa',
      concepte: 'El model 349 és la declaració recapitulativa d’operacions intracomunitàries: hi llistes les compres i les vendes de béns i serveis amb empreses d’altres països de la UE.',
      mnemotecnia: 'El 349 és la llista de la compra europea: no paga res, només recapitula.',
      pregunta: 'Quin model recull les operacions amb empreses d’altres països de la UE?',
      resposta: 'El model 349, la declaració recapitulativa d’operacions intracomunitàries.',
      explicacio: 'És informativa: no ix cap import a pagar, però Hisenda la creua amb el que declaren les empreses dels altres països. Només es presenta en els períodes amb operacions, i la periodicitat (mensual o trimestral) depén del volum: la gestoria et dirà quina et toca.'
    }),
    targeta('gestoria-roi-036', {
      titol: 'El ROI i el model 036',
      concepte: 'El ROI és el Registre d’Operadors Intracomunitaris. Has d’estar-hi d’alta per a operar amb empreses d’altres països de la UE amb el teu NIF-IVA, i l’alta es demana amb el model 036.',
      mnemotecnia: 'ROI: el «rei» de les operacions europees; la corona es demana amb el 036.',
      pregunta: 'Amb quin model demanes l’alta en el Registre d’Operadors Intracomunitaris?',
      resposta: 'Amb el model 036, la declaració censal.',
      explicacio: 'Amb l’alta, el teu NIF apareix com a NIF-IVA vàlid en el sistema europeu VIES. Si no hi estàs, el proveïdor europeu no pot comprovar que eres empresa i et pot facturar amb IVA com si fores un particular.'
    }),
    targeta('gestoria-lletra-nif', {
      titol: 'La lletra del NIF',
      concepte: 'El NIF d’una persona porta una lletra final de control. Es calcula dividint el número entre 23: el residu, de 0 a 22, tria la lletra en una taula fixa.',
      mnemotecnia: 'Vint-i-tres lletres de guàrdia: el residu tria qui fa la guàrdia.',
      pregunta: 'Per a què servix la lletra final del NIF d’una persona?',
      resposta: 'És un control: ix del residu de dividir el número entre 23 i delata els errors en copiar-lo.',
      explicacio: 'Si t’equivoques en una sola xifra o en canvies dues de lloc, la lletra deixa de quadrar. Per això un programa et pot avisar d’un NIF mal copiat abans d’enviar el full a la gestoria. Que la lletra quadre no prova que el NIF existisca.'
    }),
    targeta('gestoria-lletra-entitat', {
      titol: 'La primera lletra del NIF d’una entitat',
      concepte: 'El NIF d’una entitat (l’antic CIF) comença per una lletra que indica la forma jurídica: A, societat anònima; B, societat limitada; F, cooperativa; G, associació o fundació.',
      mnemotecnia: 'A d’Anònima, B de «Bé, limitada», F de «Fem-ho junts», G de «Gent que s’associa».',
      pregunta: 'Quina forma jurídica indica un NIF d’entitat que comença per B?',
      resposta: 'Una societat de responsabilitat limitada.',
      explicacio: 'Després de la lletra venen set xifres i un caràcter de control, que pot ser una xifra o una lletra segons el tipus d’entitat. Llegir la primera lletra ajuda a detectar un NIF copiat al camp equivocat o una contrapart mal identificada.'
    }),
    targeta('gestoria-conservacio-factures', {
      titol: 'Quant de temps guardar les factures',
      concepte: 'Has de conservar les factures emeses i rebudes almenys quatre anys, el termini de prescripció fiscal. El Codi de Comerç demana sis anys per als llibres i la documentació de l’activitat empresarial.',
      mnemotecnia: 'Quatre per a Hisenda, sis per al Codi de Comerç: guarda-les fins al més llarg que t’afecte.',
      pregunta: 'Quant de temps, com a mínim, has de guardar les factures pel termini de prescripció fiscal?',
      resposta: 'Quatre anys.',
      explicacio: 'Els quatre anys es compten des que acaba el termini per a presentar la declaració on entra la factura, no des de la data de la factura. Si tens obligacions mercantils, aplica el termini més llarg, el de sis anys.'
    }),
    targeta('gestoria-retencio-irpf', {
      titol: 'La retenció d’IRPF en les factures',
      concepte: 'Si fas una activitat professional i factures a una empresa o a un altre professional, la factura porta una retenció d’IRPF del 15 %, o del 7 % l’any d’inici i els dos següents.',
      mnemotecnia: 'Arrancada a 7, velocitat de creuer a 15.',
      pregunta: 'Quina retenció d’IRPF porta normalment la factura d’un professional a una empresa?',
      resposta: 'El 15 %; el 7 % l’any d’inici de l’activitat i els dos següents.',
      explicacio: 'El 7 % només s’aplica si l’any anterior no feies cap activitat professional, i has de comunicar-ho al client. La retenció es calcula sobre la base imposable: el client la resta del total i la ingressa a Hisenda a compte teu, i tu la restes en el 130 i en la renda. A particulars no se’ls aplica retenció.'
    }),
    targeta('gestoria-iva-no-es-teu', {
      titol: 'L’IVA no és teu',
      concepte: 'L’IVA que cobres no és un ingrés de la teua activitat: el guardes per compte d’Hisenda fins que el lliures amb el 303.',
      mnemotecnia: 'L’IVA és una motxilla prestada: la portes tu, però no és teua.',
      pregunta: 'Cobres una factura de 121 € que porta un 21 % d’IVA. Quina part és ingrés de la teua activitat?',
      resposta: '100 €. Els 21 € d’IVA els has de liquidar a Hisenda.',
      explicacio: 'Per a l’IRPF compta la base imposable, no el total amb IVA. Aparta l’IVA cobrat en una reserva: si el gastes, quan presentes el 303 l’hauràs de pagar igualment.'
    }),
    targeta('gestoria-base-iva-retencio', {
      titol: 'Base, IVA i retenció en una factura',
      concepte: 'En una factura professional amb retenció, el total a cobrar és la base imposable més l’IVA menys la retenció d’IRPF. Tots dos percentatges s’apliquen sobre la base.',
      mnemotecnia: 'Base, puja l’IVA, baixa la retenció: «base, més, menys».',
      pregunta: 'Base de 1.000 €, IVA del 21 % i retenció del 15 %. Quin és el total a cobrar?',
      resposta: '1.060 €: 1.000 + 210 − 150.',
      explicacio: 'Els 210 € d’IVA els liquides amb el 303. Els 150 € de retenció els ingressa el client a Hisenda a compte del teu IRPF, i tu els restes després en el 130 i en la renda.'
    }),
    targeta('gestoria-numeracio-correlativa', {
      titol: 'Numeració correlativa',
      concepte: 'Les factures que emets han de portar un número correlatiu dins de cada sèrie, sense salts. Pots tindre diverses sèries, i les rectificatives van en una sèrie pròpia.',
      mnemotecnia: 'Les factures són com les dents d’una pinta: si en falta una, es nota.',
      pregunta: 'Pots deixar un buit en la numeració de les factures que emets?',
      resposta: 'No. Dins de cada sèrie, la numeració ha de ser correlativa.',
      explicacio: 'Un salt de número és el primer que crida l’atenció en una revisió, i també la manera més ràpida de descobrir una factura que falta en el full trimestral. Si una factura emesa és errònia, no en reutilitzes el número: es corregix amb una rectificativa.'
    })
  ])
});
