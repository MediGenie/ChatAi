import { useEffect, useState, useRef } from 'react';
import {useDispatch, useSelector} from "react-redux";
import { fetchChatBot } from "../../store/chatbots";
import { fetchChatResponse, receiveChatRequest, clearChatResponse} from '../../store/chat';
import { useParams } from "react-router-dom/cjs/react-router-dom.min";
import typingGif from "../../assets/typing-text.gif";
import { delay } from "../Util";
import {BiSolidSend} from 'react-icons/bi';
import { BsCloudUpload } from "react-icons/bs";
import {SlOptions} from 'react-icons/sl';
import {TbError404} from 'react-icons/tb';
import io from 'socket.io-client';

function ChatBotShow(){
  
  const dispatch = useDispatch();
  const {chatBotId} = useParams();
  const bot = useSelector(state => state.entities.chatBots?.new ? state.entities.chatBots.new: null  )
  const sessionUser = useSelector(state => state.session?.user);
  const [imageFile, setImageFile] = useState(null);
  const [request, setRequest] = useState('');
  const [response, setResponse] = useState('');
  const fileInputRef = useRef(null);
  const [botLoaded, setBotLoaded] = useState(false);
  const [loadingResponse, setLoadingResponse] = useState(false); //shows message loading gif
  const [loadingChat, setLoadingChat] = useState(false); //disables chat until message finishes
  const [imagePreviewUrl, setImagePreviewUrl] = useState(null);
  const [showMenu, setShowMenu] = useState(false);
  const [messages, setMessages] = useState([]);
  
  const [audioQueue, setAudioQueue] = useState([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioPlayerRef = useRef(null);

  const chat = useSelector(state => Object.keys(state.entities.chats).length === 0 ? {} : state.entities.chats.current);
  const newResponse = useSelector(state => state.entities.chats?.new);

  const chatEndRef = useRef(null);
  const socket = io('http://meverse.kr:5001');
    
 
  const scrollToBottomChat = ()=>{
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const triggerFileInput = () => {
    fileInputRef.current.click();
  };

  const handleImageUploadClick = (e) => {
    e.preventDefault();
    fileInputRef.current.click();
  };
   
  const handleImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
  
      const resizeImage = (file, maxWidth, maxHeight, callback) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const img = new Image();
          img.onload = () => {
            let width = img.width;
            let height = img.height;
  
            if (width > height) {
              if (width > maxWidth) {
                height *= maxWidth / width;
                width = maxWidth;
              }
            } else {
              if (height > maxHeight) {
                width *= maxHeight / height;
                height = maxHeight;
              }
            }
  
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);
            const resizedDataUrl = canvas.toDataURL(file.type);
            callback(resizedDataUrl);
          };
          img.src = e.target.result;
        };
        reader.readAsDataURL(file);
      };
  
      if (file.size > 548576) { // if image is larger than 1MB
        resizeImage(file, 512, 512, (resizedBase64) => {
          setImageFile(resizedBase64.replace('data:', '').replace(/^.+,/, ''));
          setImagePreviewUrl(resizedBase64); // Set resized image for preview
          console.log('Resized image:', resizedBase64); // Log resized image data
        });
      } else {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64String = reader.result.replace('data:', '').replace(/^.+,/, '');
          setImageFile(base64String);
          setImagePreviewUrl(reader.result); // Set image preview URL
          console.log('Image file base64:', base64String); // Log base64 image data
        };
        reader.readAsDataURL(file);
      }
      console.log('Image file:', file); // Log file details
    }
  };
  

  const clearImagePreview = () => {
    setImagePreviewUrl(null);
    setImageFile(null);
  };

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
    socket.on(`${sessionUser?.name}`, (message) => {
      console.log('Received message:', message);
      if (message.audio) {
        console.log('Received audio message:', message.audio);
        handleIncomingAudio(message);
      }
      // Optionally handle text messages if needed
    });
  
    return () => {
      socket.off('connect');
      socket.off('error');
      socket.off(`${sessionUser?.name}`);
      socket.disconnect();
    };
  }, [sessionUser?.name]);


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

  useEffect(() => {
    // Query all user message elements
    const userMessages = document.querySelectorAll('.user-message-selector');
    // Apply the new class to each user message element
    userMessages.forEach(el => {
      el.classList.add('user-show-message-detail');
    });
  }, []);

  useEffect(() => {
    scrollToBottomChat();
  }, [chat?.messages]); // Assuming 'chat?.messages' holds the array of messages

  
  useEffect(()=>{
    setTimeout(scrollToBottomChat, 500) //had to add a delay so typing gif has time to load before the scroll occurs
  }, [loadingChat])
  
  const handleChange = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault(); // Prevent the default action to stop from submitting the form
      handleSubmit(e); // Call the submit function
    } else {
      console.log('Text input changed:', e.target.value); // Log text input change
      setRequest(e.target.value);
    }
    document.querySelector(".show-chat-form-input").scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    setRequest(""); // Clear the input field immediately
    setLoadingChat(true);
    setLoadingResponse(true);
  
    const formData = new FormData();
    if (request.trim()) {
      formData.append('text', request.trim());
    }
    if (imageFile) {
      formData.append('image', imageFile);
    }
    setImagePreviewUrl(null); // Clear image preview
  
    try {
      await dispatch(fetchChatResponse(chat._id, formData)).then(() => {
        setLoadingResponse(false);
        setImageFile(null);
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingChat(false);
    }
  };


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
              {/* {bot?.email.name && <h1 className="chat-header">Chat with {bot?.name}{bot?.email.name !== 'admin' ? ` (@${bot?.email.name})`: null}</h1>} */}
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
                  {chat?.messages_images?.map((mess, i)=>{
                    
                    return (
                      <div key={i}>
                        {mess.role === 'assistant' 
                          ? <div className='chatbot-show-message-detail'> 
                              <img className='chatbot-show-img-small' src={bot?.profileImageUrl} alt={bot?.name} />
                              <h1>{bot?.name}</h1>
                            </div>
                          : <div className='chatbot-show-message-detail'> 
                              <img className='chatbot-show-img-small' src={sessionUser?.profileImageUrl} alt={sessionUser?.name} />
                              <h1>{sessionUser?.name}</h1>
                            </div>
                        }
                        {mess.content.split('\n').map((message, j) => {
                          return <h2 key={j}>{message}</h2>
                        })}
                  
                        {/* Render the base64 image if it exists in the message */}
                        {mess.image && (
                          <div className="chat-message-image-container-chat">
                            <img src={`data:image/jpeg;base64,${mess.image}`} alt="Chat Message" className="chat-message-image"/>
                          </div>
                        )}
                      </div>
                    );
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
        <div className="chatbot-show-message-form-container">
        <div className="input-with-image-preview">
          {imagePreviewUrl && (
            <div className="image-preview-inside-input">
              <img src={imagePreviewUrl} alt="Preview" />
              <button onClick={clearImagePreview} className="cancel-image-preview-button">×</button>
            </div>
          )}
         <input 
  type='text' 
  className="show-chat-form-input" 
  onChange={handleChange} 
  onKeyDown={handleChange} // Add this line
  value={request} 
  placeholder={`Send a message to ${bot?.name}`}
/>
        </div>
        <button 
          type="button"
          className="chat-form-button-image" 
          onClick={triggerFileInput}
          disabled={loadingChat}
        >
          <BsCloudUpload />
        </button>
        <button 
          type="submit"
          className="chat-form-button" 
          disabled={loadingChat}
        >
          <BiSolidSend />
        </button>
        <input
          type="file"
          onChange={handleImageChange}
          accept="image/*"
          style={{ display: 'none' }}
          ref={fileInputRef}
        />
      </div>
        </form>
        
      </div>}
      {showMenu && popup()}
    </>
  )

}

export default ChatBotShow;