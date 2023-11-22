import { Link } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../../store/session';
import { openModal } from "../../store/modal";
// import gpt from '../../assets/gpt.jpg';
import {FiSearch} from 'react-icons/fi';
import {RiLogoutBoxRLine} from 'react-icons/ri';
import {BsChatRightDots} from 'react-icons/bs';
import {FaHandFist} from 'react-icons/fa6';

function NavBar () {
  const loggedIn = useSelector(state => !!state.session.user);
  const user = useSelector(state => state.session.user)
  const dispatch = useDispatch();
  
  const logoutUser = e => {
      e.preventDefault();
      dispatch(logout());
  }

  const getLinks = () => {
    if (loggedIn) {
      return (
        <div className="links-nav">
          <button onClick={logoutUser} id="logout-button" title='Logout'><RiLogoutBoxRLine /></button>
          {/* Check if the username is "admin" */}
          {user.name === 'admin' && (
            <div id="create-button" className='nav-create-button' title='Create a Chatbot!' onClick={()=>dispatch(openModal({name:'new'}))}>
              <div>+</div>
            </div>
          )}
        </div>
      );
    } else {
      return 
    }
  }

  return (
    <div className='navbar'>
      <div className="nav-left">
        {/* <Link to='/'><img className='logo' src={gpt} alt='logo' /></Link> */}
        <div id='chat-logo-title'>
          <Link to='/' ><h1 id='chat-title'>MeVerse</h1></Link>
        </div>
        
      </div>
      <div className="nav-right">
        { getLinks() }
      </div>
    </div>
  );
}

export default NavBar;