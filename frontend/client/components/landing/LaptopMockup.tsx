import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';

interface LaptopMockupProps extends HTMLMotionProps<"div"> {
  children: React.ReactNode;
}

export default function LaptopMockup({ children, className = "", ...props }: LaptopMockupProps) {
  return (
    <motion.div 
      className={`w-full max-w-[1000px] perspective-[2000px] mx-auto ${className}`}
      {...props}
    >
      <div className="relative">
        {/* Laptop Screen Frame (Silver Aluminum Edge with Black Glass Bezel) */}
        <div className="relative aspect-[16/10] w-full bg-black rounded-t-[2rem] rounded-b-xl p-3 md:p-5 shadow-2xl border-[3px] border-[#d1d5db] overflow-hidden">
          {/* Internal screen */}
          <div className="absolute inset-x-3 md:inset-x-5 inset-y-3 md:inset-y-5 rounded-lg bg-white overflow-hidden shadow-inner flex flex-col">
             {/* Fake browser/app header for extra realism */}
             <div className="h-8 bg-slate-100 border-b border-slate-200 flex items-center px-4 gap-2 shrink-0">
                <div className="w-2.5 h-2.5 rounded-full bg-red-400"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-amber-400"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-green-400"></div>
                <div className="mx-auto h-4 w-1/3 bg-white rounded-md border border-slate-200 shadow-sm"></div>
             </div>
             {/* Dynamic Content area */}
             <div className="flex-1 relative bg-slate-50 overflow-hidden">
               {children}
             </div>
          </div>
          
          {/* Camera notch */}
          <div className="absolute top-1.5 md:top-2 left-1/2 -translate-x-1/2 w-3 md:w-4 h-3 md:h-4 bg-gray-900 rounded-full border border-[#111] shadow-inner" />
        </div>

        {/* Laptop Base (Silver Keyboard Deck Edge) */}
        <div className="relative w-[114%] left-[-7%] h-6 md:h-10 bg-[#e5e7eb] rounded-b-[2rem] rounded-t-sm mt-0.5 flex justify-center shadow-[0_30px_60px_rgba(0,0,0,0.2)] overflow-hidden z-10 border border-[#d1d5db]">
           {/* Trackpad indentation */}
           <div className="w-24 md:w-32 h-full bg-[#d1d5db] rounded-t-xl mx-auto shadow-inner" />
           <div className="absolute top-0 w-full h-[2px] bg-white opacity-80" />
           {/* Base reflection */}
           <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent opacity-60" />
           <div className="absolute bottom-0 w-full h-1 bg-[#9ca3af]" />
        </div>
      </div>
    </motion.div>
  );
}
