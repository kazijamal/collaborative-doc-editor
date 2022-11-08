const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const { GameSchema } = require('./Game');

const UserSchema = new Schema({
	username: {
		type: String,
		required: true,
	},
	email: {
		type: String,
		required: true,
	},
	password: {
		type: String,
		required: true,
	},
	verified: {
		type: Boolean,
		required: true,
	},
	key: {
		type: String,
		required: true,
	},
	games: {
		type: [GameSchema],
	},
	human: {
		type: Number,
		default: 0,
	},
	wopr: {
		type: Number,
		default: 0,
	},
	tie: {
		type: Number,
		default: 0,
	},
});

const User = mongoose.model("User", UserSchema);

module.exports = User;
