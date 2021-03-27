const yargs = require('yargs');
const https = require('https')
const io = require('socket.io-client');

const argv = yargs.option('board', {
    alias: 'b',
    description: 'Board id (can be found in url as idroo.com/board-<id here>)',
    type: 'string',
    requiresArg: true,
    demandOption: true,
  }).help().alias('help', 'h').argv;

console.log('Getting session')
const req = https.request(`https://idroo.com/board-${argv.board}`, res => {
  if (res.statusCode != 200) {
    console.log(`IDroo returned code ${res.statusCode}`);
    return;
  }
  if (!res.headers['set-cookie']) {
    console.log(`IDroo didn't send cookies`);
    return;
  }
  let match = /s%[\w-]*\.[\w%]*/.exec(res.headers['set-cookie']);
  if (!res.headers['set-cookie']) {
    console.log(`IDroo didn't send connect.sid cookie`);
    return;
  }
  let sid = match[0];
  console.log(`Got session id: ${sid}`);

  //if we force transport to websocket only it will crash the server for some reason
  const socket = io('https://idroo.com/', {
    path: `/${argv.board}/socket.io`,
    transportOptions: {
      websocket: {
        extraHeaders: { 'Cookie': `connect.sid=${sid};` }
      }
    }, 
    transports: [
      'websocket'
    ],
  });

  socket.io.on('open', () => {
    console.log('socket open');
  })
  socket.io.on('close', e => {
    console.log(`socket closed (${e})`);
    if (e == 'transport close') {
      console.log('crashed');
    }
  });

});

req.on('error', error => {
  console.log(`request to IDroo failed: ${error.message}`);
})

req.end();