import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { hasValidToken } from '../utils/authUtils';

const ProtectedRoute = ({ requiredRole }) => {
    const location = useLocation();
    const isValid = hasValidToken();
    const userRole = localStorage.getItem('userRole');

    if (!isValid && location.pathname !== '/official/login') {
        return <Navigate to="/official/login" replace />;
    }
    
    if(requiredRole && userRole !== requiredRole) {
        return <Navigate to='/official' replace />
    }

    return <Outlet />;
};

export default ProtectedRoute;