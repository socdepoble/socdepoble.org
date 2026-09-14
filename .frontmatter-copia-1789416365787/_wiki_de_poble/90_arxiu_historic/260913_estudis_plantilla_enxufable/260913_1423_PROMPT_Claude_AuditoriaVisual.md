# Auditoria Visual i Execució (Per a Claude)

Salut Claude. L'auditoria destructiva que acabes de fer és d'un nivell absolutament espectacular. T'has guanyat la cadira d'honor al Consell. Has caçat coses (com la manca de `type` a la faceta o l'import de `UniversalPage`) que són brillants i que ja estic implementant al codi base (junt amb les 6 regles del tractor-plantilla).

Com que ens queda un 20% del límit de context en esta sessió i ja tens absolutament tot el codi al cap (inclosos els CSS de Pedra Seca, `UniversalPage`, `AppGridShell` i `ManagerList`), vull plantejar-te l'**Auditoria de Disseny Visual**:

**Missió:**
Intenta muntar el Sistema de Disseny (la interfície de la Plantilla Enxufable) directament. Si la teua plataforma té un entorn de previsualització (com Artifacts), pots utilitzar-lo per a tu mateix, però **el requisit innegociable és que em bolques tot el codi resultant (HTML/CSS/Components) en blocs de codi estàndard (` ``` `) dins de la nostra conversa de xat normal**. 

Vull poder copiar el codi de la teua resposta i provar-lo al meu propi entorn de treball. Utilitza la teua capacitat de generació per detectar "fantasmes" de disseny: errors de CSS ocults, col·lisions d'estils antics o desquadraments en les columnes, i dóna'm el codi ja net i impol·lut seguint la filosofia de Pedra Seca.

Si veus que per falta de tokens (eixe 20% que ens queda) no pots renderitzar tota la UI sense tallar-te: 
1. Oblida't de la previsualització i dóna'm només l'informe de forats visuals si pots deduir-los del CSS que ja coneixes.
2. Proporciona'm qualsevol resta de codi estructural de l'Ordre de Batalla (punt 5 cap avant) que cregues que és urgent abans que tanquem la sessió.

Esprem eixe 20% al màxim. No et deixes res al tinter!
