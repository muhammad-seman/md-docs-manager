// GitHub OAuth Configuration
// IMPORTANT: Update this with your GitHub OAuth App credentials
const OAUTH_CONFIG = {
    // Get these from: https://github.com/settings/developers
    // Create new OAuth App with:
    // - Homepage URL: https://muhammad-seman.github.io/md-docs-manager/
    // - Authorization callback URL: https://muhammad-seman.github.io/md-docs-manager/

    clientId: 'YOUR_GITHUB_OAUTH_CLIENT_ID', // Replace with your Client ID
    redirectUri: window.location.origin + window.location.pathname.replace(/\/$/,''),
    scope: 'repo',

    // Security: Use state parameter to prevent CSRF attacks
    generateState: function() {
        return Array.from(crypto.getRandomValues(new Uint8Array(16)))
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');
    }
};

// Export for use in app.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = OAUTH_CONFIG;
}
