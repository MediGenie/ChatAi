const { json } = require("express");
const {OpenAIApi, Configuration} = require("openai");

const rules = [
  'You should respond as realistically as you can in the format of a casual text message conversation.', 
  'Never ever mention that you are an AI language model.'
]
async function getAiResponse(chatBot, chat, chatRequest, userInfo) {
    // Initialize OpenAI API with API key
    const openai = new OpenAIApi(new Configuration({
        apiKey: process.env.CHAT_API_KEY
    }));

    // System prompt build-up
    const systemPromptParts = [
        userInfo.name ? `This person you are talking to is ${userInfo.name}. the person is called and named ${userInfo.name}` : '',
        userInfo.location ? `${userInfo.name} is from ${userInfo.location}.` : '',
        userInfo.age ? `${userInfo.name} is ${userInfo.age} years old.` : '',
        chatBot.systemprompt ? `from ${chatBot.systemprompt}` : '',
        ...rules
    ];
    const systemPrompt = systemPromptParts.filter(part => part.length > 0).join(' ');
    console.log('systemPrompt', systemPrompt);
    let userText = chatRequest.text || ""; // Ensure user text is a string
    let transformedRequest;
    let imageDescription;

    if (chatRequest.image) {
        // Process the image using GPT-4 Vision
        const imageResponse = await openai.createChatCompletion({
            model: "gpt-4-vision-preview",
            messages: [
                {
                    role: "user",
                    content: [
                        { type: "text", text: "describe what is going on in the picture and extract any text and numbers in the image. " },
                        {
                            type: "image_url",
                            image_url: {
                                "url": `data:image/jpeg;base64,${chatRequest.image}`
                            },
                        },
                    ],
                },
            ],
            max_tokens: 250
        });

        // Extracting the image description
        imageDescription = imageResponse.data.choices[0].message.content;
        userText = `Consider the context of ${imageDescription}. ${userInfo.name}'s PROMPT: ${userText}.`;

        transformedRequest = {
            "role": "user",
            "content": userText // Directly assign the string here
        };
    } else {
        // If there's no image, just use the text
        transformedRequest = {
            "role": "user",
            "content": userText // Directly assign the string here
        };
    }



    // Constructing the messages array
    let messages = [{ role: 'system', content: systemPrompt }, ...chat.messages, transformedRequest];
    // Request chat completion from OpenAI
    try {
        const response = await openai.createChatCompletion({
            model: "gpt-4-1106-preview",
            messages: messages,
            temperature:0.4,
        });

        return {
            aiResponse: response.data.choices[0].message,
            imageDescription: imageDescription // Return the image description as well
        };
    } catch (error) {
        console.error('Error fetching AI response:', error);
        throw error;
    }
}

module.exports = {
  getAiResponse,
}