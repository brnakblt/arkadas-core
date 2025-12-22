import React, { useState } from 'react';
import Image from 'next/image';
import { User, Check, X, Clock } from 'lucide-react';

// Prototype for the "Student Attendance Card" interaction
// Described in docs/UX_STRATEGY.md

type AttendanceStatus = 'present' | 'absent' | 'late';

interface Student {
  id: string;
  name: string;
  avatarUrl?: string;
}

interface AttendanceCardProps {
  student: Student;
  initialStatus?: AttendanceStatus;
  onStatusChange: (status: AttendanceStatus) => void;
}

export const AttendanceCard: React.FC<AttendanceCardProps> = ({
  student,
  initialStatus = 'present',
  onStatusChange,
}) => {
  const [status, setStatus] = useState<AttendanceStatus>(initialStatus);

  const handleStatusChange = (newStatus: AttendanceStatus) => {
    setStatus(newStatus);
    onStatusChange(newStatus);
  };

  return (
    <div className="flex items-center justify-between p-4 bg-white rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
      {/* Left: Student Info */}
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden flex items-center justify-center relative">
          {student.avatarUrl ? (
            <Image src={student.avatarUrl} alt={student.name} fill className="object-cover" />
          ) : (
            <User className="w-6 h-6 text-gray-400" />
          )}
        </div>
        <div>
          <h3 className="font-medium text-gray-900">{student.name}</h3>
          <p className="text-xs text-gray-500">Student ID: {student.id}</p>
        </div>
      </div>

      {/* Right: Interaction Controls (Segmented Control Prototype) */}
      <div className="flex bg-gray-100 rounded-lg p-1">
        <button
          onClick={() => handleStatusChange('present')}
          className={`p-2 rounded-md transition-all ${status === 'present'
              ? 'bg-green-500 text-white shadow-sm'
              : 'text-gray-500 hover:bg-gray-200'
            }`}
          aria-label="Mark Present"
        >
          <Check className="w-5 h-5" />
        </button>
        <button
          onClick={() => handleStatusChange('late')}
          className={`p-2 rounded-md transition-all ${status === 'late'
              ? 'bg-yellow-500 text-white shadow-sm'
              : 'text-gray-500 hover:bg-gray-200'
            }`}
          aria-label="Mark Late"
        >
          <Clock className="w-5 h-5" />
        </button>
        <button
          onClick={() => handleStatusChange('absent')}
          className={`p-2 rounded-md transition-all ${status === 'absent'
              ? 'bg-red-500 text-white shadow-sm'
              : 'text-gray-500 hover:bg-gray-200'
            }`}
          aria-label="Mark Absent"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
