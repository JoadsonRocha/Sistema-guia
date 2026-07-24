import React, { useState, useEffect, useRef } from 'react';
import { 
  getTreZonas, 
  getTreSecoes, 
  getTreLocaisVotacao, 
  findTreMatch, 
  TreZoneOption, 
  TreLocationItem 
} from '../lib/treDataService';
import { MapPin, ChevronDown, Check, Building2, Layers, Search, Sparkles } from 'lucide-react';

interface TreLocationFieldsProps {
  zona: string;
  secao: string;
  localVotacao: string;
  onChange: (updates: { zona?: string; secao?: string; localVotacao?: string }) => void;
  titulo?: string;
  onTituloChange?: (val: string) => void;
  inputClassName?: string;
  labelClassName?: string;
  isCompact?: boolean;
}

export const TreLocationFields: React.FC<TreLocationFieldsProps> = ({
  zona,
  secao,
  localVotacao,
  onChange,
  titulo,
  onTituloChange,
  inputClassName = "w-full bg-zinc-50 border border-zinc-200 rounded-sm p-3.5 font-black text-[11px] text-zinc-900 outline-none focus:border-blue-600 transition-all placeholder:text-zinc-300",
  labelClassName = "text-[8px] font-black text-zinc-400 uppercase tracking-widest ml-1",
  isCompact = false
}) => {
  // Submenu Open States
  const [openSubmenu, setOpenSubmenu] = useState<'zona' | 'secao' | 'local' | null>(null);

  // Search Filter States inside submenus
  const [searchZona, setSearchZona] = useState('');
  const [searchSecao, setSearchSecao] = useState('');
  const [searchLocal, setSearchLocal] = useState('');

  // Refs for click outside
  const containerRef = useRef<HTMLDivElement>(null);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpenSubmenu(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Sync Search Filters with external props when submenu opens
  useEffect(() => {
    if (openSubmenu === 'zona') setSearchZona(zona || '');
    if (openSubmenu === 'secao') setSearchSecao(secao || '');
    if (openSubmenu === 'local') setSearchLocal(localVotacao || '');
  }, [openSubmenu]);

  // Derived Data Options
  const allZonas = getTreZonas();
  const availableSecoes = getTreSecoes(zona, localVotacao);
  const availableLocais = getTreLocaisVotacao(zona, secao);

  // Filtered Lists
  const filteredZonas = allZonas.filter(z => 
    z.label.toLowerCase().includes(searchZona.toLowerCase()) ||
    z.municipioStr.toLowerCase().includes(searchZona.toLowerCase()) ||
    z.zonaClean.includes(searchZona)
  );

  const filteredSecoes = availableSecoes.filter(s => 
    s.secao.includes(searchSecao) ||
    s.local.toLowerCase().includes(searchSecao.toLowerCase()) ||
    (s.bairro && s.bairro.toLowerCase().includes(searchSecao.toLowerCase()))
  );

  const filteredLocais = availableLocais.filter(l => 
    l.local.toLowerCase().includes(searchLocal.toLowerCase()) ||
    (l.bairro && l.bairro.toLowerCase().includes(searchLocal.toLowerCase())) ||
    l.zona.toLowerCase().includes(searchLocal.toLowerCase()) ||
    l.secoesStr.toLowerCase().includes(searchLocal.toLowerCase())
  );

  // Selection Handlers
  const handleSelectZona = (selectedZona: TreZoneOption) => {
    const newZona = selectedZona.label;
    onChange({ zona: newZona });

    // Check if current local matches new zona
    const match = findTreMatch(newZona, secao, localVotacao);
    if (match && match.local) {
      onChange({ zona: newZona, localVotacao: match.local });
    }
    setOpenSubmenu('secao'); // Auto-advance to section submenu for fast flow!
  };

  const handleSelectSecao = (selectedSec: { secao: string; local: string; zona: string }) => {
    const updates: { zona?: string; secao?: string; localVotacao?: string } = {
      secao: selectedSec.secao
    };

    // Auto-fill local and zona if known
    if (selectedSec.local) {
      updates.localVotacao = selectedSec.local;
    }
    if (selectedSec.zona && (!zona || zona === 'TRE General')) {
      updates.zona = selectedSec.zona;
    }

    onChange(updates);
    setOpenSubmenu(null);
  };

  const handleSelectLocal = (selectedLocal: TreLocationItem) => {
    const updates: { zona?: string; secao?: string; localVotacao?: string } = {
      localVotacao: selectedLocal.local
    };

    // Auto-fill zona if not set
    if (selectedLocal.zona) {
      updates.zona = selectedLocal.zona;
    }

    onChange(updates);

    // If section not selected or not in this school, auto-open section menu
    const isSecInSchool = selectedLocal.secoes.some(s => s === secao || s.padStart(3, '0') === secao?.padStart(3, '0'));
    if (!secao || !isSecInSchool) {
      setOpenSubmenu('secao');
    } else {
      setOpenSubmenu(null);
    }
  };

  return (
    <div ref={containerRef} className="space-y-3 relative text-left">
      {/* ROW 1: TÍTULO, ZONA, SEÇÃO */}
      <div className={`grid ${onTituloChange !== undefined ? 'grid-cols-3' : 'grid-cols-2'} gap-3`}>
        {/* OPTIONAL TÍTULO FIELD */}
        {onTituloChange !== undefined && (
          <div className="space-y-1 col-span-1">
            <label className={labelClassName}>TÍTULO</label>
            <input 
              type="text" 
              value={titulo || ''} 
              onChange={e => onTituloChange(e.target.value)} 
              className={inputClassName} 
              placeholder="Nº Título..." 
            />
          </div>
        )}

        {/* ZONA FIELD WITH SUBMENU */}
        <div className="space-y-1 relative col-span-1">
          <label className={labelClassName}>
            ZONA <span className="text-[7px] text-blue-600 font-bold ml-1">TRE</span>
          </label>
          <div className="relative">
            <input 
              type="text" 
              value={openSubmenu === 'zona' ? searchZona : (zona || '')} 
              onChange={e => {
                setSearchZona(e.target.value);
                onChange({ zona: e.target.value });
              }}
              onFocus={() => setOpenSubmenu('zona')}
              className={`${inputClassName} pr-8 cursor-pointer font-bold`} 
              placeholder="Ex: 1ª ZE..." 
            />
            <button 
              type="button" 
              onClick={() => setOpenSubmenu(openSubmenu === 'zona' ? null : 'zona')}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-zinc-400 hover:text-blue-600 transition-colors"
            >
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${openSubmenu === 'zona' ? 'rotate-180 text-blue-600' : ''}`} />
            </button>
          </div>

          {/* SUBMENU DROPDOWN FOR ZONA */}
          {openSubmenu === 'zona' && (
            <div className="absolute left-0 top-full mt-1 w-64 md:w-72 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-md shadow-xl z-50 overflow-hidden text-xs">
              <div className="p-2 bg-zinc-100 dark:bg-zinc-800/80 border-b border-zinc-200 dark:border-zinc-700 flex items-center justify-between">
                <span className="font-black text-[9px] uppercase tracking-wider text-zinc-600 dark:text-zinc-300 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-blue-600" /> Selecione a Zona (TRE-RR)
                </span>
                <span className="text-[8px] bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 font-bold px-1.5 py-0.5 rounded">
                  {filteredZonas.length} Zonas
                </span>
              </div>

              <div className="max-h-56 overflow-y-auto divide-y divide-zinc-100 dark:divide-zinc-800/50">
                {filteredZonas.map((zOption) => {
                  const isSelected = zona === zOption.label || (zona && zona.includes(zOption.zonaClean));
                  return (
                    <button
                      key={zOption.value}
                      type="button"
                      onClick={() => handleSelectZona(zOption)}
                      className={`w-full text-left p-2.5 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors flex items-center justify-between group ${
                        isSelected ? 'bg-blue-50/80 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-bold' : 'text-zinc-800 dark:text-zinc-200'
                      }`}
                    >
                      <div>
                        <div className="font-black text-[11px] flex items-center gap-1.5">
                          <span className="px-1.5 py-0.5 bg-blue-600 text-white rounded-[2px] text-[8px] font-black">
                            {zOption.label}
                          </span>
                        </div>
                        <p className="text-[9px] text-zinc-500 dark:text-zinc-400 mt-0.5 font-medium line-clamp-1">
                          {zOption.municipioStr}
                        </p>
                      </div>
                      {isSelected && <Check className="w-3.5 h-3.5 text-blue-600 shrink-0" />}
                    </button>
                  );
                })}

                {/* CUSTOM INPUT FALLBACK BUTTON */}
                {searchZona.trim() && !filteredZonas.some(z => z.label.toLowerCase() === searchZona.toLowerCase()) && (
                  <button
                    type="button"
                    onClick={() => {
                      onChange({ zona: searchZona });
                      setOpenSubmenu('secao');
                    }}
                    className="w-full text-left p-2.5 bg-amber-50 dark:bg-amber-950/30 hover:bg-amber-100 dark:hover:bg-amber-900/40 text-amber-800 dark:text-amber-300 font-bold text-[10px] flex items-center gap-2"
                  >
                    <span>✍️ Usar Zona personalizada:</span>
                    <span className="font-black text-blue-600 underline">{searchZona}</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* SEÇÃO FIELD WITH SUBMENU */}
        <div className="space-y-1 relative col-span-1">
          <label className={labelClassName}>
            SEÇÃO <span className="text-[7px] text-blue-600 font-bold ml-1">TRE</span>
          </label>
          <div className="relative">
            <input 
              type="text" 
              value={openSubmenu === 'secao' ? searchSecao : (secao || '')} 
              onChange={e => {
                setSearchSecao(e.target.value);
                onChange({ secao: e.target.value });
              }}
              onFocus={() => setOpenSubmenu('secao')}
              className={`${inputClassName} pr-8 cursor-pointer font-bold`} 
              placeholder="Ex: 001..." 
            />
            <button 
              type="button" 
              onClick={() => setOpenSubmenu(openSubmenu === 'secao' ? null : 'secao')}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-zinc-400 hover:text-blue-600 transition-colors"
            >
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${openSubmenu === 'secao' ? 'rotate-180 text-blue-600' : ''}`} />
            </button>
          </div>

          {/* SUBMENU DROPDOWN FOR SEÇÃO */}
          {openSubmenu === 'secao' && (
            <div className="absolute right-0 md:left-0 top-full mt-1 w-64 md:w-80 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-md shadow-xl z-50 overflow-hidden text-xs">
              <div className="p-2 bg-zinc-100 dark:bg-zinc-800/80 border-b border-zinc-200 dark:border-zinc-700 flex items-center justify-between">
                <span className="font-black text-[9px] uppercase tracking-wider text-zinc-600 dark:text-zinc-300 flex items-center gap-1">
                  <Layers className="w-3 h-3 text-blue-600" /> Seções {zona ? `da ${zona}` : 'do TRE'}
                </span>
                <span className="text-[8px] bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 font-bold px-1.5 py-0.5 rounded">
                  {filteredSecoes.length} Opções
                </span>
              </div>

              <div className="max-h-56 overflow-y-auto divide-y divide-zinc-100 dark:divide-zinc-800/50">
                {filteredSecoes.length > 0 ? (
                  filteredSecoes.map((sOption) => {
                    const isSelected = secao === sOption.secao;
                    return (
                      <button
                        key={`${sOption.secao}_${sOption.local}`}
                        type="button"
                        onClick={() => handleSelectSecao(sOption)}
                        className={`w-full text-left p-2.5 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors flex items-center justify-between group ${
                          isSelected ? 'bg-blue-50/80 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-bold' : 'text-zinc-800 dark:text-zinc-200'
                        }`}
                      >
                        <div className="overflow-hidden">
                          <div className="font-black text-[11px] flex items-center gap-1.5">
                            <span className="px-1.5 py-0.5 bg-zinc-800 text-white rounded-[2px] text-[9px] font-black">
                              Seção {sOption.secao}
                            </span>
                            {sOption.zona && (
                              <span className="text-[8px] font-bold text-blue-600 dark:text-blue-400 uppercase">
                                ({sOption.zona})
                              </span>
                            )}
                          </div>
                          <p className="text-[9px] text-zinc-500 dark:text-zinc-400 mt-0.5 font-medium truncate">
                            📍 {sOption.local} {sOption.bairro ? `(${sOption.bairro})` : ''}
                          </p>
                        </div>
                        {isSelected && <Check className="w-3.5 h-3.5 text-blue-600 shrink-0 ml-2" />}
                      </button>
                    );
                  })
                ) : (
                  <div className="p-3 text-center text-zinc-400 text-[10px]">
                    Nenhuma seção pré-cadastrada encontrada para a busca.
                  </div>
                )}

                {/* CUSTOM INPUT FALLBACK BUTTON */}
                {searchSecao.trim() && !filteredSecoes.some(s => s.secao === searchSecao) && (
                  <button
                    type="button"
                    onClick={() => {
                      onChange({ secao: searchSecao });
                      setOpenSubmenu(null);
                    }}
                    className="w-full text-left p-2.5 bg-amber-50 dark:bg-amber-950/30 hover:bg-amber-100 dark:hover:bg-amber-900/40 text-amber-800 dark:text-amber-300 font-bold text-[10px] flex items-center gap-2"
                  >
                    <span>✍️ Usar Seção personalizada:</span>
                    <span className="font-black text-blue-600 underline">{searchSecao}</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ROW 2: LOCAL DE VOTAÇÃO FIELD WITH SUBMENU */}
      <div className="space-y-1 relative">
        <label className={labelClassName}>
          LOCAL DE VOTAÇÃO <span className="text-[7px] text-blue-600 font-bold ml-1">ESCOLA / COLÉGIO TRE</span>
        </label>
        <div className="relative">
          <input 
            type="text" 
            value={openSubmenu === 'local' ? searchLocal : (localVotacao || '')} 
            onChange={e => {
              setSearchLocal(e.target.value);
              onChange({ localVotacao: e.target.value });
            }}
            onFocus={() => setOpenSubmenu('local')}
            className={`${inputClassName} pr-8 cursor-pointer font-bold`} 
            placeholder="Selecione ou busque a Escola / Local de Votação TRE..." 
          />
          <button 
            type="button" 
            onClick={() => setOpenSubmenu(openSubmenu === 'local' ? null : 'local')}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-zinc-400 hover:text-blue-600 transition-colors"
          >
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${openSubmenu === 'local' ? 'rotate-180 text-blue-600' : ''}`} />
          </button>
        </div>

        {/* SUBMENU DROPDOWN FOR LOCAL DE VOTAÇÃO */}
        {openSubmenu === 'local' && (
          <div className="absolute left-0 top-full mt-1 w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-md shadow-2xl z-50 overflow-hidden text-xs">
            <div className="p-2.5 bg-zinc-100 dark:bg-zinc-800/80 border-b border-zinc-200 dark:border-zinc-700 flex items-center justify-between">
              <span className="font-black text-[9px] uppercase tracking-wider text-zinc-600 dark:text-zinc-300 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-blue-600" /> Locais de Votação {zona ? `da ${zona}` : 'do TRE-RR'}
              </span>
              <span className="text-[8px] bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 font-bold px-1.5 py-0.5 rounded">
                {filteredLocais.length} Locais Cadastrados
              </span>
            </div>

            <div className="max-h-64 overflow-y-auto divide-y divide-zinc-100 dark:divide-zinc-800/50">
              {filteredLocais.length > 0 ? (
                filteredLocais.map((lOption) => {
                  const isSelected = localVotacao === lOption.local;
                  return (
                    <button
                      key={lOption.id}
                      type="button"
                      onClick={() => handleSelectLocal(lOption)}
                      className={`w-full text-left p-3 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors flex items-start justify-between group ${
                        isSelected ? 'bg-blue-50/80 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-bold' : 'text-zinc-800 dark:text-zinc-200'
                      }`}
                    >
                      <div className="space-y-0.5 pr-2">
                        <div className="font-black text-[11px] text-zinc-900 dark:text-white flex items-center gap-2">
                          <span>🏫 {lOption.local}</span>
                          <span className="px-1.5 py-0.2 bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded text-[8px] font-black uppercase">
                            {lOption.zona}
                          </span>
                        </div>
                        <div className="text-[9px] text-zinc-500 dark:text-zinc-400 font-medium flex items-center gap-3">
                          {lOption.bairro && <span>📍 Bairro: <strong className="text-zinc-700 dark:text-zinc-300">{lOption.bairro}</strong></span>}
                          {lOption.municipio && <span>🏛️ Município: <strong className="text-zinc-700 dark:text-zinc-300">{lOption.municipio}</strong></span>}
                          {lOption.secoesStr && (
                            <span className="bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded text-[8px] font-bold text-zinc-600 dark:text-zinc-300">
                              Seções: {lOption.secoesStr}
                            </span>
                          )}
                        </div>
                      </div>
                      {isSelected && <Check className="w-4 h-4 text-blue-600 shrink-0 mt-1" />}
                    </button>
                  );
                })
              ) : (
                <div className="p-4 text-center text-zinc-400 text-[10px]">
                  Nenhum local de votação oficial encontrado para esse filtro.
                </div>
              )}

              {/* CUSTOM INPUT FALLBACK BUTTON */}
              {searchLocal.trim() && !filteredLocais.some(l => l.local.toLowerCase() === searchLocal.toLowerCase()) && (
                <button
                  type="button"
                  onClick={() => {
                    onChange({ localVotacao: searchLocal });
                    setOpenSubmenu(null);
                  }}
                  className="w-full text-left p-3 bg-amber-50 dark:bg-amber-950/30 hover:bg-amber-100 dark:hover:bg-amber-900/40 text-amber-800 dark:text-amber-300 font-bold text-[10px] flex items-center gap-2"
                >
                  <span>✍️ Usar Local de Votação personalizado:</span>
                  <span className="font-black text-blue-600 underline">{searchLocal}</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
