import React, { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { UploadCloud, File, CheckCircle2 } from 'lucide-react';

export default function UploadSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: false, margin: "-10%" });

  return (
    <section ref={containerRef} className="relative min-h-[100vh] bg-slate-50 dark:bg-[#0F1115] flex items-center justify-center py-32 overflow-hidden">
       <div className="max-w-[1400px] w-full mx-auto px-6 lg:px-12 flex flex-col lg:flex-row items-center gap-16 lg:gap-24 relative z-10 font-sans">
          
          {/* Text Content - Slides in from left */}
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -50 }}
            transition={{ duration: 1, ease: "easeOut", type: "spring", bounce: 0.3 }}
            className="w-full lg:w-[40%] text-left"
          >
             <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#EAF4F3] dark:bg-[#573ec4]/20 text-[#3F6E6D] dark:text-[#C4B5FD] text-xs font-bold uppercase tracking-widest mb-6 border border-[#D5E8E7] dark:border-[#573ec4]/30">
               Step 1
             </div>
             <h2 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-slate-900 dark:text-white mb-6 leading-[1.1]">
                The <span className="text-[#4C1D95]">Upload</span>
             </h2>
             <p className="text-xl md:text-2xl text-slate-500 font-medium leading-relaxed max-w-lg">
                Drag and drop your messy, multi-page PDF bank statements. LedgerLens begins structuring them instantly.
             </p>
          </motion.div>

          {/* Floating Dropzone Elements */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 50 }}
            animate={isInView ? { opacity: 1, scale: 1, y: 0 } : { opacity: 0, scale: 0.9, y: 50 }}
            transition={{ duration: 0.8, delay: 0.2, type: "spring", bounce: 0.3 }}
            className="w-full lg:w-[60%] perspective-[2000px] flex items-center justify-center"
          >
             <div className="w-full max-w-[600px] relative rounded-[40px] bg-white dark:bg-[#121213] shadow-[0_40px_100px_rgba(0,0,0,0.08)] border border-slate-100 dark:border-white/5 p-8 h-[450px] md:h-[500px] flex flex-col items-center justify-center transform-gpu transition-all">
                
                {/* Dashed drop area */}
                <div className="absolute inset-6 rounded-[32px] border-[3px] border-dashed border-[#D5E8E7] dark:border-[#573ec4]/30 bg-[#EDF6F5]/30 dark:bg-[#573ec4]/10 flex flex-col items-center justify-center overflow-hidden">
                   
                   {/* This part stays until replaced */}
                   <motion.div 
                      initial={{ opacity: 1, scale: 1 }}
                      animate={isInView ? { opacity: 0, scale: 0.9, y: -20 } : { opacity: 1, scale: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: 1.5 }}
                      className="flex flex-col items-center z-10 w-full text-center px-4"
                   >
                      <div className="w-20 h-20 md:w-24 md:h-24 bg-white dark:bg-[#0F1115] shadow-xl shadow-[#D5E8E7]/70 dark:shadow-[#573ec4]/10 rounded-full flex items-center justify-center mb-6">
                         <UploadCloud className="w-10 h-10 md:w-12 md:h-12 text-[#4C1D95]" />
                      </div>
                      <p className="text-xl md:text-2xl font-bold text-slate-800 dark:text-white tracking-tight">Drop your statement here</p>
                      <p className="text-sm md:text-base text-slate-400 mt-2 font-medium">Supports PDF, CSV, Excel</p>
                   </motion.div>

                   {/* Replacing card */}
                   <motion.div
                      initial={{ y: 100, opacity: 0, scale: 0.8 }}
                      animate={isInView ? { y: 0, opacity: 1, scale: 1 } : { y: 100, opacity: 0, scale: 0.8 }}
                      transition={{ duration: 0.8, type: "spring", bounce: 0.4, delay: 1.8 }}
                      className="absolute z-20 w-[85%] md:w-[450px] px-6 py-6 md:py-8 bg-white dark:bg-[#1A1A1D] rounded-3xl shadow-[0_25px_60px_rgba(0,0,0,0.15)] border border-slate-100 dark:border-white/10 flex items-center gap-4 md:gap-6"
                   >
                      <div className="w-14 h-14 md:w-16 md:h-16 bg-red-50 dark:bg-red-500/10 rounded-2xl flex shrink-0 items-center justify-center border border-red-100 dark:border-red-500/20 shadow-sm">
                        <File className="w-7 h-7 md:w-8 md:h-8 text-red-500" />
                      </div>
                      <div className="flex-1 min-w-0 text-left">
                        <h3 className="text-base md:text-xl font-bold text-slate-900 dark:text-white truncate tracking-tight">Bank_Statement_Mar.pdf</h3>
                        <p className="text-slate-400 font-bold mt-1 text-[10px] md:text-xs">3.4 MB • 42 Pages</p>
                        
                        <div className="h-2 w-full bg-slate-100 dark:bg-white/5 rounded-full mt-4 relative overflow-hidden">
                           <motion.div 
                             initial={{ width: 0 }}
                             animate={isInView ? { width: "100%" } : { width: 0 }}
                             transition={{ delay: 2.5, duration: 1.5, ease: "easeInOut" }}
                             className="absolute inset-y-0 left-0 bg-[#573ec4] rounded-full"
                           />
                        </div>
                      </div>
                      
                      <motion.div
                        initial={{ scale: 0, rotate: -180 }}
                        animate={isInView ? { scale: 1, rotate: 0 } : { scale: 0, rotate: -180 }}
                        transition={{ duration: 0.5, delay: 4.0, type: "spring", bounce: 0.6 }}
                        className="absolute -top-3 -right-3 md:-top-4 md:-right-4 w-10 h-10 md:w-12 md:h-12 bg-[#573ec4] rounded-full flex items-center justify-center shadow-lg border-[4px] border-white dark:border-[#121213]"
                      >
                        <CheckCircle2 className="w-5 h-5 md:w-6 md:h-6 text-white" />
                      </motion.div>
                   </motion.div>
                </div>
             </div>
          </motion.div>

       </div>
    </section>
  );
}
