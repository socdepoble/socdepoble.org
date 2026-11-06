import {capturaAdminUsuaris} from '../adminUsuaris.js';
/** R20b · arbitratge G2: l'administració d'usuaris necessita un servidor, una sessió
 * real i un registre d'auditoria. El local valida l'entrada (TypeError abans de cap
 * efecte) i després rebutja sempre amb «no-disponible»: no fabrica cap èxit ni
 * accepta autoritat injectada. Com la bústia push sense servei, el grup es declara. */
export function creaAdminUsuarisLocal(){
  const noDisponible=()=>Object.assign(new Error('Administració local no disponible.'),{code:'no-disponible'});
  return {
    async adminLlistaUsuarisRegistrats(value={}){capturaAdminUsuaris(value);throw noDisponible();},
    async adminAssignaMembreOrganitzacio(value){capturaAdminUsuaris(value,'membre',{local:true});throw noDisponible();},
    async adminConnectaUsuari(value){capturaAdminUsuaris(value,'connecta',{local:true});throw noDisponible();}
  };
}
