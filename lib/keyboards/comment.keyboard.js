const { Keyboard } = require("grammy");
const { NO_COMMENT } = require("../const");

const commentKeyboard = new Keyboard().text(NO_COMMENT).oneTime();

module.exports = commentKeyboard;