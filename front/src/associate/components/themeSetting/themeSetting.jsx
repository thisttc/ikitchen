import React, { useState, useEffect, useRef } from 'react';
import Swal from 'sweetalert2';

const ThemeSettings = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    filter: { brightness: 0.95, saturate: 0.7, contrast: 1 },
    preset: 'muted'
  });
  const previewRef = useRef(null);

  const token = localStorage.getItem('token');

  const loadSettings = async () => {
    try {
      const res = await fetch('http://localhost:5000/theme/settings');
      const data = await res.json();
      setSettings(data);
      if (previewRef.current) {
        const { brightness, saturate, contrast } = data.filter;
        previewRef.current.style.filter = `brightness(${brightness}) saturate(${saturate}) contrast(${contrast})`;
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      const res = await fetch('http://localhost:5000/theme/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          filter: settings.filter,
          preset: settings.preset
        })
      });
      if (res.ok) {
        Swal.fire({ icon: 'success', title: 'บันทึกสำเร็จ', timer: 1500, showConfirmButton: false });
      } else {
        throw new Error();
      }
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'บันทึกไม่สำเร็จ', text: 'กรุณาลองอีกครั้ง' });
    } finally {
      setSaving(false);
    }
  };

  const handleFilterChange = (key, value) => {
    const newFilter = { ...settings.filter, [key]: parseFloat(value) };
    setSettings(prev => ({ ...prev, filter: newFilter, preset: 'custom' }));
    if (previewRef.current) {
      previewRef.current.style.filter = `brightness(${newFilter.brightness}) saturate(${newFilter.saturate}) contrast(${newFilter.contrast})`;
    }
  };

  const applyPreset = (preset) => {
    let newFilter;
    switch (preset) {
      case 'normal': newFilter = { brightness: 1, saturate: 1, contrast: 1 }; break;
      case 'muted': newFilter = { brightness: 0.95, saturate: 0.7, contrast: 1 }; break;
      case 'dusty': newFilter = { brightness: 0.92, saturate: 0.55, contrast: 1.05 }; break;
      case 'dark': newFilter = { brightness: 0.85, saturate: 0.6, contrast: 1.08 }; break;
      default: return;
    }
    setSettings({ filter: newFilter, preset });
    if (previewRef.current) {
      previewRef.current.style.filter = `brightness(${newFilter.brightness}) saturate(${newFilter.saturate}) contrast(${newFilter.contrast})`;
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  if (loading) return <div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-10 w-10 border-4 border-t-transparent border-gray-200" /></div>;

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">🎨 ตั้งค่าโทนสีเว็บไซต์</h1>
      
      <div className="bg-white rounded-xl shadow p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">ธีมสำเร็จรูป</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {['normal', 'muted', 'dusty', 'dark'].map(p => (
            <button key={p} onClick={() => applyPreset(p)} className={`p-3 rounded-lg border-2 transition-all ${settings.preset === p ? 'border-sea-serenade bg-sea-serenade/10' : 'border-gray-200 hover:border-gray-300'}`}>
              
              <span>{p === 'normal' ? 'ปกติ' : p === 'muted' ? 'หม่นนวล' : p === 'dusty' ? 'ซีดขาว' : 'มืดครึ้ม'}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">ปรับแต่งเอง</h2>
        {['brightness', 'saturate', 'contrast'].map(key => (
          <div key={key} className="mb-6">
            <div className="flex justify-between mb-2">
              <label className="text-sm text-gray-600">{key === 'brightness' ? 'ความสว่าง' : key === 'saturate' ? 'ความเข้มสี' : 'ความคมชัด'}</label>
              <span className="text-sm text-gray-500">{Math.round(settings.filter[key] * 100)}%</span>
            </div>
            {key === 'brightness' && (
              <input type="range" min="0" max="1" step="0.01" value={settings.filter.brightness} onChange={(e) => handleFilterChange('brightness', e.target.value)} className="w-full h-2 bg-gray-200 rounded-lg accent-sea-serenade" />
            )}
            {key === 'saturate' && (
              <input type="range" min="0" max="1" step="0.01" value={settings.filter.saturate} onChange={(e) => handleFilterChange('saturate', e.target.value)} className="w-full h-2 bg-gray-200 rounded-lg accent-sea-serenade" />
            )}
            {key === 'contrast' && (
              <input type="range" min="0" max="1.2" step="0.01" value={settings.filter.contrast} onChange={(e) => handleFilterChange('contrast', e.target.value)} className="w-full h-2 bg-gray-200 rounded-lg accent-sea-serenade" />
            )}
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">ตัวอย่าง</h2>
        <div ref={previewRef} className="grid grid-cols-3 gap-4 text-center transition-all duration-200">
          <div className="p-3 bg-sea-serenade rounded-lg text-white">สีหลัก</div>
          <div className="p-3 bg-peacock-green rounded-lg text-white">สีรอง</div>
          <div className="p-3 bg-brandy-rose rounded-lg text-white">สีเน้น</div>
        </div>
      </div>

      <div className="flex gap-3">
        <button onClick={saveSettings} disabled={saving} className="flex-1 bg-sea-serenade text-white py-2 rounded-lg disabled:opacity-50">{saving ? 'กำลังบันทึก...' : 'บันทึก'}</button>
        <button onClick={() => { if (previewRef.current) previewRef.current.style.filter = ''; }} className="px-4 py-2 bg-gray-200 rounded-lg">รีเซ็ตตัวอย่าง</button>
      </div>
      <p className="text-gray-400 text-center mt-4">* การตั้งค่านี้จะถูกบันทึกและผู้ใช้งานทั่วไปจะเห็นโทนสีเดียวกัน</p>
    </div>
  );
};

export default ThemeSettings;