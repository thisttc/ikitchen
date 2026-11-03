import { Routes, Route } from 'react-router-dom'
import App from './visitor/App'
import Admin from './associate/admin'

const MainRoutes = () => {
  return (
    <Routes>
      <Route path='/*' element={<App/>}/>
      <Route path='/associate/*' element={<Admin/>}/>
      <Route path='/admin/*' element={<Admin/>}/>
    </Routes>
  )
}

export default MainRoutes