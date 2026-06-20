import React, { useRef } from 'react';
import { motion, useScroll, useTransform, useSpring } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import LaptopMockup from './LaptopMockup';
import DashboardPreview from './DashboardPreview';

export default function HeroSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"]
  });

  const springScroll = useSpring(scrollYProgress, { stiffness: 100, damping: 30 });
  
  const headerY = useTransform(springScroll, [0, 1], [0, -200]);
  const headerOpacity = useTransform(springScroll, [0, 0.4], [1, 0]);

  // Laptop opening effect
  const laptopRotateX = useTransform(springScroll, [0, 0.2], [55, 0]);
  const laptopScale = useTransform(springScroll, [0, 0.2], [0.8, 1]);
  const laptopY = useTransform(springScroll, [0, 0.5], [100, -100]);

  return (
    <section ref={containerRef} className="relative min-h-[140vh] w-full bg-white text-slate-900 pt-32 pb-40 overflow-hidden font-sans">
      {/* Soft Light Background Gradients */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[50%] h-[50%] rounded-full bg-teal-100/60 blur-[120px]" />
        <div className="absolute top-[20%] -right-[10%] w-[60%] h-[60%] rounded-full bg-slate-50/60 blur-[120px]" />
        <div className="absolute top-[50%] left-[20%] w-[40%] h-[40%] rounded-full bg-[#EDF6F5]/60 blur-[120px]" />
      </div>

      <div className="sticky top-24 z-10 text-center px-6 max-w-7xl mx-auto flex flex-col items-center">
        <motion.div 
          style={{ y: headerY, opacity: headerOpacity }}
          className="flex flex-col items-center"
        >
          <motion.div
             initial={{ opacity: 0, y: 30 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ duration: 1, ease: "easeOut" }}
             className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full bg-slate-50 border border-slate-200 text-slate-600 text-sm font-bold shadow-sm mb-8"
           >
            <span className="flex h-2.5 w-2.5 rounded-full bg-teal-500 animate-pulse border border-teal-200"></span>
            LedgerLens AI Engine 2.0
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.1, ease: "easeOut" }}
            className="text-6xl md:text-[5.5rem] font-extrabold tracking-tight leading-[1.05] mb-8 text-slate-900 font-sans"
          >
            Intelligent <br className="hidden md:block"/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-600 to-lime-500 font-sans">Accounting automation.</span>
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.2, ease: "easeOut" }}
            className="text-xl md:text-2xl text-slate-500 max-w-2xl font-medium mb-12"
          >
            Experience the most advanced financial data extraction. Watch as chaos transforms into absolute clarity before your eyes.
          </motion.p>
          
          <motion.div
             initial={{ opacity: 0, scale: 0.9 }}
             animate={{ opacity: 1, scale: 1 }}
             transition={{ duration: 0.8, delay: 0.4 }}
             className="flex items-center gap-4 mb-16"
          >
             <Link to="/enhanced/signup" className="group relative inline-flex items-center justify-center gap-3 px-8 py-4 bg-slate-900 text-white rounded-full font-bold text-lg hover:bg-black transition-all shadow-[0_10px_40px_rgba(0,0,0,0.2)] hover:-translate-y-1 hover:shadow-[0_20px_40px_rgba(0,0,0,0.3)]">
               See how it works
               <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
             </Link>
          </motion.div>
        </motion.div>
        
        {/* The Laptop appearing below text */}
        <div className="w-full mt-[-40px] perspective-[2000px]">
           <LaptopMockup style={{ rotateX: laptopRotateX, scale: laptopScale, y: laptopY, transformStyle: 'preserve-3d' }}>
              <DashboardPreview />
           </LaptopMockup>
        </div>

      </div>
    </section>
  );
}
