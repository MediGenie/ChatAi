import { combineReducers } from 'redux';
import chatBots from './chatbots';
import chats from './chat';
import transcriptionReducer from './transcriptionReducer';

export default combineReducers({
  chatBots,
  chats,
  transcription: transcriptionReducer,
});