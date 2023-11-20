import { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useHistory, useLocation } from 'react-router-dom';
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
  console.log("Redirect Path:", redirectPath);  
  const signupUrlWithRedirect = redirectPath ? `/signup?redirect=${redirectPath}` : '/signup';
  const location = useLocation();

  useEffect(() => {
    console.log("Checking redirect: ", isLoggedIn, redirectPath);
    if (isLoggedIn) {
      history.push(redirectPath || '/chatbots');
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
    const redirectUrl = query.get('redirect') || '/defaultRedirectPath';
    dispatch(login({ email, password }, redirectUrl)); // Or dispatch(signup(...)) for SignupForm
  };

  return (
    <div className='session-form-container'>
      <form className="session-form login" onSubmit={handleSubmit}>
        <h2>로그인</h2>
        <label>
          <span>이메일</span>
          <input type="text"
            value={email}
            onChange={update('email')}
            placeholder="Email"
          />
        </label>
        <div className="errors">{errors?.email}</div>
        <label>
          <span>비밀번호</span>
          <input type="password"
            value={password}
            onChange={update('password')}
            placeholder="Password"
          />
        </label>
        <div className="errors">{errors?.password}</div>
        <input type="submit" value="로그인" disabled={!email || !password} />
        <Link to={redirectPath ? `/signup?redirect=${redirectPath}` : '/signup'}>
          가입 안하셨으면 가입하세요!
        </Link>
      </form>
    </div>
  );
}

export default LoginForm;