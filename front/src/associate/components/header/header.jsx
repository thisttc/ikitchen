import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { GoScreenFull, GoScreenNormal } from "react-icons/go";
import { IoIosNotifications } from "react-icons/io";
import { useToken } from '../hooks/useToken';
import { useTokenExpiration } from '../hooks/tokenExpiration';
import TokenExpirationManager from '../tokenExpiration/tokenexpiation';

const Header = () => {
  const navigate = useNavigate();
  const [isBlurred, setIsBlurred] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [userRole, setUserRole] = useState(null);

  const { token, logout } = useToken();
  const { showCountdown, timeLeft, reset } = useTokenExpiration(5);

  useEffect(() => {
    const role = localStorage.getItem('userRole');
    setUserRole(role);
  }, [token]);

  const handleLogout = () => {
    reset();
    logout();
    navigate('/official/login');
  };

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullScreen(true));
    } else {
      document.exitFullscreen().then(() => setIsFullScreen(false));
    }
  };

  useEffect(() => {
    const handleScroll = () => setIsBlurred(window.scrollY > 1);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="sticky top-0 z-50">
      <div className={`w-full h-16 flex justify-between px-10 items-center transition-all duration-200 shadow-md/5 bg-white`}>
        <div className="flex items-center">
          <p className="text-2xl font-bold">
            <span className="text-light-cyan pr-1">{userRole === 'admin' ? 'ADMIN' : 'USER'}</span>
            <span className="text-morning-mist">{userRole === 'admin' ? 'DASHBOARD' : 'PANEL'}</span>
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div onClick={toggleFullScreen} className="cursor-pointer">
            {isFullScreen ? <GoScreenNormal size={18} /> : <GoScreenFull size={18} />}
          </div>
          <div onClick={token ? handleLogout : () => navigate('/official/login')}>
            {token ? (
              <button className="bg-brandy-rose p-1 rounded-lg text-white cursor-pointer hover:bg-brandy-rose/90">
                ออกจากระบบ
              </button>
            ) : (
              <button className="bg-gray-100 p-1 rounded-lg text-gray-500 cursor-not-allowed">
                ออกจากระบบ
              </button>
            )}
          </div>
        </div>
      </div>
      <TokenExpirationManager showCountdown={showCountdown} timeLeft={timeLeft} />
    </div>
  );
};

export default Header;