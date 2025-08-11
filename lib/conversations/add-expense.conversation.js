const { addExpense } = require("../api/expenses");
const { TODAY, YESTERDAY, BEFORE_YESTERDAY, NO_COMMENT } = require("../const");
const categoryKeyboard = require("../keyboards/categories.keyboard");
const commentKeyboard = require("../keyboards/comment.keyboard");
const dateKeyboard = require("../keyboards/date.keyboard");

module.exports = async function addExpenseConversation(conversation, ctx) {
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
        const comment = commentAnswer !== NO_COMMENT ? commentAnswer : undefined;

        await addExpense(value, category, date, comment, ctx.update.message.from.first_name);
        return await ctx.reply('👍', { reply_markup: null });
    } catch (error) {
        await ctx.reply(`Йосип драний! Сталася халепа: ${error.message ?? error}`, { reply_markup: null });
    }
};