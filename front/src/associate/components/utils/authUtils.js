export const isTokenValid = (token) => {
    if (!token) return false;
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        if (Date.now() >= payload.exp * 1000) {
            localStorage.removeItem('token');
            return false;
        }
        return true;
    } catch {
        localStorage.removeItem('token');
        return false;
    }
};

export const getValidToken = () => {
    const token = localStorage.getItem('token');
    if (isTokenValid(token)) {
        return token;
    }
    return null;
};

export const setToken = (newToken) => {
    localStorage.setItem('token', newToken);
};

export const removeToken = () => {
    localStorage.removeItem('token');
};

export const hasValidToken = () => {
    return getValidToken() !== null;
};