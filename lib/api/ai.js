const { generateText } = require("ai");
const { openai } = require('@ai-sdk/openai');
const { readFile } = require('fs/promises');

const system = readFile('./SYSTEM.MD', 'utf-8');
const getImageUrl = filePath => `https://api.telegram.org/file/bot${process.env.BOT_TOKEN}/${filePath}`;

const extractDataFromReceipt = async filePath => {
    try {
        const result = await generateText({
            model: openai('gpt-5-mini'),
            messages: [
                {
                    role: 'user',
                    content: [
                        {
                            type: 'text',
                            text: 'Extract the total amount, the category, and the operation date from the receipt image',
                        },
                        {
                            type: 'image',
                            image: getImageUrl(filePath)
                        }
                    ]
                }
            ],
            system: await system
        });

        return result.text;
    } catch (error) {
        throw new Error(`Failed to extract data from receipt: ${error.message}`);
    }
};

module.exports = extractDataFromReceipt;