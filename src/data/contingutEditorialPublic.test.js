import { expect,test } from 'vitest';
import { normalitzaFilesEditorials } from './contingutEditorialPublic.js';
test('malformed list members and complex identifiers cannot enter a feed',()=>{
  expect(normalitzaFilesEditorials([null,3,'text',[],{id:{toString:null},title:'Invalid'},{id:'ok',title:'Keep'}])).toEqual([{id:'ok',title:'Keep'}]);
  expect(normalitzaFilesEditorials({id:'not-a-list'})).toEqual([]);
});
test('known rendered text/date fields never retain JSON objects or arrays',()=>{
  const [item]=normalitzaFilesEditorials([{id:'x',title:{toString:null},subtitle:['x'],description:false,author_name:{secret:'x'},town_name:{bad:true},created_at:[],content:{html:'x'},price:12,unknown:{keep:true}}]);
  expect(item).toEqual({id:'x',title:'',subtitle:'',description:'',author_name:'',town_name:'',created_at:'',content:'',price:12,unknown:{keep:true}});
});
test('real metadata, duplicates, order, dates and original source survive',()=>{
  const real={id:'real',title:'Fira',created_at:'2026-11-12T10:00:00Z',population:33,unknown:{nested:['kept']}};
  expect(normalitzaFilesEditorials([real,real,{title:'Legacy without id'}])).toEqual([real,real,{title:'Legacy without id'}]);
  expect(normalitzaFilesEditorials([real])[0]).toBe(real);
});
test('a brand is not a town and unknown location/date is not invented',()=>{
  const real={id:'x',town_name:' Sóc de Poble ',location:'Sóc de Poble',author_location:'Sóc de Poble'};
  expect(normalitzaFilesEditorials([real])).toEqual([{id:'x',town_name:'',location:'',author_location:''}]);
  expect(real.town_name).toBe(' Sóc de Poble ');
});
test('structured author and label metadata preserve safe fields without raw object text',()=>{
  expect(normalitzaFilesEditorials([{id:'x',author:{name:{bad:true},avatar_url:'/a.webp',custom:17},labels:[{text:{bad:true},href:'/mur',custom:23},'Real',null],tags:{bad:true}}])).toEqual([
    {id:'x',author:{name:'',avatar_url:'/a.webp',custom:17},labels:[{text:'',href:'/mur',custom:23},'Real'],tags:[]}
  ]);
});
test('accessors are never evaluated by defensive normalization',()=>{
  const value={id:'x'};Object.defineProperty(value,'title',{enumerable:true,get(){throw new Error('must not run');}});
  expect(normalitzaFilesEditorials([value])).toEqual([{id:'x'}]);
});
test('geographic aliases cannot turn the legitimate author brand into a town',()=>{
  const brand=' \u00a0sÓc\tDE POBLE ';
  const fields={town_name:brand,townName:brand,location:brand,author_location:brand,population:brand};
  const input={id:'aliases',name:'Sóc de Poble',author_name:'Sóc de Poble',...fields,poble:brand,
    author:{name:'Sóc de Poble',nom:'Sóc de Poble',...fields,poble:{nom:brand,extra:{keep:true}}},
    seller:{name:'Sóc de Poble',...fields,poble:brand}};
  const [item]=normalitzaFilesEditorials([input]);
  for(const record of [item,item.author,item.seller]) {
    for(const field of Object.keys(fields)) expect(record[field]).toBe('');
    expect(record.name).toBe('Sóc de Poble');
  }
  expect(item.author_name).toBe('Sóc de Poble');
  expect(item.poble).toBe('');
  expect(item.author.nom).toBe('Sóc de Poble');
  expect(item.author.poble).toEqual({nom:'',extra:{keep:true}});
  expect(item.seller.poble).toBe('');
  expect(normalitzaFilesEditorials([{id:'object',poble:{nom:brand}}])[0].poble.nom).toBe('');
  expect(input.townName).toBe(brand);
  expect(input.author.poble.nom).toBe(brand);
});
test('geographic normalization preserves real places, numeric populations and safe metadata without invoking getters',()=>{
  const throwing=()=>{throw new Error('geographic getter must not run');};
  const poble={nom:'Tibi',name:'Sóc de Poble',custom:{keep:true}};
  const author={name:'Sóc de Poble',town_name:'Benillup',population:321,poble};
  Object.defineProperty(author,'townName',{enumerable:true,get:throwing});
  const sellerPoble={custom:7};Object.defineProperty(sellerPoble,'nom',{enumerable:true,get:throwing});
  const input={id:'real',townName:'Muro d’Alcoi',poble,population:0,author,seller:{name:'Sóc de Poble',poble:sellerPoble}};
  const [item]=normalitzaFilesEditorials([input]);
  expect(item).toEqual({id:'real',townName:'Muro d’Alcoi',poble:{nom:'Tibi',name:'Sóc de Poble',custom:{keep:true}},population:0,
    author:{name:'Sóc de Poble',town_name:'Benillup',population:321,poble:{nom:'Tibi',name:'Sóc de Poble',custom:{keep:true}}},
    seller:{name:'Sóc de Poble',poble:{custom:7}}});
  expect(item.poble).toBe(poble);
  expect(item.author.poble).toBe(poble);
  expect(Object.getOwnPropertyDescriptor(author,'townName').get).toBe(throwing);
});
test('an already integral seed list preserves references; a repair only replaces the changed branch',()=>{
  const author={name:'Associació real',town_name:'Tibi'};
  const label={text:'Cultura'};
  const poble={nom:'Tibi'};
  const row={id:'integral',author,poble,labels:[label,'Festa']};
  const rows=[row];
  expect(normalitzaFilesEditorials(rows)).toBe(rows);
  const dirty={id:'dirty',town_name:'Sóc de Poble',author,poble,labels:[label]};
  const input=[row,dirty];
  const result=normalitzaFilesEditorials(input);
  expect(result).not.toBe(input);
  expect(result[0]).toBe(row);
  expect(result[1]).not.toBe(dirty);
  expect(result[1]).toEqual({...dirty,town_name:''});
  expect(result[1].author).toBe(author);
  expect(result[1].poble).toBe(poble);
  expect(result[1].labels).toBe(dirty.labels);
  expect(dirty.town_name).toBe('Sóc de Poble');
});
test('list and label accessors and non-enumerable fields are never retained or invoked',()=>{
  const throwing=()=>{throw new Error('list getter must not run');};
  const labels=['Real'];Object.defineProperty(labels,'1',{enumerable:true,get:throwing});
  const row={id:'x',labels};Object.defineProperty(row,'title',{get:throwing});
  const input=[row];Object.defineProperty(input,'1',{enumerable:true,get:throwing});
  const result=normalitzaFilesEditorials(input);
  expect(result).toEqual([{id:'x',labels:['Real']}]);
  expect(Object.hasOwn(result[0],'title')).toBe(false);
  expect(result).not.toBe(input);
  expect(Object.getOwnPropertyDescriptor(input,'1').get).toBe(throwing);
});
