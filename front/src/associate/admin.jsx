import React, { useEffect } from 'react'
import Header from './components/header/header'
import Sidebar from './components/sidebar/sidebar'
import OfficialRoutes from './routes/officialRoutes'
import AdminRoutes from './routes/adminRoutes'
import { useNavigate, useLocation } from 'react-router-dom'
import { useToken } from './components/hooks/useToken'

const Admin = () => {
  const { token } = useToken();
  const location = useLocation();

  const isAdminRoute = location.pathname.startsWith('/admin');

  useEffect(() => {
    document.body.style.filter = '';
  }, []);

  return (
    <div>
      <div className={`${token ? 'bg-white' : 'bg-gray-100'} min-h-screen flex flex-col`}>
      <Header/>
      <div className='flex flex-1'>
        <Sidebar/>
        <div className='flex-1 h-full pl-38 pr-10 pt-10 pb-20 overflow-y-auto'>
          { isAdminRoute ? <AdminRoutes/> : <OfficialRoutes/> }
        </div>
      </div>
    </div>
    </div>
    
  )
}

export default Admin;