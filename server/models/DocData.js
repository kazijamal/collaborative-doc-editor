const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const DocDataSchema = new Schema({
	mostRecentDocs: {
        type: [String]
    },
});

const DocData = mongoose.model("DocDataSchema", DocDataSchema);
module.exports = DocData;