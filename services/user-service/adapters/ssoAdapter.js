// services/user-service/adapters/ssoAdapter.js
// SSO / Authentication Provider Adapter
// ----------------------------------------------------------
// This adapter provides a clean interface for SSO integration.
// Currently uses a LOCAL MOCK provider.
// Replace with real SSO (Google, Azure AD, Okta, etc.) by
// implementing the same interface against the real provider's SDK.
// ----------------------------------------------------------

/**
 * @typedef {Object} SSOUser
 * @property {string} email
 * @property {string} name
 * @property {string} provider - e.g. 'google', 'azure', 'okta', 'local'
 * @property {string} externalId - Provider-specific user ID
 */

const PROVIDER = process.env.SSO_PROVIDER || 'local';

/**
 * Validate an SSO token / assertion and return user information.
 * In production, this would verify the token with the SSO provider.
 *
 * @param {string} ssoToken - The SSO assertion / token
 * @returns {Promise<SSOUser|null>} - Validated user info or null
 */
const validateSSOToken = async (ssoToken) => {
  if (PROVIDER === 'local') {
    // MOCK: In local mode, we don't actually validate SSO.
    // This is clearly a mock — not pretending to be real.
    console.log('[SSO Adapter] MOCK MODE — no real SSO validation');
    return null;
  }

  // Production: Add real SSO provider validation here
  // Example for Google:
  //   const ticket = await googleClient.verifyIdToken({ idToken: ssoToken });
  //   const payload = ticket.getPayload();
  //   return { email: payload.email, name: payload.name, provider: 'google', externalId: payload.sub };

  // Example for Azure AD:
  //   const decoded = await azureClient.validateToken(ssoToken);
  //   return { email: decoded.email, name: decoded.name, provider: 'azure', externalId: decoded.oid };

  return null;
};

/**
 * Generate SSO login URL for redirecting the user.
 * @returns {string} - The SSO login redirect URL
 */
const getSSOLoginURL = () => {
  if (PROVIDER === 'local') {
    console.log('[SSO Adapter] MOCK MODE — SSO login URL not available');
    return null;
  }

  // Production: Return the real SSO authorization URL
  // return `${process.env.SSO_ISSUER}/authorize?client_id=${process.env.SSO_CLIENT_ID}&redirect_uri=${process.env.SSO_CALLBACK_URL}&response_type=code&scope=openid email profile`;
  return null;
};

/**
 * Handle SSO callback / code exchange.
 * @param {string} code - Authorization code from SSO provider
 * @returns {Promise<SSOUser|null>}
 */
const handleSSOCallback = async (code) => {
  if (PROVIDER === 'local') {
    console.log('[SSO Adapter] MOCK MODE — no real SSO callback handling');
    return null;
  }

  // Production: Exchange code for tokens and extract user info
  return null;
};

module.exports = {
  validateSSOToken,
  getSSOLoginURL,
  handleSSOCallback,
  PROVIDER
};
