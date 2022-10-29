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

app.use(cors());
app.use(express.json());

app.use('/library', express.static('library'));

app.get('/api/connect/:id', async (req, res) => {
    const { id } = req.params;
    const ydoc = await persistence.getYDoc(id);
    const documentState = Y.encodeStateAsUpdate(ydoc);
    const base64Encoded = fromUint8Array(documentState);
    console.log('sending sync: ', base64Encoded);
    res.writeHead(200, {
        Connection: 'keep-alive',
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
    });
    res.write('event: sync\n'); // added these
    res.write(`data: ${base64Encoded}`);
    res.write('\n\n');
});

app.post('/api/op/:id', async (req, res) => {
    const { id } = req.params;
    const update = toUint8Array(req.body.update);
    console.log('received update: ', update);
    const updated = await persistence.storeUpdate(id, update);
    console.log('store update res: ', updated);
});

app.get('/', async (req, res) => {
    const ydoc = new Y.Doc();
    ydoc.getArray('arr').insert(0, [1, 2, 3]);
    ydoc.getArray('arr').toArray(); // => [1, 2, 3]
    persistence.storeUpdate('my-doc', Y.encodeStateAsUpdate(ydoc));
    const gotdoc1 = await persistence.getYDoc('no-exist');
    console.log(gotdoc1);
    console.log(gotdoc1.store.clients.length);
    const gotdoc2 = await persistence.getYDoc('my-doc');
    console.log(gotdoc2);
    console.log(gotdoc2.store.clients.length);
    res.send('egsiognesoignsjk');
});

app.listen(5001, () => {
    console.log('Listening on port 5001...');
});
