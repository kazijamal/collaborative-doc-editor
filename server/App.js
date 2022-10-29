const express = require('express');
const app = express();
const cors = require('cors');
const Y = require('yjs');
const LeveldbPersistence = require('y-leveldb').LeveldbPersistence;
const persistence = new LeveldbPersistence('./leveldb');
const toUint8Array = require('js-base64').toUint8Array;
const fromUint8Array = require('js-base64').fromUint8Array;
const QuillDeltaToHtmlConverter =
    require('quill-delta-to-html').QuillDeltaToHtmlConverter;
const EventEmitter = require('node:events').EventEmitter;

app.use(cors());
app.use(express.json());

app.use('/library', express.static('library'));

const myEmitter = new EventEmitter();

app.get('/api/connect/:id', async (req, res) => {
    const { id } = req.params;
    const ydoc = await persistence.getYDoc(id);
    const documentState = Y.encodeStateAsUpdate(ydoc);
    const base64Encoded = fromUint8Array(documentState);

    // console.log('sending sync: ', base64Encoded);
    res.writeHead(200, {
        Connection: 'keep-alive',
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
    });

    res.write('event: sync\n');
    res.write(`data: ${base64Encoded}`);
    res.write('\n\n');

    myEmitter.on('receivedUpdate', (update) => {
        // console.log('sending update: ', update);
        res.write('event: update\n');
        res.write(`data: ${fromUint8Array(update)}`);
        res.write('\n\n');
    });
});

app.post('/api/op/:id', async (req, res) => {
    const { id } = req.params;
    const update = toUint8Array(req.body.update);
    const updated = await persistence.storeUpdate(id, update);
    // console.log('store update res: ', updated);
    res.sendStatus(200);
    myEmitter.emit('receivedUpdate', update);
});

app.listen(5001, () => {
    console.log('Listening on port 5001...');
});
