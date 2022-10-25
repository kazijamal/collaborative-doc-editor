const express = require('express');
const app = express();
const mongoose = require('mongoose');
const cors = require('cors');

app.use(cors());

app.use('/library', express.static('library'));

app.get('/api/connect/:id', (req, res) => {
    const { id } = req.params;
    console.log(id);
    res.writeHead(200, {
        Connection: 'keep-alive',
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
    });
    setInterval(async () => {
        console.log('pinging');
        res.write('event: sync\n'); // added these
        res.write(`data: ${JSON.stringify({ hasUnread: true })}`);
        res.write('\n\n');
    }, 5000);
});

app.listen(5001, () => {
    console.log('Listening on port 5001...');
});
