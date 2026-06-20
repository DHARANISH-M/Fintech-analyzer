import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Zap, UploadCloud, Building2, UserCircle, CreditCard, ArrowRight, CheckCircle2 } from 'lucide-react';

export default function Onboarding() {
  const [step, setStep] = useState(1);
  const [useCase, setUseCase] = useState<'personal' | 'business' | null>(null);
  const [currency, setCurrency] = useState('INR');
  const navigate = useNavigate();

  const handleNext = () => {
    if (step < 3) {
      setStep(step + 1);
    } else {
      const symbols: Record<string, string> = { 'INR': '₹', 'USD': '$', 'EUR': '€', 'GBP': '£' };
      localStorage.setItem('user_currency', symbols[currency] || '₹');
      navigate('/enhanced/dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-background text-card-foreground flex flex-col justify-center items-center p-6 font-sans">
      
      {/* Step Indicators */}
      <div className="absolute top-10 flex gap-2 w-full max-w-md px-6 z-10">
        {[1, 2, 3].map(i => (
          <div key={i} className={`h-1.5 flex-1 transition-colors duration-500 ${step >= i ? 'bg-primary' : 'bg-border'}`} style={{ borderRadius: "0px" }} />
        ))}
      </div>

      <motion.div 
        layout
        className="w-full max-w-xl bg-card border border-border p-10 shadow-none z-10 relative overflow-hidden rounded-lg"
      >
        <AnimatePresence mode="wait">
          
          {step === 1 && (
            <motion.div key="step1" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-sub-card border border-sub-border text-primary mx-auto flex items-center justify-center mb-6 rounded-md">
                  <UploadCloud className="w-8 h-8" />
                </div>
                <h2 className="text-2xl font-heading font-normal text-foreground uppercase tracking-normal mb-3">Upload your first statement</h2>
                <p className="text-card-foreground text-sm font-light">Let LedgerLens parse your raw statement into structured local insights instantly.</p>
              </div>

              <div className="border-2 border-dashed border-sub-border hover:border-primary bg-sub-card/50 transition-colors p-10 text-center cursor-pointer mb-8 group rounded-md">
                <UploadCloud className="w-10 h-10 mx-auto text-muted-foreground group-hover:text-primary transition-colors mb-4" />
                <p className="font-bold text-foreground text-sm">Click or drag PDF statement</p>
                <p className="text-xs text-muted-foreground mt-2 font-light">Supports multi-page bank formats (HDFC, SBI, ICICI, etc.)</p>
              </div>

              <div className="flex justify-between items-center">
                <button onClick={handleNext} className="text-xs font-bold text-muted-foreground hover:text-foreground uppercase tracking-wider transition-colors">skip for now</button>
                <button onClick={handleNext} className="cursor-btn-primary flex items-center gap-2">
                  Continue <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="step2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="text-center mb-8">
                <h2 className="text-2xl font-heading font-normal text-foreground uppercase tracking-normal mb-3">Select your use case</h2>
                <p className="text-card-foreground text-sm font-light">We optimize chart categories (CoA) based on your intent.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
                <div 
                  onClick={() => setUseCase('personal')}
                  className={`p-6 border-2 cursor-pointer transition-all rounded-md ${useCase === 'personal' ? 'border-primary bg-sub-card' : 'border-border hover:border-sub-border'}`}
                >
                  <UserCircle className={`w-8 h-8 mb-4 ${useCase === 'personal' ? 'text-primary' : 'text-muted-foreground'}`} />
                  <h3 className="font-bold text-foreground text-sm">Personal finance</h3>
                  <p className="text-xs text-card-foreground mt-2 font-light">Track expenses, budget smarter, and enhance savings rate.</p>
                  {useCase === 'personal' && <CheckCircle2 className="w-5 h-5 text-primary mt-4" />}
                </div>
                
                <div 
                  onClick={() => setUseCase('business')}
                  className={`p-6 border-2 cursor-pointer transition-all rounded-md ${useCase === 'business' ? 'border-primary bg-sub-card' : 'border-border hover:border-sub-border'}`}
                >
                  <Building2 className={`w-8 h-8 mb-4 ${useCase === 'business' ? 'text-primary' : 'text-muted-foreground'}`} />
                  <h3 className="font-bold text-foreground text-sm">Business accounting</h3>
                  <p className="text-xs text-card-foreground mt-2 font-light">Generate PnL, journal entries, and track cash-flow runways.</p>
                  {useCase === 'business' && <CheckCircle2 className="w-5 h-5 text-primary mt-4" />}
                </div>
              </div>

              <div className="flex justify-end">
                <button 
                  onClick={handleNext} 
                  disabled={!useCase}
                  className={`cursor-btn-primary flex items-center gap-2 ${!useCase ? 'bg-border text-muted-foreground border-border cursor-not-allowed' : ''}`}
                >
                  Continue Configuration <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div key="step3" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-sub-card border border-sub-border text-primary mx-auto flex items-center justify-center mb-6 rounded-md">
                  <CreditCard className="w-8 h-8" />
                </div>
                <h2 className="text-2xl font-heading font-normal text-foreground uppercase tracking-normal mb-3">Choose local currency</h2>
                <p className="text-card-foreground text-sm font-light">Select the primary currency metrics you deal in.</p>
              </div>

              <div className="bg-sub-card border border-sub-border p-2 mb-10 text-sm font-bold rounded-md">
                <select 
                  value={currency} 
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full bg-transparent border-none focus:ring-0 py-4 px-6 text-foreground cursor-pointer outline-none font-sans"
                >
                  <option value="INR" className="bg-card text-foreground">₹ (INR) Indian Rupee</option>
                  <option value="USD" className="bg-card text-foreground">$ (USD) US Dollar</option>
                  <option value="EUR" className="bg-card text-foreground">€ (EUR) Euro</option>
                  <option value="GBP" className="bg-card text-foreground">£ (GBP) British Pound</option>
                </select>
              </div>

              <div className="flex justify-end mt-12 w-full">
                <button onClick={handleNext} className="w-full cursor-btn-primary flex items-center justify-center gap-3">
                  <Zap className="w-4 h-4" /> Access dashboard
                </button>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </motion.div>
    </div>
  );
}

