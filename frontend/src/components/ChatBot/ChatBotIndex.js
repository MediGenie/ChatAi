import { useEffect } from "react";
import {useDispatch, useSelector} from "react-redux";
import { fetchChatBots } from "../../store/chatbots";
import {Link , useHistory} from "react-router-dom";
import './ChatBotIndex.css'
import { createChat } from "../../store/chat";
import { openModal } from "../../store/modal";

function ChatBotIndex(){
  const dispatch = useDispatch();
  const history = useHistory();
  const chatBots = useSelector(state => Object.values(state.entities.chatBots.all).length !== 0 ?  Object.values(state.entities.chatBots.all) : []  )
  const chatted = useSelector(state => state.entities.chatBots?.chatted )
  useEffect(()=>{
    dispatch(fetchChatBots())
  }, [dispatch])

  const clickHandler = (chatBotId) => (e)=>{
    dispatch(createChat({chatBotId}));
    history.push(`/chatbots/${chatBotId}`)
  } 

  return(
    <>
      {/* <h1>Featured Chatbots</h1> */}
      <div className="chatbots-index-container">
        {chatBots?.map((bot, i)=>{
          return(
            <ul className="chatbots-index-details" key={i}>
              <li title={bot.name}>{bot.name}</li>
              <img src={bot.profileImageUrl} alt={bot.name}/>
              {chatted.includes(bot._id) ? <Link to={`/chatbots/${bot._id}`} id="resume-button">Resume Chat</Link> : <button onClick={clickHandler(bot._id)} id="chat-button"> Start Chat</button>}
            </ul>
          )
        })}
      </div>
      {/* <h1>Recently Chatted With</h1> */}
    </>
  )

  
  

}

export default ChatBotIndex;