const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const DocSchema = new Schema({
    name: {
        type: String,
        required: true,
    },
    updatedAt: {
        type: Date,
        default: Date.now
    },
    // ip: {
    //     type: String,
    //     required: true,
    // },
    // cluster_ip: {
    // 	type: String,
    // 	required: true
    // }
});

const Doc = mongoose.model('Doc', DocSchema);
module.exports = Doc;

