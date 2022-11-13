const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const MediaSchema = new Schema({
    url: {
        type: String,
    },
    mimetype: {
        type: String,
        required: true,
    },
});

const Media = mongoose.model('Media', MediaSchema);
module.exports = Media;
