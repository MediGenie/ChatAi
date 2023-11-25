const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const ChatBot = mongoose.model('ChatBot');
const Chat = mongoose.model('Chat');
const {getAiResponse} = require('../../openAi');
const { requireUser } = require('../../config/passport');
const { convertTextToAudio } = require('./fetchAPI.js');
const socket = require('../../config/socket');
const multer = require('multer');
const fs = require('fs');
const upload = multer();

  function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  import('p-queue').then((PQueueModule) => {
    const queue = new PQueueModule.default({ concurrency: 1 });
  
    router.patch('/:id', requireUser, upload.fields([{ name: 'imageBase64' }, { name: 'audio' }]), async (req, res) => {
      try {
        const isToggled = req.body.isToggled === 'true';
        const chat = await Chat.findOne({ _id: req.params.id, author: { _id: req.user._id } })
          .populate('chatBot', '_id name');
        const chatBot = await ChatBot.findOne({ _id: chat.chatBot._id });
        const io = socket.getIO();
        // Extract text and base64 image from the request body
        const text = req.body.text;
        const base64Image = req.body.image;
        const audioFile = req.files.audio ? req.files.audio[0] : null;
        // Construct chat request object
        const chatRequest = {
          text: text || '',
          image: base64Image,
          audio: audioFile
        };

        const formattedMessage = { role: 'user', content: chatRequest.text };
        const formattedMessageImage = { role: 'user', content: chatRequest.text, image: chatRequest.image };
        // Get AI response
        const textResponse = await getAiResponse(chatBot, chat, chatRequest, req.user);
        chat.messages = [...chat.messages,formattedMessage, textResponse.aiResponse]
        formattedMessageImage.imageDescription = textResponse.imageDescription; 
        chat.messages_images = [...chat.messages_images,formattedMessageImage, textResponse.aiResponse]
        console.log('Chat response:', chat.messages);
        const updatedChat = await chat.save();


        res.json(updatedChat);
        console.log('Json');
        // Process the text response
        if (textResponse && typeof textResponse.aiResponse.content === 'string') {
          // Split text into sentences
          const punctuationRegex = /(?:[^.!?。]|\b\w+\.\b)+[.!?。]*/g;
          const sentences = textResponse.aiResponse.content.match(punctuationRegex) || [textResponse.aiResponse.content];
  
          // Process each sentence for audio conversion
          for (let i = 0; i < sentences.length; i++) {
            await queue.add(async () => {
              let sentence = sentences[i];
              // Split the sentence into words, treating acronyms or punctuated words as single words
              let words = sentence.split(' ').filter(w => w);
  
              while (words.length > 0) {
                // Initialize chunk
                let chunk = '';
                let wordCount = 0;
  
                // Loop to ensure at least 20 words in the chunk if available
                while (words.length > 0 && (wordCount < 20 || chunk.match(/[.!?]$/))) {
                  let currentWord = words.shift();
                  chunk += (chunk ? ' ' : '') + currentWord;
                  // Increment word count, treating acronyms as single words
                  wordCount += currentWord.includes('.') && !currentWord.match(/\b\w+\.\b/) ? 0 : 1;
                }
  
                // Ensure the chunk ends with punctuation if it's not the last chunk
                if (words.length > 0 && !chunk.match(/[.!?]$/)) {
                  chunk += '.';
                }
  
                if (chunk.trim().length > 0) {
                  const audioBase64 = await convertTextToAudio(chunk,chatBot.elevenlabs);
                  // If audio conversion was successful, handle the audio chunk here
                  if (audioBase64) {
                    console.log('audioBase64', req.user.name);
                    io.emit(`${req.user.name}`, { audio: audioBase64});
                  }
                }
              }
            });
          }
        } else {
          console.error('Invalid textResponse format:', textResponse);
        }
      } catch (err) {
        console.error(err);
        return res.status(500).json('Could not return that request');
      }
    });
  });
  


router.get('/:id', async (req, res, next) => {
  let chat = null;
  try {
    chat = await Chat.findById(req.params.id)
    return res.json(chat)
  } catch(err) {
    const error = new Error('Chat not found');
    error.statusCode = 404;
    error.errors = { message: "No chat found with that id" };
    return next(error);
  }
  
});

router.get('/', requireUser, async (req, res, next) => {
  try {
    const chat = await Chat.find({author: req.user})
                  .populate('chatBot, _id name')
    return res.json(chat)
  } catch(err) {
    const error = new Error('Chat not found');
    error.statusCode = 404;
    error.errors = { message: "No chat found with that id" };
    return next(error);
  }
  
});

router.post('/', requireUser, async (req, res) => {
  const chatBot = await ChatBot.findOne({_id: req.body.chatBotId})
  try {
      const newChat = new Chat ({
    author: req.user,
    chatBot: chatBot,
    messages: []
  });

  const chat = await newChat.save();
  return res.json(chat);

  }catch(err){
    const error = new Error('Chatbot not found');
    error.statusCode = 404;
    error.errors = { message: "No chatbot found with that id" };
    return next(error);
  }
});




module.exports = router;