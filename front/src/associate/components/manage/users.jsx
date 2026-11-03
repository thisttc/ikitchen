import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import { FaRegEdit } from "react-icons/fa";
import { MdDeleteForever } from "react-icons/md";

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const token = localStorage.getItem('token');
  const userRole = localStorage.getItem('userRole');

  useEffect(() => {
    setIsAdmin(userRole === 'admin');
    if (userRole === 'admin') {
      fetchAllStaff();
    } else {
      fetchSelfProfile();
    }
  }, []);

  const fetchAllStaff = async () => {
    try {
      const res = await fetch('http://localhost:5000/admin/users', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setUsers(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchSelfProfile = async () => {
    try {
      const res = await fetch('http://localhost:5000/staff/profile', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setCurrentUser(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id, name) => {
    const result = await Swal.fire({
      title: 'ยืนยันการลบ',
      text: `ต้องการลบ "${name}" ออกจากระบบใช่หรือไม่`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#BF806E',
      confirmButtonText: 'ลบ',
      cancelButtonColor: '#C8D88C',
      cancelButtonText: 'ยกเลิก'
    });
    if (result.isConfirmed) {
      try {
        const res = await fetch(`http://localhost:5000/admin/users/${id}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          Swal.fire({ icon: 'success', title: 'ลบสำเร็จ', timer: 1500, showConfirmButton: false });
          fetchAllStaff();
        } else throw new Error();
      } catch {
        Swal.fire({ icon: 'error', title: 'ลบไม่สำเร็จ', confirmButtonColor: '#6AAFBD', confirmButtonText: 'เข้าใจแล้ว' });
      }
    }
  };

  const handleEdit = (user) => {
    setEditingUser({ ...user });
  };

  const handleUpdate = async () => {
    if (!editingUser) return;
    try {
      const res = await fetch(`http://localhost:5000/admin/users/${editingUser._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(editingUser)
      });
      if (res.ok) {
        Swal.fire({ icon: 'success', title: 'อัปเดตสำเร็จ', timer: 1500, showConfirmButton: false });
        setEditingUser(null);
        fetchAllStaff();
      } else {
        const err = await res.json();
        Swal.fire({ icon: 'error', title: 'อัปเดตไม่สำเร็จ', text: err.message, confirmButtonColor: '#6AAFBD', confirmButtonText: 'เข้าใจแล้ว' });
      }
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'เกิดข้อผิดพลาด', text: err.message, confirmButtonColor: '#6AAFBD', confirmButtonText: 'เข้าใจแล้ว' });
    }
  };

  const handleCreateStaff = async (newStaff) => {
    try {
      const res = await fetch('http://localhost:5000/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(newStaff)
      });
      if (res.ok) {
        Swal.fire({ icon: 'success', title: 'เพิ่มเจ้าหน้าที่สำเร็จ', timer: 1500, showConfirmButton: false });
        setShowCreateModal(false);
        fetchAllStaff();
      } else {
        const err = await res.json();
        Swal.fire({ icon: 'error', title: 'เพิ่มเจ้าหน้าที่ไม่สำเร็จ', text: err.message, confirmButtonColor: '#6AAFBD', confirmButtonText: 'เข้าใจแล้ว' });
      }
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'เกิดข้อผิดพลาด', text: err.message, confirmButtonColor: '#6AAFBD', confirmButtonText: 'เข้าใจแล้ว' });
    }
  };

  const handleSelfUpdate = async () => {
    try {
      const res = await fetch('http://localhost:5000/staff/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          alias: currentUser.alias,
          email: currentUser.email
        })
      });
      if (res.ok) {
        Swal.fire({ icon: 'success', title: 'อัปเดตโปรไฟล์สำเร็จ', timer: 1500, showConfirmButton: false });
        fetchSelfProfile();
      } else {
        const err = await res.json();
        Swal.fire({ icon: 'error', title: 'อัปเดตโปรไฟไม่สำเร็จ', text: err.message, confirmButtonColor: '#6AAFBD', confirmButtonText: 'เข้าใจแล้ว' });
      }
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'เกิดข้อผิดพลาด', text: err.message, confirmButtonColor: '#6AAFBD', confirmButtonText: 'เข้าใจแล้ว' });
    }
  };

  const CreateStaffModal = () => {
    const [form, setForm] = useState({ alias: '', name: '', email: '', password: '' });
    const onSubmit = (e) => {
      e.preventDefault();
      if (!form.alias || !form.name || !form.email || !form.password) {
        Swal.fire({ icon: 'warning', title: 'กรุณากรอกข้อมูลให้ครบ', confirmButtonColor: '#6AAFBD', confirmButtonText: 'เข้าใจแล้ว' });
        return;
      }
      handleCreateStaff(form);
    };
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl p-6 w-96">
          <h2 className="text-xl font-bold mb-4">เพิ่มเจ้าหน้าที่ใหม่</h2>
          <form onSubmit={onSubmit}>
            <input type="text" placeholder="ชื่อผู้ใช้" className="w-full border p-2 mb-2 rounded" value={form.alias} onChange={e => setForm({ ...form, alias: e.target.value })} />
            <input type="text" placeholder="ชื่อ-นามสกุล" className="w-full border p-2 mb-2 rounded" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
            <input type="email" placeholder="อีเมล" className="w-full border p-2 mb-2 rounded" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
            <input type="password" placeholder="รหัสผ่าน" className="w-full border p-2 mb-4 rounded" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setShowCreateModal(false)} className="px-4 py-2 bg-gray-300 rounded">ยกเลิก</button>
              <button type="submit" className="px-4 py-2 bg-sea-serenade text-white rounded">บันทึก</button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  if (isAdmin) {
    return (
      <div className="p-6">
        <div className="flex justify-between items-center mb-10">
          <h1 className="text-lg">รายชื่อเจ้าหน้าที่ในระบบ</h1>
          <button onClick={() => setShowCreateModal(true)} className="bg-sea-serenade text-white px-4 py-2 rounded-lg hover:bg-opacity-80 cursor-pointer">
            + เพิ่มเจ้าหน้าที่ใหม่
          </button>
        </div>
        <div className="bg-white overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-100 border-t border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-md tracking-wider" style={{ width: '30%' }}>ชื่อผู้ใช้</th>
                <th className="px-4 py-3 text-left text-md tracking-wider" style={{ width: '25%' }}>ชื่อ-นามสกุล</th>
                <th className="px-4 py-3 text-left text-md tracking-wider" style={{ width: '30%' }}>อีเมล</th>
                <th className="px-4 py-3 text-center text-md tracking-wider" style={{ width: '15%' }}>จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user._id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3">{user.alias}</td>
                  <td className="px-4 py-3">{user.name}</td>
                  <td className="px-4 py-3">{user.email}</td>
                  <td className="px-4 py-3 flex items-center justify-evenly">
                    <button onClick={() => handleEdit(user)} className="flex items-center justify-center px-2 py-1 border border-gray-500 rounded-lg hover:bg-sea-serenade hover:text-white cursor-pointer">
                      <FaRegEdit size={12} />
                      <span className="pl-2">แก้ไข</span>
                    </button>
                    <button onClick={() => handleDelete(user._id, user.name)} className="flex items-center justify-center px-2 py-1 border border-gray-500 rounded-lg hover:bg-brandy-rose hover:text-white cursor-pointer">
                      <MdDeleteForever size={15} />
                      <span className="pl-2">ลบทิ้ง</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {editingUser && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl shadow-lg p-8 w-[480px] max-w-full">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-semibold text-gray-800">แก้ไขข้อมูลพนักงาน</h2>
                <button
                  onClick={() => setEditingUser(null)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-5">
                <div>
                  <label className="block mb-2">ชื่อผู้ใช้</label>
                  <input
                    type="text"
                    placeholder="username"
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sea-serenade focus:border-transparent transition-all"
                    value={editingUser.alias}
                    onChange={e => setEditingUser({ ...editingUser, alias: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block mb-2">ชื่อ-นามสกุล</label>
                  <input
                    type="text"
                    placeholder="สมชาย ใจดี"
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sea-serenade focus:border-transparent transition-all"
                    value={editingUser.name}
                    onChange={e => setEditingUser({ ...editingUser, name: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block mb-2">อีเมล</label>
                  <input
                    type="email"
                    placeholder="name@example.com"
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sea-serenade focus:border-transparent transition-all"
                    value={editingUser.email}
                    onChange={e => setEditingUser({ ...editingUser, email: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block mb-2">รหัสผ่านใหม่ <span className='text-dusty-rose-brown ml-2'>* เว้นว่างไว้หากไม่ต้องการเปลี่ยน *</span></label>
                  <input
                    type="password"
                    placeholder="******"
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sea-serenade focus:border-transparent transition-all"
                    onChange={e => setEditingUser({ ...editingUser, password: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-8">
                <button
                  onClick={() => setEditingUser(null)}
                  className="px-5 py-2.5 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all font-medium"
                >
                  ยกเลิก
                </button>
                <button
                  onClick={handleUpdate}
                  className="px-5 py-2.5 bg-sea-serenade hover:bg-opacity-85 text-white rounded-xl transition-all font-medium shadow-sm"
                >
                  บันทึก
                </button>
              </div>
            </div>
          </div>
        )}
        {showCreateModal && <CreateStaffModal />}
      </div>
    );
  }

  if (!currentUser) return <div className="p-6">กำลังโหลด...</div>;

  return (
    <div className="p-6 max-w-lg mx-auto">
      <h1 className="text-lg mb-6">โปรไฟล์ของฉัน</h1>
      <div className="bg-gray-50 rounded-xl shadow p-10">
        <div className="mb-6 flex flex-col">
          <label className='pb-2'>ชื่อผู้ใช้</label>
          <input type="text" className="w-full outline-none bg-white border border-gray-300 rounded-md px-3 py-1" value={currentUser.alias} onChange={e => setCurrentUser({ ...currentUser, alias: e.target.value })} />
        </div>
        <div className="mb-6 flex flex-col">
          <label className="pb-2">ชื่อ-นามสกุล</label>
          <input type="text" className="w-full text-gray-500 outline-none cursor-not-allowed border border-gray-300 rounded-md px-3 py-1" value={currentUser.name} disabled />
        </div>
        <div className="mb-10 flex flex-col">
          <label className="pb-2">อีเมล</label>
          <input type="email" className="w-full outline-none bg-white border border-gray-300 rounded-md px-3 py-1" value={currentUser.email} onChange={e => setCurrentUser({ ...currentUser, email: e.target.value })} />
        </div>
        <button onClick={handleSelfUpdate} className="w-full bg-sea-serenade text-white py-2 rounded-lg">บันทึกการเปลี่ยนแปลง</button>
        <p className="text-gray-400 text-center mt-2">
          * หากต้องการเปลี่ยนรหัสผ่าน กรุณาติดต่อผู้ดูแลระบบ
        </p>
      </div>
    </div>
  );
};

export default UserManagement;