// Centralized API configuration
// Change this single value to switch between environments

const API_URLS = {
    production: "https://jobfairform-backend.onrender.com",
    local: "http://localhost:2000"
};

// Use environment variable if set, otherwise default to production
export const API_URL = import.meta.env.VITE_API_URL || API_URLS.production;

export default API_URL;
