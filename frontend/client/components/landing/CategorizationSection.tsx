import React, { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import { Sparkles, ArrowRight, CornerDownRight, BrainCircuit } from 'lucide-react';

export default function CategorizationSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { margin: "-20%", once: false });

  const [phase, setPhase] = useState(0);

  useEffect(() => {
    if (!isInView) {
      setPhase(0);
      return;
    }
    const timer1 = setTimeout(() => setPhase(1), 800);
    const timer2 = setTimeout(() => setPhase(2), 2200);
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [isInView]);

  return (
    <section ref={containerRef} className="py-32 bg-slate-50 relative min-h-[100vh] flex items-center overflow-hidden">
      <div className="max-w-[1400px] w-full mx-auto px-6 lg:px-12 flex flex-col lg:flex-row items-center gap-16 lg:gap-24 relative z-10">
         
         {/* Text Content */}
         <motion.div 
           initial={{ opacity: 0, x: -50 }}
           animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -50 }}
           transition={{ duration: 1, ease: "easeOut", type: "spring", bounce: 0.3 }}
           className="w-full lg:w-[40%] text-left"
         >
           <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#EAF4F3] text-[#3F6E6D] text-xs font-bold uppercase tracking-widest mb-6 border border-[#D5E8E7]">
             Step 3
           </div>
           <h2 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-slate-900 mb-6 leading-[1.1]">
              Deep <span className="text-[#4C1D95]">Classification</span>
           </h2>
           <p className="text-xl md:text-2xl text-slate-500 font-medium leading-relaxed max-w-lg">
             Our AI maps ambiguous transaction strings to standardized financial ledgers with extreme confidence.
           </p>
         </motion.div>

         {/* Bespoke Pipeline Animation - Replaces Laptop */}
         <motion.div 
           initial={{ opacity: 0, scale: 0.95, y: 50 }}
           animate={isInView ? { opacity: 1, scale: 1, y: 0 } : { opacity: 0, scale: 0.95, y: 50 }}
           transition={{ duration: 0.8, delay: 0.2, type: "spring" }}
           className="w-full lg:w-[60%] flex flex-col items-center justify-center p-6 md:p-12"
         >
           <div className="w-full max-w-md mx-auto flex flex-col gap-6 md:gap-8 relative">
              
              {/* Top Raw Block */}
              <div className="w-full bg-slate-900 text-white rounded-3xl p-6 shadow-[0_20px_40px_rgba(0,0,0,0.15)] border border-slate-700 relative z-20">
                 <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex flex-col gap-1">
                      <span className="text-slate-400 font-mono text-xs uppercase tracking-widest">Raw Statement String</span>
                      <motion.div 
                        animate={phase >= 1 ? { color: "#9ca3af" } : { color: "#ffffff" }}
                        className="text-xl md:text-3xl font-mono font-bold break-all"
                      >
                        SWIGGY*INSTAMART
                      </motion.div>
                    </div>
                    <div className="px-3 py-1 bg-slate-800 rounded text-red-400 font-bold font-mono text-sm self-start md:self-auto">
                      - ₹1,240.00
                    </div>
                 </div>
              </div>

              {/* Connecting AI Node */}
              <div className="flex justify-center relative z-10 -my-4 h-24">
                 <div className="absolute top-0 bottom-0 w-[2px] bg-slate-200" />
                 
                 <motion.div
                   initial={{ scale: 0 }}
                   animate={phase >= 1 ? { scale: 1 } : { scale: 0 }}
                   transition={{ duration: 0.5, type: "spring" }}
                   className="w-16 h-16 bg-white rounded-full border border-slate-200 shadow-xl flex items-center justify-center z-10 self-center relative"
                 >
                   <AnimatePresence mode="wait">
                     {phase === 1 ? (
                        <motion.div 
                          key="processing"
                          initial={{ opacity: 0, rotate: -90 }} animate={{ opacity: 1, rotate: 0 }} exit={{ opacity: 0, scale: 0 }}
                          className="w-full h-full flex items-center justify-center"
                        >
                          <BrainCircuit className="w-8 h-8 text-[#4C1D95] animate-pulse" />
                          <span className="absolute w-full h-full rounded-full border-[3px] border-[#EDF6F5] border-t-[#4C1D95] animate-[spin_1.5s_linear_infinite]" />
                        </motion.div>
                     ) : phase === 2 ? (
                        <motion.div 
                          key="done"
                          initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                          className="w-full h-full bg-[#573ec4] rounded-full flex items-center justify-center scale-[1.05]"
                        >
                          <ArrowRight className="w-8 h-8 text-white rotate-90" />
                        </motion.div>
                     ) : null}
                   </AnimatePresence>
                 </motion.div>
              </div>

              {/* Bottom Result Block */}
              <div className="w-full min-h-[140px] relative z-20">
                 <AnimatePresence mode="wait">
                   {phase < 2 ? (
                     <motion.div 
                       key="empty"
                       initial={{ opacity: 0, y: 20 }}
                       animate={{ opacity: 1, y: 0 }}
                       exit={{ opacity: 0, y: 20, scale: 0.95 }}
                       className="w-full h-[140px] rounded-3xl border-[3px] border-dashed border-slate-200 flex items-center justify-center bg-white/50"
                     >
                       <span className="text-slate-400 font-bold">Standardizing record...</span>
                     </motion.div>
                   ) : (
                     <motion.div 
                       key="resolved"
                       initial={{ opacity: 0, y: -20, scale: 0.9 }}
                       animate={{ opacity: 1, y: 0, scale: 1 }}
                       transition={{ duration: 0.6, type: "spring", bounce: 0.4 }}
                       className="w-full bg-white rounded-3xl p-6 md:p-8 shadow-[0_20px_50px_rgba(110,159,157,0.2)] border border-[#D5E8E7] relative overflow-hidden"
                     >
                       <div className="absolute inset-0 bg-gradient-to-br from-[#EDF6F5] to-white pointer-events-none" />
                       
                       <div className="relative z-10 flex flex-col gap-4">
                          <div className="flex flex-col">
                             <div className="text-xs font-bold text-[#4C1D95] uppercase tracking-widest flex items-center gap-1 mb-1">
                               <CornerDownRight className="w-4 h-4"/> Mapped Category
                             </div>
                             <div className="text-3xl md:text-5xl font-extrabold text-slate-800 tracking-tight">
                                Food & Dining
                             </div>
                          </div>
                          
                          <motion.div 
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.4 }}
                            className="inline-flex w-fit px-4 py-2 bg-[#4C1D95] rounded-full text-sm font-bold text-white items-center gap-2 shadow-sm"
                          >
                            <Sparkles className="w-4 h-4 fill-white animate-pulse" />
                            99.9% Context Match
                          </motion.div>
                       </div>
                     </motion.div>
                   )}
                 </AnimatePresence>
              </div>
              
           </div>
         </motion.div>

      </div>
    </section>
  );
}
