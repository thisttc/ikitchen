import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { IoClose, IoOpenOutline, IoSearch } from "react-icons/io5";
import Swal from 'sweetalert2';

export default function Search() {
    const navigate = useNavigate();
    const [blogs, setBlogs] = useState([]);
    const [filteredBlogs, setFilteredBlogs] = useState([]);

    const [searchTerm, setSearchTerm] = useState('');
    const [selectCategory, setSelectCategory] = useState('');
    const [categories, setCategories] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [perPage] = useState(20);

    const fetchBlog = async () => {
        try {
            const res = await fetch('http://localhost:5000/blog');
            if (res.ok) {
                const allBlogs = await res.json();
                const publishedBlogs = allBlogs.filter(blog => blog.status === 'published');
                setBlogs(publishedBlogs);
                setFilteredBlogs(publishedBlogs);

                const allCategories = [...new Set(publishedBlogs.flatMap(
                    blog => Array.isArray(blog.category) ? blog.category : [blog.category]
                ))];
                setCategories(allCategories.filter(cat => cat));
            } else {
                throw new Error('โหลดข้อมูลไม่สำเร็จ');
            }
        } catch (err) {
            console.error('Error:', err);
            Swal.fire({
                icon: 'error',
                title: 'โหลดข้อมูลไม่สำเร็จ',
                text: err.message,
                confirmButtonColor: '#6AAFBD',
                confirmButtonText: 'เข้าใจแล้ว'
            })
        }
    };

    useEffect(() => {
        fetchBlog();
    }, []);

    const filterBlog = () => {
        let filtered = [...blogs];
        if (searchTerm.trim()) {
            filtered = filtered.filter(blog => blog.title.toLowerCase().includes(searchTerm.toLowerCase()));
        }

        if (selectCategory) {
            filtered = filtered.filter(blog => {
                const blogCategories = Array.isArray(blog.category) ? blog.category : [blog.category];
                return blogCategories.includes(selectCategory);
            });
        }

        setFilteredBlogs(filtered);
        setCurrentPage(1);
    };




    useEffect(() => {
        filterBlog();
    }, [searchTerm, selectCategory]);

    const clearFilters = () => {
        setSearchTerm('');
        setSelectCategory('');
    };

    const viewBlogDetail = (blog) => {
        navigate(`/blog/${blog._id}`);
    };

    const indexOfLastblog = currentPage * perPage;
    const indexOfFirstblog = indexOfLastblog - perPage;
    const currentBlogs = filteredBlogs.slice(indexOfFirstblog, indexOfLastblog);
    const totalPages = Math.ceil(filteredBlogs.length / perPage);

    const getVisiblePages = () => {
        const maxVisible = 15;
        if (totalPages <= maxVisible) {
            return Array.from({ length: totalPages }, (_, i) => i + 1);
        }
        let start = Math.max(currentPage - Math.floor(maxVisible / 2), 1);
        let end = Math.min(start + maxVisible - 1, totalPages);
        if (end - start + 1 < maxVisible) {
            start = Math.max(end - maxVisible + 1, 1);
        }
        return Array.from({ length: end - start + 1 }, (_, i) => start + i);
    };

    return (
        <div className="w-full flex flex-col">
            <p className="text-lg mb-6">ค้นหากระดานบันทึกภายในระบบ</p>
            <div className="w-120 xl:flex items-center gap-10">
                <div className="flex flex-col">
                    <p className="pb-2">ค้นหาจากชื่อหัวข้อ</p>
                    <div className="flex items-center border border-gray-400 px-6 py-1 rounded-full">
                        <IoSearch size={12} />
                        <input type="text" className="px-4 w-120 outline-none" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="พิมพ์ชื่อหัวข้อที่ต้องการค้นหา..." />
                    </div>
                </div>
                <div className="flex pt-4 xl:pt-0 gap-6">
                    <div className="flex flex-col">
                        <p className="pb-2">กรองตามประเภท</p>
                        <div className="flex gap-6">
                            <select value={selectCategory} onChange={(e) => setSelectCategory(e.target.value)} className="w-120 border border-gray-400 rounded-lg px-6 py-1 cursor-pointer">
                                <option value=''>ทั้งหมด</option>
                                {[...categories]
                                    .sort((a, b) => a.localeCompare(b, 'th'))
                                    .map((cat, idx) => (
                                        <option key={idx} value={cat}>{cat}</option>
                                    ))
                                }
                            </select>
                            {(searchTerm || selectCategory) && (
                                <button
                                    onClick={clearFilters}
                                    className="px-3 py-1 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-full hover:bg-gray-50 transition flex items-center gap-2 cursor-pointer"
                                >
                                    <IoClose />
                                    <p>เคลียร์</p>
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
            <div className="pt-4 pb-2 text-gray-500">
                <p>พบ {filteredBlogs.length} รายการ
                    {filteredBlogs.length !== blogs.length && (
                        <span className=""> (จากทั้งหมด {blogs.length} รายการ) </span>
                    )} </p>
            </div>
            <div>
                <table className="w-full">
                    <thead className="bg-gray-100 border-t border-b border-gray-200">
                        <tr>
                            <th className="px-4 py-3 text-left text-md tracking-wider" style={{ width: '5%' }}>#</th>
                            <th className="px-4 py-3 text-left text-md tracking-wider" style={{ width: '40%' }}>หัวข้อ</th>
                            <th className="px-4 py-3 text-left text-md tracking-wider" style={{ width: '30%' }}>ประเภท</th>
                            <th className="px-4 py-3 text-left text-md tracking-wider" style={{ width: '15%' }}>ผู้เขียน</th>
                            <th className="px-4 py-3 text-center text-md tracking-wider" style={{ width: '10%' }}>ดูรายละเอียด</th>
                        </tr>
                    </thead>
                    <tbody>
                        {currentBlogs.length === 0 ? (
                            <tr><td colSpan='4' className="px-4 py-8 text-center text-gray-500">ไม่พบข้อมูลที่ค้นหา</td></tr>
                        ) : (
                            currentBlogs.map((post, index) => (
                                <tr key={post._id} className="border-b border-gray-100 hover:bg-gray-50">
                                    <td className="px-4 py-3">{indexOfFirstblog + index + 1}</td>
                                    <td className="px-4 py-4">{post.title}</td>
                                    <td className="px-4 py-3">{post.category}</td>
                                    <td className="px-4 py-3">{post.userId?.name || 'ไม่ระบุชื่อ'}</td>
                                    <td className="text-center ">
                                        <button
                                            onClick={() => viewBlogDetail(post)}
                                            className="text-gray-400 hover:text-sea-serenade transition inline-flex items-center justify-center gap-1 cursor-pointer"
                                            title="ดูรายละเอียด"
                                        >
                                            <IoOpenOutline size={18}/>
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
            <div>
                {totalPages > 1 && (
                    <div className="flex justify-center items-center gap-2 py-10 border-t border-gray-200">
                        <button
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className={`px-3 py-1 rounded border ${currentPage === 1
                                    ? 'bg-white text-gray-300 cursor-not-allowed'
                                    : 'bg-white text-gray-600 hover:bg-gray-50 cursor-pointer'
                                }`}
                        >
                            ก่อนหน้า
                        </button>
                        {getVisiblePages().map(number => (
                            <button
                                key={number}
                                onClick={() => setCurrentPage(number)}
                                className={`px-3 py-1 rounded border ${currentPage === number
                                        ? 'bg-sea-serenade text-white'
                                        : 'bg-white text-gray-600 hover:bg-gray-50 cursor-pointer'
                                    }`}
                            >
                                {number}
                            </button>
                        ))}
                        <button
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                            className={`px-3 py-1 rounded border ${currentPage === totalPages
                                    ? 'bg-white text-gray-300 cursor-not-allowed'
                                    : 'bg-white text-gray-600 hover:bg-gray-50 cursor-pointer'
                                }`}
                        >
                            ถัดไป
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}