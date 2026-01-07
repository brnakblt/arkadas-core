import React from 'react';
import Image from 'next/image';

interface LogoProps {
  className?: string;
  showText?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const Logo: React.FC<LogoProps> = ({ className = '', showText = true, size = 'md' }) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16'
  };

  const textSizeClasses = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-3xl'
  };

  return (
    <div className={`flex items-center space-x-3 ${className}`}>
      {/* Logo Image */}
      <div className={`${sizeClasses[size]} relative`}>
        <Image
          src="/images/logo.svg"
          alt="Arkadaş Özel Eğitim ve Rehabilitasyon Merkezi"
          fill
          className="object-contain transition-all duration-300"
          priority
        />
      </div>

      {/* Brand Text */}
      {showText && (
        <div className="flex flex-col">
          <span className={`font-display font-bold text-primary ${textSizeClasses[size]} leading-normal pb-1`}>
            arkadaş
          </span>
        </div>
      )}
    </div>
  );
};

export default Logo;