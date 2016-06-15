"use strict";

const net = require('net');
const byline = require('byline');
const CBuffer = require('CBuffer');

module.exports = createInstance;

function createInstance(opts) {

    opts = opts || {};
    const bufferSize = opts.bufferSize || 128;

    let nextConnectionId = 1;
    const connections = {};

    const server = net.createServer((socket) => {
        newConnection(connections, nextConnectionId++, socket, bufferSize);
    });

    return {
        listen: (port, host) => {
            return server.listen(port, host);
        },
        getClientNames: () => {
            return Object.keys(connections);
        },
        getClients: () => {
            const out = {};
            for (var k in connections) {
                out[k] = {
                    connectedAt : connections[k].connectedAt,
                    log         : connections[k].log,
                    state       : connections[k].settings
                };
            }
            return out;
        },
        getClientLog: (name) => {
            if (!(name in connections)) {
                return _error(name);
            }
            return connections[k].log.toArray();
        },
        getClientState: (name) => {
            if (!(name in connections)) {
                return _error(name);
            }
            return connections[k].settings;
        }
    };

    function _error(name) {
        throw new Error("no such client: " + name);
    }

}

function newConnection(conns, id, sock, bufferSize) {

    const connectedAt = Date.now();
    let state = 'ident';
    let name = null;
    const log = new CBuffer(bufferSize);
    const settings = {};

    sock.setEncoding('utf8');

    const lines = byline.createStream(sock);
    lines.on('data', _handleLine);

    sock.on('end', _teardown);
    sock.on('close', _teardown);

    function _teardown() {
        if (name) {
            delete conns[name];
            name = null;
        }
    }

    function _handleLine(line) {
        switch (state) {
            case 'ident':
                if (line.match(/^IAM\s+(\w+)$/)) {
                    if (RegExp.$1 in conns) {
                        sock.destroy();
                        state = 'dead';
                    } else {
                        name = RegExp.$1;
                        conns[name] = {
                            connectedAt : connectedAt,
                            id          : id,
                            name        : name,
                            log         : log,
                            settings    : settings
                        };
                        state = 'ready';    
                    }
                } else {
                    sock.destroy();
                    state = 'dead';
                }
                break;
            case 'ready':
                if (line.match(/^LOG\s+([^$]*)$/)) {
                    log.unshift([Date.now(), RegExp.$1.trim()]);
                } else if (line.match(/^SET\s+(\w+)\s+([^$]+)/)) {
                    settings[RegExp.$1] = RegExp.$2.trim();
                }
                break;
        }
    }

}
