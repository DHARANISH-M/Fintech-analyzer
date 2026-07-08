import React from 'react';

interface LoaderProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export default function Loader({ className = "", size = "md" }: LoaderProps) {
  const sizeClasses = {
    sm: "scale-75 my-2",
    md: "scale-100 my-6",
    lg: "scale-125 my-12"
  };

  return (
    <div className={`flex flex-col items-center justify-center p-8 ${sizeClasses[size]} ${className}`}>
      <div className="loader mb-4" />
    </div>
  );
}
