const { Keyboard } = require("grammy");
const { CATEGORY_BUTTONS, CATEGORIES } = require("../const");

const categoryKeyboard = new Keyboard().resized().selected().oneTime();

CATEGORY_BUTTONS.forEach(row => {
    categoryKeyboard.row();
    row.forEach(cat => categoryKeyboard.text(CATEGORIES[cat]));
});

module.exports = categoryKeyboard;