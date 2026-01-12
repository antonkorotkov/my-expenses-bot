const { addExpense } = require("../api/expenses");
const { TODAY, YESTERDAY, BEFORE_YESTERDAY, NO_COMMENT } = require("../const");
const categoryKeyboard = require("../keyboards/categories.keyboard");
const commentKeyboard = require("../keyboards/comment.keyboard");
const dateKeyboard = require("../keyboards/date.keyboard");

module.exports = async function addExpenseConversation(conversation, ctx) {
    try {
        await ctx.reply('Скільки витрачено в Євро? Наприклад: 1000, 9.99, 7.5', {
            reply_parameters: { message_id: ctx.msg.message_id }
        });
        let value;
        let amountCtx;
        do {
            amountCtx = await conversation.waitFor("message:text");
            value = parseFloat(amountCtx.msg.text.replace(',', '.'));

            if (isNaN(value) || value <= 0) {
                await amountCtx.reply('Спробуй ще раз. Наприклад: 1000, 9.99, 7.5', {
                    reply_parameters: { message_id: amountCtx.msg.message_id }
                });
            }
        } while (isNaN(value) || value <= 0);

        await amountCtx.reply('Якої категорії витрати?', {
            reply_markup: categoryKeyboard,
            reply_parameters: { message_id: amountCtx.msg.message_id }
        });
        const categoryCtx = await conversation.waitFor("message:text");
        const category = categoryCtx.msg.text;

        await categoryCtx.reply('Коли була витрата?', {
            reply_markup: dateKeyboard,
            reply_parameters: { message_id: categoryCtx.msg.message_id }
        });

        let date;
        let dateCtx;
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

        await dateCtx.reply('Додати якийсь коментар?', {
            reply_markup: commentKeyboard,
            reply_parameters: { message_id: dateCtx.msg.message_id }
        });
        const commentCtx = await conversation.waitFor('message:text');
        const commentAnswer = commentCtx.msg.text;
        const comment = commentAnswer !== NO_COMMENT ? commentAnswer : undefined;

        await addExpense(value, category, date, comment, commentCtx.from.first_name);
        return await commentCtx.reply('👍', {
            reply_markup: { remove_keyboard: true },
            reply_parameters: { message_id: commentCtx.msg.message_id }
        });
    } catch (error) {
        await ctx.reply(`Йосип драний! Сталася халепа: ${error.message ?? error}`, { reply_markup: null });
    }
};