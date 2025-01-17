import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { signup, clearSessionErrors } from '../../store/session';

function SignupForm () {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [age, setage] = useState('');
  const [location, setlocation] = useState('');
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
  const [image, setImage] = useState(null);
  const [photoUrl, setPhotoUrl] = useState(null);

  const errors = useSelector(state => state.errors.session);
  const dispatch = useDispatch();

  useEffect(() => {
    return () => {
      dispatch(clearSessionErrors());
    };
  }, [dispatch]);

  const update = field => {
    let setState;

    switch (field) {
      case 'email':
        setState = setEmail;
        break;
      case 'username':
        setState = setUsername;
        break;
      case 'password':
        setState = setPassword;
        break;
      case 'password2':
        setState = setPassword2;
        break;
      case 'age':
        setState = setage;
        break;
      case 'location':
        setState = setlocation;
        break;
      default:
        throw Error('Unknown field in Signup Form');
    }

    return e => setState(e.currentTarget.value);
  }

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


  const usernameSubmit = e => {
    e.preventDefault();
    const user = {
      email,
      username,
      age,
      location,
      image,
      password
    };

    dispatch(signup(user)); 
  }

  return (
    <div className="session-form-container">
      <form className="session-form" onSubmit={usernameSubmit}>
        <h2>Sign Up</h2>
        <div className="errors">{errors?.email}</div>
        <label>
          <span>Email</span>
          <input type="text"
            value={email}
            onChange={update('email')}
            placeholder="Email"
          />
        </label>
        <div className="errors">{errors?.age}</div>
        <label>
          <span>Age</span>
          <input type="text"
            value={age}
            onChange={update('age')}
            placeholder="Age"
          />
        </label>
        <div className="errors">{errors?.location}</div>
        <label>
          <span>Location</span>
          <input type="text"
            value={location}
            onChange={update('location')}
            placeholder="Location"
          />  
        </label>
        <div className="errors">{errors?.username}</div>
        <label>
          <span>Username</span>
          <input type="text"
            value={username}
            onChange={update('username')}
            placeholder="Username"
          />
        </label>
        <div className="errors">{errors?.password}</div>
        <label>
          <span>Password</span>
          <input type="password"
            value={password}
            onChange={update('password')}
            placeholder="Password"
          />
        </label>
        <div className="errors">
          {password !== password2 && 'Confirm Password field must match'}
        </div>
        <label>
          <span>Confirm Password</span>
          <input type="password"
            value={password2}
            onChange={update('password2')}
            placeholder="Confirm Password"
          />
        </label>
        <label>
          <span>Profile Image</span>
          <input type="file" accept=".jpg, .jpeg, .png" onChange={handleFile} />
        </label>
        {photoUrl? <img className='preview' src={photoUrl} alt='preview' /> : null}
        <input
          type="submit"
          value="Sign Up"
          disabled={!email || !username || !password || password !== password2}
        />
      </form>

    </div>
  );
}

export default SignupForm;