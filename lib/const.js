const TODAY = 'Сьогодні';
const YESTERDAY = 'Вчора';
const BEFORE_YESTERDAY = 'Позавчора';
const NO_COMMENT = 'Без коментаря';

const CATEGORIES = {
    'food': '🍔 Їжа',
    'clothes': '🧥 Одяг',
    'toys': '🧸 Іграшки',
    'beauty': '💄 Краса',
    'health': '🌡️ Здоровʼя',
    'sport': '⚽️ Спорт',
    'car': '🚗 Машина',
    'entertainment': '🎮 Розваги',
    'travel': '🛩️ Подорожі',
    'transport': '🚕 Транспорт',
    'restaurants': '🍽️ Ресторани',
    'house': '🏡 Дім',
    'animals': '🐈‍⬛ Боря',
    'rent': '🏠 Оренда',
    'other': 'Інше'
};

const CATEGORY_BUTTONS = [
    ['food', 'clothes', 'toys'],
    ['beauty', 'health', 'sport'],
    ['car', 'entertainment', 'travel'],
    ['transport', 'restaurants', 'house'],
    ['animals', 'rent', 'other']
];

module.exports = {
    TODAY,
    YESTERDAY,
    BEFORE_YESTERDAY,
    NO_COMMENT,
    CATEGORIES,
    CATEGORY_BUTTONS
};