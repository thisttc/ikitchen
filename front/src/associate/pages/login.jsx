import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom';
import { MdEmail } from "react-icons/md";
import { IoIosLock } from "react-icons/io";
import { useToken } from '../components/hooks/useToken';
import Swal from 'sweetalert2';
import 'sweetalert2/dist/sweetalert2.css';

const Login = () => {

    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    })

    const { token, login: authLogin } = useToken();
    useEffect(() => {
        if (token) {
            const userRole = localStorage.getItem('userRole');
            if(userRole === 'admin') {
                navigate('/admin');
            } else {
                navigate('/official');
            }
        }
    }, [token, navigate]);

    const handleInputChange = (event) => {
        const { name, value } = event.target;
        setFormData({
            ...formData,
            [name]: value
        })
    }

    const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('1. Submit started');
    
    // เก็บ token ปัจจุบันก่อน submit
    const currentToken = localStorage.getItem('token');
    console.log('2. Current token before submit:', currentToken ? 'exists' : 'null');
    
    try {
        const response = await fetch("https://rayongcity.onrender.com/auth/login", {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });
        
        console.log('3. Response status:', response.status);
        const result = await response.json();
        
        if (response.ok) {
            console.log('4. Login success, setting token');
            localStorage.setItem('token', result.token);
            localStorage.setItem('userRole', result.user.role);
            
            Swal.fire({
                icon: 'success',
                text: 'คุณเข้าสู่ระบบสำเร็จ!',
                timer: 1500,
                showConfirmButton: false
            }).then(() => {
                console.log('5. Success swal closed');
                navigate(result.user.role === 'admin' ? '/admin' : '/official');
            });
        } else {
            console.log('4. Login failed');
            
            // ตรวจสอบว่า token ถูกเปลี่ยนแปลงระหว่างนี้ไหม
            setTimeout(() => {
                const tokenAfter = localStorage.getItem('token');
                console.log('5. Token after error (before swal):', tokenAfter === currentToken ? 'same' : 'CHANGED!');
                
                Swal.fire({
                    icon: 'error',
                    title: 'เข้าสู่ระบบไม่สำเร็จ',
                    text: 'อีเมลล์หรือรหัสผ่านไม่ถูกต้อง',
                    confirmButtonColor: '#6AAFBD',
                    confirmButtonText: 'ลองอีกครั้ง',
                    allowOutsideClick: false,
                    allowEscapeKey: false
                }).then((swalResult) => {
                    console.log('6. Error swal closed, result:', swalResult);
                    if (swalResult.isConfirmed) {
                        setFormData({ email: '', password: '' });
                    }
                });
            }, 0);
        }
    } catch(error) {
        console.error('Fetch error:', error);
    }
};

    return (
        <div className='w-full h-full flex flex-col items-center justify-center'>
            <form className='bg-white rounded-xl w-120 shadow-lg/10 flex flex-col items-center justify-center p-10' onSubmit={handleSubmit}>
                <p className='text-xl pb-16'>หน้าเข้าสู่ระบบ</p>
                <div className='w-full h-full flex flex-col items-center justify-center pb-6'>
                    <div className='flex items-center justify-center border-1 border-sail rounded-full w-full h-10 px-6'>
                        <MdEmail className='text-gray-500' size={20}/>
                        <input
                            className='pl-4 w-full outline-none'
                            type='email'
                            name='email'
                            placeholder='อีเมลล์'
                            value={formData.email}
                            onChange={handleInputChange}
                            required
                        />
                    </div>
                </div>
                <div className='pb-20 w-full h-full flex flex-col items-center justify-center'>
                    <div className='flex items-center justify-center border-1 border-sail rounded-full w-full h-10 px-6'>
                        <IoIosLock className='text-gray-500' size={20}/>
                        <input
                            className='pl-4 w-full outline-none'
                            type='password'
                            name='password'
                            placeholder='รหัสผ่าน'
                            value={formData.password}
                            onChange={handleInputChange}
                            required
                        />
                    </div>
                </div>
                <button className='w-full py-3 rounded-full bg-sail' type='submit'>คลิกเพื่อเข้าสู่ระบบ</button>
            </form>
        </div>
  )
}

export default Login