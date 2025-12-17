"use client";

import React, { useEffect, useState, useRef } from "react";

interface BezierBackgroundProps {
    className?: string;
}

const BezierBackground: React.FC<BezierBackgroundProps> = ({ className = "" }) => {
    const [paths, setPaths] = useState<{ d: string; color: string; width: string; opacity: string; style?: React.CSSProperties }[]>([]);
    const [isVisible, setIsVisible] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                    observer.disconnect();
                }
            },
            { threshold: 0.2 } // Trigger when 20% visible
        );

        if (containerRef.current) {
            observer.observe(containerRef.current);
        }

        return () => observer.disconnect();
    }, []);

    useEffect(() => {
        // Logic adapted from templates/demo_animated.html
        const w = 1440;
        const h = 800; // Increased height to match template scale

        // Random number generator
        const rnd = (min: number, max: number) => Math.random() * (max - min) + min;

        // Define lines with properties
        const linesConfig = [
            { color: "#F4A261", width: "3", opacity: "0.6", delay: "0s" },   // Secondary (Orange-ish)
            { color: "#7CB342", width: "2.5", opacity: "0.6", delay: "0.3s" }, // Primary (Green)
            { color: "#EAB308", width: "2", opacity: "0.5", delay: "0.6s" },   // Yellow/Contrast
        ];

        const newPaths = linesConfig.map((config) => {
            // Start Height (Left side) - Expanded range for more deviation
            const startY = rnd(h * 0.1, h * 0.9);

            // End Height (Right side)
            const endY = rnd(h * 0.1, h * 0.9);

            // Control Points (match template logic)
            const midX = w * 0.5;
            const midY = rnd(0, h);

            const d = `
        M -50,${startY} 
        C ${w * 0.2},${rnd(0, h)} ${w * 0.4},${rnd(0, h)} ${midX},${midY}
        S ${w * 0.8},${rnd(0, h)} ${w + 50},${endY}
      `.replace(/\s+/g, ' ').trim();

            return {
                d,
                color: config.color,
                width: config.width,
                opacity: config.opacity,
                style: { animationDelay: config.delay }
            };
        });

        setPaths(newPaths);
    }, []);

    return (
        <div ref={containerRef} className={`pointer-events-none absolute w-full overflow-hidden ${className}`}>
            <svg
                viewBox="0 0 1440 800"
                xmlns="http://www.w3.org/2000/svg"
                className="w-full h-full"
                preserveAspectRatio="none"
            >
                {/* Background Grid Pattern (Optional, from template) */}
                <defs>
                    <pattern id="smallGrid" width="40" height="40" patternUnits="userSpaceOnUse">
                        <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#ccc" strokeWidth="0.5" strokeOpacity="0.1" />
                    </pattern>
                </defs>
                {/* <rect width="100%" height="100%" fill="url(#smallGrid)" /> */}

                {paths.map((p, i) => (
                    <path
                        key={i}
                        d={p.d}
                        fill="none"
                        stroke={p.color}
                        strokeWidth={p.width}
                        strokeOpacity={p.opacity}
                        className={isVisible ? "path-draw" : "opacity-0"}
                        style={{
                            ...p.style,
                            mixBlendMode: "multiply"
                        }}
                    />
                ))}
            </svg>
        </div>
    );
};

export default BezierBackground;
