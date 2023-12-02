const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const ChatBot = mongoose.model('ChatBot');
const Chat = mongoose.model('Chat');
const {getAiResponse} = require('../../openAi');
const { requireUser } = require('../../config/passport');
const { convertTextToAudio } = require('./fetchAPI.js');

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