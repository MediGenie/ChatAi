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
    let chatbots;
    if (!req.query.query) {
      chatbots = await ChatBot.find()
                  .populate("author", "_id name")
                  .sort({ name: 1 });
      for (const bot of chatbots) {
        if (!bot.profileImageUrl.includes('aws')) {
          bot.profileImageUrl = await retrievePrivateFile(bot.profileImageUrl); // Added await
          console.log(`Retrieved S3 URL for bot ${bot._id}: ${bot.profileImageUrl}`); // Log the URL
        }
      }
    } else {
        chatbots = await ChatBot.find({"name": { "$regex": req.query.query, "$options": "i" }})  //$options of 'i' makes search case insensitive
                    .populate("author", "_id name")
        chatbots.forEach(bot=>{
          if(!bot.profileImageUrl.includes('aws') ){
            bot.profileImageUrl = retrievePrivateFile(bot.profileImageUrl)
          }
        }) 
    }
    
    const chats = await Chat.find({author: req.user}).sort({updatedAt: -1})
    const chattedChatbotIds = chats.map(chat => chat.chatBot);

    return res.json({chatbots, chattedChatbotIds});
  }
  catch(err) {
    return res.json([]);
  }
});

//gets chatBot and the signedIn user's messages with that bot
router.get('/:id', requireUser, async (req, res, next) => {
  let chatbot;
  try {
    chatbot = await ChatBot.findById(req.params.id).populate("author", "_id name");
    if (!chatbot) {
      const error = new Error('Chatbot not found');
      error.statusCode = 404;
      error.errors = { message: "No chatbot found with that id" };
      return next(error);
    }

    if (!chatbot.profileImageUrl.includes('aws')) {
      chatbot.profileImageUrl = await retrievePrivateFile(chatbot.profileImageUrl);
      console.log(`Retrieved S3 URL for chatbot ${chatbot._id}: ${chatbot.profileImageUrl}`);
    }

    // Check if the user is the author of the chatbot
    if (!chatbot.author._id.equals(req.user._id)) {
      // User is not the author, create a new chat with the user as the author
      let newChat = new Chat({
        chatBot: chatbot._id,
        author: req.user._id,
        // Copy other necessary details from chatbot if needed
      });

      await newChat.save();
      console.log(`New chat created for user ${req.user._id} with chatbot ${chatbot._id}`);
      return res.json({ chat: newChat, chatbot });
    }

    // If the user is the author, return the existing chat
    let chat = await Chat.findOne({ chatBot: chatbot, author: req.user });
    if (!chat) chat = {};
    return res.json({ chat, chatbot });
  } catch (err) {
    console.error("Error in GET '/:id' route:", err);
    return next(err);
  }
});



//gets all chatbots created by a user
router.get('/user/:userId', requireUser, async (req, res, next) => {
  let user;
  try {
    user = await User.findById(req.params.userId);
  } catch (err) {
    console.error("Error in '/user/:userId' route:", err); // Log the error
    const error = new Error('User not found');
    error.statusCode = 404;
    error.errors = { message: "No user found with that id" };
    return next(error);
  }
  try {
    const chatBots = await ChatBot.find({ author: user })
                          .sort({ createdAt: -1 })
                          .populate("author", "_id name profileImageUrl");
    for (const bot of chatBots) {
      if (!bot.profileImageUrl.includes('aws')) {
        bot.profileImageUrl = await retrievePrivateFile(bot.profileImageUrl); // Added await
        console.log(`Retrieved S3 URL for chatbot ${bot._id}: ${bot.profileImageUrl}`); // Log the URL
      }
    }
    return res.json(chatBots);
  } catch (err) {
    console.error("Error in '/user/:userId' route:", err); // Log the error
    return res.json([]);
  }
});

//create new chatbot
router.post('/', singleMulterUpload("image"),  requireUser, async (req, res, next) => {
  const profileImageUrl = req.file ?
      await singleFileUpload({ file: req.file, public: false}) :
      'https://pet-network-seeds.s3.us-west-1.amazonaws.com/default_person.png';
  try{
    const newChatBot = new ChatBot({
      name: req.body.name,
      profileImageUrl,
      systemprompt: req.body.systemprompt,
      context: req.body.context,
      elevenlabs: req.body.elevenlabs,
      author: req.user
    });
    let chatBot = await newChatBot.save();
    chatBot = await chatBot.populate("author", "_id name profileImageUrl");
    if (!chatBot.profileImageUrl.includes('aws')) {
      chatBot.profileImageUrl = await retrievePrivateFile(chatBot.profileImageUrl); // Added await
      console.log(`Retrieved S3 URL for new chatbot ${chatBot._id}: ${chatBot.profileImageUrl}`); // Log the URL
    }
    return res.json(chatBot);
  } catch (err) {
    console.error("Error in POST '/':", err); // Log the error
    next(err);
  }
});

router.patch('/:id', singleMulterUpload("image"), requireUser, async (req, res, next) => {
  let chatbot = await ChatBot.findOne({ _id: req.params.id, author: {_id: req.user._id}})
  if(!chatbot && req.user.name === 'admin') chatbot = await ChatBot.findOne({ _id: req.params.id})
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
    chatbot.systemprompt = req.body.systemprompt || chatbot.systemprompt;
    chatbot.context = req.body.context || chatbot.context;
    chatbot.elevenlabs = req.body.elevenlabs || chatbot.elevenlabs;
    await chatbot.save();
    chatbot = await chatbot.populate("author", "_id name profileImageUrl");
    if(!chatbot.profileImageUrl.includes('aws') ){
      chatbot.profileImageUrl = await retrievePrivateFile(chatbot.profileImageUrl)
    }
  
    let chat = await Chat.findOne({ chatBot: chatbot, author: req.user})
    if(!chat) chat = {};
    return res.json({chat, chatbot})

  }catch(err) {
    next(err);
  }
});

router.delete('/:id',  requireUser, async (req, res, next) => {
  let chatbot = await ChatBot.findOne({ _id: req.params.id, author: {_id: req.user._id}})
  if(!chatbot && req.user.name === 'admin') chatbot = await ChatBot.findOne({ _id: req.params.id})
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