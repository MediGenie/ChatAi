const { json } = require("express");
const {OpenAI} = require("openai");
const socket = require('./config/socket');


const rules = [
  'You should respond as realistically as you can in the format of a casual text message conversation.', 
  'Never ever mention that you are an AI language model.'
]
async function getAiResponse(chatBot, chat, chatRequest, userInfo) {

    try {
        const io = socket.getIO();

        const openai = new OpenAI({
            apiKey:  process.env.CHAT_API_KEY,
          });
    
        // System prompt build-up
        const systemPromptParts = [
            userInfo.name ? `This person you are talking to is ${userInfo.name}. the person is called and named ${userInfo.name}` : '',
            userInfo.location ? `${userInfo.name} is from ${userInfo.location}.` : '',
            userInfo.age ? `${userInfo.name} is ${userInfo.age} years old.` : '',
            chatBot.systemprompt ? `from ${chatBot.systemprompt}` : '',
            ...rules
        ];
        const systemPrompt = systemPromptParts.filter(part => part.length > 0).join(' ');
        let userText = chatRequest.text || ""; // Ensure user text is a string
        let transformedRequest;
        let imageDescription;
    
        if (chatRequest.image) {
            // Process the image using GPT-4 Vision
            const imageResponse = await openai.chat.completions.create({
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
            imageDescription = imageResponse.choices[0]?.message?.content;
                if (!imageDescription) {
                throw new Error('Image description not found in response');
                console.log('Image Response:', imageResponse);
}
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

        // let messages = [{ role: 'system', content: systemPrompt }];
        // if (chat.messages.length > 1) {
        //     messages.push(...chat.messages.slice(-2)); // Add the last two chat messages
        // } else {
        //     messages.push(...chat.messages); // If there are fewer than two, add all available
        // }
        // messages.push(transformedRequest); // Always keep the transformedRequest as the last element
        // Request chat completion from OpenAI
    
            const stream = await openai.chat.completions.create({
                model: "gpt-4-1106-preview",
                messages: messages,
                stream: true,
            });
    
            let content = "";
            let role = ""
            for await (const chunk of stream) {
                let chunkContent = chunk.choices[0]?.delta?.content || ""
                io.emit(`stream chunk`, { chunk: chunkContent});
                role += chunk.choices[0]?.delta?.role || ""
                content += chunkContent;
            }
    
            let aiResponse = {
                role,
                content
            }
    
            return {
                aiResponse,
                imageDescription, // Return the image description as well
            };
    } catch (error) {
        console.log('=====>error in catch', error);
    }

   
}

module.exports = {
  getAiResponse,
}