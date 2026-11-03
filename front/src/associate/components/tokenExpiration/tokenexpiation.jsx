import React from "react";
import { IoTimeOutline } from "react-icons/io5";

const TokenExpirationManager = ({ showCountdown, timeLeft }) => {
    if (!showCountdown || !timeLeft || timeLeft <= 0) return null;

    const minutes = Math.floor(timeLeft / 60000);
    const seconds = Math.floor((timeLeft % 60000) / 1000);
    const isUrgent = timeLeft <= 60000;

    return (
        <div className={`relative top-0 left-0 right-0 z-50 ${isUrgent ? 'bg-red-500 animate-pulse' : 'bg-yellow-500'
            } text-white py-2 px-4 shadow-lg`}>
            <div className="flex items-center justify-center gap-3">
                <IoTimeOutline size={20} />
                <span className="font-medium">
                    กำลังจะหมดอายุการใช้งานใน:
                    <strong className="mx-2 text-lg">
                        {minutes}:{seconds.toString().padStart(2, '0')}
                    </strong>
                    {isUrgent ? ' ⚠️ กรุณาบันทึกงาน!' : ' นาที'}
                </span>
            </div>
        </div>
    );
};

export default TokenExpirationManager;