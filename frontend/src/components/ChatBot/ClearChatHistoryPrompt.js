import { useDispatch, useSelector } from "react-redux";
import { closeModal } from "../../store/modal";
import { deleteChat, createChat } from "../../store/chat";

function ClearChatHistoryPrompt(){
  const dispatch = useDispatch();
  const chatbot = useSelector(state => state.entities.chatBots?.new ? state.entities.chatBots.new : null  )
  const chat = useSelector(state => Object.keys(state.entities.chats).length === 0 ? null : state.entities.chats.current);
  const modal = useSelector(state => state.ui.modal);
  if (!modal) {
    return null;
  }

  const handleClear = e => {
    const setResponse = modal.fnc;
    e.preventDefault();
    setResponse('');
    dispatch(deleteChat(chat?._id))
    // dispatch(createChat({chatBotId: chatbot?._id}))
    dispatch(closeModal())
  }



  return (
    <div className="chatbot-conformation-popup">
      <h1>Are you sure you want to clear this chatbot's history? </h1>
      <br/>
      <h1><strong>It will be gone forever.</strong></h1>
      <div className="chatbot-conformation-popup-buttons">
        <button className='red-button' onClick={handleClear}>Yes</button>
        <button className='green-button' onClick={()=>dispatch(closeModal())}>No</button>
      </div>
    </div>
  )

}



export default ClearChatHistoryPrompt;