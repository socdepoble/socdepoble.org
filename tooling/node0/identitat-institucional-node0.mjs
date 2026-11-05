/** Institutional designation from the Mestre, AH11/AH12 (2026-11-04).
 * Discovery at socdepoble.org still requires its own hosting deployment.
 * The POSSE replica is related; it is not an ActivityPub Move alias.
 */
export const IDENTITAT_INSTITUCIONAL_NODE0=Object.freeze({
  account:'socdepoble@socdepoble.org',mailFrom:'socdepoble@socdepoble.org',
  canonicalOrigin:'https://socdepoble.org',canonicalResource:'acct:socdepoble@socdepoble.org',
  nodeOrigin:'https://socdepoble.cat',nodeResource:'acct:socdepoble@socdepoble.cat',
  canonicalActor:'https://socdepoble.org/ap/actors/socdepoble.json',canonicalProfile:'https://socdepoble.org/projecte',
  nodeActor:'https://socdepoble.cat/ap/actors/socdepoble',
  posseAccount:'depoble@mastodont.cat',posseProfile:'https://mastodont.cat/@depoble'
});
export function webFingerInstitucional(resource){
  const i=IDENTITAT_INSTITUCIONAL_NODE0;
  if(resource!==i.canonicalResource&&resource!==i.nodeResource)return null;
  const canonical=resource===i.canonicalResource,actor=canonical?i.canonicalActor:i.nodeActor,profile=canonical?i.canonicalProfile:i.nodeOrigin;
  return{subject:resource,aliases:[actor,profile],links:[
    {rel:'self',type:'application/activity+json',href:actor},
    {rel:'http://webfinger.net/rel/profile-page',type:'text/html',href:profile},
    {rel:'related',type:'application/activity+json',href:canonical?i.nodeActor:i.canonicalActor},
    {rel:'related',type:'text/html',href:i.posseProfile}
  ]};
}
