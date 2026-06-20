import React, { useRef } from 'react';
import { motion, useInView, useScroll, useTransform } from 'framer-motion';
import { Calendar } from 'lucide-react';

const TIMELINE = [
  { id: 1, label: "Week 1", docs: 12, value: "₹45,000" },
  { id: 2, label: "Week 2", docs: 34, value: "₹1,20,500" },
  { id: 3, label: "Week 3", docs: 89, value: "₹3,40,200" }
];

export default function TimelineSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { margin: "-20%", once: false });

  return (
    <section ref={containerRef} className="py-40 bg-white relative">
      <div className="max-w-4xl mx-auto px-6 text-center">
         <motion.div 
           initial={{ opacity: 0, y: 30 }}
           whileInView={{ opacity: 1, y: 0 }}
           viewport={{ once: true }}
           className="mb-24"
         >
           <h2 className="text-5xl md:text-7xl font-bold tracking-tight text-slate-900 mb-6">
              Step 5: <span className="text-[#4C1D95]">Track</span>
           </h2>
           <p className="text-xl md:text-2xl text-slate-500 max-w-2xl mx-auto font-medium">
             Continuously upload files over time to build an expanding ledger intelligence timeline.
           </p>
         </motion.div>

         <div className="relative flex flex-col md:flex-row items-center justify-between mt-20 gap-8">
            {/* The line connecting them */}
            <div className="absolute top-1/2 left-[10%] right-[10%] h-1 bg-slate-100 -translate-y-1/2 hidden md:block" />
            
            {/* Animated drawing line */}
            <motion.div 
              initial={{ width: "0%" }}
              animate={isInView ? { width: "80%" } : { width: "0%" }}
              transition={{ duration: 1.5, ease: "easeInOut" }}
              className="absolute top-1/2 left-[10%] h-1 bg-[#573ec4] -translate-y-1/2 hidden md:block" 
            />

            {TIMELINE.map((step, i) => (
              <motion.div 
                key={step.id}
                initial={{ opacity: 0, y: 50, scale: 0.8 }}
                animate={isInView ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: 50, scale: 0.8 }}
                transition={{ duration: 0.6, delay: i * 0.4 + 0.5, type: "spring" }}
                className="relative z-10 flex flex-col items-center bg-white p-6 rounded-3xl border border-slate-100 shadow-xl w-64"
              >
                <div className="w-14 h-14 bg-[#EAF4F3] rounded-full flex items-center justify-center mb-6 shadow-inner">
                  <Calendar className="w-6 h-6 text-[#4C1D95]" />
                </div>
                <h4 className="text-xl font-bold text-slate-900">{step.label}</h4>
                <div className="mt-2 text-sm font-medium text-slate-500">{step.docs} Statements</div>
                <div className="mt-4 px-4 py-2 bg-slate-50 rounded-xl font-bold text-slate-900">{step.value} Analyzed</div>
              </motion.div>
            ))}
         </div>
      </div>
    </section>
  );
}
