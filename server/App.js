/*

TODO
- email
- "presence" event
- /media/upload
- /media/access/:mediaid
- insertImage(index: number, url: string)

*/

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

// db
const User = require('./models/User');
const DocData = require('./models/DocData');

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

app.use((req, res, next) => {
    res.append('X-CSE356', '630a7abf047a1139b66db8e3');
    next();
});
app.use(cookieParser());
app.use(
    session({
        secret: 'secret key',
        cookie: { secure: false },
        resave: false,
        saveUninitialized: false,
        store: MongoStore.create({ clientPromise: clientPromise }),
    })
);

app.use('/library', express.static('library'));
app.use(express.static('build'));
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

app.get('/api/connect/:id', async (req, res) => {
    const { id } = req.params;

    // console.log('connect to ' + id);
    const { _id, mostRecentDocs } = await DocData.findOne();
    const index = mostRecentDocs.indexOf(id);
    if (index <= -1) {
        return res.send({ error: true, message: 'doc does not exist' });
    }
    mostRecentDocs.splice(index, 1);
    mostRecentDocs.push(id);
    await DocData.findByIdAndUpdate(_id, { mostRecentDocs: mostRecentDocs });

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

    myEmitter.on(`receivedUpdateFor=${id}`, (update) => {
        // console.log('sending update: ', update);
        res.write('event: update\n');
        res.write(`data: ${fromUint8Array(update)}`);
        res.write('\n\n');
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

// login routes (use router later?)
app.post('/users/signup', async (req, res) => {
    const { name, password, email } = req.body.values;
    if ((await User.findOne({ email: email })) !== null)
        return res.send({ error: true, message: 'user email already exists' });

    const newUser = new User({ name, password, email, verified: true });
    const _id = (await newUser.save())._id;
    const encodedID = encodeURIComponent(_id);
    const verifyUrl = `http://bkmj.cse356.compas.cs.stonybrook.edu/users/verify?key=${encodedID}`;

    transporter.sendMail({
        to: newUser.email,
        from: '"burger king michael jackson" <mail@bkmj.cse356.compas.cs.stonybrook.edu>',
        subject: 'Verify Email for Googly Docs',
        text: verifyUrl,
        html: `<a href=${verifyUrl}>${verifyUrl}</a>`,
    });
    return res.send({ status: 'OK' });
});

app.get('/users/verify', async (req, res) => {
    const _id = req.query.key;
    const user = await User.findById(_id);
    if (user === null)
        return res.send({
            error: true,
            message: 'incorrect key for email verification',
        });

    user.verified = true;
    await user.save();
    return res.send({ status: 'OK' });
});

app.post('/users/login', async (req, res) => {
    const { email, password } = req.body.values;
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
        res.send({ status: 'OK' });
    });
});

app.post('/users/logout', async (req, res) => {
    const result = await req.session.destroy();
    return res.send({ status: 'OK' });
});

app.post('/collection/create', async (req, res) => {
    const { name } = req.body;
    const { _id, mostRecentDocs } = await DocData.findOne();
    mostRecentDocs.push(name);
    await DocData.findByIdAndUpdate(_id, { mostRecentDocs: mostRecentDocs });

    return res.send({ error: false });
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
        return res.send({ error: false });
    }
    return res.send({
        error: true,
        message: 'tried to delete doc that does not exist',
    });
});

app.post('/collection/list', async (req, res) => {
    // const docs = await persistence.getAllDocNames();
    let { _id, mostRecentDocs } = await DocData.findOne();
    if (mostRecentDocs.length > 10) mostRecentDocs = mostRecentDocs.slice(-10);
    const toSend = mostRecentDocs.map((docName) => {
        return { id: docName, name: docName };
    });
    console.log(toSend);
    return res.send(toSend);
});

app.post('/collection/exists', async (req, res) => {
    let { id } = req.body;
    let { _id, mostRecentDocs } = await DocData.findOne();
    return res.send({ exists: mostRecentDocs.includes(id) });
});

const port = 5001;
app.listen(port, () => {
    console.log(`Listening on port ${port}...`);
});
