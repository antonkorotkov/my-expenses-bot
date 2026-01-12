const { Keyboard } = require("grammy");
const { NO_COMMENT } = require("../const");

const commentKeyboard = new Keyboard().resized().selected().text(NO_COMMENT).oneTime();

module.exports = commentKeyboard;