// Single source of truth for the backend base URL.
//
// VITE_API_URL is the only thing a deployment should set. It is inlined by Vite
// at BUILD time, so changing it requires a rebuild, not just a restart.
//
// There is deliberately NO production fallback host. The previous default sent
// any production build with a missing VITE_API_URL to a decommissioned Render
// instance — a build that looked completely healthy while talking to the wrong
// server. A misconfigured deploy must fail loudly instead.
const CUSTOM_URL = import.meta.env.VITE_API_URL;

// Dev-only convenience: `VITE_DB_MODE` picks a local backend when no explicit
// URL is set. It has no effect on production builds.
const DB_MODE = import.meta.env.VITE_DB_MODE || 'demo';

const URL_MAP = {
    local: 'http://localhost:2000',
    demo: 'http://localhost:2000',
};

function resolveApiUrl() {
    if (CUSTOM_URL) return CUSTOM_URL;

    if (import.meta.env.PROD) {
        throw new Error(
            'VITE_API_URL is not set. Production builds must define it at build time — ' +
            'there is no default backend host.'
        );
    }

    return URL_MAP[DB_MODE] || 'http://localhost:2000';
}

export const API_URL = resolveApiUrl();

export default API_URL;
