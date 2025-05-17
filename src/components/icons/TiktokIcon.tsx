import React from 'react';

interface TiktokIconProps extends React.SVGProps<SVGSVGElement> {
  className?: string;
  width?: number | string;
  height?: number | string;
}

const TiktokIcon: React.FC<TiktokIconProps> = ({ className = '', width = 24, height = 24, ...props }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={width}
      height={height}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="0"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      {/* 四角の枠 */}
      <rect x="2" y="2" width="20" height="20" rx="4" fill="none" stroke="currentColor" strokeWidth="2" />
      
      {/* 音符マーク */}
      <path
        d="M17.3 8c-0.9-0.7-1.3-1.6-1.4-2.5h-2.5v8.8c0 0.8-0.7 1.5-1.5 1.5s-1.5-0.7-1.5-1.5 0.7-1.5 1.5-1.5c0.1 0 0.2 0 0.2 0v-2.1c-0.1 0-0.2 0-0.2 0-2.5 0-4.5 2-4.5 4.5s2 4.5 4.5 4.5 4.5-2 4.5-4.5v-5c0.8 0.6 1.8 0.9 2.8 0.9v-2.5c-0.7-0.1-1.3-0.1-1.9-0.6z"
        fill="currentColor"
      />
    </svg>
  );
};

export default TiktokIcon; 