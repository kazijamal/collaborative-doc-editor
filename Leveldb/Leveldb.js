const express = require('express');
const LeveldbPersistence = require('y-leveldb').LeveldbPersistence;
const persistence = new LeveldbPersistence('./leveldb');
const Y = require('yjs');
const toUint8Array = require('js-base64').toUint8Array;
const fromUint8Array = require('js-base64').fromUint8Array;
const app = express();

app.use(express.json());

app.get('/', (req, res) => {
    res.send("hello, world")
});

// app.post('/getYdoc', async (req, res) => {
//     const { id } = req.body;
//     const ydoc = await persistence.getYDoc(id);
//     console.log(JSON.stringify(ydoc));
//     return res.send({ ydoc: ydoc, id: id});
// });
app.post('/getDocState', async (req, res) => {
    const { id } = req.body;

    const ydoc = await persistence.getYDoc(id);
    const documentState = Y.encodeStateAsUpdate(ydoc);
    const base64Encoded = fromUint8Array(documentState);

    res.send({ docState: base64Encoded });
})

app.post('/getYDocText', async (req, res) => {
    const { id } = req.body;

    const ydoc = await persistence.getYDoc(id);
    const text = ydoc.getText('quill').toString();

    // console.log(text);

    res.send(text);
})

app.post('/update', async (req, res) => {
    const { id, update } = req.body;

    await persistence.storeUpdate(id, toUint8Array(update));
    return res.send({ error: false });
});

app.post('/clear', async (req, res) => {
    const { id } = req.body;
    await persistence.clearDocument(id);
    return res.send({ error: false });
})


const port = 3000;
app.listen(port, () => {
    console.log(`Listening on port ${port}...`);
})
