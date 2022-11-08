const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const GameSchema = new Schema({
	start_date: {
		type: Date,
		required: true,
	},
	grid: {
		type: [String],
		required: true,
	},
	winner: {
		type: String,
		required: true,
	}
});

const Game = mongoose.model("Game", GameSchema);

module.exports.GameSchema = GameSchema;
module.exports.Game = Game;
