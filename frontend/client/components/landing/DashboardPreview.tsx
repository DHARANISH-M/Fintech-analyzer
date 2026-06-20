import React from 'react';
import { motion } from 'framer-motion';
import { 
  LineChart, Line, XAxis, ResponsiveContainer,
  BarChart, Bar, Cell, CartesianGrid
} from 'recharts';
import { 
  Bell, Calendar, ChevronDown, ArrowRight, Sparkles, Activity, 
  Gamepad2, Dribbble, Music, Home, Search
} from 'lucide-react';

// Simplified mini data
const balanceData = [
  { month: 'Oct', value: 3000 },
  { month: 'Nov', value: 3200 },
  { month: 'Dec', value: 3100 },
  { month: 'Jan', value: 4500 },
  { month: 'Feb', value: 6514 },
  { month: 'Mar', value: 4000 },
  { month: 'Apr', value: 2500 },
];

const cashFlowData = [
  { month: 'Oct', value: 1200 },
  { month: 'Nov', value: 1500 },
  { month: 'Dec', value: 1400 },
  { month: 'Jan', value: 1800 },
  { month: 'Feb', value: 4821 },
  { month: 'Mar', value: 1000 },
  { month: 'Apr', value: 800 },
];

const upcomingBills = [
  { name: 'Twitch', amount: '₹9.99', icon: Gamepad2, color: 'text-[#4C1D95]', bg: 'bg-[#EAF4F3]' },
  { name: 'Dribbble Pro', amount: '₹15.00', icon: Dribbble, color: 'text-rose-600', bg: 'bg-rose-50' },
  { name: 'Spotify', amount: '₹10.99', icon: Music, color: 'text-[#4C1D95]', bg: 'bg-[#EAF4F3]' },
  { name: 'Airbnb', amount: '₹220.00', icon: Home, color: 'text-rose-500', bg: 'bg-rose-50' },
];

const MiniGauge = () => (
    <div className="relative w-full aspect-[2/1] overflow-hidden flex flex-col items-center justify-center -mt-2">
      <svg viewBox="0 0 200 110" className="w-[85%]">
        <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke="#f1f5f9" strokeWidth="20" strokeLinecap="round" />
        <motion.path 
          initial={{ pathLength: 0 }} animate={{ pathLength: 0.7 }} transition={{ duration: 1.5 }}
          d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke="#573ec4" strokeWidth="20" strokeLinecap="round" strokeDasharray="251.2"
        />
      </svg>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 translate-y-2">
         <h4 className="text-[12px] font-black text-slate-900">₹1,284.50</h4>
      </div>
    </div>
);

export default function DashboardPreview() {
  return (
    <div className="w-full h-full bg-[#f8fafc] dark:bg-[#0F1115] flex overflow-hidden font-sans border border-slate-200 dark:border-white/5 rounded-2xl shadow-2xl">
      
      {/* 1. Sidebar Mimic */}
      <div className="w-[45px] h-full bg-white dark:bg-[#121213] border-r border-slate-100 dark:border-white/5 flex flex-col items-center py-4 gap-4 z-10 shrink-0">
         <div className="w-6 h-6 bg-slate-900 rounded-lg flex items-center justify-center mb-4">
            <span className="text-[10px] text-white">L</span>
         </div>
         <div className="w-7 h-7 bg-[#EDF6F5] rounded-full flex items-center justify-center text-[#4C1D95]">
            <Activity className="w-3.5 h-3.5" />
         </div>
         <div className="w-7 h-7 hover:bg-slate-50 rounded-full flex items-center justify-center text-slate-400">
            <LineChart className="w-3.5 h-3.5" />
         </div>
         <div className="w-7 h-7 hover:bg-slate-50 rounded-full flex items-center justify-center text-slate-400">
            <Calendar className="w-3.5 h-3.5" />
         </div>
      </div>

      {/* 2. Main Content Mimic */}
      <div className="flex-1 overflow-hidden flex flex-col p-4 md:p-6 pb-2">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-3 mb-6">
           <div className="text-left w-full md:w-auto">
              <h2 className="text-[16px] font-black text-slate-900 dark:text-white leading-tight">Dashboard Overview</h2>
              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Financial Intelligence</p>
           </div>
           
           <div className="flex items-center gap-2 scale-75 md:scale-95 origin-right ml-auto">
              <div className="w-[100px] h-7 bg-white dark:bg-[#1A1A1D] rounded-full border border-slate-100 dark:border-white/10 flex items-center px-3 gap-2">
                 <Calendar className="w-2.5 h-2.5 text-slate-400" />
                 <span className="text-[9px] font-bold text-slate-600">This Month</span>
              </div>
              <div className="w-7 h-7 bg-white dark:bg-[#1A1A1D] rounded-full border border-slate-100 dark:border-white/10 flex items-center justify-center">
                 <Bell className="w-3.5 h-3.5 text-slate-400" />
              </div>
           </div>
        </div>

        {/* Grid Area */}
        <div className="flex-1 grid grid-cols-12 gap-3 min-h-0">
           
           {/* Left Col (8) */}
           <div className="col-span-8 flex flex-col gap-3 h-full">
              {/* Total Balance Card */}
              <div className="bg-white dark:bg-[#121213] p-3 rounded-2xl border border-slate-100 dark:border-white/5 flex-1 flex flex-col">
                 <div className="flex justify-between mb-1">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Total Balance</span>
                    <ChevronDown className="w-2.5 h-2.5 text-slate-300" />
                 </div>
                 <h3 className="text-[18px] font-black text-slate-900 dark:text-white mb-auto">₹6,514.00</h3>
                 
                 <div className="h-[75px] w-full mt-2">
                    <ResponsiveContainer width="100%" height="100%">
                       <LineChart data={balanceData}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" opacity={0.1} />
                          <Line type="monotone" dataKey="value" stroke="#573ec4" strokeWidth={2.5} dot={false} isAnimationActive animationDuration={1000} animationEasing="ease-out" />
                       </LineChart>
                    </ResponsiveContainer>
                 </div>
              </div>

              {/* Cash Flow Card */}
              <div className="bg-white dark:bg-[#121213] p-3 rounded-2xl border border-slate-100 dark:border-white/5 flex-1 flex flex-col">
                 <div className="flex justify-between mb-1">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Cash Flow</span>
                    <div className="flex gap-1">
                       <div className="w-6 h-3 bg-[#EDF6F5] dark:bg-[#573ec4]/15 rounded-full" />
                       <div className="w-6 h-3 bg-slate-50 dark:bg-white/5 rounded-full" />
                    </div>
                 </div>
                 <h3 className="text-[18px] font-black text-slate-900 dark:text-white mb-auto">₹4,821.50</h3>
                 
                 <div className="h-[70px] w-full mt-2">
                    <ResponsiveContainer width="100%" height="100%">
                       <BarChart data={cashFlowData}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" opacity={0.1} />
                          <Bar dataKey="value" fill="#7353f6" radius={[3, 3, 3, 3]} isAnimationActive animationDuration={1000} animationEasing="ease-out" />
                       </BarChart>
                    </ResponsiveContainer>
                 </div>
              </div>
           </div>

           {/* Right Col (4) */}
           <div className="col-span-4 flex flex-col gap-3 h-full overflow-hidden">
              {/* Spending Card */}
              <div className="bg-white dark:bg-[#121213] p-3 rounded-2xl border border-slate-100 dark:border-white/5 flex-1 flex flex-col items-center">
                 <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest self-start mb-2">Spending Overview</span>
                 <MiniGauge />
              </div>

              {/* Bills Mini Card */}
              <div className="bg-white dark:bg-[#121213] p-3 rounded-2xl border border-slate-100 dark:border-white/5 flex-[1.5] flex flex-col">
                 <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-3">Upcoming Bills</span>
                 <div className="flex flex-col gap-2">
                    {upcomingBills.slice(0, 3).map((bill, i) => (
                       <div key={i} className="flex items-center justify-between pb-1 border-b border-slate-50 dark:border-white/5 last:border-0">
                          <div className="flex items-center gap-1.5 min-w-0">
                             <div className={`w-5 h-5 rounded-md ${bill.bg} dark:bg-white/5 flex items-center justify-center shrink-0`}>
                                <bill.icon className={`w-3 h-3 ${bill.color}`} />
                             </div>
                             <span className="text-[8px] font-bold text-slate-800 dark:text-white truncate">{bill.name}</span>
                          </div>
                          <span className="text-[8px] font-black text-slate-900 dark:text-white shrink-0">{bill.amount}</span>
                       </div>
                    ))}
                 </div>
              </div>
           </div>

        </div>
        
        {/* Animated Tooltip Decorator */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 1 }}
          className="absolute bottom-10 right-10 bg-[#4C1D95] text-white p-3 rounded-2xl shadow-2xl flex items-center gap-2 z-20"
        >
           <Sparkles className="w-3.5 h-3.5" />
           <span className="text-[10px] font-bold whitespace-nowrap">AI Placement Active</span>
        </motion.div>

      </div>
    </div>
  );
}

