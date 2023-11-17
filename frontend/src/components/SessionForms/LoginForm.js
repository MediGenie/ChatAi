import { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useHistory } from 'react-router-dom';
import { delay } from '../Util';
import { useQuery } from '../Routes/Routes';
import { login, clearSessionErrors } from '../../store/session';
import { Link } from 'react-router-dom';

function LoginForm () {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const errors = useSelector(state => state.errors.session);
  const isLoggedIn = useSelector(state => !!state.session.user); // Moved to top level
  const dispatch = useDispatch();
  const history = useHistory();
  const { query } = useQuery();
  const redirectPath = query.get('redirect');
  const signupUrlWithRedirect = redirectPath ? `/signup?redirect=${redirectPath}` : '/signup';

  useEffect(() => {
    if (isLoggedIn) {
      history.push(redirectPath || '/defaultRedirectPath');
    }
  }, [isLoggedIn, history, redirectPath]);

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
        <input type="submit" value="Log In" disabled={!email || !password} />
        <Link to={signupUrlWithRedirect}>Don't have an account? Sign up</Link>
      </form>
    </div>
  );
}

export default LoginForm;