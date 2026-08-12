import React, { useState } from 'react';
import { AlignmentProject } from '../types/civil';

interface CommandLineFooterProps {
  project: AlignmentProject;
  logs: string[];
  onExecuteCommand: (cmd: string) => void;
}

export const CommandLineFooter: React.FC<CommandLineFooterProps> = ({
  project,
  logs,
  onExecuteCommand,
}) => {
  const [inputCmd, setInputCmd] = useState('');

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && inputCmd.trim()) {
      onExecuteCommand(inputCmd.trim());
      setInputCmd('');
    }
  };

  // Compute total cut / fill for status bar
  let totalCut = 0;
  let totalFill = 0;
  project.crossSections.forEach((cs) => {
    totalCut += cs.cutArea * 50;
    totalFill += cs.fillArea * 50;
  });

  return (
    <footer className="h-24 bg-[#1e1e1e] border-t border-[#3e3e42] flex flex-col select-none font-mono text-xs">
      {/* Command Line Logs & Input */}
      <div className="flex-1 p-2 bg-[#181818] overflow-y-auto text-gray-400 space-y-0.5 leading-tight">
        {logs.slice(-3).map((log, idx) => (
          <div key={idx} className="opacity-80 text-[11px] truncate">
            {log}
          </div>
        ))}

        <div className="flex items-center gap-2 text-white pt-1">
          <span className="text-[#00a2ed] font-bold">Command:</span>
          <input
            type="text"
            value={inputCmd}
            onChange={(e) => setInputCmd(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type command or skill (e.g. skill:optimize_clothoid, skill:calculate_earthwork)..."
            className="flex-1 bg-transparent border-none outline-none text-xs text-white placeholder-gray-600 font-mono"
          />
        </div>
      </div>

      {/* AutoCAD Bottom Status Bar */}
      <div className="h-7 bg-[#007acc] flex items-center px-3 justify-between text-[10px] text-white">
        <div className="flex gap-4 font-bold tracking-wider">
          <span className="bg-white/20 px-1.5 py-0.5 rounded">MODEL</span>
          <span className="opacity-70 hover:opacity-100 cursor-pointer">LAYOUT1 (A1-1:1000)</span>
          <span className="opacity-70 hover:opacity-100 cursor-pointer">LAYOUT2 (構造物)</span>
        </div>

        <div className="flex gap-3 items-center font-mono">
          <span className="bg-black/20 px-1 py-0.5 rounded text-emerald-200">
            Cut: {totalCut.toFixed(0)}m³ / Fill: {totalFill.toFixed(0)}m³
          </span>
          <span className="bg-black/20 px-1 py-0.5 rounded">GRID: ON</span>
          <span className="bg-black/20 px-1 py-0.5 rounded">SNAP: ON</span>
          <span className="bg-black/20 px-1 py-0.5 rounded">ORTHO: ON</span>
          <span className="bg-black/20 px-1 py-0.5 rounded">OSNAP: END,INT</span>
          <span className="font-bold bg-white text-[#007acc] px-1.5 py-0.5 rounded">1:1000</span>
          <span className="text-cyan-200 font-bold">VRAM: 1.2/4.0 GB</span>
        </div>
      </div>
    </footer>
  );
};
