import React, { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { DownloadCloud, FileSpreadsheet } from 'lucide-react';

export default function ExportSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { margin: "-20%", once: false });

  return (
    <section ref={containerRef} className="py-40 bg-slate-50 text-slate-900 overflow-hidden flex items-center justify-center">
      <div className="max-w-6xl w-full mx-auto px-6 flex flex-col md:flex-row items-center gap-16">
         
         <div className="flex-1 z-20">
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
              transition={{ duration: 0.8 }}
            >
              <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mb-8 shadow-sm border border-slate-200">
                 <DownloadCloud className="w-8 h-8 text-[#4C1D95]" />
              </div>
              <h2 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 text-slate-900">
                 Step 7: <span className="text-[#4C1D95]">Export</span>
              </h2>
              <p className="text-xl md:text-2xl text-slate-500 font-medium mb-10 max-w-lg">
                Your perfectly structured, AI-categorized ledger. Ready to download as an Excel sheet instantly.
              </p>
              
              <button className="px-8 py-4 bg-[#4C1D95] hover:bg-[#4f7f7d] text-white font-bold rounded-full transition-transform hover:scale-105 shadow-[0_10px_30px_rgba(94,143,142,0.3)]">
                 See Demo Export
              </button>
            </motion.div>
         </div>

         <div className="flex-1 relative h-[500px] w-full perspective-1000">
            {/* Excel Sheet Mockup */}
            <motion.div 
              initial={{ x: "100%", rotateY: -30, opacity: 0 }}
              animate={isInView ? { x: "0%", rotateY: -15, opacity: 1 } : { x: "100%", rotateY: -30, opacity: 0 }}
              transition={{ duration: 1.2, type: "spring", bounce: 0.2 }}
              className="absolute right-0 top-10 w-[600px] h-[400px] bg-white rounded-xl shadow-2xl p-2 border border-slate-200 transform-gpu overflow-hidden z-20"
              style={{ transformStyle: 'preserve-3d' }}
            >
               {/* Excel Toolbar Mockup */}
               <div className="h-10 border-b border-[#D5E8E7] bg-[#EDF6F5] flex items-center px-4 gap-2">
                 <FileSpreadsheet className="w-5 h-5 text-[#4C1D95]" />
                 <span className="text-sm font-bold text-[#3F6E6D]">Ledger_Export.xlsx</span>
               </div>
               
               {/* Excel Grid Mockup */}
               <div className="grid grid-cols-4 border-b border-slate-200">
                 {['Date', 'Description', 'Category', 'Amount'].map(h => (
                   <div key={h} className="p-2 border-r border-slate-200 text-xs font-bold text-slate-600 bg-slate-50">{h}</div>
                 ))}
               </div>
               
               {[...Array(8)].map((_, i) => (
                 <motion.div 
                   key={i} 
                   initial={{ opacity: 0, x: 20 }}
                   animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: 20 }}
                   transition={{ delay: 1 + (i * 0.1) }}
                   className="grid grid-cols-4 border-b border-slate-100"
                 >
                   <div className="p-2 border-r border-slate-100 text-xs text-slate-800">12/03/2026</div>
                   <div className="p-2 border-r border-slate-100 text-xs font-medium text-slate-800">AWS Services</div>
                   <div className="p-2 border-r border-slate-100 text-xs text-slate-600">Cloud Infrastructure</div>
                   <div className="p-2 text-xs font-mono text-slate-800">₹4,500.00</div>
                 </motion.div>
               ))}
            </motion.div>

            {/* Glowing Backdrop */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-[#EAF4F3]/80 blur-[100px] rounded-full pointer-events-none z-10" />
         </div>
      </div>
    </section>
  );
}
