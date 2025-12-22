"use client";

import React, { useEffect } from "react";

const ViewportWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    useEffect(() => {
        // Force viewport to be exactly window width
        const handleResize = () => {
            document.body.style.width = `${window.innerWidth}px`;
            document.body.style.overflowX = 'hidden';
        };

        window.addEventListener('resize', handleResize);
        handleResize();

        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return (
        <div className="relative w-full overflow-x-hidden max-w-[100vw] min-h-screen">
            {children}
        </div>
    );
};

export default ViewportWrapper;
