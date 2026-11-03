import { useState } from "react";
import { FaStar, FaRegStar } from 'react-icons/fa';
import Swal from 'sweetalert2';

export default function ShowOnWebsiteToggle({ blogId, initailValue, onToggle }) {
    const [showOnWebsite, setShowOnWebsite] = useState(initailValue);

    const handleToggle = async () => {
        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`http://localhost:5000/blog/${blogId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ showOnWebsite: !showOnWebsite })
            });

            if(res.ok) {
                const newValue = !showOnWebsite;
                setShowOnWebsite(newValue);
                onToggle?.(blogId, newValue);

                Swal.fire({
                    icon: 'success',
                    title: newValue ? 'แสดงในหน้าแรกแล้ว' : 'ซ่อนจากหน้าแรกแล้ว',
                    timer: 1500,
                    showConfirmButton: false
                });
            } else {
                throw new Error('โหลดข้อมูลไม่สำเร็จ');
            }
        } catch (err) {
            Swal.fire({
                icon: 'error',
                title: 'เกิดข้อผิดพลาด',
                text: err.message,
                confirmButtonColor: '#6AAFBD',
                confirmButtonText: 'เข้าใจแล้ว'
            })
        }
    };

    return (
        <button
            onClick={handleToggle}
            className={`px-3 py-1 rounded-lg transiton flex justify-center items-center gap-2 mx-auto ${
                showOnWebsite
                    ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
            }`}
            title={showOnWebsite ? 'ซ่อนจากหน้าแรก' : 'แสดงบนหน้าแรก'}
        >
                {showOnWebsite ? <FaStar size={14} /> : <FaRegStar size={14} /> }
                <p>{showOnWebsite ? 'แสดง' : 'ไม่แสดง'}</p>
        </button>
    );
}