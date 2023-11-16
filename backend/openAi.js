const { json } = require("express");
const {OpenAIApi, Configuration} = require("openai");

const rules = [
  'You should respond as realistically as you can in the format of a casual text message conversation and keep the response short.', 
  'Never ever mention that you are an AI language model.'
]
async function getAiResponse(chatBot, chat, chatRequest, userInfo) {
    // Initialize OpenAI API with API key
    const openai = new OpenAIApi(new Configuration({
        apiKey: process.env.CHAT_API_KEY
    }));

    // Build system prompt using chatBot and userInfo data
    const systemPromptParts = [
        userInfo.username ? `This person you are talking to is ${userInfo.username}.` : '',
        userInfo.location ? `This person is from ${userInfo.location}.` : '',
        userInfo.age ? `This person is ${userInfo.age} years old.` : '',
        chatBot.systemprompt ? `from ${chatBot.systemprompt}` : '',
        ...rules // Include the rules
    ];
    const systemPrompt = systemPromptParts.filter(part => part.length > 0).join(' ');

    // Construct messages array for chat completion request
    const messages = [{ role: 'system', content: systemPrompt }, ...chat.messages, chatRequest];
    console.log('messages', messages);

    // Request chat completion from OpenAI and return the response
    try {
        const response = await openai.createChatCompletion({
            model: "gpt-4-1106-preview",
            messages: messages,
            temperature: 0.1
        });
        return response.data.choices[0].message;
    } catch (error) {
        console.error('Error fetching AI response:', error);
        throw error;
    }
}


module.exports = {
  getAiResponse,
}