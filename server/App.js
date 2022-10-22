const express = require('express');
const app = express();
const mongoose = require('mongoose');

app.use('/library', express.static('library'));

app.get('/api/connect/:id', (req, res) => {
    const { id } = req.params;
});

app.listen(3000, () => {
    console.log('Listening on port 3000...');
});
