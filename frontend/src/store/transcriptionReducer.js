// transcriptionReducer.js

const initialState = {
    data: null, // Initialize data to null
    errors: null, // You can also handle errors if needed
  };
  
  const RECEIVE_TRANSCRIPTION = "transcription/RECEIVE_TRANSCRIPTION";
  const TRANSCRIPTION_ERRORS = "transcription/TRANSCRIPTION_ERRORS";
  
  const transcriptionReducer = (state = initialState, action) => {
    switch (action.type) {
      case RECEIVE_TRANSCRIPTION:
        return { ...state, data: action.transcription, errors: null };
      case TRANSCRIPTION_ERRORS:
        return { ...state, errors: action.errors };
      default:
        return state;
    }
  };
  
  export default transcriptionReducer;