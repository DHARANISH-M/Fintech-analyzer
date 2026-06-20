import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Bell, Shield, Wallet, CreditCard, LogOut, ChevronDown } from 'lucide-react';

export default function Settings() {
  const [fullName, setFullName] = useState(localStorage.getItem('user_name') || 'Deepan S.');
  const [username, setUsername] = useState(localStorage.getItem('user_username') || '');
  const [email, setEmail] = useState(localStorage.getItem('user_email') || 'nexus@example.com');
  const [phone, setPhone] = useState(localStorage.getItem('user_phone') || '');
  const [currency, setCurrency] = useState(localStorage.getItem('user_currency') || '₹');

  const initials = fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  const handleSave = () => {
    localStorage.setItem('user_name', fullName);
    localStorage.setItem('user_username', username);
    localStorage.setItem('user_email', email);
    localStorage.setItem('user_phone', phone);
    localStorage.setItem('user_currency', currency);
    alert('Profile updated successfully.');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 font-sans">
      <section className="cursor-card p-8">
        <p className="text-[10px] font-bold uppercase tracking-wider text-primary font-sans">ACCOUNT & PREFERENCES</p>
        <h1 className="mt-2 text-3xl font-heading font-normal tracking-tight text-foreground">Settings</h1>
        <p className="mt-2 text-sm leading-relaxed text-card-foreground font-light">
          Manage your account configurations, workspace profiles, and preferences.
        </p>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-start">
        {/* Settings Sidebar Nav */}
        <div className="md:col-span-1 space-y-1 font-sans">
          {[
            { icon: User, label: 'Profile', active: true },
            { icon: Building, label: 'Company Info', active: false },
            { icon: Bell, label: 'Notifications', active: false },
            { icon: Shield, label: 'Security', active: false },
            { icon: Wallet, label: 'Billing', active: false },
            { icon: CreditCard, label: 'Integrations', active: false },
          ].map((item) => (
            <button key={item.label} className={`w-full flex items-center gap-3 px-4 py-2.5 transition-all border rounded-md text-[13px] ${
              item.active 
                ? 'bg-card border-border text-primary font-medium shadow-sm' 
                : 'text-muted-foreground border-transparent hover:bg-card hover:border-border hover:text-foreground font-medium'
            }`} style={{ borderRadius: "8px" }}>
              <item.icon className="w-4 h-4" />
              <span>{item.label}</span>
            </button>
          ))}
          
          <div className="pt-4 mt-4 border-t border-border">
            <button className="w-full flex items-center gap-3 px-4 py-2.5 border border-transparent text-destructive hover:bg-destructive/5 font-semibold transition-all rounded-md" style={{ borderRadius: "8px" }}>
              <LogOut className="w-4 h-4" />
              <span>Log out</span>
            </button>
          </div>
        </div>

        {/* Settings Content Area */}
        <div className="md:col-span-3">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="cursor-card p-6"
          >
            <h2 className="font-heading text-lg font-normal text-foreground tracking-tight mb-6 pb-2 border-b border-border">Profile settings</h2>
            
            <div className="flex items-center gap-6 mb-8">
              <div className="w-16 h-16 bg-sub-card border border-sub-border flex items-center justify-center text-foreground text-xl font-heading font-normal rounded-md shadow-inner" style={{ borderRadius: "8px" }}>
                {initials}
              </div>
              <div className="space-y-1">
                <button className="px-4 py-2 border border-sub-border text-xs font-semibold bg-card hover:bg-sub-card text-foreground rounded-md transition-colors">
                  Change Avatar
                </button>
                <p className="text-[10px] text-muted-foreground font-light">JPG, GIF or PNG. 1MB max limit.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Full Name</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="cursor-input"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Username</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="cursor-input"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="cursor-input"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Phone Number</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="cursor-input"
                />
              </div>
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Preferred Currency</label>
                <div className="relative">
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="cursor-input appearance-none font-sans"
                  >
                    <option value="₹">₹ INR</option>
                    <option value="$">$ USD</option>
                    <option value="€">€ EUR</option>
                    <option value="£">£ GBP</option>
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                </div>
              </div>
            </div>

            <div className="mt-8 flex justify-end">
              <button
                onClick={handleSave}
                className="cursor-btn-primary"
              >
                Save Changes
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

function Building(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="16" height="20" x="4" y="2" rx="0" ry="0" />
      <path d="M9 22v-4h6v4" />
      <path d="M8 6h.01" />
      <path d="M16 6h.01" />
      <path d="M12 6h.01" />
      <path d="M12 10h.01" />
      <path d="M12 14h.01" />
      <path d="M16 10h.01" />
      <path d="M16 14h.01" />
      <path d="M8 10h.01" />
      <path d="M8 14h.01" />
    </svg>
  );
}
