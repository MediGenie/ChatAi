import { combineReducers } from 'redux';
import { sessionErrorsReducer } from './session';
import { chatErrorsReducer } from './chat';
import { chatBotErrorsReducer } from './chatbots';



export default combineReducers({
  session: sessionErrorsReducer,
  chat: chatErrorsReducer,
  chatBot: chatBotErrorsReducer,

});