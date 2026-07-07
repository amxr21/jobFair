// Default by build type: a production bundle (Vercel) must never silently
// point at localhost — only dev builds fall back to the local backend.
const DB_MODE =
    import.meta.env.VITE_DB_MODE || (import.meta.env.PROD ? 'production' : 'demo');
const CUSTOM_URL = import.meta.env.VITE_API_URL;

const URL_MAP = {
    production: 'https://jobfair-7zaa.onrender.com',
    local: 'http://localhost:2000',
    demo: 'http://localhost:2000',
};

export const API_URL = CUSTOM_URL || URL_MAP[DB_MODE] || 'http://localhost:2000';

export default API_URL;
