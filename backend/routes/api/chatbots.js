const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const ChatBot = mongoose.model('ChatBot');
const User = mongoose.model('User');
const Chat = mongoose.model('Chat');
const { requireUser } = require('../../config/passport');
const { singleFileUpload, singleMulterUpload, retrievePrivateFile } = require("../../awsS3");


//gets all chatBots for index page
router.get('/', requireUser, async (req, res) => {
  try {
    const chatbots = await ChatBot.find()
                  .populate("author", "_id username");
    chatbots.forEach(bot=>{
      if(!bot.profileImageUrl.includes('aws') ){
        bot.profileImageUrl = retrievePrivateFile(bot.profileImageUrl)
      }
    })
    const chats = await Chat.find({author: req.user})
    const chattedChatbotIds = chats.map(chat => chat.chatBot);

    return res.json({chatbots, chattedChatbotIds});
  }
  catch(err) {
    return res.json([]);
  }
});

//gets chatBot and the signedIn user's messages with that bot
router.get('/:id', requireUser, async (req, res, next) => {
  let chatbot = null;
  try {
    chatbot = await ChatBot.findById(req.params.id)
                    .populate("author", "_id username")
    if(!chatbot.profileImageUrl.includes('aws') ){
      chatbot.profileImageUrl = retrievePrivateFile(chatbot.profileImageUrl)
    }
  } catch(err) {
    const error = new Error('Chatbot not found');
    error.statusCode = 404;
    error.errors = { message: "No chatbot found with that id" };
    return next(error);
  }
  try {
    let chat = await Chat.findOne({ chatBot: chatbot, author: req.user})
    if(!chat) chat = {};
    return res.json({chat, chatbot})
  } catch(err){
    return res.json([]);
  }
  
});

router.get('/user/:userId', requireUser, async (req, res, next) => {
  let user;
  try {
    user = await User.findById(req.params.userId);
  } catch(err) {
    const error = new Error('User not found');
    error.statusCode = 404;
    error.errors = { message: "No user found with that id" };
    return next(error);
  }
  try {
    
    const chatBots = await ChatBot.find({ author: user })
                          .sort({ createdAt: -1 })
                          .populate("author", "_id username profileImageUrl")
    chatBots.forEach(bot=>{
      if(!bot.profileImageUrl.includes('aws') ){
        bot.profileImageUrl = retrievePrivateFile(bot.profileImageUrl)
      }
    })
    return res.json(chatBots)
  } catch(err){
    return res.json([]);
  }
  
});

//create new chatbot
router.post('/', singleMulterUpload("image"),  requireUser, async (req, res, next) => {
  const profileImageUrl = req.file ?
      await singleFileUpload({ file: req.file, public: false}) : req.body.image ? req.body.image : 
      'https://pet-network-seeds.s3.us-west-1.amazonaws.com/default_profile.jpg';
  try{
    const newChatBot = new ChatBot({
      name: req.body.name,
      profileImageUrl,
      bio: req.body.bio,
      location: req.body.location,
      author: req.user
    });
    let chatBot = await newChatBot.save();
    chatBot = await chatBot.populate("author", "_id username profileImageUrl");
    if(!chatBot.profileImageUrl.includes('aws') ){
      chatBot.profileImageUrl = retrievePrivateFile(chatBot.profileImageUrl)
    }
    return res.json(chatBot);

  }catch(err) {
    next(err);
  }
});

router.patch('/:id', singleMulterUpload("image"), requireUser, async (req, res, next) => {
  let chatbot = await ChatBot.findOne({ _id: req.params.id, author: {_id: req.user._id}})
  if(!chatbot) {
    const err = new Error("Validation Error");
    err.statusCode = 400;
    const errors = {};
    err.errors = errors;
    errors.userId = "You are not the owner of this Chatbot";
    return next(err);
  }
  req.file ?
      chatbot.profileImageUrl = await singleFileUpload({ file: req.file, public: false}) :
      chatbot.profileImageUrl;
  try{
    chatbot.name = req.body.name || chatbot.name;
    chatbot.bio = req.body.bio || chatbot.bio;
    chatbot.location = req.body.location || chatbot.location;
    await chatbot.save();
    chatbot = await chatbot.populate("author", "_id username profileImageUrl");
    if(!chatbot.profileImageUrl.includes('aws') ){
      chatbot.profileImageUrl = retrievePrivateFile(chatbot.profileImageUrl)
    }
    return res.json(chatbot);

  }catch(err) {
    next(err);
  }
});

router.delete('/:id',  requireUser, async (req, res, next) => {
  const chatbot = await ChatBot.findOne({ _id: req.params.id, author: {_id: req.user._id}})
  if(!chatbot) {
    const err = new Error("Validation Error");
    err.statusCode = 400;
    const errors = {};
    err.errors = errors;
    errors.userId = "You are not the owner of this Chatbot";
    return next(err);
  }

  try{
    await Chat.deleteMany({chatBot: chatbot });

  }catch (err){
    err.statusCode = 400;
    const errors = {};
    err.errors = errors;
    errors.userId = "Unable to delete related chats";
    next(err);
  }

  try{
    await ChatBot.deleteOne({_id: req.params.id})
    return res.json('Successfully Deleted')
  }catch(err) {
    next(err);
  }
});



module.exports = router;