const { Keyboard } = require("grammy");
const { CATEGORIES, TODAY, YESTERDAY, BEFORE_YESTERDAY, NO_COMMENT } = require("../const");
const { formatMoney } = require("../utils");
const addExpenseConversation = require("./add-expense.conversation");
const categoryKeyboard = require("../keyboards/categories.keyboard");
const dateKeyboard = require("../keyboards/date.keyboard");
const { addExpense } = require("../api/expenses");
const commentKeyboard = require("../keyboards/comment.keyboard");

module.exports = async function addExpenseFromReceiptConversation(conversation, ctx, data) {
    try {
        let { value, category, date } = data;

        if (value) {
            const buttonText = [
                formatMoney(value),
                category ? CATEGORIES[category] : undefined,
                date ? date : undefined
            ].filter(Boolean).join(' / ');

            const predictionKeyboard = new Keyboard().row().text(buttonText).row().text('Нє').oneTime();
            await ctx.reply('Вгадав?', { reply_markup: predictionKeyboard });
            const { msg: { text: response } } = await conversation.waitFor('message:text');

            if (response !== buttonText) {
                await ctx.reply('Тоді самі додавайте.', { reply_markup: null });
                return await addExpenseConversation(conversation, ctx);
            }

            if (!category) {
                await ctx.reply('Якої категорії витрати?', { reply_markup: categoryKeyboard });
                const { msg: { text: newCategory } } = await conversation.waitFor("message:text");
                category = newCategory
            }

            if (!date) {
                await ctx.reply('Коли була витрата?', { reply_markup: dateKeyboard });
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
            } else {
                const [d, m, y] = date.split('.');
                const day = Number(d);
                const month = Number(m) - 1;
                const year = Number(y);
                date = new Date(year, month, day, 12);
            }

            await ctx.reply('Додати якийсь коментар?', { reply_markup: commentKeyboard });
            const { msg: { text: commentAnswer } } = await conversation.waitFor('message:text');
            const comment = commentAnswer !== NO_COMMENT ? commentAnswer : undefined;
            const finalDate = typeof date === 'string' ? new Date(date) : date;
            const finalCategory = CATEGORIES[category] || category;

            await addExpense(value, finalCategory, finalDate, comment, ctx.update.message.from.first_name);
            return await ctx.reply('👍', { reply_markup: null });
        }
    } catch (error) {
        await ctx.reply(`Йосип драний! Сталася халепа: ${error.message ?? error}`, { reply_markup: null });
    }
}