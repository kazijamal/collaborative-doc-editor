const express = require('express');
const router = express.Router();
const Doc = require('../models/Doc');
const axios = require('axios');

const CLUSTER_IPS = ['209.151.150.8'];

router.post('/create', async (req, res) => {
    const { name } = req.body;
    
    const doc = new Doc({ name });
    
    const data = await doc.save();
    const id = data._id.toString();
    
    const cluster_ip = CLUSTER_IPS[Math.floor(Math.random() * CLUSTER_IPS.length)];
    cluster_ips[id] = cluster_ip;
    try {
        await axios.post('http://209.151.155.43/elastic/index', {
            id,
            name,
            text: ''
        })
    }
    catch (e) {
        console.log(e);
    }
    return res.send({ id });
});

router.post('/delete', async (req, res) => {
    const { id } = req.body;

    const doc = await Doc.findById(id);

    const { deletedCount } = await Doc.deleteOne({ _id: id });
    if (deletedCount === 0) {
        return res.send({ error: true, message: 'doc does not exist' });
    }
    else {
        // axios.post(`http://${doc.ip}/clear`, { id });
        res.send({});
    }
});

router.get('/list', async (req, res) => {
    const docs = await Doc.find().sort({ updatedAt: -1 }).limit(10);
    res.send(docs);
});

router.post('/exists', async (req, res) => {
    let { id } = req.body;
    const doc = await Doc.findById(id);
    res.send({ exists: doc !== null });
});

module.exports = router;
