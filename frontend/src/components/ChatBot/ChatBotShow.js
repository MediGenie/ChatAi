import { useEffect, useState, useRef } from 'react';
import {useDispatch, useSelector} from "react-redux";
import { fetchChatBot } from "../../store/chatbots";
import { fetchChatResponse, receiveChatRequest, clearChatResponse} from '../../store/chat';
import { useParams } from "react-router-dom/cjs/react-router-dom.min";
import typingGif from "../../assets/typing-text.gif";
import { delay } from "../Util";
import {BiSolidSend} from 'react-icons/bi';
import {SlOptions} from 'react-icons/sl';
import {TbError404} from 'react-icons/tb';
import io from 'socket.io-client';

function ChatBotShow(){
  
  const dispatch = useDispatch();
  const {chatBotId} = useParams();
  const bot = useSelector(state => state.entities.chatBots?.new ? state.entities.chatBots.new: null  )
  const sessionUser = useSelector(state => state.session?.user);

  const [request, setRequest] = useState('');
  const [response, setResponse] = useState('');
  const [botLoaded, setBotLoaded] = useState(false);
  const [loadingResponse, setLoadingResponse] = useState(false); //shows message loading gif
  const [loadingChat, setLoadingChat] = useState(false); //disables chat until message finishes

  const [showMenu, setShowMenu] = useState(false);
  
  const [audioQueue, setAudioQueue] = useState([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioPlayerRef = useRef(null);

  const chat = useSelector(state => Object.keys(state.entities.chats).length === 0 ? {} : state.entities.chats.current);
  const newResponse = useSelector(state => state.entities.chats?.new);

  const chatEndRef = useRef(null);
  const socket = io('http://localhost:5001');
  
  const scrollToBottomChat = ()=>{
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(()=>{

    dispatch(fetchChatBot(chatBotId)).then(()=> setBotLoaded(true));
  }, [dispatch, chatBotId])

  useEffect(()=> { //this fixes bug if chatbot was edited mid conversation it wouldn't show their last response twice
    setResponse('');
    // dispatch(clearChatResponse())
  }, [bot])

  useEffect(() => {
    socket.on('connect', () => {
      console.log('Connected to WebSocket server');
    });

    socket.on('error', (error) => {
      console.error('WebSocket connection error:', error);
    });
    
    // Listen for audio messages
    socket.on(`${sessionUser?.username}`, (message) => {
      console.log('Received message:', message);
      if (message.audio) {
        console.log('Received audio message:', message.audio);
        handleIncomingAudio(message);
      }
      // Optionally handle text messages if needed
    });
  
    return () => socket.on('disconnect', () => {
      console.log('Disconnected from WebSocket server');
    });
  }, [sessionUser?.username]);


  const handleIncomingAudio = async (data) => {
    if (data) {
      setAudioQueue((prevAudioQueue) => [...prevAudioQueue, data.audio]);
    }
  };

  useEffect(() => {
    if (!isPlaying && audioQueue.length > 0) {
      
      const nextAudio = audioQueue[0];
      playAudio(nextAudio); // Play the first audio in the queue
      setAudioQueue(prevQueue => prevQueue.slice(1)); // Remove the played audio
    }
  }, [audioQueue, isPlaying]);

  const playAudio = (base64Data) => {
    setIsPlaying(true);

    const audio = new Audio(`data:audio/mpeg;base64,${base64Data}`);
    audio.onended = () => setIsPlaying(false);
    audio.play();
    audioPlayerRef.current = audio;
  };


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
    setLoadingChat(false)
  }

  useEffect(()=>{
    scrollToBottomChat();
  }, [chat, response])
  
  useEffect(()=>{
    setTimeout(scrollToBottomChat, 500) //had to add a delay so typing gif has time to load before the scroll occurs
  }, [loadingChat])
  
  const handleChange = (e) => {
    setRequest(e.target.value);
  }
  
  const handleSubmit = async(e)=>{
    e.preventDefault();
    try {
      dispatch(receiveChatRequest(request))
      setRequest("");
      setResponse("");
      setLoadingChat(true); //disables user ability to send messages
      setLoadingResponse(true); //brings up the typing message gif
      dispatch(fetchChatResponse(chat._id, {role: 'user', content: request})).then(()=>setLoadingResponse(false));
    } catch (err) {
      console.log(err)
    }

  }

  const popup = ()=>{
    return (
    <div className="show-chat-popup-container">
      <div className="show-chat-popup">
       
          </div>
      </div>
      )
  }

  if(botLoaded && !bot){
    return(
      <div>
          <h1 id='message-404'>The chatbot you are looking for cannot be found.</h1>
            <div id='icon-404' ><TbError404 /></div>
      </div>
    )
  }

  return(
    <>
      <div className="chatbot-show-container">
              {/* <div className="chatbot-show-profile">
                <img className='chatbot-show-img' src={bot?.profileImageUrl} alt={bot?.name} />
                <h1>{bot?.name}</h1>
              </div> */}
            <ul className="chatbot-show-details">
              {/* {bot?.author.username && <h1 className="chat-header">Chat with {bot?.name}{bot?.author.username !== 'admin' ? ` (@${bot?.author.username})`: null}</h1>} */}
              <div className='chatbot-show-box'>
                <ul>
                    {bot?.name && <div>
                      <div className='chatbot-show-message-detail'> 
                        <img className='chatbot-show-img-small' src={bot?.profileImageUrl} alt={bot?.name} />
                        <h1>{bot?.name} </h1>
                      </div>
                      <h2>{bot.name}</h2>
                    </div>
                    }
                  {chat?.messages?.map((mess, i)=>{
                    
                    return(
                      <div key={i}>
                        {mess.role === 'assistant' 
                        ? 
                        <div className='chatbot-show-message-detail'> 
                          <img className='chatbot-show-img-small' src={bot?.profileImageUrl} alt={bot?.name} />
                          <h1>{bot?.name} </h1>
                        </div>
                        : 
                        <div className='chatbot-show-message-detail'> 
                          <img className='chatbot-show-img-small' src={sessionUser?.profileImageUrl} alt={sessionUser?.name} />
                          <h1>{sessionUser?.username} </h1>
                        </div>
                        }
                        {mess.content.split('\n').map((message, i)=>{
                          return <h2 key={i}>{message}</h2>
                        })}
                        
                      </div>
                    ) 
                  })}
                  {response &&<div className="chatbot-show-response">
                     <div className='chatbot-show-message-detail'> 
                          <img className='chatbot-show-img-small' src={bot?.profileImageUrl} alt={bot?.name} />
                          <h1>{bot?.name} </h1>
                        </div>
                    { response && response.split('\n').map((message)=>{
                          return <h2>{message}</h2>
                        }) }
                  </div>}
                  {loadingResponse ? <img className='typing' src={typingGif} alt='gif'/> : null}
                  <div className='ref-div' ref={chatEndRef} />
                </ul>
              </div>
            </ul>
      </div>
      {bot?.name &&<div className='chatbot-show-message-form-container'>
        <form className="show-chat-form" onSubmit={handleSubmit}>
          <input type='text' className="show-chat-form-input" onChange={handleChange} value={request} placeholder={`Send a message to ${bot?.name}`}/>
          <button className='chat-form-button' disabled={loadingChat || !request.length}><BiSolidSend /></button>
        </form>
        <button className='chat-form-button' onClick={()=> showMenu ? setShowMenu(false) : setShowMenu(true)}><SlOptions/></button>
      </div>}
      {showMenu && popup()}
    </>
  )

}

export default ChatBotShow;