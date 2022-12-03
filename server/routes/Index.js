const express = require('express');
const router = express.Router();
const axios = require('axios');

router.get('/search', async (req, res) => {

    try {
        const result = await axios.post('http://209.151.155.43/elastic/search', {
            query: req.query.q
        });
        return res.send(result.data);
    }
    catch (e) {
        console.log(e);
        return res.send({ error: true, message: 'suggest failed' });
    }
});

router.get('/suggest', async (req, res) => {

    try {
        const result = await axios.post('http://209.151.155.43/elastic/suggest', {
            query: req.query.q
        });
        return res.send(result.data);
    }
    catch (e) {
        console.log(e);
        return res.send({ error: true, message: 'suggest failed' });
    }
});

module.exports = router;
