const { createServer } = require('http');

createServer(function (req, res) {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.write('Iae mundo!')
  res.end();
}).listen(process.env.PORT || 3000);

try {
  const EtecClient = require('./Structures/Client.js')
  const client = new EtecClient()
  client.loadEvents()
  client.login(process.env["token"])
} catch(e) {
  console.error(e)
}