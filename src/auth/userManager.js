import { UserManager } from 'oidc-client-ts';

const cognitoAuthConfig = {
  authority: import.meta.env.VITE_COGNITO_AUTHORITY,
  client_id: import.meta.env.VITE_COGNITO_CLIENT_ID,
  redirect_uri: import.meta.env.VITE_REDIRECT_URI,
  response_type: 'code',
  scope: 'email openid',
};

export const userManager = new UserManager(cognitoAuthConfig);

export async function signOutRedirect() {
  const clientId = import.meta.env.VITE_COGNITO_CLIENT_ID;
  const logoutUri = import.meta.env.VITE_LOGOUT_URI;
  const cognitoDomain = import.meta.env.VITE_COGNITO_DOMAIN;
  await userManager.removeUser();
  window.location.href = `${cognitoDomain}/logout?client_id=${clientId}&logout_uri=${encodeURIComponent(logoutUri)}`;
}
