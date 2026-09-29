console.log('argv1=', JSON.stringify(process.argv[1]));
console.log('metaurl=', import.meta.url);
console.log('naiveMatch=', import.meta.url === `file://${process.argv[1]}`);
