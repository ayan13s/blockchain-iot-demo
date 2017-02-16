var cloudant = require('./lib/nano.js')({url:'https://reader.cloudant.com', plugin: 'retry'});

var db = cloudant.db.use('alchemy');
var p = { q: 'trump', sort: ['date']};
db.search('enhanced', 'search',p, function(err, d) {
  console.log('callback', err ,d);
}).pipe(process.stdout);
