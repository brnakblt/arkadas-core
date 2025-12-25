"use client";

import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faBell, faUserCircle } from '@fortawesome/free-solid-svg-icons';

import { useDashboard } from '@/context/DashboardContext';

const TopBar = () => {
    const { user, searchQuery, setSearchQuery } = useDashboard();

    return (
        <header className="bg-white h-16 border-b border-gray-200 flex items-center justify-between px-6 sticky top-0 z-40">
            {/* Left: Search or Breadcrumbs */}
            <div className="flex items-center flex-1">
                <div className="relative w-full max-w-md hidden md:block">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FontAwesomeIcon icon={faSearch} className="text-gray-400" />
                    </span>
                    <input
                        type="text"
                        placeholder="Ara..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none text-sm"
                    />
                </div>
            </div>

            {/* Right: Actions & Profile */}
            <div className="flex items-center space-x-4">
                <button className="relative p-2 text-gray-400 hover:text-gray-600 transition-colors">
                    <FontAwesomeIcon icon={faBell} className="w-5 h-5" />
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
                </button>

                <div className="h-8 w-px bg-gray-200 mx-2"></div>

                <div className="flex items-center space-x-3 cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-sm ${user?.userType === 'teacher' ? 'bg-indigo-500' : 'bg-orange-500'}`}>
                        {user?.username ? user.username.charAt(0).toUpperCase() : <FontAwesomeIcon icon={faUserCircle} />}
                    </div>
                    <div className="hidden md:block text-left">
                        <p className="text-sm font-semibold text-gray-700 leading-none">{user?.username || 'Kullanıcı'}</p>
                        <p className="text-xs text-gray-500 mt-0.5 capitalize">{user?.userType === 'teacher' ? 'Öğretmen' : (user?.userType === 'parent' ? 'Veli' : '')}</p>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default TopBar;
