# Logatron

Logatron is a simple in-memory logging server with the following features:

  - clients connect and identify via TCP
  - per-connection circular buffer for log messages
  - per-connection updateable state (key/value pairs)
  - query interface

## Usage

    const logatron = require('logatron');
    const log = logatron();
    log.listen(2212, '0.0.0.0');

## API

#### `log = logatron(opts)`

Create a new instance. Valid options:

  * `bufferSize`: size of each client's circular log buffer. Defaults to 128.

#### `log.listen(port, [host])`

Start the logging server.

#### `log.getClientNames()`

Return an array of the names of all connected clients.

#### `log.getClients()`

Return a map of client name => `{ connectedAt: ..., log: ..., state: ... }`

#### `log.getClientLog(name)`

Get an array of log entries for client `name`. Each log entry is an array of `[timestamp, logMessage]`. Throws an error if no such client exists.

#### `log.getClientState(name)`

Get a the state dictionary for client `name`. Throws an error if no such client exists.

## Events

Logatron instances are `EventEmitters` and emit the following events:

  - `'ready' (clientName)`: a new client has connected and identified
  - `'log' (clientName, message)`: client `clientName` logged `message`
  - `'set' (clientName, key, value)`: client `clientName` set `key` to `value`
  - `'close' (clientNmae): client `clientName` closed its connection

## Protocol

Logatron's wire protocol is UTF-8, one command per line.

The first thing clients must do is identify:

    IAM bob\n

If the identify command fails (i.e. a syntax error or a client with the given name is already connected), the server will terminate the connection.

Thereafter you can either `LOG` a message or `SET` a key/value pair:

    LOG this is my log message\n
    SET foo bar\n
    SET foo keys can have multiple words too!\n

That's all there is to it.

## TODO

  * startup script
  * HTTP interface for status reports
  * websocket streaming

## License

ISC