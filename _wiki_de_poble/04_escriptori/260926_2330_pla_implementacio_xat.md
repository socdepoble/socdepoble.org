# Pla d'Implementació: Mòdul de Xat (Clon de WhatsApp)

## Estat Actual
Finalitzada la fase de refactorització de la interfície i alineació visual de la barra lateral (Icon-rail). Ara canviem de terç per centrar-nos exclusivament en l'arquitectura i el disseny lògic del futur mòdul de missatgeria de "Sóc de Poble".

## Objectiu de la Sessió
Abans de picar ni una sola línia de codi per al nou sistema de Xat, necessitem un **mapa complet i exhaustiu de funcionalitats** basat en el comportament de WhatsApp. L'objectiu és que la IA genere un document/skill detallat amb tota la lògica prevista (estats, confirmacions de lectura, reaccions, respostes anidades, compartició d'arxius, etc.) per tal que l'equip humà puga auditar-lo, revisar-lo amb captures de pantalla i decidir quines funcions s'aproven per a producció i quines es descarten.

## Restriccions i Visió de Producte (El Perquè)
- **Zero Fricció (Llei del Poble):** L'experiència ens diu que la gent no vol eixir de WhatsApp. Qualsevol intent de fer-los usar formularis o apps externes fracassa (ex: l'app de disfresses on només van entrar 7 de 70 persones). Per això, el nostre xat ha de ser visualment i funcionalment idèntic a WhatsApp perquè no hagen d'aprendre a utilitzar-lo.
- **Les IAs com a "Carpetes Intel·ligents":** La gent seguirà enviant 500 missatges caòtics al xat del grup. En lloc de prohibir-ho, els nostres agents IA actuaran com a oients de fons ("carpetes intel·ligents"). A mesura que la gent xarra, la IA recull eixes converses i les transforma en documents estructurats (un bloc de notes compartit, un llistat de qui s'ha apuntat, una acta), extraient l'ordre del caos sense demanar-li cap esforç addicional a l'usuari.
