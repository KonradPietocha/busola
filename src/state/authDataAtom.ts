import { parseOIDCparams } from 'components/Clusters/components/oidc-params';
import { UserManager, User } from 'oidc-client-ts';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { atom, useSetRecoilState, useRecoilValue, RecoilState } from 'recoil';
import { KubeconfigNonOIDCAuth, KubeconfigOIDCAuth } from 'types';
import { clusterState } from './clusterAtom';
import { getPreviousPath } from './useAfterInitHook';
import { openapiLastFetchedState } from 'state/openapi/openapiLastFetchedAtom';

export const hasNonOidcAuth = (
  user?: KubeconfigNonOIDCAuth | KubeconfigOIDCAuth,
) => {
  if (!user) {
    return true;
  }

  // either token or a pair (client CA, client key) is present
  if ('token' in user) {
    return !!user.token;
  } else {
    return (
      'client-certificate-data' in user &&
      !!user['client-certificate-data'] &&
      !!user['client-key-data']
    );
  }
};

export type AuthDataState = KubeconfigNonOIDCAuth | null;

type handleLoginProps = {
  userCredentials: KubeconfigOIDCAuth;
  setAuth: (auth: AuthDataState) => void;
  onAfterLogin: () => void;
  onError: () => void;
};

export function createUserManager(
  oidcParams: {
    issuerUrl: string;
    clientId: string;
    clientSecret: string;
    scopes: string[];
  },
  redirectPath = '',
) {
  const uniqueScopes = new Set(oidcParams.scopes || []);
  uniqueScopes.delete('openid');

  return new UserManager({
    redirect_uri: window.location.origin + redirectPath,
    post_logout_redirect_uri: window.location.origin + '/logout.html',
    loadUserInfo: true,
    client_id: oidcParams.clientId,
    authority: oidcParams.issuerUrl,
    client_secret: oidcParams.clientSecret,
    scope: `openid ${[...uniqueScopes].join(' ')}`,
    response_type: 'code',
    response_mode: 'query',
  });
}

async function handleLogin({
  userCredentials,
  setAuth,
  onAfterLogin,
  onError,
}: handleLoginProps): Promise<void> {
  const setupAuthEventsHooks = (
    userManager: UserManager,
    useAccessToken: boolean,
  ) => {
    userManager.events.addAccessTokenExpiring(async () => {
      const user = await userManager.signinSilent();
      setAuth({
        token: useAccessToken ? user?.access_token! : user?.id_token!,
      });
    });
    userManager.events.addSilentRenewError(e => {
      console.warn('silent renew failed', e);
      setAuth(null);
      onError();
    });
  };

  const setupVisibilityEventsHooks = (
    userManager: UserManager,
    user: User | null,
    useAccessToken: boolean,
  ) => {
    document.addEventListener('visibilitychange', async event => {
      if (document.visibilityState === 'visible') {
        if (!!user?.expired || (user?.expires_in && user?.expires_in <= 2)) {
          user = await userManager.signinSilent();
          setAuth({
            token: useAccessToken ? user?.access_token! : user?.id_token!,
          });
        }
      }
    });
  };

  const oidcParams = parseOIDCparams(userCredentials);
  const userManager = createUserManager(oidcParams);

  const useAccessToken: boolean = oidcParams?.useAccessToken ?? false;

  try {
    const storedUser = await userManager.getUser();
    const user =
      storedUser && !storedUser.expired
        ? storedUser
        : await userManager.signinRedirectCallback(window.location.href);
    setAuth({ token: useAccessToken ? user?.access_token : user?.id_token! });
    setupAuthEventsHooks(userManager, useAccessToken);
    setupVisibilityEventsHooks(userManager, user, useAccessToken);
    onAfterLogin();
  } catch (e) {
    // ignore 'No state in response' error - it means we didn't fire login request yet
    if (e instanceof Error)
      if (!e.message.includes('No state in response')) {
        alert('Login eror: ' + e);
      } else {
        // no response data yet, try to log in
        await userManager.clearStaleState();
        userManager.signinRedirect();
      }
    else {
      throw e;
    }
  }
}

export function useAuthHandler() {
  const cluster = useRecoilValue(clusterState);
  const setAuth = useSetRecoilState(authDataState);
  const navigate = useNavigate();
  const setLastFetched = useSetRecoilState(openapiLastFetchedState);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    console.log(
      'currentCluster reference changed, TODO make sure to deeply compare',
    );

    if (!cluster) {
      setAuth(null);
      setIsLoading(false);
    } else {
      // don't do the auth flow on cluster list (e.g. after refresh, while the OIDC cluster is still connected)
      if (window.location.pathname === '/clusters') {
        setIsLoading(false);
        return;
      }
      const userCredentials = cluster.currentContext?.user?.user;
      if (hasNonOidcAuth(userCredentials)) {
        setAuth(userCredentials as KubeconfigNonOIDCAuth);
        setIsLoading(false);
      } else {
        const onAfterLogin = () => {
          if (!getPreviousPath() || getPreviousPath() === '/clusters') {
            if (cluster.currentContext.namespace) {
              navigate(
                `/cluster/${encodeURIComponent(cluster.name)}/namespaces/${
                  cluster.currentContext.namespace
                }`,
              );
            } else {
              navigate('/cluster/' + encodeURIComponent(cluster.name));
            }
          }
          setIsLoading(false);
        };
        const onError = () => {
          navigate('/clusters');
          setIsLoading(false);
        };

        handleLogin({
          userCredentials: userCredentials as KubeconfigOIDCAuth,
          setAuth,
          onAfterLogin,
          onError,
        });
      }
    }
    setLastFetched(null);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cluster]);

  return { isLoading };
}

export const authDataState: RecoilState<AuthDataState> = atom<AuthDataState>({
  key: 'authDataState',
  default: null,
});
