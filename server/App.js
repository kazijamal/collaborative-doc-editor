/*
TODO
- /home route in frontend should send x-cse356 header (add header in nginx)
*/
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const MongoStore = require('connect-mongo');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const nodemailer = require('nodemailer');
const app = express();
const cors = require('cors');
const Y = require('yjs');
const LeveldbPersistence = require('y-leveldb').LeveldbPersistence;
const persistence = new LeveldbPersistence('./leveldb');
const toUint8Array = require('js-base64').toUint8Array;
const fromUint8Array = require('js-base64').fromUint8Array;
const EventEmitter = require('node:events').EventEmitter;
const multer = require('multer');
const s3 = require('@auth0/s3');
const fs = require('fs');
const { promisify } = require('util');
const unlinkAsync = promisify(fs.unlink);
const path = require('path');
const https = require('https');
const crypto = require('crypto');

// db
const User = require('./models/User');
const DocData = require('./models/DocData');
const Media = require('./models/Media');

const mongoDB = 'mongodb://127.0.0.1/docs';
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
app.use((req, res, next) => {
    res.append('X-CSE356', '630a7abf047a1139b66db8e3');
    next();
});
app.use(cookieParser());
app.use(
    session({
        secret: 'secret key',
        cookie: { secure: false, httpOnly: false },
        resave: false,
        saveUninitialized: false,
        store: MongoStore.create({ clientPromise: clientPromise }),
    })
);

// static paths
app.use('/library', express.static('library'));
app.use(express.static('build'));

// session middleware
app.use((req, res, next) => {
    console.log('id on ' + req.path, req.session._id);
    if (req.path.includes('users') || (req.session && req.session._id)) {
        next();
    } else {
        return res.send({ error: true, message: 'user is not authenticated' });
    }
});

// nodemailer
const transporter = nodemailer.createTransport({
    sendmail: true,
    newline: 'unix',
    pat: '/usr/sbin/sendmail',
});

// configure media uploading
const upload = multer({ dest: './uploads/' });
const s3Client = s3.createClient({
    s3Options: {
        accessKeyId: process.env.S3_ACCESS_KEY,
        secretAccessKey: process.env.S3_SECRET_KEY,
        endpoint: process.env.S3_ENDPOINT,
    },
});

const myEmitter = new EventEmitter();
// keep a single DocData object, array of docs. Create it if it does not exist
(async () => {
    let docData = await DocData.findOne();
    if (docData === null) {
        docData = new DocData();
        docData.save();
    }
})();

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'build', 'index.html'));
});
app.get('/home', (req, res) => {
    res.sendFile(path.join(__dirname, 'build', 'index.html'));
});
app.get('/edit:id', (req, res) => {
    res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

app.get('/home', (req, res) => {
    res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

app.get('/edit/*', (req, res) => {
    res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

const presenceData = {
    // doc1ID: {
    // session_id1: presence1,
    // session_id2: presence2,
    // ...
    // }
    // doc2ID: {
    // ...
    // }
};

app.get('/api/connect/:id', async (req, res) => {
    let { id } = req.params;

    console.log('pre encode: ', id);
    const { _id, mostRecentDocs } = await DocData.findOne();
    id = encodeURIComponent(id);
    const index = mostRecentDocs.indexOf(id);
    console.log('encoded, found: ', id, index);
    if (index <= -1) {
        console.log('doc does not exist');
        return res.send({ error: true, message: 'doc does not exist' });
    }
    mostRecentDocs.splice(index, 1);
    mostRecentDocs.push(id);
    await DocData.findByIdAndUpdate(_id, { mostRecentDocs: mostRecentDocs });

    const ydoc = await persistence.getYDoc(id);
    const documentState = Y.encodeStateAsUpdate(ydoc);
    const base64Encoded = fromUint8Array(documentState);

    res.writeHead(200, {
        Connection: 'keep-alive',
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
    });

    res.write('event: sync\n');
    res.write(`data: ${base64Encoded}`);
    res.write('\n\n');

    myEmitter.on(`receivedUpdateFor=${id}`, (update) => {
        res.write('event: update\n');
        res.write(`data: ${fromUint8Array(update)}`);
        res.write('\n\n');
    });

    myEmitter.on(`receivedPresenceFor=${id}`, (presence) => {
        if (presenceData[id] === undefined) {
            presenceData[id] = {};
        }
        presenceData[id][presence.session_id] = presence;

        console.log('presenceData', presenceData);

        res.write('event: presence\n');
        res.write(`data: ${JSON.stringify(presence)}`);
        res.write('\n\n');
    });

    myEmitter.on(`closeConnectionsFor=${req.session._id}`, () => {
        res.end();
    });

    setTimeout(() => {
        if (presenceData[id] !== undefined) {
            for (const [key, presence] of Object.entries(presenceData[id])) {
                res.write('event: presence\n');
                res.write(`data: ${JSON.stringify(presence)}`);
                res.write('\n\n');
            }
        }
    }, 75);

    req.on('close', () => {
        if (req.cookies['connect.sid']) {
            const sessionID = req.cookies['connect.sid'];

            if (presenceData[id] && presenceData[id][sessionID]) {
                const oldPresence = presenceData[id][sessionID];
                delete presenceData[id][sessionID];
                oldPresence.cursor = {};
                myEmitter.emit(`receivedPresenceFor=${id}`, oldPresence);
            }
        }
    });
});

app.post('/api/op/:id', async (req, res) => {
    const { id } = req.params;
    console.log('update to ' + id);
    const update = toUint8Array(req.body.update);
    await persistence.storeUpdate(id, update);
    // console.log('store update res: ', updated);
    res.sendStatus(200);
    myEmitter.emit(`receivedUpdateFor=${id}`, update);
});

app.post('/api/presence/:id', async (req, res) => {
    const { id } = req.params;

    res.sendStatus(200);
    myEmitter.emit(`receivedPresenceFor=${id}`, req.body);
});
// login routes (use router later?)
app.post('/users/signup', async (req, res) => {
    const { name, password, email } = req.body;
    if ((await User.findOne({ email: email })) !== null)
        return res.send({ error: true, message: 'user email already exists' });

    const newUser = new User({
        name,
        password,
        email,
        key: crypto.randomBytes(32).toString('hex'),
        verified: false,
    });
    await newUser.save();
    const encodedEmail = encodeURIComponent(newUser.email);
    const verifyUrl = `http://bkmj.cse356.compas.cs.stonybrook.edu/users/verify?email=${encodedEmail}&key=${newUser.key}`;

    transporter.sendMail({
        to: newUser.email,
        from: '"burger king michael jackson" <mail@bkmj.cse356.compas.cs.stonybrook.edu>',
        subject: 'Verify Email for Googly Docs',
        text: verifyUrl,
        html: `<a href=${verifyUrl}>${verifyUrl}</a>`,
    });
    return res.send({});
});

app.get('/users/verify', async (req, res) => {
    const { email, key } = req.query;
    User.findOne({ email: email }).then((user) => {
        if (user == null) {
            res.send({
                error: true,
                message: 'invalid verification attempt (no user with email)',
            });
            return;
        } else {
            if (user.verified == false && key == user.key) {
                user.verified = true;
                user.save().then((user) => {
                    res.send({ status: 'OK' });
                    return;
                });
            } else {
                res.send({
                    error: true,
                    message:
                        'invalid verification attempt (wrong key or already verified)',
                });
                return;
            }
        }
    });
});

app.post('/users/login', async (req, res) => {
    const { email, password } = req.body;
    console.log(email, password);
    const user = await User.findOne({
        email: email,
        password: password,
        verified: true,
    });
    if (user === null)
        return res.send({ error: true, message: 'login failed' });
    req.session._id = user._id.toString();
    req.session.save(() => {
        console.log('id after login: ', req.session._id);
        res.send({ name: user.name });
    });
});

app.post('/users/logout', async (req, res) => {
    myEmitter.emit(`closeConnectionsFor=${req.session._id}`);
    const result = await req.session.destroy();
    return res.send({});
});

app.post('/collection/create', async (req, res) => {
    const { name } = req.body;
    const { _id, mostRecentDocs } = await DocData.findOne();
    const id = encodeURIComponent(name);
    mostRecentDocs.push(id);
    await DocData.findByIdAndUpdate(_id, { mostRecentDocs: mostRecentDocs });

    return res.send({ id });
});

app.post('/collection/delete', async (req, res) => {
    const { id } = req.body;
    const { _id, mostRecentDocs } = await DocData.findOne();
    const index = mostRecentDocs.indexOf(id);
    // if we are deleting a doc which exists
    if (index > -1) {
        mostRecentDocs.splice(index, 1);
        await DocData.findByIdAndUpdate(_id, {
            mostRecentDocs: mostRecentDocs,
        });
        await persistence.clearDocument(id);
        return res.send({});
    }
    return res.send({
        error: true,
        message: 'tried to delete doc that does not exist',
    });
});

app.get('/collection/list', async (req, res) => {
    // const docs = await persistence.getAllDocNames();
    let { _id, mostRecentDocs } = await DocData.findOne();
    if (mostRecentDocs.length > 10) mostRecentDocs = mostRecentDocs.slice(-10);
    const toSend = mostRecentDocs.map((docName) => {
        return { id: docName, name: decodeURIComponent(docName) };
    });
    console.log(toSend);
    return res.send(toSend);
});

app.post('/collection/exists', async (req, res) => {
    let { id } = req.body;
    let { _id, mostRecentDocs } = await DocData.findOne();
    return res.send({ exists: mostRecentDocs.includes(id) });
});

app.post('/media/upload', upload.single('file'), async (req, res) => {
    if (req.file.mimetype != 'image/jpeg' && req.file.mimetype != 'image/png') {
        await unlinkAsync(req.file.path);
        return res.send({
            error: true,
            message: 'uploaded media must be jpeg or png image',
        });
    } else {
        const newMedia = new Media({ mimetype: req.file.mimetype });
        await newMedia.save();
        const newfilename =
            newMedia._id.toString() + path.extname(req.file.originalname);
        const params = {
            localFile: req.file.path,
            s3Params: {
                Bucket: 'media',
                Key: newfilename,
            },
        };
        const uploader = s3Client.uploadFile(params);
        uploader.on('error', async function (err) {
            console.error('unable to upload:', err.stack);
            await unlinkAsync(req.file.path);
            res.send({ error: true, message: 'unable to upload media' });
        });
        uploader.on('end', async function () {
            console.log('done uploading');
            await unlinkAsync(req.file.path);
            newMedia.url =
                'https://media.bkmj-storage.us-nyc1.upcloudobjects.com/' +
                newfilename;
            await newMedia.save();
            return res.send({ mediaid: newMedia._id.toString() });
        });
    }
});

app.get('/media/access/:mediaid', async (req, res) => {
    const media = await Media.findById(req.params.mediaid);
    if (!media) {
        return res.send({
            error: true,
            message: 'no media found with provided mediaid',
        });
    } else {
        https.get(media.url, (httpres) => {
            res.type(media.mimetype);
            httpres.pipe(res);
        });
    }
});

const port = 5001;
app.listen(port, () => {
    console.log(`Listening on port ${port}...`);
});
