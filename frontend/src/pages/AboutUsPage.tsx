import React from "react";
import { Link } from "react-router-dom";
import { Shield, Users, Lock, Heart, Activity, Globe, ArrowRight, Zap, CheckCircle2 } from "lucide-react";

export const AboutUsPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-orange-200">
      {/* Navigation */}
      <nav className="flex items-center justify-between px-8 py-6 max-w-7xl mx-auto absolute top-0 left-0 right-0 z-50">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-full bg-slate-900 flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
            <div className="w-3 h-3 rounded-full bg-white ml-1" />
            <div className="w-2 h-2 rounded-full bg-orange-500 mr-1 mt-2" />
          </div>
          <span className="text-xl font-semibold tracking-tight">EchoSphere</span>
        </Link>
        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
          <Link to="/" className="hover:text-slate-900 transition-colors">Home</Link>
          <Link to="/about" className="text-slate-900 font-bold">About</Link>
          <Link to="/community" className="hover:text-slate-900 transition-colors">Community</Link>
        </div>
        <div className="flex items-center gap-4">
          <Link to="/contact" className="hidden md:block px-5 py-2.5 rounded-full bg-white/50 backdrop-blur-md border border-slate-200 text-sm font-medium hover:bg-white transition-all shadow-sm">
            Contact us
          </Link>
          <Link to="/community" className="px-5 py-2.5 rounded-full bg-slate-900 text-white text-sm font-medium hover:bg-slate-800 transition-colors shadow-lg">
            Enter Platform
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden flex flex-col items-center justify-center text-center px-4">
        <div className="absolute inset-0 z-0">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-orange-400/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-400/20 rounded-full blur-3xl animate-pulse delay-1000" />
        </div>
        
        <div className="relative z-10 max-w-4xl mx-auto space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-100 border border-orange-200 text-orange-700 text-xs font-bold uppercase tracking-wider mb-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <SparklesIcon className="w-4 h-4" /> The Future of Social
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight leading-[1.1] animate-in fade-in slide-in-from-bottom-6 duration-700">
            Where Community <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-rose-500">Meets Absolute Security.</span>
          </h1>
          <p className="text-lg md:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed animate-in fade-in slide-in-from-bottom-8 duration-700 delay-150">
            EchoSphere isn't just another platform. It's a fortified ecosystem designed to foster genuine connection while neutralizing threats in real-time using advanced AI.
          </p>
        </div>
      </section>

      {/* The Purpose (Community focus) */}
      <section className="py-24 bg-white relative">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-4xl font-bold text-slate-900 mb-6">Our Purpose: Authentic Connection</h2>
            <p className="text-slate-600 text-lg leading-relaxed">
              We built EchoSphere to be a sanctuary for ideas, collaboration, and shared interests. We believe that when people are given a space free from toxicity and manipulation, incredible things happen.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="group bg-slate-50 rounded-[2rem] p-8 border border-slate-100 hover:border-orange-200 hover:shadow-xl hover:shadow-orange-500/10 transition-all duration-300">
              <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-sm text-orange-500 mb-6 group-hover:scale-110 transition-transform">
                <Users size={28} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Vibrant Organizations</h3>
              <p className="text-slate-600 leading-relaxed">
                Join niche communities and organizations tailored to your passions. Engage in deep, meaningful discussions with like-minded individuals globally.
              </p>
            </div>

            <div className="group bg-slate-50 rounded-[2rem] p-8 border border-slate-100 hover:border-orange-200 hover:shadow-xl hover:shadow-orange-500/10 transition-all duration-300">
              <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-sm text-orange-500 mb-6 group-hover:scale-110 transition-transform">
                <Globe size={28} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Borderless Interaction</h3>
              <p className="text-slate-600 leading-relaxed">
                Break down geographic barriers. Our dynamic feed ensures you discover the most relevant content and voices from around the world.
              </p>
            </div>

            <div className="group bg-slate-50 rounded-[2rem] p-8 border border-slate-100 hover:border-orange-200 hover:shadow-xl hover:shadow-orange-500/10 transition-all duration-300">
              <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-sm text-orange-500 mb-6 group-hover:scale-110 transition-transform">
                <Heart size={28} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Positive Engagement</h3>
              <p className="text-slate-600 leading-relaxed">
                Our reputation system naturally surfaces high-quality, supportive interactions while filtering out noise, ensuring your feed is always a place of value.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* The Security (TrustShield focus) - Dark Mode Section */}
      <section className="py-32 bg-slate-900 text-white relative overflow-hidden">
        {/* Abstract background elements */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-700 via-transparent to-transparent" />
          <div className="absolute bottom-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-emerald-600 via-transparent to-transparent" />
        </div>

        <div className="max-w-7xl mx-auto px-4 md:px-8 relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="order-2 lg:order-1 relative">
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-emerald-500 rounded-3xl blur opacity-30 animate-pulse" />
            <div className="bg-slate-800/80 backdrop-blur-xl border border-slate-700 p-8 rounded-3xl relative">
              <div className="flex items-center gap-4 mb-8 pb-8 border-b border-slate-700">
                <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center text-emerald-400">
                  <Activity size={24} />
                </div>
                <div>
                  <div className="text-xs text-slate-400 uppercase tracking-widest font-bold">System Status</div>
                  <div className="text-emerald-400 font-bold flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> TrustShield Active
                  </div>
                </div>
              </div>
              
              <div className="space-y-6">
                {[
                  "Real-time toxicity and hate speech filtering",
                  "Automated bot and spam neutralization",
                  "Advanced threat detection AI pipeline",
                  "Secure user isolation architecture"
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-4">
                    <div className="mt-1 w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center shrink-0">
                      <CheckCircle2 size={14} className="text-blue-400" />
                    </div>
                    <span className="text-slate-300 font-medium">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          <div className="order-1 lg:order-2 space-y-8">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-900/50 border border-blue-700 text-blue-300 text-xs font-bold uppercase tracking-wider mb-4">
                <Lock className="w-4 h-4" /> Enterprise-Grade Safety
              </div>
              <h2 className="text-4xl md:text-5xl font-bold mb-6">Secured by <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">TrustShield.</span></h2>
              <p className="text-lg text-slate-400 leading-relaxed">
                Freedom of expression shouldn't mean compromising on safety. Behind EchoSphere operates the TrustShield Identity Engine—a highly sophisticated, asynchronous AI worker that monitors the platform's heartbeat.
              </p>
            </div>
            
            <p className="text-lg text-slate-400 leading-relaxed">
              Every message, post, and interaction is parsed through deep neural networks to instantly identify malicious intent, harassment, and security threats before they ever reach your screen. You focus on connecting; we focus on protecting.
            </p>
            
            <Link to="/community" className="inline-flex items-center gap-2 text-emerald-400 font-bold hover:text-emerald-300 transition-colors group">
              Explore the secure community <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 text-center px-4">
        <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-6">Ready to experience the difference?</h2>
        <p className="text-slate-600 mb-10 max-w-xl mx-auto text-lg">Join thousands of users who have already discovered a safer, more meaningful way to connect online.</p>
        <Link to="/register" className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-orange-500 text-white rounded-full font-bold text-lg hover:bg-orange-600 transition-all shadow-xl shadow-orange-500/30 hover:scale-105 active:scale-95">
          Create Free Account <Zap size={20} />
        </Link>
      </section>

      {/* Minimal Footer */}
      <footer className="py-8 text-center text-slate-500 border-t border-slate-200 text-sm font-medium">
        &copy; {new Date().getFullYear()} EchoSphere & TrustShield. All rights reserved.
      </footer>
    </div>
  );
};

// Mini internal icon component
function SparklesIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
      <path d="M5 3v4" />
      <path d="M19 17v4" />
      <path d="M3 5h4" />
      <path d="M17 19h4" />
    </svg>
  );
}
