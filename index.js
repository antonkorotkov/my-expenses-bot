require('dotenv').config();

const { Bot, session, GrammyError, HttpError } = require("grammy");
const { conversations, createConversation } = require("@grammyjs/conversations");
const addExpenseConversation = require('./lib/conversations/add-expense.conversation');
const addExpenseFromReceiptConversation = require('./lib/conversations/add-expense-from-receipt.conversation');
const { formatMoney } = require('./lib/utils');
const extractDataFromReceipt = require('./lib/api/ai');
const { getExpenses } = require('./lib/api/expenses');

const processedMediaGroups = new Set();
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
bot.use(createConversation(addExpenseFromReceiptConversation));

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

bot.on('message:photo', async ctx => {
    try {
        const stats = await ctx.conversation.active();

        if (Object.keys(stats).length)
            return;

        if (ctx.msg.media_group_id) {
            if (processedMediaGroups.has(ctx.msg.media_group_id)) {
                return;
            }

            processedMediaGroups.add(ctx.msg.media_group_id);

            setTimeout(() => {
                processedMediaGroups.delete(ctx.msg.media_group_id);
            }, 60000);
        }

        await ctx.reply('Зараз перевіримо шо ви там накупили, хвилиночку...', { reply_markup: null });

        const file = await ctx.getFile();
        const data = await extractDataFromReceipt(file.file_path);
        const [valueString, category, dateString] = data.split(',');
        const value = parseFloat(valueString.trim());
        const date = dateString.trim();

        if (isNaN(value) || value <= 0) {
            await ctx.reply('Не можу зрозуміти скільки витрачено.', { reply_markup: null });
            return await ctx.conversation.enter('addExpenseConversation');
        }

        await ctx.conversation.enter('addExpenseFromReceiptConversation', {
            value: value,
            category: category.trim(),
            date: date.length !== 10 ? undefined : date,
        });
    } catch (error) {
        return await ctx.reply(`Йосип драний! Сталася халепа: ${error.message ?? error}`, { reply_markup: null });
    }
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