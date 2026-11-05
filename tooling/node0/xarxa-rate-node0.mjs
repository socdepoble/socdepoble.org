import {isIP} from 'node:net';

/** Trusted ingress literal only. Privacy IPv6 addresses share their /48.
 * Mapped IPv4 has the same identity as its IPv4 address, never an IPv6 quota.
 * This normalizes identity; it does not authenticate a forwarded header. */
export function xarxaRateNodeZero(value){
  if(typeof value!=='string'||value.length>45||/[\s,%\0]/.test(value)||value.includes('[')||value.includes(']'))throw new TypeError('remote_address_required');
  const family=isIP(value);
  if(family===4)return 'v4:'+value;
  if(family!==6)throw new TypeError('remote_address_required');
  const text=new URL(`http://[${value}]/`).hostname.slice(1,-1);
  const halves=text.split('::'),left=halves[0]?halves[0].split(':'):[],right=halves[1]?halves[1].split(':'):[];
  const words=(halves.length===1?left:[...left,...Array(8-left.length-right.length).fill('0'),...right]).map(word=>parseInt(word,16));
  if(words.length!==8)throw new TypeError('remote_address_required');
  if(words.slice(0,5).every(word=>word===0)&&words[5]===65535)return `v4:${words[6]>>>8}.${words[6]&255}.${words[7]>>>8}.${words[7]&255}`;
  const network=words.slice(0,3).map(word=>word.toString(16)).join(':')+'::';
  return 'v6:'+new URL(`http://[${network}]/`).hostname.slice(1,-1)+'/48';
}
