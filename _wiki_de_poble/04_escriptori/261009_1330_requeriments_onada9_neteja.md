# L'Escombrada General (Onada 9)

Aquest document estableix els requeriments per a l'**Onada 9**, centrada exclusivament en la neteja profunda del sistema de fitxers. El Mestre ha atorgat **permisos absoluts** per a esborrar brossa.

## Objectiu
Aconseguir un sistema de fitxers impecable, on només quede allò que és estructuralment necessari per a funcionar, documentar i compilar.

## Directrius d'Escombrada (Per a Claude)
Has d'analitzar carpeta per carpeta tot el repositori (`socdepoble.org`) i el directori pare (`Som de Poble`), identificant i actuant sobre la brossa:

1. **Neteja a fons de `wordpress-plugin/builds/`**: Tens via lliure per aplicar la lògica de la skill `core-empaquetat-wp`. Hi ha més de 2 GB en arxius ZIP antics. Esborra tots els ZIPs antics i preserva ÚNICAMENT la versió estable actual i la generada en l'última Onada.
2. **Auditories i arxius desfasats**: Al directori pare `Som de Poble/` hi ha fitxers com `260921_0725_informe_auditoria_...` tirats al mig. Analitza'ls i, si no valen per a res, elimina'ls. Si tenen valor històric vital, mou-los a `90_arxiu_historic/`.
3. **Brossa a l'arrel**: A l'arrel de `socdepoble.org` hi ha fitxers com `scratch-banner.py`, `fix_anchors.mjs` i carpetes inútils com `scratch` o `release`. Analitza i fulmina tot el que no siga part de l'arquitectura oficial. (Respecta els directoris de configuració amagats com `.agents`, `.immunitari`, etc.).
4. **Neteja d'Escriptori i Wiki**: Busca carpetes duplicades o buides que s'hagen pogut crear per error i esborra-les.

**Zero pietat amb la brossa**. Volem una estructura de fitxers que siga un reflex exacte de l'arquitectura de Pedra Seca. Res de pedres soltes pel camí.
