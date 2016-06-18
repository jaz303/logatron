"use strict";

const net = require('net');
const byline = require('byline');
const CBuffer = require('CBuffer');
const EventEmitter = require('events').EventEmitter;

module.exports = createInstance;

function createInstance(opts) {

    opts = opts || {};
    const bufferSize = opts.bufferSize || 128;

    let nextConnectionId = 1;
    const connections = {};

    const instance = new EventEmitter;

    const server = net.createServer((socket) => {
        newConnection(instance, connections, nextConnectionId++, socket, bufferSize);
    });

    instance.listen = (port, host) => {
        return server.listen(port, host);
    }

    instance.getClientNames = () => {
        return Object.keys(connections);
    }

    instance.getClients = () => {
        const out = {};
        for (var k in connections) {
            out[k] = {
                connectedAt : connections[k].connectedAt,
                log         : connections[k].log,
                state       : connections[k].settings
            };
        }
        return out;
    }

    instance.getClientLog = (name) => {
        if (!(name in connections)) {
            return _error(name);
        }
        return connections[k].log.toArray();
    }

    instance.getClientState = (name) => {
        if (!(name in connections)) {
            return _error(name);
        }
        return connections[k].settings;
    }

    return instance;

    function _error(name) {
        throw new Error("no such client: " + name);
    }

}

function newConnection(instance, conns, id, sock, bufferSize) {

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
            instance.emit('close', name);
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
                        instance.emit('ready', name);
                    }
                } else {
                    sock.destroy();
                    state = 'dead';
                }
                break;
            case 'ready':
                if (line.match(/^LOG\s+([^$]*)$/)) {
                    const now = Date.now();
                    const msg = RegExp.$1.trim();
                    log.unshift([now, msg]);
                    instance.emit('log', name, msg);
                } else if (line.match(/^SET\s+(\w+)(\s*|\s+[^$]+)$/)) {
                    const key = RegExp.$1;
                    const value = RegExp.$2.trim();
                    settings[key] = value;
                    instance.emit('set', name, key, value);
                }
                break;
        }
    }

}
