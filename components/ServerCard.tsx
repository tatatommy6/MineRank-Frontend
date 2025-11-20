
import React from 'react';
import type { Server } from '../types';
import { UsersIcon } from './icons';

interface ServerCardProps {
  server: Server;
  onSelect: (id: number) => void;
}

export const ServerCard: React.FC<ServerCardProps> = ({ server, onSelect }) => {
  const playerPercentage = (server.onlinePlayers / server.maxPlayers) * 100;
  
  // Ensure tags is always an array
  const tags = Array.isArray(server.tags) 
    ? server.tags 
    : typeof server.tags === 'string' 
      ? server.tags.split(',').map(t => t.trim()).filter(Boolean)
      : [];

  return (
    <div 
      className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden shadow-lg hover:border-emerald-500 transition-all duration-300 cursor-pointer group"
      onClick={() => onSelect(server.id)}
    >
      <div className="relative h-24 bg-cover bg-center" style={{ backgroundImage: `url(${server.bannerUrl})` }}>
        <div className="absolute inset-0 bg-black bg-opacity-40"></div>
      </div>
      <div className="p-4">
        <div className="flex justify-between items-start">
          <div className="flex items-center space-x-4">
            <div className="text-3xl font-bold text-slate-500 group-hover:text-emerald-500 transition-colors">#{server.rank}</div>
            <div>
              <h3 className="text-xl font-bold text-white group-hover:text-emerald-400 transition-colors">{server.name}</h3>
              <p className="text-sm text-slate-400">{server.ip}</p>
            </div>
          </div>
          <div className="text-right">
            <div className="flex items-center space-x-2 text-slate-300">
                <UsersIcon className="w-5 h-5 text-cyan-400" />
                <span>{server.onlinePlayers} / {server.maxPlayers}</span>
            </div>
            <span className="text-xs px-2 py-1 bg-slate-700 text-slate-300 rounded-full mt-2 inline-block">{server.version}</span>
          </div>
        </div>
        <div className="mt-4">
          <div className="w-full bg-slate-700 rounded-full h-2.5">
            <div className="bg-gradient-to-r from-teal-400 to-emerald-500 h-2.5 rounded-full" style={{ width: `${playerPercentage}%` }}></div>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
            {tags.slice(0, 4).map(tag => (
                <span key={tag} className="text-xs font-semibold px-2.5 py-1 bg-slate-700 text-sky-300 rounded-full">
                    {tag}
                </span>
            ))}
        </div>
      </div>
    </div>
  );
};
