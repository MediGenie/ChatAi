import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchUserChatBots, fetchChatBots } from '../../store/chatbots';
import { logout } from '../../store/session';
import { createChat } from "../../store/chat";
import {Link , useHistory} from "react-router-dom";
import { openModal } from '../../store/modal';
import {RiLogoutBoxRLine} from 'react-icons/ri';

function Profile () {
  const dispatch = useDispatch();
  const history = useHistory();
  const currentUser = useSelector(state => state.session.user);
  const chatBots = useSelector(state => state.entities.chatBots.all ?  state.entities.chatBots.all : {}  )
  const userChatBots = useSelector(state => state.entities.chatBots.user);
  const chatted = useSelector(state => state.entities.chatBots?.chatted);
  
  useEffect(() => {
    dispatch(fetchChatBots())
    dispatch(fetchUserChatBots(currentUser._id))
  }, [currentUser, dispatch]);

  const logoutUser = e => {
    e.preventDefault();
    dispatch(logout());
  }

    return (
      <div className='profile-container'>
      
          <h1>You are currently signed in as <strong>{currentUser?.name}</strong> </h1>
          <h1>Your location is <strong>{currentUser?.location}</strong></h1>
          <h1>Your age is <strong>{currentUser?.age}</strong></h1>

      </div>
    );
  }

export default Profile;