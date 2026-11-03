import { Routes, Route } from 'react-router-dom'
import Dashboard from '../blogs/dashboard'
import Blog from '../blogs/blog'
import Addblog from '../blogs/addblog'
import Pending from '../blogs/pending'
import Login from '../pages/login'
import EditBlog from '../blogs/editblog'
import ProtectedRoute from '../components/protection/protection'
import UserManagement from '../components/manage/users'
import ThemeSettings from '../components/themeSetting/themeSetting'

const AdminRoutes = () => {
  return (
    <Routes>
      <Route path='/login' element={<Login/>}/>
      <Route element={<ProtectedRoute requiredRole='admin' />}>
        <Route path='/users' element={<UserManagement />} />
        <Route path='/' element={<Dashboard />} />
        <Route path='/blog' element={<Blog />} />
        <Route path='/addblog' element={<Addblog />} />
        <Route path='/pending' element={<Pending />} />
        <Route path='/edit/:id' element={<EditBlog />} />
        <Route path='/settings' element={<ThemeSettings />} />
      </Route>
    </Routes>
  )
}

export default AdminRoutes