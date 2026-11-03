import { useState, useEffect } from 'react';
import { getValidToken, removeToken, setToken, isTokenValid } from '../utils/authUtils';
import Swal from 'sweetalert2';

export const useToken = () => {
    const [token, setTokenState] = useState(getValidToken);
    
    const updateToken = () => {
        console.log('🔔 updateToken called');
        const newToken = getValidToken();
        setTokenState(prev => {
            if (prev !== newToken) {
                console.log('🔄 Token state changed');
            }
            return newToken;
        });
    };
    
    const login = (newToken) => {
        console.log('🔐 login called');
        setToken(newToken);
        setTokenState(newToken);
    };
    
    const logout = () => {
        console.log('🚪 logout called');
        removeToken();
        setTokenState(null);
        // ไม่ต้องปิด Swal อัตโนมัติ ปล่อยให้ component จัดการเอง
    };
    
    useEffect(() => {
        console.log('📌 Setting up token listeners');
        
        const handleStorageChange = () => {
            console.log('📦 storage event detected');
            updateToken();
        };
        
        const handleFocus = () => {
            console.log('👁️ focus event detected');
            updateToken();
        };
        
        window.addEventListener('storage', handleStorageChange);
        window.addEventListener('focus', handleFocus);
        
        const interval = setInterval(() => {
            console.log('⏰ interval checking token');
            updateToken();
        }, 30000);
        
        return () => {
            console.log('🧹 Cleaning up token listeners');
            window.removeEventListener('storage', handleStorageChange);
            window.removeEventListener('focus', handleFocus);
            clearInterval(interval);
        };
    }, []);
    
    return { token, login, logout, updateToken };
};