const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const cookieParser = require('cookie-parser');
const LeveldbPersistence = require('y-leveldb').LeveldbPersistence;
const persistence = new LeveldbPersistence('./leveldb');
const app = express();
const cors = require('cors');
const Y = require('yjs');
const toUint8Array = require('js-base64').toUint8Array;
const fromUint8Array = require('js-base64').fromUint8Array;
const EventEmitter = require('node:events').EventEmitter;
const path = require('path');
const axios = require('axios');

// db
const Doc = require('./models/Doc');

const mongoDB = 'mongodb://209.151.152.38:27017/docs';
const clientPromise = mongoose
    .connect(mongoDB, { useNewUrlParser: true, useUnifiedTopology: true })
    .then((m) => m.connection.getClient());
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error'));

// middleware
app.use(
    cors({
        credentials: true,
        origin: 'http://localhost:3000',
        exposedHeaders: ['set-cookie'],
    })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

const presenceData = {
 
};

const updates = {

};

const myEmitter = new EventEmitter();

// const CLUSTER_IPS = ['209.151.150.8'];
const timer = 1000;
setInterval(async () => {

    for (const [id, update] of Object.entries(updates)) {
        if (update !== undefined && update.length > 0) {

            const doc = await Doc.findById(id);
            const ydoc = await persistence.getYDoc(id);
            const text = ydoc.getText('quill').toString();
            await axios.post('http://209.151.155.43/elastic/index', { id, name: doc.name, text });
            // await axios.post(`http://${doc.ip}/update`, { id, update, name: doc.name });

            myEmitter.emit(`receivedUpdateFor=${id}`, update);
            updates[id] = [];
        }
    }
}, timer);

app.get('/connect/:id', async (req, res) => {
    let { id } = req.params;
    
    if (updates[id] === undefined) 
        updates[id] = [];
    
    const doc = await Doc.findById(id);
    if (doc === null) 
        return res.send({ error: true, message: 'doc does not exist' });
    doc.updatedAt = Date.now();
    await doc.save();

    res.writeHead(200, {
        Connection: 'keep-alive',
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
    });

    myEmitter.on(`receivedUpdateFor=${id}`, update => handleUpdate(update, res, id, doc.name));
    myEmitter.on(`receivedPresenceFor=${id}`, presence => handlePresence(presence, res, id));

    sendSync(id, res);
    setTimeout(() => sendPresence(id, res), 75);

    req.on('close', () => handleDisconnect(id, req)); 
});

async function handleUpdate(update, res, id, name) {

    for (const incrementalUpdate of update) 
        res.write(`event: update\ndata: ${incrementalUpdate}\n\n`)
}

async function handlePresence(presence, res, id) {

    if (presenceData[id] === undefined) 
        presenceData[id] = {};
    presenceData[id][presence.session_id] = presence;

    res.write(`event: presence\ndata: ${JSON.stringify(presence)}\n\n`);
}

async function sendSync(id, res, ip) {
    const ydoc = await persistence.getYDoc(id);
    const documentState = Y.encodeStateAsUpdate(ydoc);
    const base64Encoded = fromUint8Array(documentState);
    res.write(`event: sync\ndata: ${base64Encoded}\n\n`);
}

async function sendPresence(id, res) {
    if (presenceData[id] !== undefined) 
        for (const [key, presence] of Object.entries(presenceData[id])) 
            res.write(`event: presence\ndata: ${JSON.stringify(presence)}\n\n`);
}

function handleDisconnect(id, req) {
    if (req.cookies['connect.sid']) {
        const sessionID = req.cookies['connect.sid'];

        if (presenceData[id] && presenceData[id][sessionID]) {
            const oldPresence = presenceData[id][sessionID];
            delete presenceData[id][sessionID];
            oldPresence.cursor = {};
            myEmitter.emit(`receivedPresenceFor=${id}`, oldPresence);
        }
    }
};

app.post('/op/:id', async (req, res) => { 
    await persistence.storeUpdate(req.params.id, toUint8Array(req.body.update));
    updates[req.params.id].push(req.body.update);
    res.send({});
});

app.post('/presence/:id', async (req, res) => {
    const { id } = req.params;
    const { index, length } = req.body;

    const presence = {
        session_id: req.cookies['connect.sid'],
        name: req.query.name,
        cursor: {
            index,
            length
        }    
    }
    res.sendStatus(200);
    myEmitter.emit(`receivedPresenceFor=${id}`, presence);
});

const port = 5001;
app.listen(port, () => {
    console.log(`------------------\nListening on port ${port}...\n------------------\n`);
});
