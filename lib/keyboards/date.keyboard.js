const { Keyboard } = require("grammy");
const { TODAY, YESTERDAY, BEFORE_YESTERDAY } = require("../const");

const dateKeyboard = new Keyboard()
    .resized()
    .selected()
    .oneTime()
    .text(TODAY)
    .text(YESTERDAY)
    .text(BEFORE_YESTERDAY);

module.exports = dateKeyboard;