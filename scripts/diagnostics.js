const logatron = require('../')();

logatron.listen(2212, '127.0.0.1');

logatron.on('ready', function(client) {
	_log("READY", client)
})

logatron.on('log', function(client, msg) {
	_log("LOG", client, msg);
});

logatron.on('set', function(client, key, value) {
	_log("SET", client, key + " = " + value);
});

logatron.on('close', function(client) {
	_log("CLOSE", client);
});

function _log(prefix, client, message) {
	console.log([prefix, client, message || ''].join('|'));
}