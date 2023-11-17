import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {createChatBot, fetchChatBot, updateChatBot} from '../../store/chatbots';
import {createChat} from '../../store/chat';
// import { fetchImages, clearImages } from '../../store/images.js';
import { closeModal } from '../../store/modal';
import { useHistory } from 'react-router-dom/cjs/react-router-dom.min';


function ChatBotNew(props){
  const [name, setName] = useState('Default Name');
  const [systemprompt, setSystemPrompt] = useState('Default System Prompt');
  const [elevenlabs, setElevenLabs] = useState('Default Eleven Labs Info');
  const [context, setContext] = useState('Default Context');
  const [image, setImage] = useState(null);
  const [photoUrl, setPhotoUrl] = useState(null);
  const errors = useSelector(state => state.errors.session);
  const {form} = props;
  const history = useHistory();
  const dispatch = useDispatch();
  const chatbot = useSelector(state => state.entities.chatBots?.new ? state.entities.chatBots.new : null )
  const modal = useSelector(state => state.ui.modal);

  useEffect(()=>{
    if(modal.chatbotId){ //came from profile page
      dispatch(fetchChatBot(modal.chatbotId))
    }
  }, [dispatch])



  useEffect(()=>{
    if((form === 'edit' || form === 'clone') && chatbot){
      setName(chatbot.name);
      if(chatbot.systemprompt) setSystemPrompt(chatbot.systemprompt);
      if(chatbot.elevenlabs) setElevenLabs(chatbot.elevenlabs);
      if(chatbot.context) setContext(chatbot.context);
    }

  }, [chatbot, form])



  const update = field => {
    let setState;
  
    switch (field) {
      case 'name':
        setState = setName;
        break;
      case 'systemprompt':
        setState = setSystemPrompt;
        break;
      // case 'imagePrompt':
      //   setState = setImagePrompt;
      //   break;
      case 'elevenlabs':
        setState = setElevenLabs;
        break;
      case 'context':
        setState = setContext;
        break;
      default:
        throw Error('Unknown field in Form');
    }
  
    return e => setState(e.currentTarget.value);
  }

  // const generateImage = e => {
  //   e.preventDefault();
  //   setLoadingImage(true);
  //   dispatch(fetchImages({name, prompt, from}, imagePrompt)).then(() => setLoadingImage(false));
  // }

  const handleFile = ({ currentTarget }) => {
    const file = currentTarget.files[0];
    setImage(file);
    if (file) {
      const fileReader = new FileReader();
      fileReader.readAsDataURL(file);
      fileReader.onload = () => setPhotoUrl(fileReader.result);
    }else {
      setPhotoUrl(null);
    }
  }

  const handleClearFile = e => {
    setPhotoUrl(null);
    setImage(null);
    document.getElementsByClassName('picture-input')[0].value = null;

  }

  const chatBotSubmitCleanup = (chatbot) => {
    dispatch(createChat({chatBotId: chatbot?._id})).then(history.push(`/chatbots/${chatbot._id}`));
  }


  const chatBotSubmit = e => {
    e.preventDefault();
    
    const bot = {
      name,
      image,
      systemprompt,
      elevenlabs,
      context
    };

    if(form === 'edit' || form === 'clone'){
      bot._id = chatbot._id;

      let newImage;
      if(image !== null){
        newImage = image;
      }else{
        newImage = chatbot.profileImageUrl
      }
      bot.image = newImage;
    }
    if(form === 'new'){
      dispatch(createChatBot(bot)).then((chatbot)=> chatBotSubmitCleanup(chatbot)); 
    }else if(form === 'clone'){
      dispatch(createChatBot(bot)).then((chatbot)=> chatBotSubmitCleanup(chatbot));
    } else if(form === 'edit'){
      dispatch(updateChatBot(bot)); 
    }
    // dispatch(clearImages());
    dispatch(closeModal());
  }
  

  return (
      <div className="chatbot-form-container">
        <form className="chatbot-form" onSubmit={chatBotSubmit}>
          <h2>{form === 'new' ? 'New Influencer' : form === 'clone' ? 'Chatbot Clone' : 'Edit Chatbot'}</h2>
          <div className="errors">{errors?.name}</div>
          <div className='input-container'>
            <label id={name && 'filled'}>*Influencer Name</label>
            <input type="text"
              value={name}
              onChange={update('name')}
              // placeholder="What is their name?"
            />
          </div>

          <div className="errors">{errors?.elevenlabs}</div>
          <div className='input-container'>
            <label id={elevenlabs && 'filled'}>Eleven Labs</label>
            <textarea
              value={elevenlabs}
              onChange={update('elevenlabs')}
              // placeholder="How does the chatbot perceive itself?"
            />
          </div>
          <div className="errors">{errors?.systemprompt}</div>
          <div className='input-container'>
            <label id={systemprompt && 'filled'}>System Prompt</label>
            <textarea
              value={systemprompt}
              // onInput='this.style.height = "";this.style.height = this.scrollHeight + "px"'
              onChange={update('systemprompt')}
              // style={{overflow: 'hidden'}}
              // placeholder="Details about your chatbot so it acts the way you want."
            />
          </div>
          <div className="errors">{errors?.context}</div>
          <div className='input-container'>
            <label id={context && 'filled'}>Context</label>
            <textarea
              value={context}
              // onInput='this.style.height = "";this.style.height = this.scrollHeight + "px"'
              onChange={update('context')}
              // style={{overflow: 'hidden'}}
              // placeholder="Details about your chatbot so it acts the way you want."
            />
          </div>
          <label>
            <span>Chatbot Image</span>
            <input type="file" accept=".jpg, .jpeg, .png" className='picture-input' onChange={handleFile} />
          </label>
          {photoUrl? <img className='preview' src={photoUrl} alt='preview' /> 
            : form !== 'new' && chatbot?.profileImageUrl ? <img className='preview' src={chatbot?.profileImageUrl} alt='preview' /> 
            : null}
          {image ? <button className='chatbot-img-remove-button' onClick={handleClearFile}>Remove</button>: null}
          <input
            type="submit"
            value={form === 'edit' ? 'Save' : 'Create'}
            disabled={!name || !systemprompt || !elevenlabs}
          />
          </form>

        </div>
    );
}

export default ChatBotNew;






