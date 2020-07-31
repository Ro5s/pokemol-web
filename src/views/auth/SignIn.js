import React, { useContext, useState } from 'react';
import {  withRouter } from 'react-router-dom';

import {
  CurrentUserContext,
  DaoDataContext,
} from '../../contexts/Store';

import { ButtonPrimary, FormContainer } from '../../App.styles.js';
import { Web3SignIn } from '../../components/account/Web3SignIn';

const signinTypes = {
  web3: 'Web3',
  password: 'Password',
};

const SignIn = ({ history }) => {
  const [daoData] = useContext(DaoDataContext);
  const [, setCurrentUser] = useContext(CurrentUserContext);

  const [signinType, setSigninType] = useState(null);
  const historyState = history.location.state;

  return (
    <FormContainer>
      {historyState && historyState.msg && (
        <div className="EmailConfirmed">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
          >
            <path fill="none" d="M0 0h24v24H0V0z" />
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm4.59-12.42L10 14.17l-2.59-2.58L6 13l4 4 8-8z" />
          </svg>{' '}
          {historyState.msg}
        </div>
      )}

      <h2>Sign in</h2>
      {signinType !== signinTypes.password && (
        <>
          <Web3SignIn history={history} setCurrentUser={setCurrentUser} />

          {+daoData.version !== 2 ? (
            <ButtonPrimary onClick={() => setSigninType(signinTypes.password)}>
              Sign in With Password
            </ButtonPrimary>
          ) : null}
        </>
      )}

    </FormContainer>
  );
};
export default withRouter(SignIn);
