router.patch('/:id', requireUser, async (req, res) => {
    try {
      const chat = await Chat.findOne({ _id: req.params.id, author: {_id: req.user._id}})
                          .populate("chatBot", "_id name");
      const chatBot = await ChatBot.findOne({_id: chat.chatBot._id});
  
      // Get AI response
      const textResponse = await getAiResponse(chatBot, chat, req.body.chatRequest, req.user);
      chat.messages = [...chat.messages, req.body.chatRequest, textResponse];
      const updatedChat = await chat.save();
  
      // Send updated chat back to client
      res.json(updatedChat);
  
      // Start audio conversion asynchronously
      convertTextToSpeech(textResponse)
        .then(audioBuffer => {
          // Handle the audio buffer (e.g., save to storage, notify user, etc.)
          // Note: This part of the code will execute independently
        })
        .catch(err => {
          console.error('Error in audio conversion:', err);
          // Handle any errors that occur in the audio conversion process
        });
  
    } catch(err) {
      console.error(err);
      return res.status(500).json({ message: 'Could not return that request' });
    }
  });
  
  async function convertTextToSpeech(text) {
    // Implement the logic to convert text to speech
    // This function should return a promise
  }
  