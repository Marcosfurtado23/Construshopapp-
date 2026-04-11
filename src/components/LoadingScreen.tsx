import React from 'react';
import { 
  Hammer, 
  Wrench, 
  HardHat, 
  Ruler, 
  Paintbrush, 
  Truck, 
  Package, 
  Droplet, 
  PaintRoller, 
  Home,
  BrickWall,
  Settings
} from 'lucide-react';

export function LoadingScreen({ progress }: { progress: number }) {
  return (
    <div className="fixed inset-0 bg-slate-900 z-[9999] flex flex-col items-center justify-between py-12 overflow-hidden font-sans">
      {/* Subtle background grid */}
      <div className="absolute inset-0 opacity-10 pointer-events-none" 
           style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.2) 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
      </div>

      {/* Floating Icons */}
      <FloatingIcon icon={<Hammer className="w-6 h-6 text-orange-600" />} top="10%" left="10%" delay="0s" />
      <FloatingIcon icon={<BrickWall className="w-6 h-6 text-orange-600" />} top="15%" right="15%" delay="0.5s" />
      <FloatingIcon icon={<Wrench className="w-6 h-6 text-blue-600" />} top="40%" left="5%" delay="1s" />
      <FloatingIcon icon={<HardHat className="w-6 h-6 text-yellow-500" />} top="35%" right="8%" delay="1.5s" />
      <FloatingIcon icon={<Paintbrush className="w-6 h-6 text-red-500" />} top="65%" left="12%" delay="2s" />
      <FloatingIcon icon={<Droplet className="w-6 h-6 text-blue-400" />} top="60%" right="10%" delay="2.5s" />
      <FloatingIcon icon={<Package className="w-6 h-6 text-orange-500" />} bottom="10%" left="20%" delay="3s" />
      <FloatingIcon icon={<Settings className="w-6 h-6 text-gray-600" />} bottom="15%" right="20%" delay="3.5s" />

      {/* Logo Area */}
      <div className="relative z-10 flex flex-col items-center mt-8">
        <div className="relative w-28 h-28 bg-white rounded-full shadow-lg flex items-center justify-center mb-4 border-4 border-blue-900">
          <Home className="w-14 h-14 text-orange-500 absolute top-3" />
          <div className="flex gap-2 mt-6 z-10">
            <Hammer className="w-7 h-7 text-blue-900" />
            <Wrench className="w-7 h-7 text-blue-900" />
          </div>
        </div>
        <h1 className="text-3xl font-black text-white tracking-tight drop-shadow-sm">CONSTRUSHOP</h1>
        <p className="text-xs font-bold text-slate-300 tracking-widest mt-1">MATERIAIS DE CONSTRUÇÃO</p>
      </div>

      {/* Center Spinner Area */}
      <div className="relative z-10 flex items-center justify-center my-8">
        {/* Animated dashed circle */}
        <div className="absolute w-52 h-52 rounded-full border-4 border-dashed border-orange-500 animate-[spin_10s_linear_infinite] opacity-80"></div>
        <div className="absolute w-60 h-60 rounded-full border-4 border-dashed border-blue-600 animate-[spin_15s_linear_infinite_reverse] opacity-50"></div>
        
        {/* Center icon */}
        <div className="w-36 h-36 bg-white rounded-full shadow-2xl flex items-center justify-center z-10 border-4 border-white">
          <PaintRoller className="w-16 h-16 text-blue-800" />
        </div>
      </div>

      {/* Progress Area */}
      <div className="relative z-10 flex flex-col items-center w-full max-w-xs px-6 mb-8">
        <h2 className="text-2xl font-black text-white mb-4 drop-shadow-sm">CARREGANDO...</h2>
        
        <div className="w-full h-8 bg-slate-800 rounded-full overflow-hidden shadow-inner relative border-2 border-slate-700">
          <div 
            className="h-full bg-gradient-to-r from-blue-400 to-blue-600 transition-all duration-300 ease-out flex items-center justify-center"
            style={{ width: `${progress}%` }}
          >
            {/* Glossy overlay */}
            <div className="absolute top-0 left-0 right-0 h-1/2 bg-white/20 rounded-t-full"></div>
          </div>
          <div className="absolute inset-0 flex items-center justify-center text-white font-bold text-sm drop-shadow-md">
            {Math.round(progress)}%
          </div>
        </div>
        
        <p className="text-slate-400 text-sm font-medium mt-6">v1.9.4</p>
      </div>
    </div>
  );
}

function FloatingIcon({ icon, top, left, right, bottom, delay }: any) {
  return (
    <div 
      className="absolute bg-white/90 backdrop-blur-sm p-3 rounded-2xl shadow-lg border border-gray-100 animate-[bounce_3s_ease-in-out_infinite]"
      style={{ top, left, right, bottom, animationDelay: delay }}
    >
      {icon}
    </div>
  );
}
