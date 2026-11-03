import { IoHome } from "react-icons/io5";
import { FaRegEdit } from "react-icons/fa";
import { MdDeleteForever } from "react-icons/md";
import { useState, useEffect } from "react";
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import ShowOnWebsiteToggle from "../components/showOnWebsite/showOnWebsite";

export default function Blog() {

    const navigate = useNavigate();
    const [pendingPosts, setPendingPosts] = useState([]);
    const [userRole, setUserRole] = useState(null);

    const getToken = () => localStorage.getItem('token');

    useEffect(() => {
        const role = localStorage.getItem('userRole');
        setUserRole(role);
    }, []);

    const fetchDraftBlogs = async () => {
        const token = getToken();
        if(!token) {
            Swal.fire({
                icon: 'warning',
                title: 'เซสซันหมดอายุ',
                text: 'กรุณาเข้าสู่ระบบก่อน',
                confirmButtonColor: '#6AAFBD',
                confirmButtonText: 'เข้าใจแล้ว'
            }).then(() => {
                navigate('/official/login');
            });
            return;
        }
        
        try {
            const isAdmin = userRole === 'admin';
            const url = isAdmin
                ? 'http://localhost:5000/blog'
                : 'http://localhost:5000/blog/my';

            const res = await fetch(url, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if(res.ok) {
                const allBlogs = await res.json();
                const draftBlogs = allBlogs.filter(blog => blog.status === 'published');
                const sortedBlogs = draftBlogs.sort((a, b) =>
                    new Date(b.updatedAt) - new Date(a.updatedAt)
                );
                setPendingPosts(draftBlogs);
                setCurrentPage(1);
            } else if (res.status === 401) {
                Swal.fire({
                    icon: 'warning',
                    title: 'เซสซันหมดอายุ',
                    text: 'กรุณาเข้าสู่ระบบก่อน',
                    confirmButtonColor: '#6AAFBD',
                    confirmButtonText: 'เข้าใจแล้ว'
                }).then(() => {
                    localStorage.removeItem('token');
                    navigate('/official/login');
                });
            } else {
                throw new Error('เกิดข้อผิดพลาดในการโหลดข้อมูล');
            }
        } catch (err) {
            console.error('Error fetching draft blogs:', err);
            Swal.fire({
                icon: 'error',
                title: 'เกิดข้อผิดพลาดในการโหลดข้อมูล',
                text: err.message,
                confirmButtonColor: '#6AAFBD',
                confirmButtonText: 'เข้าใจแล้ว'
            })
        }
    };

    useEffect(() => {
        if(userRole !== null) {
            fetchDraftBlogs();
        }
    }, [userRole]);

    const handleDelete = async (id) => {
        const result = await Swal.fire({
            icon: 'question',
            text: 'คุณต้องการลบกระดานบันทึกนี้ใช่หรือไม่',
            showCancelButton: true,
            confirmButtonColor: '#BF806E',
            confirmButtonText: 'ลบทิ้ง',
            cancelButtonColor: '#C8D88C',
            cancelButtonText:'ยกเลิก'
        });

        if(result.isConfirmed) {
            const token = getToken();
            try {
                const res = await fetch(`http://localhost:5000/blog/${id}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if(res.ok) {
                    Swal.fire({
                        icon: 'success',
                        title: 'ลบสำเร็จ',
                        timer: 1500,
                        showConfirmButton: false
                    });

                    fetchDraftBlogs();
                } else {
                    throw new Error('ลบข้อมูลไม่สำเร็จ');
                }
            } catch (err) {
                console.error('Delete error:', err);
                Swal.fire({
                    icon: 'error',
                    title: 'ลบไม่สำเร็จ',
                    text: err.message,
                    confirmButtonColor: '#6AAFBD',
                    confirmButtonText: 'เข้าใจแล้ว'
                });
            }
        }
    };

    const handleEdit = (id) => {
        const isAdmin = userRole === 'admin';
        const basePath = isAdmin ? '/admin' : '/official';
        navigate(`${basePath}/edit/${id}`);
    }

    useEffect(() => {
        const sortedBlogs = [...pendingPosts].sort((a, b) =>
            new Date(b.updatedAt) - new Date(a.updatedAt)
        );
        if(JSON.stringify(sortedBlogs) !== JSON.stringify(pendingPosts)) {
            setPendingPosts(sortedBlogs);
        }
    }, [pendingPosts]);

    const [currentPage, setCurrentPage] = useState(1);
    const [perPage] = useState(20);

    const indexOfLastblog = currentPage * perPage;
    const indexOfFirstblog = indexOfLastblog - perPage;
    const currentBlogs = pendingPosts.slice(indexOfFirstblog, indexOfLastblog);

    const totalPages = Math.ceil(pendingPosts.length / perPage);

    const paginate = (pageNumber) => {
        setCurrentPage(pageNumber)
    }

    const pageNumber = [];
    for(let i = 1; i <= totalPages; i++) {
        pageNumber.push(i);
    }

    const getVisiblePages = () => {
        const maxVisible = 15;
        if(totalPages <= maxVisible) {
            return pageNumber;
        }

        let start = Math.max(currentPage - Math.floor(maxVisible / 2), 1);
        let end = Math.min(start + maxVisible -1, totalPages);

        if(end - start + 1 < maxVisible) {
            start = Math.max(end - maxVisible + 1, 1);
        }

        return pageNumber.slice(start - 1, end);
    };

    const handleToggleWebsite = (id, newValue) => {
        setPendingPosts(prev => prev.map(post =>
            post._id === id ? {...post, showOnWebsite: newValue} : post
        ));
    };

    const isAdmin = userRole === 'admin';
    const colSpan = isAdmin ? 6 : 5;

    return (
        <div className="w-full h-full">
            <div className="flex justify-between items-center mb-10">
                <div className="flex flex-col justify-center">
                    <p className="text-lg">กระดานบันทึกที่เผยแพร่แล้ว</p>
                    <p>Published Blogs</p>
                </div>
                <div className="flex items-center justify-center"><IoHome className="cursor-pointer" size={12}/> <span className="px-2">/</span> <span className="cursor-pointer">กระดานบันทึก</span></div>
            </div>
            <div className="flex flex-col justify-between items-center w-full">
                <table className="w-full">
                    <thead className="bg-gray-100 border-t border-b border-gray-200">
                        <tr>
                            <th className="px-4 py-3 text-left text-md tracking-wider" style={{ width: '5%' }}>#</th>
                            <th className="px-4 py-3 text-left text-md tracking-wider" style={{ width: '30%' }}>หัวข้อ</th>
                            <th className="px-4 py-3 text-left text-md tracking-wider" style={{ width: '25%' }}>ประเภท</th>
                            {isAdmin && (<th className="px-4 py-3 text-left text-md tracking-wider" style={{ width: '15%' }}>ผู้เขียน</th>)}
                            <th className="px-4 py-3 text-center text-md tracking-wider" style={{ width: '10%' }}>แสดงบนหน้าแรก</th>
                            <th className="px-4 py-3 text-center text-md tracking-wider" style={{ width: '15%' }}>แก้ไข / ลบทิ้ง</th>
                        </tr>
                    </thead>
                    <tbody>
                        { currentBlogs.length ===  0 ? (
                            <tr><td colSpan={colSpan} className="px-4 py-8 text-center text-gray-500">ไม่มีกระดานบันทึกที่รอเผยแพร่</td></tr>
                        ) : (
                            currentBlogs.map((post, index) => (
                                <tr key={post._id} className="border-b border-gray-100 hover:bg-gray-50">
                                    <td className="px-4 py-3">{indexOfFirstblog + index + 1}</td>
                                    <td className="px-4 py-4">{post.title}</td>
                                    <td className="px-4 py-3">{post.category}</td>
                                    { isAdmin && (
                                        <td className="px-4 py-3">{post.userId?.name || 'ไม่ระบุ'}</td>
                                    ) }
                                    <td className="px-4 py-3">
                                        <div className="flex items-center justify-center">
                                            <ShowOnWebsiteToggle
                                            blogId={post._id}
                                            initailValue={post.showOnWebsite || false}
                                            onToggle={handleToggleWebsite}
                                        />
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="w-full flex items-center justify-evenly">
                                            <button
                                                onClick={() => handleEdit(post._id)}
                                                title="edit" 
                                                className="flex items-center justify-center px-2 py-1 border border-gray-500 rounded-lg hover:bg-sea-serenade hover:text-white cursor-pointer"
                                            >
                                                <FaRegEdit size={12}/>
                                                <span className="pl-2">แก้ไข</span>
                                            </button>
                                            <button
                                                onClick={() => handleDelete(post._id)}
                                                title="delete" 
                                                className="flex items-center justify-center px-2 py-1 border border-gray-500 rounded-lg hover:bg-brandy-rose hover:text-white cursor-pointer"
                                            >
                                                <MdDeleteForever size={15}/>
                                                <span className="pl-2">ลบทิ้ง</span>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
                { pendingPosts.length === 0 ? (
                    ''
                ) : (
                    <div className="flex justify-center items-center gap-2 mt-20">
                        <button 
                            onClick={() => paginate(currentPage - 1)} 
                            disabled = {currentPage === 1}
                            className={`px-3 py-1 rounded border ${
                                currentPage === 1
                                    ? 'bg-white text-gray-300 cursor-not-allowed'
                                    : 'bg-white text-gray-700 hover:bg-gray-50 cursor-pointer'
                            }`}
                        >
                            ก่อนหน้า
                        </button>
                        { getVisiblePages().map(number => (
                            <button
                                key={number}
                                onClick={() => paginate(number)}
                                className={`px-3 py-1 rounded border ${
                                    currentPage === number
                                        ? 'bg-sea-serenade text-white'
                                        : 'bg-white text-gray-700 hover:bg-gray-50 cursor-pointer'
                             
                                    }`}
                            >
                                {number}
                            </button>
                        )) }
                        <button
                            onClick={() => paginate(currentPage + 1)}
                            disabled={currentPage === totalPages}
                            className={`px-3 py-1 rounded border ${
                                currentPage === totalPages
                                    ? 'bg-white text-gray-300 cursor-not-allowed'
                                    : 'bg-white text-gray-700 hover:bg-gray-50 cursor-pointer'
                            }`}
                        >
                            ถัดไป
                        </button>
                    </div>
                ) }
                { pendingPosts.length > 0 && (
                    <div className="text-center text-sm text-gray-500 mt-4">
                        หน้า {currentPage} จาก {totalPages} หน้า <span className="font-extrabold text-lg">·</span> แสดง {currentBlogs.length} จาก {pendingPosts.length} รายการ
                    </div>
                )}
            </div>
        </div>
    );
}