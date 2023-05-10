import jwtFetch from './jwt';
import { REMOVE_CHATBOT, RECEIVE_NEW_CHATBOT } from './chatbots';

const RECEIVE_CHAT = "chats/RECEIVE_CHAT";
const REMOVE_CHAT = "chats/REMOVE_CHAT";

const RECEIVE_CHAT_REQUEST = "chats/RECEIVE_CHAT_REQUEST";
const RECEIVE_CHAT_RESPONSE = "chats/RECEIVE_CHAT_RESPONSE";

const RECEIVE_CHAT_ERRORS = "chats/RECEIVE_CHAT_ERRORS";
const CLEAR_CHAT_ERRORS = "chats/CLEAR_CHAT_ERRORS";

const receiveChat = chat => ({
  type: RECEIVE_CHAT,
  chat
});

const removeChat = chatId => ({
  type: REMOVE_CHAT,
  chatId
});

export const receiveChatRequest = (chatRequest) => ({
  type: RECEIVE_CHAT_REQUEST,
  chatRequest
});
const receiveChatResponse = (chatResponse) => ({
  type: RECEIVE_CHAT_RESPONSE,
  chatResponse
});

const receiveErrors = errors => ({
  type: RECEIVE_CHAT_ERRORS,
  errors
});

export const createChat = (chat) => async dispatch => {
  try {
    const res = await jwtFetch('/api/chats/', {
      method: 'POST',
      body: JSON.stringify(chat)
    });
    const data = await res.json();
    dispatch(receiveChat(data));
  } catch(err) {
    const resBody = await err.json();
    if (resBody.statusCode === 400) {
      return dispatch(receiveErrors(resBody.errors));
    }
  }
}

export const deleteChat = (chatId) => async dispatch =>{
  try {
      await jwtFetch(`/api/chats/${chatId}`, {
      method: 'DELETE'
    });
    dispatch(removeChat(chatId));
  } catch(err) {
    const resBody = await err.json();
    if (resBody.statusCode === 400) {
      return dispatch(receiveErrors(resBody.errors));
    }
  }
}

export const fetchChatResponse = (chatRequest)=> async dispatch=> {
  
  try {
    const res = await jwtFetch ('/api/chatbot', {
      method: 'POST',
      body: JSON.stringify({chatRequest})
    });
    const chatResponse = await res.json();
    dispatch(receiveChatResponse(chatResponse));
  } catch (err) {
    const resBody = await err.json();
    if (resBody.statusCode === 400) {
      dispatch(receiveErrors(resBody.errors));
    }
  }
};


const nullErrors = null;

export const chatErrorsReducer = (state = nullErrors, action) => {
  switch(action.type) {
    case RECEIVE_CHAT_ERRORS:
      return action.errors;
    case CLEAR_CHAT_ERRORS:
      return nullErrors;
    default:
      return state;
  }
};

const chatsReducer = (state = [], action) => {
  switch(action.type) {
    // case RECEIVE_CHATS:
    //   return { ...state, all: action.chats, new: undefined};
    case RECEIVE_NEW_CHATBOT:
      return action.payload.chat
    case REMOVE_CHATBOT:
      return [];
    case REMOVE_CHAT:
      return [];
    case RECEIVE_CHAT_REQUEST:
      return [...state, {role: 'user', content: action.chatRequest}]
    case RECEIVE_CHAT_RESPONSE:
      return [...state, {role:'assistant', content: action.chatResponse}]
    default:
      return state;
  }
};

export default chatsReducer;