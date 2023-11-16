const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const chatBotSchema = Schema({
  author: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  name: {
    type: String,
    required: true
  },
  profileImageUrl: {
    type: String,
    required: false
  },
  systemprompt: {
    type: String,
    required: false
  },  
  elevenlabs: {
    type: String,
    required: false
  },
  context: {
    type: String,
    required: false
  }
}, {
  timestamps: true
});


module.exports = mongoose.model('ChatBot', chatBotSchema);