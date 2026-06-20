import React, { useState, useRef } from 'react';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import { Filter } from 'lucide-react';
import CountUp from './CountUp';

const TRANSACTIONS = {
  week: [
    { id: 1, name: "Stripe Payout", amount: 32000 },
    { id: 2, name: "AWS Services", amount: 4500 },
    { id: 3, name: "Swiggy Lunch", amount: 1250 }
  ],
  month: [
    { id: 4, name: "WeWork Office", amount: 15000 },
    { id: 5, name: "Google Workspace", amount: 1200 },
    { id: 1, name: "Stripe Payout", amount: 32000 },
    { id: 6, name: "Zomato Dinner", amount: 3400 }
  ]
};

export default function TransactionSection() {
  const [filter, setFilter] = useState<'week'|'month'>('week');
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { margin: "-20%", once: false });

  // Auto toggle to show off animation
  React.useEffect(() => {
    if (!isInView) return;
    const interval = setInterval(() => {
      setFilter(f => f === 'week' ? 'month' : 'week');
    }, 4000); 
    return () => clearInterval(interval);
  }, [isInView]);

  return (
    <section ref={containerRef} className="py-40 bg-slate-50 dark:bg-[#0F1115] relative overflow-hidden">
      <div className="max-w-4xl mx-auto px-6 font-sans">
         
         <div className="text-center mb-16">
           <motion.h2 
             initial={{ opacity: 0, scale: 0.9 }}
             whileInView={{ opacity: 1, scale: 1 }}
             viewport={{ once: true }}
             className="text-5xl md:text-7xl font-bold tracking-tight text-slate-900 dark:text-white mb-6 font-sans"
           >
              Step 6: <span className="text-[#4C1D95]">Experience</span>
           </motion.h2>
           <p className="text-xl md:text-2xl text-slate-500 font-medium">
             Fluid filtering and beautifully responsive transaction lists.
           </p>
         </div>

         <div className="bg-white dark:bg-[#121213] rounded-[48px] shadow-2xl p-8 border border-slate-100 dark:border-white/5 max-w-2xl mx-auto text-left relative z-10">
            
            {/* Filter Header */}
            <div className="flex items-center justify-between mb-8 pb-6 border-b border-slate-100 dark:border-white/5">
               <div className="flex items-center gap-2 font-bold text-slate-700 dark:text-slate-300">
                  <Filter className="w-5 h-5 text-slate-400" /> Transactions
               </div>
               
               <div className="flex bg-slate-100 dark:bg-white/5 p-1 rounded-full relative">
                  <button 
                    onClick={() => setFilter('week')}
                    className={`relative z-10 px-6 py-2 rounded-full text-xs md:text-sm font-bold transition-colors duration-300 ${filter === 'week' ? 'text-[#4C1D95] dark:text-[#C4B5FD]' : 'text-slate-500'} cursor-pointer`}
                  >
                    This Week
                  </button>
                  <button 
                    onClick={() => setFilter('month')}
                    className={`relative z-10 px-6 py-2 rounded-full text-xs md:text-sm font-bold transition-colors duration-300 ${filter === 'month' ? 'text-[#4C1D95] dark:text-[#C4B5FD]' : 'text-slate-500'} cursor-pointer`}
                  >
                    This Month
                  </button>
                  
                  {/* Sliding Pill */}
                  <motion.div 
                    className="absolute inset-y-1 bg-white dark:bg-[#1A1A1D] rounded-full shadow-md"
                    animate={{ 
                      left: filter === 'week' ? '4px' : 'calc(50% + 2px)',
                      right: filter === 'week' ? 'calc(50% + 2px)' : '4px',
                    }}
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
               </div>
            </div>

            {/* List */}
            <div className="min-h-[350px] relative">
               <AnimatePresence mode="popLayout">
                  {TRANSACTIONS[filter].map((t) => (
                    <motion.div 
                      layout
                      initial={{ opacity: 0, scale: 0.9, y: 30 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9, y: -30, filter: "blur(10px)" }}
                      transition={{ type: "spring", stiffness: 350, damping: 30 }}
                      key={`${filter}-${t.id}`}
                      className="flex items-center justify-between p-5 mb-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100/50 dark:border-white/5 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                         <div className="w-12 h-12 rounded-2xl bg-[#EDF6F5] dark:bg-[#573ec4]/15 flex items-center justify-center font-bold text-[#4C1D95] dark:text-[#C4B5FD] shadow-sm">
                            {t.name.charAt(0)}
                         </div>
                         <div className="font-bold text-slate-800 dark:text-white tracking-tight">{t.name}</div>
                      </div>
                      <div className="font-extrabold text-slate-900 dark:text-white tabular-nums text-lg">
                         <CountUp 
                           to={t.amount} 
                           duration={1.5} 
                           isInView={isInView} 
                           prefix="₹" 
                         />
                      </div>
                    </motion.div>
                  ))}
               </AnimatePresence>
            </div>
         </div>
      </div>
    </section>
  );
}
