import jwtFetch from './jwt';

const RECEIVE_TRANSCRIPTION = "transcription/RECEIVE_TRANSCRIPTION";
const TRANSCRIPTION_ERRORS = "transcription/TRANSCRIPTION_ERRORS";

const receiveTranscription = transcription => ({
    type: RECEIVE_TRANSCRIPTION,
    transcription
  });
  
  const transcriptionErrors = errors => ({
    type: TRANSCRIPTION_ERRORS,
    errors
  });

  export const fetchTranscription = (audioFile) => async dispatch => {
    try {
      console.log("Starting transcription fetch with file:", audioFile);
      const formData = new FormData();
      formData.append('audio', audioFile);
  
      console.log("Making POST request to /api/transcription");
      const res = await jwtFetch('/api/transcription', {
        method: 'POST',
        body: formData
      });
  
      if (res.status >= 400) {
        console.error("Response status indicates an error:", res.status);
        throw res;
      }
  
      console.log("Transcription fetch successful, processing response data");
      const data = await res.json();
      console.log("Dispatching receiveTranscription with data:", data);
      dispatch(receiveTranscription(data.transcription));
    } catch (err) {
      console.error("Error in fetchTranscription:", err);
      const resBody = await err.json();
      console.error("Dispatching transcriptionErrors with errors:", resBody.errors);
      dispatch(transcriptionErrors(resBody.errors));
    }
  };
  
  const transcriptionReducer = (state = {}, action) => {
    switch (action.type) {
      case RECEIVE_TRANSCRIPTION:
        console.log("Transcription data received in reducer:", action.transcription);
        return { ...state, data: action.transcription };
      case TRANSCRIPTION_ERRORS:
        console.log("Transcription errors received in reducer:", action.errors);
        return { ...state, errors: action.errors };
      default:
        return state;
    }
  };
  
  export default transcriptionReducer;