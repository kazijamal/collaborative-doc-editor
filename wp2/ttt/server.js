const express = require('express');
const app = express();
const port = 5000;
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

// mongoose models
const User = require('./models/User');
const { Game } = require('./models/Game');

// nodemailer setup
const transporter = nodemailer.createTransport({
    sendmail: true,
    newline: 'unix',
    path: '/usr/sbin/sendmail',
});

// mongoose setup
const mongoDB = 'mongodb://127.0.0.1/ttt';
const clientPromise = mongoose
    .connect(mongoDB, { useNewUrlParser: true, useUnifiedTopology: true })
    .then((m) => m.connection.getClient());
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));

// misc setup
app.set('view engine', 'ejs');
app.use(express.json()); // for parsing application/json
app.use(express.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded
app.use('/css', express.static('css'));
app.use('/js', express.static('js'));

// session setup
app.use(
    session({
        secret: 'abc123',
        cookie: {},
        resave: false,
        saveUninitialized: false,
        store: MongoStore.create({ clientPromise: clientPromise }),
    })
);

// set headers
app.use((req, res, next) => {
    res.append('X-CSE356', '630a7abf047a1139b66db8e3');
    next();
});

// routes
app.get('/ttt', (req, res) => {
    if (req.query.name) {
        const { userId } = req.session;
        User.findById(userId).then((user) => {
            if (user == null) {
                return res.json({ status: 'ERROR' });
            }
            let games = user.games;
            games.sort((a, b) => {
                return new Date(b) - new Date(a);
            });
            if (games.length != 0 && games[0].winner == ' ') {
                res.render(__dirname + '/pages/game', {
                    name: req.query.name,
                    date: new Date(),
                    grid: games[0].grid,
                });
            } else {
                res.render(__dirname + '/pages/game', {
                    name: req.query.name,
                    date: new Date(),
                    grid: [' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' '],
                });
            }
        });
    } else {
        res.render(__dirname + '/pages/index');
    }
});

app.get('/ttt/signup', (req, res) => {
    res.render(__dirname + '/pages/signup');
});

app.get('/ttt/login', (req, res) => {
    res.render(__dirname + '/pages/login');
});

app.get('/ttt/logout', (req, res) => {
    res.render(__dirname + '/pages/logout');
});

const checkwinner = (grid) => {
    const possiblewins = [
        [0, 1, 2],
        [3, 4, 5],
        [6, 7, 8],
        [0, 3, 6],
        [1, 4, 7],
        [2, 5, 8],
        [0, 4, 8],
        [2, 4, 6],
    ];
    for (const possiblewin of possiblewins) {
        let xwon = true;
        let owon = true;
        for (const cell of possiblewin) {
            if (grid[cell] != 'X') {
                xwon = false;
            }
            if (grid[cell] != 'O') {
                owon = false;
            }
        }
        if (xwon) {
            return 'X';
        }
        if (owon) {
            return 'O';
        }
    }
    return ' ';
};

app.post('/ttt/play', (req, res) => {
    const userId = req.session.userId;
    User.findById(userId).then((user) => {
        if (user == null) {
            res.send({ status: 'ERROR' });
            return;
        }

        const { move } = req.body;

        let games = user.games;
        games.sort((a, b) => new Date(b) - new Date(a));
        if (
            games.length == 0 ||
            (games.length != 0 && games[0].winner != ' ')
        ) {
            const newGame = new Game({
                start_date: new Date(),
                grid: [' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' '],
                winner: ' ',
            });
            newGame.save().then((game) => {
                user.games.push(game);
                user.save().then((newUser) => {
                    const gameId = game._id;
                    Game.findById(gameId).then((currGame) => {
                        let grid = currGame.grid;
                        if (move == null) {
                            res.send({ status: 'OK', grid, winner: ' ' });
                            return;
                        } else {
                            grid[move] = 'X';
                            let winner = checkwinner(grid);
                            if (winner == 'X') {
                                currGame.grid = grid;
                                currGame.winner = winner;
                                currGame.save().then((updatedGame) => {
                                    user.human += 1;
                                    user.games.id(gameId).set(updatedGame);
                                    user.save().then((user) => {
                                        res.send({
                                            status: 'OK',
                                            grid,
                                            winner,
                                        });
                                        return;
                                    });
                                });
                            } else {
                                const empty = [];
                                for (let i = 0; i < grid.length; i++) {
                                    if (grid[i] == ' ') {
                                        empty.push(i);
                                    }
                                }
                                if (empty.length == 0) {
                                    let newWinner = checkwinner(grid);
                                    currGame.grid = grid;
                                    currGame.winner = newWinner;
                                    currGame.save().then((updatedGame) => {
                                        if (newWinner == 'X') {
                                            user.human += 1;
                                        } else if (newWinner == 'O') {
                                            user.wopr += 1;
                                        } else if (newWinner == ' ') {
                                            user.tie += 1;
                                        }
                                        user.games.id(gameId).set(updatedGame);
                                        user.save().then((user) => {
                                            res.send({
                                                status: 'OK',
                                                grid,
                                                winner:
                                                    newWinner == ' '
                                                        ? 'T'
                                                        : newWinner,
                                            });
                                            return;
                                        });
                                    });
                                } else {
                                    const random =
                                        empty[
                                            Math.floor(
                                                Math.random() * empty.length
                                            )
                                        ];
                                    grid[random] = 'O';
                                    currGame.grid = grid;
                                    let newWinner = checkwinner(grid);
                                    currGame.winner = newWinner;
                                    currGame.save().then((updatedGame) => {
                                        if (newWinner == 'X') {
                                            user.human += 1;
                                        } else if (newWinner == 'O') {
                                            user.wopr += 1;
                                        }
                                        user.games.id(gameId).set(updatedGame);
                                        user.save().then((user) => {
                                            res.send({
                                                status: 'OK',
                                                grid,
                                                winner: newWinner,
                                            });
                                            return;
                                        });
                                    });
                                }
                            }
                        }
                    });
                });
            });
        } else {
            games.sort((a, b) => new Date(b) - new Date(a));
            const gameId = games[0]._id;
            Game.findById(gameId).then((currGame) => {
                let grid = currGame.grid;
                if (move == null) {
                    res.send({ status: 'OK', grid, winner: ' ' });
                    return;
                } else {
                    grid[move] = 'X';
                    let winner = checkwinner(grid);
                    if (winner == 'X') {
                        currGame.grid = grid;
                        currGame.winner = winner;
                        currGame.save().then((updatedGame) => {
                            user.human += 1;
                            user.games.id(gameId).set(updatedGame);
                            user.save().then((user) => {
                                res.send({ status: 'OK', grid, winner });
                                return;
                            });
                        });
                    } else {
                        const empty = [];
                        for (let i = 0; i < grid.length; i++) {
                            if (grid[i] == ' ') {
                                empty.push(i);
                            }
                        }
                        if (empty.length == 0) {
                            let newWinner = checkwinner(grid);
                            currGame.grid = grid;
                            currGame.winner = newWinner;
                            currGame.save().then((updatedGame) => {
                                if (newWinner == 'X') {
                                    user.human += 1;
                                } else if (newWinner == 'O') {
                                    user.wopr += 1;
                                } else if (newWinner == ' ') {
                                    user.tie += 1;
                                }
                                user.games.id(gameId).set(updatedGame);
                                user.save().then((user) => {
                                    res.send({
                                        status: 'OK',
                                        grid,
                                        winner:
                                            newWinner == ' ' ? 'T' : newWinner,
                                    });
                                    return;
                                });
                            });
                        } else {
                            const random =
                                empty[Math.floor(Math.random() * empty.length)];
                            grid[random] = 'O';
                            currGame.grid = grid;
                            let newWinner = checkwinner(grid);
                            currGame.winner = newWinner;
                            currGame.save().then((updatedGame) => {
                                if (newWinner == 'X') {
                                    user.human += 1;
                                } else if (newWinner == 'O') {
                                    user.wopr += 1;
                                }
                                user.games.id(gameId).set(updatedGame);
                                user.save().then((user) => {
                                    res.send({
                                        status: 'OK',
                                        grid,
                                        winner: newWinner,
                                    });
                                    return;
                                });
                            });
                        }
                    }
                }
            });
        }
    });
});

app.post('/adduser', (req, res) => {
    const { username, password, email } = req.body;
    User.findOne({ email: email }).then((existingUser) => {
        if (existingUser != null) {
            res.send({ status: 'ERROR' });
            return;
        } else {
            const newUser = new User({
                username,
                password,
                email,
                key: crypto.randomBytes(32).toString('hex'),
                verified: false,
            });
            newUser
                .save()
                .then((user) => {
                    const encodedEmail = encodeURIComponent(user.email);
                    const verifyUrl = `http://kj.cse356.compas.cs.stonybrook.edu/verify?email=${encodedEmail}&key=${user.key}`;
                    transporter.sendMail({
                        to: user.email,
                        from: '"kj" <mail@kj.cse356.compas.cs.stonybrook.edu>',
                        subject: 'kj TTT Verify Email',
                        text: verifyUrl,
                        html: `<a href=${verifyUrl}>${verifyUrl}</a>`,
                    });
                    res.send({ status: 'OK' });
                    return;
                })
                .catch((err) => {
                    res.send({ status: 'ERROR' });
                });
        }
    });
});

app.get('/verify', (req, res) => {
    const { email, key } = req.query;
    User.findOne({ email: email }).then((user) => {
        if (user == null) {
            res.send({ status: 'ERROR' });
            return;
        } else {
            if (user.verified == false && key == user.key) {
                user.verified = true;
                user.save().then((user) => {
                    res.send({ status: 'OK' });
                    return;
                });
            } else {
                res.send({ status: 'ERROR' });
                return;
            }
        }
    });
});

app.post('/login', (req, res) => {
    const { username, password } = req.body;
    User.findOne({ username: username }).then((user) => {
        if (user == null) {
            res.send({ status: 'ERROR ' });
        } else {
            if (user.verified && password == user.password) {
                req.session.userId = user._id;
                res.send({ status: 'OK' });
                return;
            } else {
                res.send({ status: 'ERROR' });
                return;
            }
        }
    });
});

app.post('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            res.send({ status: 'ERROR' });
            return;
        } else {
            res.send({ status: 'OK' });
            return;
        }
    });
});

app.post('/listgames', (req, res) => {
    const userId = req.session.userId;
    User.findById(userId).then((user) => {
        if (user == null) {
            res.send({ status: 'ERROR' });
            return;
        } else {
            const games = user.games.map((game) => ({
                id: game._id,
                start_date: game.start_date,
            }));
            res.send({
                status: 'OK',
                games: games,
            });
        }
    });
});

app.post('/getgame', (req, res) => {
    const gameId = req.body.id;
    const userId = req.session.userId;
    User.findById(userId).then((user) => {
        if (user == null) {
            res.send({ status: 'ERROR' });
            return;
        } else {
            const game = user.games.id(gameId);
            res.send({
                status: 'OK',
                grid: game.grid,
                winner: game.winner,
            });
        }
    });
});

app.post('/getscore', (req, res) => {
    const userId = req.session.userId;
    User.findById(userId).then((user) => {
        if (user == null) {
            res.send({ status: 'ERROR' });
            return;
        } else {
            res.send({
                status: 'OK',
                human: user.human,
                wopr: user.wopr,
                tie: user.tie,
            });
        }
    });
});

app.listen(port, () => {
    console.log(`Express app listening at ${port}`);
});
