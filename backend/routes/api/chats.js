const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const ChatBot = mongoose.model('ChatBot');
const Chat = mongoose.model('Chat');
const {getAiResponse} = require('../../openAi');
const { requireUser } = require('../../config/passport');
const { convertTextToAudio } = require('./fetchAPI.js');

  function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  

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

import('p-queue').then((PQueueModule) => {
  const queue = new PQueueModule.default({ concurrency: 1 }); // You can adjust concurrency as needed

  router.patch('/:id', requireUser, async (req, res) => {
    try {
      const chat = await Chat.findOne({ _id: req.params.id, author: { _id: req.user._id } })
        .populate('chatBot', '_id name');
      const chatBot = await ChatBot.findOne({ _id: chat.chatBot._id });

      // Get AI response
      const textResponse = await getAiResponse(chatBot, chat, req.body.chatRequest, req.user);
      chat.messages = [...chat.messages, req.body.chatRequest, textResponse];
      const updatedChat = await chat.save();

      // Send updated chat back to the client
      res.json(updatedChat);

      // Process the text response
      if (textResponse && typeof textResponse.content === 'string') {
        // Split text into sentences
        const punctuationRegex = /(?:[^.!?。]|\b\w+\.\b)+[.!?。]*/g;
        const sentences = textResponse.content.match(punctuationRegex) || [textResponse.content];

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
                const audioBase64 = await convertTextToAudio(chunk);
                // If audio conversion was successful, handle the audio chunk here
                if (audioBase64) {
                  //console.log('Audio chunk converted to base64:', audioBase64);
                  // Handle the audio chunk (save and provide URLs, or send via WebSocket)
                }
              }
            }
            // Send the chunk of text to the frontend as well
           // io.emit(`${userName}`, { text: sentence });
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

router.delete('/:id', requireUser, async (req, res) => {
  const chat = await Chat.findOne({ _id: req.params.id, author: {_id: req.user._id}})
  if(!chat) {
    const err = new Error("Validation Error");
    err.statusCode = 400;
    const errors = {};
    err.errors = errors;
    errors.userId = "You are not the owner of this Chat";
    return next(err);
  }

  try{
    // await Chat.deleteOne({_id: req.params.id})
    // return res.json('Successfully Deleted')
    chat.messages = [];
    const updatedChat = await chat.save();
    return res.json(updatedChat);
  }catch(err) {
    next(err);
  }
});

router.delete('/chatbot/:chatbotId', requireUser, async (req, res) => {
  
  try{
    const chat = await Chat.deleteOne({ chatBot: req.params.chatbotId, author: {_id: req.user._id}})
    // if(!chat) {
    //   const err = new Error("Validation Error");
    //   err.statusCode = 400;
    //   const errors = {};
    //   err.errors = errors;
    //   errors.userId = "You are not the owner of this Chat";
    // }
    return chat;
  }catch(err) {
    console.log(err);
  }
});




module.exports = router;