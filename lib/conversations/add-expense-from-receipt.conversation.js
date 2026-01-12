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
        let predictionCtx;
        let categoryCtx;
        let dateCtx;

        if (value) {
            const buttonText = [
                formatMoney(value),
                category ? CATEGORIES[category] : undefined,
                date ? date : undefined
            ].filter(Boolean).join(' / ');

            const predictionKeyboard = new Keyboard().resized().selected().row().text(buttonText).row().text('Нє').oneTime();
            await ctx.reply('Вгадав?', {
                reply_markup: predictionKeyboard,
                reply_parameters: { message_id: ctx.msg.message_id }
            });
            predictionCtx = await conversation.waitFor('message:text');
            const response = predictionCtx.msg.text;

            if (response !== buttonText) {
                await ctx.reply('Тоді самі додавайте.', { reply_markup: null });
                return await addExpenseConversation(conversation, ctx);
            }

            if (!category) {
                await predictionCtx.reply('Якої категорії витрати?', {
                    reply_markup: categoryKeyboard,
                    reply_parameters: { message_id: predictionCtx.msg.message_id }
                });
                categoryCtx = await conversation.waitFor("message:text");
                const newCategory = categoryCtx.msg.text;
                category = newCategory
            }

            if (!date) {
                await (categoryCtx || predictionCtx).reply('Коли була витрата?', {
                    reply_markup: dateKeyboard,
                    reply_parameters: { message_id: (categoryCtx || predictionCtx).msg.message_id }
                });

                do {
                    dateCtx = await conversation.waitFor('message:text');
                    const dateTxt = dateCtx.msg.text;

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
                        await dateCtx.reply('Щось не зрозумів...', {
                            reply_markup: dateKeyboard,
                            reply_parameters: { message_id: dateCtx.msg.message_id }
                        });
                } while (!date);
            } else {
                const [d, m, y] = date.split('.');
                const day = Number(d);
                const month = Number(m) - 1;
                const year = Number(y);
                date = new Date(year, month, day, 12);
            }

            const lastCtx = dateCtx || categoryCtx || predictionCtx;
            await lastCtx.reply('Додати якийсь коментар?', {
                reply_markup: commentKeyboard,
                reply_parameters: { message_id: lastCtx.msg.message_id }
            });
            const commentCtx = await conversation.waitFor('message:text');
            const commentAnswer = commentCtx.msg.text;
            const comment = commentAnswer !== NO_COMMENT ? commentAnswer : undefined;
            const finalDate = typeof date === 'string' ? new Date(date) : date;
            const finalCategory = CATEGORIES[category] || category;

            await addExpense(value, finalCategory, finalDate, comment, commentCtx.from.first_name);
            return await commentCtx.reply('👍', {
                reply_markup: { remove_keyboard: true },
                reply_parameters: { message_id: commentCtx.msg.message_id }
            });
        }
    } catch (error) {
        await ctx.reply(`Йосип драний! Сталася халепа: ${error.message ?? error}`, { reply_markup: null });
    }
}