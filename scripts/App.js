require('dotenv').config();
const { Client } = require('@elastic/elasticsearch');
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
const memjs = require('memjs');

// db
const Doc = require('./models/Doc');
const mongoDB = 'mongodb://209.151.152.38:27017/docs';
const clientPromise = mongoose
    .connect(mongoDB, { useNewUrlParser: true, useUnifiedTopology: true })
    .then((m) => m.connection.getClient());
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error'));

// app.use(
// 	session({
// 		secret: 'secret key',
// 		cookie: { secure: false, httpOnly: false },
// 		resave: false,
// 		saveUninitialized: false,
// 		store: MongoStore.create({ clientPromise: clientPromise }),
// 	})
// );	

// elastic
const elasticClient = new Client({
	node: 'http://209.94.59.37:9200'
});

const memcached = memjs.Client.create("bkmj:password@209.151.154.78:11211");

const verifySearchCache = (req, res, next) => {
	const { q } = req.query;
	memcached.get(`search:${q}`, (err, val) => {
		if (err) throw err;
		if (val !== null) {
			return res.json(JSON.parse(val));
		} else {
			return next();
		}
	});
};

const verifySuggestCache = (req, res, next) => {
	const { q } = req.query;
	memcached.get(`suggest:${q}`, (err, val) => {
		if (err) throw err;
		if (val !== null) {
			return res.json(JSON.parse(val));
		} else {
			return next();
		}
	});
};

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

const docs = new Map();

const myEmitter = new EventEmitter();

// const CLUSTER_IPS = ['209.151.150.8'];
const timer = 8000;
setInterval(async () => {

    for (const [id, update] of Object.entries(updates)) {
        if (update !== undefined && update.length > 0) {

            const ydoc = docs.get(id)//await persistence.getYDoc(id);
            const text = ydoc.getText('quill').toString();

            await elasticClient.index({
                index: 'docs',
                id,
                body: { text, exacttext: text}
            });

            myEmitter.emit(`receivedUpdateFor=${id}`, update);
            updates[id] = [];
        }
    }
}, timer);

// names = new Map();
// app.post('/name', (req, res) => {
//     const { cookie, name } = req.body;
//     names.set(cookie, name);
//})

app.get('/api/connect/:id', async (req, res) => {
    let { id } = req.params;
    
    if (updates[id] === undefined) 
        updates[id] = [];
    if (docs.get(id) === undefined)
        docs.set(id, new Y.Doc());
    
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
    const ydoc = docs.get(id)//await persistence.getYDoc(id);
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

app.post('/api/op/:id', async (req, res) => { 
    res.send({});
    // await persistence.storeUpdate(req.params.id, toUint8Array(req.body.update));
    Y.applyUpdate(docs.get(req.params.id), toUint8Array(req.body.update));
    updates[req.params.id].push(req.body.update);
});

app.post('/api/presence/:id', async (req, res) => {
    res.sendStatus(200);
    const { id } = req.params;
    const { index, length } = req.body;

    console.log(req.cookies['connect.sid']);

	const doc = await Doc.findById(id);
    const presence = {
        session_id: req.cookies['connect.sid'],
        name: 'name',//names.get(req.cookies['connect.sid'])
        cursor: {
            index,
            length
        }    
    }
    myEmitter.emit(`receivedPresenceFor=${id}`, presence);
});

app.get('/index/search', verifySearchCache, async (req, res) => {

	try {
		// const beforeMillis = new Date().getTime();
		// console.log('search ', req.query.q);
		const result = await elasticClient.search({
			index: 'docs',
			query: {
				'match_phrase': {
					'text': req.query.q
				}
			},
			highlight: {
				'fields': {
					'text': {},
				},
				'type': 'fvh',
				'fragment_size': 105,
			}
		});

		// const afterMillis = new Date().getTime();
		const hits = result.hits.hits.slice(0, 10);
		// console.log('search ', req.query.q, (afterMillis - beforeMillis), hits);

		const searchResults = hits.map((hit) => ({ docid: hit._id, name: 'Milestone #4', snippet: hit.highlight.text[0]}));
		res.send(searchResults);

		await memcached.set(`search:${req.query.q}`, JSON.stringify(searchResults), { expires: 30 });

		// console.log(req.query.q, searchResults);
	}
	catch (e) {
		console.log(e);
		res.send(e);
	}
});

app.get('/index/suggest', verifySuggestCache, async (req, res) => {

	try {
		// const beforeMillis = new Date().getTime();
		// console.log('suggest ', req.query.q, new Date().getTime());
		// console.log('suggest ', req.query.q);
		const result = await elasticClient.search({
			index: 'docs',
			query: {
				'prefix': {
					'exacttext': req.query.q
				}
			},
			highlight: {
				'fields': {
					'exacttext': {}
				},
				'fragment_size': 1,
				'number_of_fragments': 1,
				'boundary_scanner': 'word',
				'pre_tags': [""],
				'post_tags': [""]
			}
		});
		// const afterMillis = new Date().getTime();
		// console.log('suggest ', req.query.q, (afterMillis - beforeMillis), result.hits.hits);

		// console.log('return from suggest ', req.query.q, new Date().getTime());

		const suggestions = result.hits.hits.map((hit) => (hit.highlight.exacttext[0]));
		const suggestionsWithoutQuery = suggestions.filter((x) => x != req.query.q);
		const uniqueSuggestions = Array.from(new Set(suggestionsWithoutQuery));
		res.send(uniqueSuggestions);

		await memcached.set(`suggest:${req.query.q}`, JSON.stringify(uniqueSuggestions), { expires: 30 });

		// console.log(req.query.q, uniqueSuggestions);
	}
	catch (e) {
		console.log(e);
		res.send(e);
	}
});




const port = 5001;
app.listen(port, () => {
    console.log(`------------------\nListening on port ${port}...\n------------------\n`);
});
