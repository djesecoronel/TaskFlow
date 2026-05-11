import { Search, Filter, Save, X } from 'lucide-react';
import { useState } from 'react';

export default function BoardFilters({ filters, setFilters, savedFilters, saveCurrentFilter }) {
  return (
    <div className="flex flex-wrap items-center gap-4 mb-8 p-6 bg-slate-900/50 border border-slate-800 rounded-[2rem] backdrop-blur-md">
      
      {/* RF-07.1: Búsqueda por Texto */}
      <div className="relative flex-1 min-w-[250px]">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
        <input 
          type="text"
          placeholder="Buscar tareas por título o descripción..."
          value={filters.search}
          onChange={(e) => setFilters({...filters, search: e.target.value})}
          className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-12 pr-4 text-sm text-white focus:border-indigo-500 outline-none transition-all"
        />
      </div>

      {/* RF-07.2: Filtros de Categoría */}
      <div className="flex items-center gap-3">
        <select 
          value={filters.priority}
          onChange={(e) => setFilters({...filters, priority: e.target.value})}
          className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs font-black text-slate-400 uppercase outline-none focus:border-indigo-500"
        >
          <option value="ALL">Prioridad: Todas</option>
          <option value="ALTA">Alta</option>
          <option value="MEDIA">Media</option>
          <option value="BAJA">Baja</option>
        </select>

        {/* Botón Guardar Filtro (RF-07.3) */}
        <button 
          onClick={saveCurrentFilter}
          className="p-3 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-xl hover:bg-indigo-500/20 transition-all active:scale-95"
          title="Guardar este filtro"
        >
          <Save size={18} />
        </button>

        {/* Resetear Filtros */}
        <button 
          onClick={() => setFilters({ search: '', priority: 'ALL', member: 'ALL' })}
          className="p-3 bg-slate-800/50 text-slate-500 rounded-xl hover:text-white transition-all"
        >
          <X size={18} />
        </button>
      </div>
    </div>
  );
}