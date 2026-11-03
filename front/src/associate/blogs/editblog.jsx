import { IoHome } from "react-icons/io5";
import Edit from '../components/form/edit';

export default function EditBlog () {
    return (
        <div className="w-full h-full">
            <div className="flex justify-between items-center mb-10">
                <div className="flex flex-col justify-center">
                    <p className="text-lg">แก้ไข<span>กระดานบันทึก</span></p>
                    <p>User Dashboard</p>
                </div>
                <div className="flex items-center justify-center"><IoHome className="cursor-pointer" size={12}/> <span className="px-2">/</span> <span className="cursor-pointer">กระดานบันทึก</span></div>
            </div>
            <div className="flex justify-between items-center w-full gap-10">
                <Edit/>
            </div>
        </div>
    )
} 