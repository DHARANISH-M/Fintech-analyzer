import React, { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { BrainCircuit, TrendingUp, AlertTriangle } from 'lucide-react';

const INSIGHTS = [
  {
    icon: <TrendingUp className="w-6 h-6 text-[#4C1D95]" />,
    title: "Unusual Expense Detected",
    value: "Software Subs up 24%",
    valueClass: "text-[#4C1D95]"
  },
  {
    icon: <BrainCircuit className="w-6 h-6 text-[#7353f6]" />,
    title: "Predicted Cashflow Gap",
    value: "Expected by Mar 25",
    valueClass: "text-[#573ec4]"
  },
  {
    icon: <AlertTriangle className="w-6 h-6 text-[#B39DFF]" />,
    title: "Missing Rent Payment",
    value: "Usually paid by 5th",
    valueClass: "text-[#7F9E35]"
  }
];

export default function InsightsSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { margin: "-10%", once: false });

  return (
    <section ref={containerRef} className="py-40 bg-white relative">
      <div className="max-w-6xl mx-auto px-6">
        
        <div className="text-center mb-24">
           <motion.div
             initial={{ scale: 0 }}
             animate={isInView ? { scale: 1 } : { scale: 0 }}
             transition={{ type: "spring", bounce: 0.5 }}
             className="w-20 h-20 bg-gradient-to-br from-[#4C1D95] to-[#7353f6] rounded-3xl mx-auto flex items-center justify-center shadow-2xl shadow-[#4C1D95]/30 mb-8"
           >
             <BrainCircuit className="w-10 h-10 text-white" />
           </motion.div>
           <motion.h2 
             initial={{ opacity: 0, y: 20 }}
             animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
             transition={{ delay: 0.2 }}
             className="text-5xl md:text-7xl font-bold tracking-tight text-slate-900 mb-6"
           >
              Step 8: <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#4C1D95] to-[#7353f6]">Insights</span>
           </motion.h2>
           <motion.p 
             initial={{ opacity: 0, y: 20 }}
             animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
             transition={{ delay: 0.3 }}
             className="text-xl md:text-2xl text-slate-500 font-medium max-w-2xl mx-auto"
           >
             Go beyond the ledger. LedgerLens AI detects anomalous spending patterns and cashflow risks before they happen.
           </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
           {INSIGHTS.map((insight, i) => (
             <motion.div
               key={i}
               initial={{ opacity: 0, y: 50 }}
               animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
               transition={{ duration: 0.6, delay: 0.5 + (i * 0.2), type: "spring" }}
               className="bg-slate-50 border border-slate-100 rounded-[32px] p-8 hover:shadow-2xl hover:scale-105 transition-all duration-300 group"
             >
               <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-8 bg-white shadow-sm group-hover:-translate-y-2 transition-transform`}>
                 {insight.icon}
               </div>
               <h3 className="text-xl font-bold text-slate-900 mb-2">{insight.title}</h3>
               <p className={`text-lg font-bold ${insight.valueClass}`}>{insight.value}</p>
             </motion.div>
           ))}
        </div>

      </div>
    </section>
  );
}
