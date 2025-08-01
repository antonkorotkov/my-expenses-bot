require('dotenv').config();

const { Bot, Keyboard, session, GrammyError, HttpError } = require("grammy");
const { conversations, createConversation } = require("@grammyjs/conversations");
const { addExpense, getExpenses } = require('./api/expenses');

const TODAY = 'Сьогодні';
const YESTERDAY = 'Вчора';
const BEFORE_YESTERDAY = 'Позавчора';
const NO = 'Без коментаря';

const CATEGORIES = [
    ['🍔 Їжа', '🧥 Одяг', '🧸 Іграшки'],
    ['💄 Краса', '🌡️ Здоровʼя', '⚽️ Спорт'],
    ['🚗 Машина', '🎮 Розваги', '🛩️ Подорожі'],
    ['🚕 Транспорт', '🍽️ Ресторани', '🏡 Дім'],
    ['🐈‍⬛ Боря', '🏠 Оренда', 'Інше']
];

const categoryKeyboard = new Keyboard().oneTime();
const dateKeyboard = new Keyboard().oneTime().text(TODAY).text(YESTERDAY).text(BEFORE_YESTERDAY);
const commentKeyboard = new Keyboard().oneTime().text(NO);

CATEGORIES.forEach(row => {
    categoryKeyboard.row();
    row.forEach(cat => categoryKeyboard.text(cat));
});

const formatMoney = money => {
    return new Intl.NumberFormat('sk-SK', {
        style: 'currency',
        currency: 'EUR',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(money);
};

async function addExpenseConversation(conversation, ctx) {
    try {
        await ctx.reply('Скільки витрачено в Євро? Наприклад: 1000, 9.99, 7.5');
        let value;
        do {
            value = await conversation.form.number(ctx => ctx.reply('Спробуй ще раз.'));

            if (value <= 0)
                await ctx.reply('Таке не можна...');
        } while (value <= 0);

        await ctx.reply('Якої категорії витрати?', { reply_markup: categoryKeyboard });
        const { msg: { text: category } } = await conversation.waitFor("message:text");

        await ctx.reply('Коли була витрата?', { reply_markup: dateKeyboard });
        let date;
        do {
            const { msg: { text: dateTxt } } = await conversation.waitFor('message:text');

            const today = new Date();
            if (dateTxt === TODAY) {
                date = today;
            }
            else if (dateTxt === YESTERDAY) {
                date = new Date(today);
                date.setDate(today.getDate() - 1);
            }
            else if (dateTxt === BEFORE_YESTERDAY) {
                date = new Date(today);
                date.setDate(today.getDate() - 2);
            }
            else if (/^\d{2}\.\d{2}\.\d{4}$/.test(dateTxt)) {
                const [d, m, y] = dateTxt.split('.');
                const day = Number(d);
                const month = Number(m) - 1;
                const year = Number(y);

                if (new Date().getFullYear() === year)
                    date = new Date(year, month, day, 12);
            }

            if (!date)
                await ctx.reply('Щось не зрозумів...', { reply_markup: dateKeyboard });
        } while (!date);

        await ctx.reply('Додати якийсь коментар?', { reply_markup: commentKeyboard });
        const { msg: { text: commentAnswer } } = await conversation.waitFor('message:text');
        const comment = commentAnswer !== NO ? commentAnswer : undefined;

        await addExpense(value, category, date, comment, ctx.update.message.from.first_name);
        return await ctx.reply('👍', { reply_markup: null });
    } catch (error) {
        await ctx.reply(`Йосип драний! Сталася халепа: ${error.message ?? error}`, { reply_markup: null });
    }
}

const bot = new Bot(process.env.BOT_TOKEN);

bot.use(session({
    type: "multi",
    custom: {
        initial: () => ({}),
    },
    conversation: {}
}));
bot.use(conversations());

bot.use(createConversation(addExpenseConversation));

bot.use(async (ctx, next) => {
    if (ctx.chat.id !== Number(process.env.CHAT_ID))
        return await ctx.reply(`Упс. Не той чат. ${ctx.chat.id}`);

    await next();
});

bot.command('expense', async ctx => {
    const stats = await ctx.conversation.active();

    if (!Object.keys(stats).length)
        await ctx.conversation.enter('addExpenseConversation');
});

bot.command('stats_w', async ctx => {
    const money = await getExpenses('w');
    await ctx.reply(money ? `Витрати за тиждень: ${formatMoney(money)} 😫` : 'Немає витрат за тиждень', { reply_markup: null });
});

bot.command('stats_m', async ctx => {
    const money = await getExpenses('m');
    await ctx.reply(money ? `Витрати за місяць: ${formatMoney(money)} 😫` : 'Немає витрат за місяць', { reply_markup: null });
});

bot.command('stats_y', async ctx => {
    const money = await getExpenses('y');
    await ctx.reply(money ? `Витрати за рік: ${formatMoney(money)} 😫` : 'Немає витрат за рік', { reply_markup: null });
});

bot.on('msg:text', async ctx => {
    if (ctx.update.message.chat.type === 'private')
        return ctx.reply('Додайте мене у групу');
});

bot.catch((err) => {
    const ctx = err.ctx;
    console.error(`Error while handling update ${ctx.update.update_id}:`);

    const e = err.error;
    if (e instanceof GrammyError) {
        console.error("Error in request:", e.description);
    } else if (e instanceof HttpError) {
        console.error("Could not contact Telegram:", e);
    } else {
        console.error("Unknown error:", e);
    }
});

(async () => {
    await bot.api.setMyCommands([
        { command: "expense", description: "Додати витрати" },
        { command: "stats_w", description: "Витрати за тиждень" },
        { command: "stats_m", description: "Витрати за місяць" },
        { command: "stats_y", description: "Витрати за рік" }
    ]);

    bot.start();
})();