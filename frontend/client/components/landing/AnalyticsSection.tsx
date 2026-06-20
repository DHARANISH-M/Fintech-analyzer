import React, { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { PieChart, LineChart } from 'lucide-react';
import LaptopMockup from './LaptopMockup';
import CountUp from './CountUp';

export default function AnalyticsSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { margin: "-20%", once: false });

  return (
    <section ref={containerRef} className="py-32 bg-white text-slate-900 dark:bg-[#0F1115] relative min-h-[100vh] flex items-center overflow-hidden">
       {/* Background Decoration */}
       <div className="absolute top-[30%] -right-[10%] w-[50%] h-[50%] rounded-full bg-[#EAF4F3]/60 dark:bg-[#573ec4]/10 blur-[120px] pointer-events-none" />

       <div className="max-w-[1400px] mx-auto px-6 lg:px-12 w-full flex flex-col lg:flex-row-reverse items-center gap-16 lg:gap-24 relative z-10 font-sans">
          
          {/* Text Content - Slides in from right */}
          <motion.div 
            initial={{ opacity: 0, x: 50 }}
            animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: 50 }}
            transition={{ duration: 1, ease: "easeOut", type: "spring", bounce: 0.3 }}
            className="w-full lg:w-[40%] text-left"
          >
             <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#EAF4F3] dark:bg-[#573ec4]/20 text-[#3F6E6D] dark:text-[#C4B5FD] text-xs font-bold uppercase tracking-widest mb-6 border border-[#D5E8E7] dark:border-[#573ec4]/30">
               Step 4
             </div>
             <h2 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6 leading-[1.1] dark:text-white">
                Real-Time <span className="text-[#4C1D95] italic">Analytics</span>
             </h2>
             <p className="text-xl md:text-2xl text-slate-500 font-medium leading-relaxed">
                Interactive analytics built natively on top of the parsed ledgers. Get real-time cashflow visibility in a beautiful interface.
             </p>
          </motion.div>

          {/* Laptop - Slides in from left */}
          <motion.div 
            initial={{ opacity: 0, x: -100 }}
            animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -100 }}
            transition={{ duration: 1, delay: 0.2, ease: "easeOut", type: "spring", bounce: 0.2 }}
            className="w-full lg:w-[60%] flex items-center justify-center relative"
          >
            <div className="relative w-full">
               <LaptopMockup>
                  <div className="w-full h-full bg-slate-50 dark:bg-[#121213] flex flex-col p-4 md:p-6 overflow-hidden text-left relative">
                     <div className="w-full h-full bg-white dark:bg-[#0F1115] rounded-2xl shadow-sm border border-slate-100 dark:border-white/5 flex flex-col relative overflow-hidden">
                        
                        {/* Top Stats Bar */}
                        <div className="h-20 md:h-28 border-b border-slate-100 dark:border-white/5 flex items-center px-4 md:px-8 gap-4 md:gap-8 bg-slate-50/30 dark:bg-white/5">
                           <div className="flex flex-col gap-0.5 md:gap-1">
                             <div className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 whitespace-nowrap">
                               <LineChart className="w-3 h-3 md:w-4 md:h-4 text-[#4C1D95]" />
                               Total Inflow
                             </div>
                             <div className="text-2xl md:text-4xl lg:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tighter">
                               <CountUp to={412500} duration={2.5} isInView={isInView} prefix="₹" />
                             </div>
                           </div>
                           
                           <div className="w-[1px] h-8 md:h-12 bg-slate-200 dark:bg-white/10 mx-auto hidden sm:block"></div>
                           
                           <div className="flex flex-col gap-0.5 md:gap-1 pl-4 md:pl-0">
                             <div className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 whitespace-nowrap">
                               <PieChart className="w-3 h-3 md:w-4 md:h-4 text-[#7353f6]" />
                               Total Outflow
                             </div>
                             <div className="text-2xl md:text-4xl lg:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tighter">
                               <CountUp to={245600} duration={2.5} isInView={isInView} prefix="₹" />
                             </div>
                           </div>
                        </div>

                        {/* Animated Bar Charts Container */}
                        <div className="flex-1 relative pb-4 px-6 md:px-10 pt-10 flex items-end justify-between gap-3 md:gap-6 lg:gap-8 bg-white dark:bg-[#0F1115]">
                           
                           {/* Chart grid lines */}
                           <div className="absolute inset-x-6 md:inset-x-10 inset-y-8 flex flex-col justify-between pointer-events-none">
                             {[...Array(4)].map((_, i) => (
                               <div key={i} className="w-full border-t border-slate-100 dark:border-white/5 border-dashed" />
                             ))}
                           </div>

                           {[40, 70, 45, 90, 60, 100].map((height, i) => (
                              <motion.div 
                                 key={i}
                                 initial={{ height: "0%" }}
                                 animate={isInView ? { height: `${height}%` } : { height: "0%" }}
                                 transition={{ duration: 1.2, delay: i * 0.1, ease: "easeOut", type: "spring", bounce: 0.4 }}
                                 className="w-full bg-gradient-to-t from-[#573ec4] via-[#7353f6] to-[#C4B5FD] rounded-t-lg relative group shadow-md z-10 max-w-[60px] md:max-w-[80px]"
                              >
                                <div className="absolute top-0 left-0 w-full h-full bg-white/0 group-hover:bg-white/20 transition-colors rounded-t-lg" />
                                <motion.div 
                                  initial={{ opacity: 0 }} 
                                  animate={isInView ? { opacity: 1 } : { opacity: 0 }} 
                                  transition={{ delay: 1.5 + (i * 0.1) }}
                                  className="absolute -top-6 md:-top-8 left-1/2 -translate-x-1/2 text-[10px] md:text-xs font-bold text-slate-600 bg-white px-1.5 md:px-2 py-0.5 md:py-1 rounded shadow-sm border border-slate-100 hidden sm:block"
                                >
                                   ₹{Math.floor(height * 2.45)}k
                                </motion.div>
                              </motion.div>
                           ))}
                        </div>
                     </div>
                  </div>
               </LaptopMockup>

               {/* Integrated Floating Icon - better placement */}
               <motion.div 
                 initial={{ scale: 0, rotate: -20, opacity: 0, y: 20 }}
                 animate={isInView ? { scale: 1, rotate: 12, opacity: 1, y: 0 } : { scale: 0, rotate: -20, opacity: 0, y: 20 }}
                 transition={{ duration: 1.2, type: "spring", bounce: 0.4, delay: 0.8 }}
                 className="absolute -bottom-10 -right-4 md:-bottom-12 md:right-0 w-20 h-20 md:w-32 md:h-32 bg-white dark:bg-[#121213] border border-slate-100 dark:border-white/10 rounded-3xl flex items-center justify-center p-5 md:p-8 shadow-[0_30px_60px_rgba(0,0,0,0.12)] z-30 pointer-events-none"
               >
                 <LineChart className="w-full h-full text-[#4C1D95]" strokeWidth={2.5} />
               </motion.div>
            </div>
          </motion.div>

       </div>
    </section>
  );
}

