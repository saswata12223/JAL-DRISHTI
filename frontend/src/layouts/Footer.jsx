import React from 'react';

export default function Footer() {
  return (
    <footer className="w-full py-3 px-4 sm:px-6 border-t border-slate-200 bg-white text-[11.5px] text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2 select-none shrink-0 rounded-b">
      <div>
        <span className="font-medium text-slate-700">&copy; {new Date().getFullYear()} Jal Drishti</span>
        <span className="mx-1.5 text-slate-300">&bull;</span>
        <span>Uttarakhand Flood Intelligence System</span>
      </div>
      <div>
        <span className="text-slate-400 font-medium">Data Sources:</span>
        <span className="ml-1 text-slate-600">CWC &bull; IMD &bull; NRSC &bull; USGS &bull; GSI &bull; Govt of Uttarakhand</span>
      </div>
    </footer>
  );
}


