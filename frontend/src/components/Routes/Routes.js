import { Route, Redirect, useLocation, useHistory  } from 'react-router-dom';
import { useSelector } from 'react-redux';

export const AuthRoute = ({ component: Component, path, exact }) => {
  const loggedIn = useSelector(state => !!state.session.user);

  return (
    <Route path={path} exact={exact} render={(props) => (
      !loggedIn ? (
        <Component {...props} />
      ) : (
        <Redirect to="/chatbots" />
      )
    )} />
  );
};

export const ProtectedRoute = ({ component: Component, ...rest }) => {
  const loggedIn = useSelector(state => !!state.session.user);
  const location = useLocation();

  return (
    <Route
      {...rest}
      render={props =>
        loggedIn ? (
          <Component {...props} />
        ) : (
          // Redirect to the login page and pass the current path as a query parameter
          <Redirect to={`/login?redirect=${location.pathname}`} />
        )
      }
    />
  );
};

export function useQuery() {
  const location = useLocation();
  const history = useHistory();
  const queryParams = new URLSearchParams(location.search);

  const setQuery = (params) => {
    Object.entries(params).forEach(([key, value]) => {
      if (value != null) {
        queryParams.set(key, value);
      } else {
        queryParams.delete(key);
      }
    });
    history.push({ search: queryParams.toString() });
  };

  return { query: queryParams, setQuery };
}