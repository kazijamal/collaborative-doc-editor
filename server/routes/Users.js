const express = require('express');
const nodemailer = require('nodemailer');
const router = express.Router();
const crypto = require('crypto');
const User = require('../models/User');

const transporter = nodemailer.createTransport({
    sendmail: true,
    newline: 'unix',
    pat: '/usr/sbin/sendmail',
});

router.post('/signup', async (req, res) => {
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

    res.send({});
});

router.get('/verify', async (req, res) => {
    const { email, key } = req.query;
    User.findOne({ email: email }).then((user) => {
        if (user == null) {
            res.send({
                error: true,
                message: 'invalid verification attempt (no user with email)',
            });
        } else {
            if (user.verified == false && key == user.key) {
                user.verified = true;
                user.save().then((user) => {
                    res.send({ status: 'OK' });
                });
            } else {
                res.send({
                    error: true,
                    message:
                        'invalid verification attempt (wrong key or already verified)',
                });
            }
        }
    });
});

router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    const user = await User.findOne({
        email: email,
        password: password,
        verified: true,
    });
    if (user === null)
        return res.send({ error: true, message: 'login failed' });
    req.session._id = user._id.toString();
    req.session.name = user.name;
    req.session.save(() => {
        res.send({ name: user.name });
    });
});

router.post('/logout', async (req, res) => {
    const result = await req.session.destroy();
    res.send({});
});


module.exports = router;