const express = require('express');
const app = express();
const cors = require('cors');

const Y = require('yjs');
const LeveldbPersistence = require('y-leveldb').LeveldbPersistence;
const persistence = new LeveldbPersistence('./leveldb');

app.use(cors());

app.use('/library', express.static('library'));

app.get('/api/connect/:id', async (req, res) => {
    const { id } = req.params;
    const yDoc = await persistence.getYDoc(id);
    res.writeHead(200, {
        Connection: 'keep-alive',
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
    });
    setInterval(async () => {
        console.log('pinging');
        res.write('event: sync\n'); // added these
        res.write(`data: ${JSON.stringify({ hasUnread: true })}`);
        res.write('\n\n');
    }, 5000);
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
