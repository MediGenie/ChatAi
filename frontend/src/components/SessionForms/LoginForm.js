import { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {delay} from '../Util';

import { login, clearSessionErrors } from '../../store/session';

function LoginForm () {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const errors = useSelector(state => state.errors.session);
  const dispatch = useDispatch();

  useEffect(() => {
    return () => {
      dispatch(clearSessionErrors());
    };
  }, [dispatch]);

  const update = (field) => {
    const setState = field === 'email' ? setEmail : setPassword;
    return e => setState(e.currentTarget.value);
  }

  const handleSubmit = (e) => {
    e.preventDefault();
    dispatch(login({ email, password })); 
  }


  return (
    <div className='session-form-container'>
      <form className="session-form login" onSubmit={handleSubmit}>
        <h2>Log In</h2>
        <label>
          <span>Email</span>
          <input type="text"
            value={email}
            onChange={update('email')}
            placeholder="Email"
          />
        </label>
        <div className="errors">{errors?.email}</div>
        <label>
          <span>Password</span>
          <input type="password"
            value={password}
            onChange={update('password')}
            placeholder="Password"
          />
        </label>
        <div className="errors">{errors?.password}</div>
        <input
          type="submit"
          value="Log In"
          disabled={!email || !password}
        />
      
      </form>
    </div>
  );
}

export default LoginForm;