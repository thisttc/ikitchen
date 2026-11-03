import React, { useEffect, useState } from 'react'
import { IoHome, IoSettingsOutline } from "react-icons/io5";
import { BsPostcard } from "react-icons/bs";
import { LuImagePlus } from "react-icons/lu";
import { MdOutlinePending } from "react-icons/md";
import { useLocation, useNavigate } from 'react-router-dom';
import { LuFolderCog } from "react-icons/lu";
import { LuCalendar } from "react-icons/lu";
import { FaUsers } from "react-icons/fa";

const Sidebar = () => {

  const location = useLocation();
  const navigate = useNavigate();
  const [activeLink, setActiveLink] = useState('/');
  const userRole = localStorage.getItem('userRole');
  const isAdmin = userRole === 'admin';

  const getActivePath = (paths) => {
    return paths.some(path => location.pathname.startsWith(path));
  };
  
  const handleLinkClick = (link) => {
    navigate(link);
  }

  useEffect(() => {
    setActiveLink(location.pathname);
  }, [location.pathname]);

  return (
    <div className='w-28 h-screen bg-white fixed shadow-[4px_0_6px_-1px_rgba(0,0,0,0.1)] overflow-y-auto'>
      <ul className=''>
        <li className={activeLink === '/official' || activeLink === '/admin' ? 'bg-sea-serenade flex flex-col items-center justify-center h-20 text-white' : 'flex flex-col items-center justify-center h-20 text-black cursor-pointer hover:bg-gray-100/70'} onClick={() => handleLinkClick(isAdmin ? '/admin' : '/official')}>
          <IoHome className='mb-1' size={20} /><span>หน้าแรก</span>
        </li>
        <li className={activeLink.startsWith('/official/users') || activeLink.startsWith('/admin/users') ? 'bg-deep-cyan-blue flex flex-col items-center justify-center h-20 text-white' : 'flex flex-col items-center justify-center h-20 text-black cursor-pointer hover:bg-gray-100/70'} onClick={() => handleLinkClick(isAdmin ? '/admin/users' : '/official/users')}>
          <FaUsers className='mb-1' size={20} /><span>จัดการผู้ใช้งาน</span>
        </li>
        <li className={activeLink.startsWith('/official/blog') || activeLink.startsWith('/admin/blog') ? 'bg-peacock-green flex flex-col items-center justify-center h-20 text-white' : 'flex flex-col items-center justify-center h-20 text-black cursor-pointer hover:bg-gray-100/70'} onClick={() => handleLinkClick(isAdmin ? '/admin/blog' : '/official/blog')}>
          <BsPostcard className='mb-1' size={20} /><span>กระดานบันทึก</span>
        </li>
        <li className={activeLink.startsWith('/official/addblog') || activeLink.startsWith('/admin/addBlog') ? 'bg-sea-nymph flex flex-col items-center justify-center h-20 text-white' : 'flex flex-col items-center justify-center h-20 text-black cursor-pointer hover:bg-gray-100/70'} onClick={() => handleLinkClick(isAdmin ? '/admin/addBlog' : '/official/addblog')}>
          <LuImagePlus className='mb-1' size={20} /><span className='text-xs'>เพิ่มการะดานบันทึก</span>
        </li>
        <li className={activeLink.startsWith('/official/pending') || activeLink.startsWith('/admin/pending') ? 'bg-light-sage-green flex flex-col items-center justify-center h-20 text-white' : 'flex flex-col items-center justify-center h-20 text-black cursor-pointer hover:bg-gray-100/70'} onClick={() => handleLinkClick(isAdmin ? '/admin/pending' : '/official/pending')}>
          <MdOutlinePending className='mb-1' size={20} /><span>รอเผยแพร่</span>
        </li>
        {isAdmin && (
          <li className={activeLink.startsWith('/admin/settings') ? 'bg-sea-nymph flex flex-col items-center justify-center h-20 text-white' : 'flex flex-col items-center justify-center h-20 text-black cursor-pointer hover:bg-gray-100/70'} onClick={() => handleLinkClick('/admin/settings')}>
            <IoSettingsOutline className='mb-1' size={20} /><span>ตั้งค่า</span>
          </li>
        )}
      </ul>
    </div>
  )
}

export default Sidebar