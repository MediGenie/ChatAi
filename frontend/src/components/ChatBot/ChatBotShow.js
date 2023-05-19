import { useEffect, useState, useRef } from "react";
import {useDispatch, useSelector} from "react-redux";
import { fetchChatBot } from "../../store/chatbots";
import { fetchChatResponse, receiveChatRequest} from '../../store/chat';
import { fetchPrompts, clearPrompts } from "../../store/prompts";
import {Link} from "react-router-dom";
import './ChatBotShow.scss'
import { useParams } from "react-router-dom/cjs/react-router-dom.min";
import typingGif from "../../assets/typing-text.gif";
import { delay } from "../Util";
import { openModal } from "../../store/modal";


function ChatBotShow(){
  
  const dispatch = useDispatch();
  const {chatBotId} = useParams();
  const bot = useSelector(state => state.entities.chatBots?.new ? state.entities.chatBots.new: null  )
  const sessionUser = useSelector(state => state.session?.user);

  const [request, setRequest] = useState('');
  const [response, setResponse] = useState('');
  const [loadingChat, setLoadingChat] = useState(false);
  const [loadingPrompts, setLoadingPrompts] = useState(false);

  const chat = useSelector(state => Object.keys(state.entities.chats).length === 0 ? {} : state.entities.chats.current);
  const newResponse = useSelector(state => state.entities.chats?.new);
  const prompts = useSelector(state => state.ui.prompts.response?.content.split('\n'));
  const chatEndRef = useRef(null);
  
  const scrollToBottomChat = ()=>{
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(()=>{
    dispatch(clearPrompts())
    dispatch(fetchChatBot(chatBotId))
  }, [dispatch, chatBotId])

  const generatePrompts = e => {  
    e.preventDefault();
    setLoadingPrompts(true);
    dispatch(clearPrompts());
    dispatch(fetchPrompts(chatBotId)).then(()=>setLoadingPrompts(false));
  }

  
  useEffect(()=>{
    if(newResponse){
      delayTypeResponse();
    }
  }, [newResponse]);
  

  const delayTypeResponse = async() => {
    // let lastChat = chat.messages[chat?.messages.length - 1]?.content.split('');
    let newChat = newResponse?.content.split('');
    for (let i = 0; i < newChat?.length; i++) {
      await delay(30)
      setResponse(newChat.slice(0,i+1).join(''))
    }
    
  }
  
  useEffect(()=>{
    scrollToBottomChat();
  }, [chat, response])
  
  const handleChange = (e) => {
    setRequest(e.target.value);
  }
  
  const handlePromptClick = (e) => {
    e.preventDefault();
    if(!loadingChat){
      try {
        const prompt = e.target.innerText;
        dispatch(receiveChatRequest(prompt));
        setResponse("");
        setLoadingChat(true);
        dispatch(fetchChatResponse(chat._id, {role: 'user', content: prompt })).then(()=>setLoadingChat(false));
      } catch (err) {
        console.log(err)
      }

    }
  }
  const handleSubmit = async(e)=>{
    e.preventDefault();
    try {
      dispatch(receiveChatRequest(request))
      setRequest("");
      setResponse("");
      setLoadingChat(true);
      dispatch(fetchChatResponse(chat._id, {role: 'user', content: request })).then(()=>setLoadingChat(false));
    } catch (err) {
      console.log(err)
    }

  }


  return(
    <div className="chatbot-show-container">
        
          <ul className="chatbot-show-details">
            <div className="chatbot-show-profile">
              <img className='chatbot-show-img' src={bot?.profileImageUrl} alt={bot?.name} />
              <li>{bot?.name}</li>
              
            </div>
            <div className='chatbot-show-box'>
              <ul>
                {chat?.messages?.map((mess, i)=>{
                   
                  return(
                    <div key={i}>
                      <h1 >{mess.role === 'assistant' ? bot?.name : 'You'}</h1>
                      <h2>{mess.content}</h2>
                    </div>
                  ) 
                })}
                <div>
                  {response && <h1>{bot?.name}</h1>}
                  { response && <h2>{response}</h2> }
                </div>
                {loadingChat ? <img className='typing' src={typingGif} alt='gif'/> : null}
                <div ref={chatEndRef} />
              </ul>
            </div>
          </ul>
          <div className="show-chat-right-panel">
            <form onSubmit={handleSubmit}>
              <h1>Talk to {bot?.name}:</h1>
              <input onChange={handleChange} value={request}/>
              <input type='submit' value="Send" disabled={loadingChat}/>
            </form>
            {/* <h1>Prompt Suggestions:</h1> */}
            <ul className="prompt-suggestions" onClick={handlePromptClick}>
              {loadingPrompts ? <h1>Loading...</h1> : null}
              {prompts?.map((prompt, i)=>{
                const modified = typeof parseInt(prompt[0]) === 'number' ? prompt.slice(3) : prompt.slice(0,2) === '- ' ? prompt.slice(1) : prompt[0] === '-' ? prompt.slice(1) : prompt;
                return(
                  <li key={i}>{modified}</li>
                )
              })}
            </ul>
            <button disabled={loadingPrompts} onClick={generatePrompts}>Generate Prompts</button>
            <button onClick={()=> dispatch(openModal({name: 'clear history', fnc: setResponse}))}>Clear Chat History</button>
            { bot?.author?._id.toString() === sessionUser?._id.toString() ? <button onClick={()=> dispatch(openModal({name:'edit'}))}>Edit Bot</button> : null}
            { bot?.author?._id.toString() === sessionUser?._id.toString() ? <button onClick={()=> dispatch(openModal({name:'delete'}))}>Delete Bot</button> : null}
            <button onClick={()=> dispatch(openModal({name: 'clone'}))}>Clone Bot</button>
            <Link to='/chatbots/'>Back to ChatBot Index</Link>
          </div>
             
    </div>
  )

}

export default ChatBotShow;