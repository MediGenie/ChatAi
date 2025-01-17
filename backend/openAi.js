const { json } = require("express");
const {OpenAIApi, Configuration} = require("openai");

const rules = [
  'You should respond as realistically as you can in the format of a casual text message conversation and keep the response short.', 
  'Never ever mention that you are an AI language model.'

]


const getAiResponse = async (chatBot, chat, chatRequest) =>{
  const openai = new OpenAIApi(new Configuration({
    apiKey: process.env.CHAT_API_KEY
  }));
  const systemprompt = chatBot.systemprompt ? `from ${chatBot.systemprompt}` : '';
  const context = chatBot.context ? `${chatBot.context}` : '';
  const greeting = chatBot.greeting ? {role:'assistant', content: chatBot.greeting} : {};
  let systemPrompt = `${systemprompt}. and ${context}. ${greeting.content}`;
  let messages = [{role:'system', content: systemPrompt},...chat.messages, chatRequest];
  console.log('messages', messages);
  const res = await openai.createChatCompletion({

    model: "gpt-4-1106-preview",
    messages: messages,
    temperature: 0.1
  });
  return res.data.choices[0].message
}


module.exports = {
  getAiResponse,
}