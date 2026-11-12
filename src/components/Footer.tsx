import React from 'react';
import { Mail, Compass, ExternalLink } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-[#0F2942] text-slate-300 border-t border-slate-800 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Institutional Info */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <img
                src="/assets/aistudio/cf5c58d0-12a9-4626-be9f-a04f5ce6e0f2-removebg-preview_1a1edeb0.png"
                alt="GRI Emblem"
                className="w-10 h-10 object-contain drop-shadow-md"
              />
              <span className="font-bold text-white text-sm">Centre for Grassroots Research & Innovation (GRI)</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Office of Research | Faculty of Engineering and Technology, JAIN (Deemed-to-be University).
              Advancing grassroots participatory research, human-centered design thinking, and sustainable societal engineering.
            </p>
          </div>

          {/* Event Context & Support */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-white uppercase tracking-wider">Design Thinking Field Visit</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Conducted on 31st October 2026. Participant certificates are officially issued by GRI and verified through this centralized portal.
            </p>
            <div className="pt-1">
              <a
                href="mailto:creativetech036@gmail.com"
                className="inline-flex items-center gap-1.5 text-xs text-blue-300 hover:text-white transition-colors"
              >
                <Mail className="w-3.5 h-3.5 text-blue-400" />
                <span>creativetech036@gmail.com</span>
              </a>
            </div>
          </div>

          {/* Official Social Channels */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-white uppercase tracking-wider">Official Channels</h4>
            <div className="flex flex-col gap-2 pt-1 text-xs">
              <a
                href="https://www.linkedin.com/company/centre-for-grassroots-research-innovation-gri/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-between text-slate-300 hover:text-white transition-colors p-2 rounded-lg bg-slate-800/60 hover:bg-slate-800"
              >
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#0A66C2]"></span>
                  <span>LinkedIn Company Page</span>
                </div>
                <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
              </a>

              <a
                href="https://www.instagram.com/jainresearch_gri?xtok=ZnB1cW9xZnYxbHFq"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-between text-slate-300 hover:text-white transition-colors p-2 rounded-lg bg-slate-800/60 hover:bg-slate-800"
              >
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-pink-500"></span>
                  <span>Instagram @jainresearch_gri</span>
                </div>
                <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
              </a>
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
          <p>© 2026 Centre for Grassroots Research & Innovation (GRI) · JAIN (Deemed-to-be University). All rights reserved.</p>
          <div className="flex items-center gap-2">
            <span>Academic Records Division</span>
            <span>·</span>
            <span>Design Thinking Course Repository</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
