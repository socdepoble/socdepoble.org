/** Shim de laboratori: en instal·lar a tooling/, este fitxer NO es copia.
 *  Permet que els tractors del laboratori importen `../lib/arrel.mjs` igual que
 *  ho faran des de tooling/gates o tooling/wiki, i que les proves els carreguen. */
export * from '../../../../../tooling/lib/arrel.mjs';
