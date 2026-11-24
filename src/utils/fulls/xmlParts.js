/* Positional OOXML fragments, not a general XML DOM. No regexp rescans a
   missing delimiter from each opening tag. CDATA, comments and quoted >
   stay opaque. Declarations/DOCTYPE and unterminated markup are refused. */
const nomChar = /[\w:.-]/;
const error = () => new TypeError('XML del llibre malmés: falta un delimitador o una etiqueta de tancament.');
function* marques(xml) {
  let pos=0;
  while ((pos=xml.indexOf('<',pos))!==-1) {
    const inici=pos;
    if (xml.startsWith('<![CDATA[',pos)) {
      const fi=xml.indexOf(']]>',pos+9);if(fi===-1)throw error();pos=fi+3;continue;
    }
    if (xml.startsWith('<!--',pos)) {
      const fi=xml.indexOf('-->',pos+4);if(fi===-1)throw error();pos=fi+3;yield {tipus:'comentari',inici,fi:pos};continue;
    }
    if (xml.startsWith('<?',pos)) {
      const fi=xml.indexOf('?>',pos+2);if(fi===-1)throw error();pos=fi+2;continue;
    }
    pos+=1;const tanca=xml[pos]==='/';if(tanca)pos+=1;
    const nomInici=pos;while(pos<xml.length&&nomChar.test(xml[pos]))pos+=1;
    if(pos===nomInici)throw error();
    const nomComplet=xml.slice(nomInici,pos),nom=nomComplet.slice(nomComplet.lastIndexOf(':')+1),atributInici=pos;
    let quote=null;
    while(pos<xml.length) {
      const char=xml[pos];
      if(char==='<')throw error();
      if(quote!==null){if(char===quote)quote=null;}
      else if(char==='"'||char==="'")quote=char;
      else if(char==='>')break;
      pos+=1;
    }
    if(pos===xml.length||quote!==null)throw error();
    const buit=!tanca&&xml[pos-1]==='/',atributs=xml.slice(atributInici,buit?pos-1:pos);pos+=1;
    yield {nom,tipus:tanca?'tanca':buit?'buit':'obri',atributs,inici,fi:pos};
  }
}
export function senseComentarisXml(xml) {
  const parts=[];let pos=0;
  for(const token of marques(xml))if(token.tipus==='comentari'){parts.push(xml.slice(pos,token.inici));pos=token.fi;}
  parts.push(xml.slice(pos));return parts.join('');
}
export function* elementsXml(xml,noms,{oberts=[]}={}) {
  const wanted=new Set(Array.isArray(noms)?noms:[noms]),opening=new Set(oberts),tokens=marques(xml);
  for(const token of tokens) {
    if(!wanted.has(token.nom)||token.tipus==='tanca')continue;
    if(token.tipus==='buit'||opening.has(token.nom)){yield {...token,cos:undefined};continue;}
    let found=false;
    for(let next=tokens.next();!next.done;next=tokens.next()) {
      const close=next.value;
      if(close.nom!==token.nom)continue;
      if(close.tipus!=='tanca')throw error();
      yield {...token,cos:xml.slice(token.fi,close.inici),fi:close.fi};found=true;break;
    }
    if(!found)throw error();
  }
}
