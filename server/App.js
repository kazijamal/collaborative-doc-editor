require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const MongoStore = require('connect-mongo');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const path = require('path');
const proxy = require('express-http-proxy');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();
global.cluster_ips = {};
// db
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
        // store: MongoStore.create({ clientPromise: clientPromise }),
    })
);

// static paths
app.use('/library', express.static('library'));
app.use(express.static('build'));

app.use((req, res, next) => {
    if (req.path.includes('users') || (req.session && req.session._id)) {
        next();
    } else {
        return res.send({ error: true, message: 'user is not authenticated' });
    }
});

function selectProxyHost(req) {
	const url = req.originalUrl;

	const id = url.substring(url.lastIndexOf('/') + 1);
	const ip = cluster_ips[id];
	
	return `http://${ip}/api:5001`;
};

app.use('/api', proxy((req) => selectProxyHost(req), {
	proxyReqPathResolver: req => {
		const name = encodeURIComponent(req.session.name);
		return req.url + `?name=${name}`;
	}
}));

// routers 
const UsersRouter = require('./routes/Users');
app.use('/users', UsersRouter);
const CollectionsRouter = require('./routes/Collections');
app.use('/collection', CollectionsRouter);
const MediaRouter = require('./routes/Media');
app.use('/media', MediaRouter);
const IndexRouter = require('./routes/Index');
app.use('/index', IndexRouter);

app.get(['/', '/home', '/edit/*'], (req, res) => {
    res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

const port = 5001;
app.listen(port, () => {
    console.log(`------------------\nListening on port ${port}...\n------------------\n`);
});
