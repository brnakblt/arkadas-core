"use client";

import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUsers, faFolderOpen } from '@fortawesome/free-solid-svg-icons';
import FileManager from '@/components/files/FileManager';
import UserManagement from '@/components/admin/UserManagement';

export default function AdminPage() {
    const [activeTab, setActiveTab] = useState<'users' | 'files'>('users');

    return (
        <div className="h-full flex flex-col">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Sistem Yönetimi</h1>
            </div>

            <div className="bg-white rounded-xl shadow-sm mb-6">
                <div className="flex border-b">
                    <button 
                        className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors border-b-2 ${
                            activeTab === 'users' 
                                ? 'border-blue-600 text-blue-600 bg-blue-50/50' 
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                        }`}
                        onClick={() => setActiveTab('users')}
                    >
                        <FontAwesomeIcon icon={faUsers} />
                        Kullanıcılar
                    </button>
                    <button 
                        className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors border-b-2 ${
                            activeTab === 'files' 
                                ? 'border-blue-600 text-blue-600 bg-blue-50/50' 
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                        }`}
                        onClick={() => setActiveTab('files')}
                    >
                        <FontAwesomeIcon icon={faFolderOpen} />
                        Dosya Yöneticisi
                    </button>
                </div>
            </div>

            <div className="flex-1 min-h-0">
                {activeTab === 'users' ? (
                    <UserManagement />
                ) : (
                    <div className="h-[calc(100vh-250px)]">
                        <FileManager basePath="/" />
                    </div>
                )}
            </div>
        </div>
    );
}
