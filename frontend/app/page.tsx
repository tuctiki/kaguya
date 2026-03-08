"use client";

import { useState, useEffect, useMemo } from "react";
import { 
  Search, SortAsc, MapPin, Tag, ChevronRight, 
  Settings, Check, User, Ruler, DollarSign, Calendar, Eye, Filter, ArrowDownLeft, ArrowUpRight
} from "lucide-react";

interface Snapshot {
  snapshot_date: string;
  age: number;
  price_yen: number;
  area: string;
  availability: string;
  review_count: number;
  change_notes: string;
  face_photo_quality: string;
}

interface Profile {
  profile_url: string;
  name: string;
  height_cm: number;
  cup_size: string;
  measurements?: string;
  weight_kg?: string;
  shop_name?: string;
  service_type?: string;
  local_image_path: string | null;
  latest_snapshot?: Snapshot;
}

const COLUMNS = [
  { id: "photo", label: "Obj" },
  { id: "name", label: "Identifier", alwaysVisible: true },
  { id: "age", label: "Age" },
  { id: "measurements", label: "3S" },
  { id: "height", label: "HT" },
  { id: "weight", label: "WT" },
  { id: "cup", label: "Cup" },
  { id: "price", label: "Rate" },
  { id: "shop", label: "Shop" },
  { id: "area", label: "Sector" },
  { id: "availability", label: "Status" },
  { id: "reviews", label: "Intel" },
];

export default function Dashboard() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("Newest Intel");
  const [visibleColumns, setVisibleColumns] = useState<string[]>(["photo", "name", "age", "measurements", "height", "weight", "cup", "price", "shop", "area", "availability"]);
  const [showColumnSelector, setShowColumnSelector] = useState(false);

  // Filter States
  const [selectedAreas, setSelectedAreas] = useState<string[]>([]);
  const [ageRange, setAgeRange] = useState<{ min: number, max: number }>({ min: 18, max: 24 });
  const [cupRange, setCupRange] = useState<{ min: string, max: string }>({ min: 'A', max: 'Z' });
  const [activeFilter, setActiveFilter] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/profiles")
      .then((res) => res.json())
      .then((data) => {
        setProfiles(data);
        setLoading(false);
      })
      .catch((err) => console.error("Fetch error:", err));
  }, []);

  const CUP_ORDER = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
  const cupToIndex = (cup: string | undefined) => {
    if (!cup) return -1;
    const match = cup.toUpperCase().match(/[A-Z]/);
    return match ? CUP_ORDER.indexOf(match[0]) : -1;
  };

  const filterOptions = useMemo(() => {
    const areas = Array.from(new Set(profiles.map(p => p.latest_snapshot?.area).filter((v): v is string => !!v))).sort();
    return { areas };
  }, [profiles]);

  const toggleFilter = (type: string, value: any) => {
    const update = (prev: any[]) => 
      prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value];
    
    if (type === 'area') setSelectedAreas(update);
  };

  const toggleColumn = (id: string) => {
    if (COLUMNS.find(c => c.id === id)?.alwaysVisible) return;
    setVisibleColumns(prev => 
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
  };

  const filteredProfiles = useMemo(() => {
    return profiles
      .filter((p) => {
        const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || 
                             (p.latest_snapshot?.area?.toLowerCase().includes(search.toLowerCase()) ?? false);
        
        const pCupIdx = cupToIndex(p.cup_size);
        const matchesCup = pCupIdx >= cupToIndex(cupRange.min) && pCupIdx <= cupToIndex(cupRange.max);
        
        const matchesArea = selectedAreas.length === 0 || (p.latest_snapshot?.area && selectedAreas.includes(p.latest_snapshot.area));
        
        let matchesAge = true;
        if (p.latest_snapshot?.age) {
          matchesAge = p.latest_snapshot.age >= ageRange.min && p.latest_snapshot.age <= ageRange.max;
        }

        return (matchesSearch || !search) && matchesCup && matchesArea && matchesAge;
      })
      .sort((a, b) => {
        if (sortBy === "Price: Low") return (a.latest_snapshot?.price_yen || 0) - (b.latest_snapshot?.price_yen || 0);
        if (sortBy === "Price: High") return (b.latest_snapshot?.price_yen || 0) - (a.latest_snapshot?.price_yen || 0);
        
        if (sortBy === "Age: Low") return (a.latest_snapshot?.age || 0) - (b.latest_snapshot?.age || 0);
        if (sortBy === "Age: High") return (b.latest_snapshot?.age || 0) - (a.latest_snapshot?.age || 0);
        
        if (sortBy === "Height: Low") return (a.height_cm || 0) - (b.height_cm || 0);
        if (sortBy === "Height: High") return (b.height_cm || 0) - (a.height_cm || 0);
        
        if (sortBy === "Name: A-Z") return a.name.localeCompare(b.name);
        if (sortBy === "Name: Z-A") return b.name.localeCompare(a.name);

        if (sortBy === "Cup: A-Z") return cupToIndex(a.cup_size) - cupToIndex(b.cup_size);
        if (sortBy === "Cup: Z-A") return cupToIndex(b.cup_size) - cupToIndex(a.cup_size);

        return 0;
      });
  }, [profiles, search, cupRange, selectedAreas, ageRange, sortBy]);

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen bg-[#171412]">
      <div className="animate-pulse text-amber-600 text-2xl font-bold tracking-[0.3em]">KAGUYA</div>
    </div>
  );

  return (
    <main className="min-h-screen text-stone-300 selection:bg-amber-600/30 font-sans" onClick={() => setActiveFilter(null)}>
      {/* Background Decor */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-orange-900/10 blur-[140px] rounded-full"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-amber-900/10 blur-[140px] rounded-full"></div>
      </div>

      <section className="container mx-auto px-6 py-12 max-w-7xl">
        <header className="flex flex-col gap-10 mb-16">
          <div className="flex items-end justify-between">
            <div className="flex items-center gap-6">
              <div className="w-14 h-14 bg-gradient-to-tr from-amber-700 to-amber-600 rounded-2xl amber-glow flex items-center justify-center rotate-3 hover:rotate-0 transition-transform duration-300">
                <Tag className="text-stone-200 w-7 h-7" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-2">
                   <span className="w-2 h-2 bg-amber-600 rounded-full animate-pulse shadow-[0_0_12px_rgba(180,83,9,1)]"></span>
                   <span className="text-[10px] font-black text-amber-700/80 uppercase tracking-[0.4em]">Operational Status: Active</span>
                </div>
                <h1 className="text-7xl font-black text-stone-200 tracking-tighter uppercase italic leading-none drop-shadow-2xl">
                  kaguya<span className="text-amber-600 not-italic">.</span>
                </h1>
              </div>
            </div>

            <div className="hidden md:flex flex-col items-end gap-3 text-right">
              <div className="text-[10px] text-stone-600 font-bold uppercase tracking-[0.3em] bg-stone-900/40 px-3 py-1 rounded-full border border-stone-800/30">
                v2.8 Deep Scan • <span className="text-amber-700/80">Secure Node</span>
              </div>
              <div className="flex items-center gap-2 px-3">
                <div className="w-1.5 h-1.5 bg-emerald-600/60 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.4)]"></div>
                <span className="text-[9px] font-bold text-stone-700 uppercase tracking-widest">Region: Tokyo Mainframe</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col lg:flex-row items-stretch gap-4 bg-stone-900/40 backdrop-blur-md border border-stone-800/20 p-2 rounded-2xl shadow-2xl">
            <div className="relative flex-1 group">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-600 group-focus-within:text-amber-600 transition-colors" />
              <input 
                type="text" 
                placeholder="Search intel parameters..."
                className="w-full bg-stone-950/40 border border-stone-900/50 rounded-xl py-4 pl-12 pr-4 text-sm focus:border-amber-700/50 focus:ring-4 focus:ring-amber-900/5 outline-none transition-all text-stone-300 placeholder:text-stone-700 font-medium"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className="flex items-center gap-2 p-1">
              <div className="flex items-center gap-2 bg-stone-950/40 border border-stone-900/50 rounded-xl px-4 py-3 group hover:border-stone-800 transition-colors">
                <SortAsc className="w-4 h-4 text-stone-600 group-hover:text-amber-600 transition-colors" />
                <select 
                  className="bg-transparent text-xs font-bold uppercase tracking-wider text-stone-500 outline-none cursor-pointer hover:text-stone-300 transition-colors"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  <option className="bg-stone-900">Newest Intel</option>
                  <option className="bg-stone-900">Price: Low</option>
                  <option className="bg-stone-900">Price: High</option>
                  <option className="bg-stone-900">Age: Low</option>
                  <option className="bg-stone-900">Age: High</option>
                  <option className="bg-stone-900">Height: Low</option>
                  <option className="bg-stone-900">Height: High</option>
                  <option className="bg-stone-900">Name: A-Z</option>
                  <option className="bg-stone-900">Name: Z-A</option>
                  <option className="bg-stone-900">Cup: A-Z</option>
                  <option className="bg-stone-900">Cup: Z-A</option>
                </select>
              </div>

              <div className="relative">
                <button 
                  onClick={(e) => { e.stopPropagation(); setShowColumnSelector(!showColumnSelector); }}
                  className="flex items-center gap-2 bg-stone-950/40 border border-stone-900/50 rounded-xl px-5 py-3 text-xs font-bold uppercase tracking-wider text-stone-500 hover:text-stone-200 hover:border-amber-700/50 hover:bg-stone-900 transition-all"
                 >
                  <Settings className="w-4 h-4" />
                  <span>Config</span>
                </button>
                
                {showColumnSelector && (
                  <div className="absolute right-0 mt-4 w-64 glass rounded-2xl overflow-hidden p-2 z-30 animate-in fade-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
                    <div className="text-[10px] font-black text-stone-600 px-4 py-3 uppercase tracking-[0.2em] border-b border-stone-800/30 mb-2">Display Parameters</div>
                    <div className="grid grid-cols-1 gap-1">
                      {COLUMNS.map(col => (
                        <button
                          key={col.id}
                          onClick={() => toggleColumn(col.id)}
                          disabled={col.alwaysVisible}
                          className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-[11px] font-bold transition-all ${
                            col.alwaysVisible ? "opacity-30 cursor-default" : "hover:bg-amber-900/10 text-stone-500 hover:text-amber-600"
                          }`}
                        >
                          {col.label}
                          {visibleColumns.includes(col.id) && <Check className="w-4 h-4 text-amber-600" />}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {(selectedAreas.length > 0 || ageRange.min !== 18 || ageRange.max !== 24 || cupRange.min !== 'A' || cupRange.max !== 'Z') && (
            <div className="flex items-center gap-4 animate-in fade-in slide-in-from-top-4 duration-500">
              <span className="text-[10px] font-bold text-stone-700 uppercase tracking-widest">Active Filters:</span>
              <div className="flex flex-wrap gap-2">
                <div className="flex items-center gap-2 bg-amber-900/10 border border-amber-900/20 px-3 py-1.5 rounded-full text-[10px] font-bold text-amber-600 uppercase tracking-wide">
                  Age {ageRange.min}-{ageRange.max}
                </div>
                <div className="flex items-center gap-2 bg-orange-950/20 border border-orange-900/20 px-3 py-1.5 rounded-full text-[10px] font-bold text-orange-600/80 uppercase tracking-wide">
                  Cup {cupRange.min}-{cupRange.max}
                </div>
                {selectedAreas.map(a => (
                  <div key={a} className="flex items-center gap-2 bg-stone-900/40 border border-stone-800/30 px-3 py-1.5 rounded-full text-[10px] font-bold text-stone-500 uppercase tracking-wide">
                    {a}
                  </div>
                ))}
                <button 
                  onClick={() => { setSelectedAreas([]); setAgeRange({ min: 18, max: 24 }); setCupRange({ min: 'A', max: 'Z' }); }}
                  className="flex items-center gap-2 hover:bg-orange-950/20 px-4 py-1.5 rounded-full text-[10px] font-bold text-orange-600 uppercase transition-all hover:scale-105"
                >
                  Reset Parameters
                </button>
              </div>
            </div>
          )}
        </header>

        {/* Table View */}
        <div className="rounded-3xl border border-stone-800/40 bg-stone-900/10 backdrop-blur-xl shadow-[0_32px_64px_-16px_rgba(0,0,0,0.8)] animate-in fade-in slide-in-from-bottom-8 duration-700">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse table-fixed">
              <thead>
                <tr className="bg-stone-900/40 border-b border-stone-900/50">
                  {visibleColumns.includes("photo") && <th className="px-6 py-5 text-[10px] font-black text-stone-600 uppercase tracking-[0.2em] w-32 text-center">Object</th>}
                  {visibleColumns.includes("name") && <th className="px-6 py-5 text-[10px] font-black text-stone-600 uppercase tracking-[0.2em] w-48">Identifier</th>}
                  
                  {/* Age Range Filter */}
                  {visibleColumns.includes("age") && (
                    <th className="px-6 py-5 relative w-24">
                      <button 
                        onClick={(e) => { e.stopPropagation(); setActiveFilter(activeFilter === 'age' ? null : 'age'); }}
                        className={`flex items-center justify-center gap-2 w-full group cursor-pointer transition-all hover:scale-105 ${
                          ageRange.min !== 18 || ageRange.max !== 24 ? "text-amber-600" : ""
                        }`}
                      >
                        <span className={`text-[10px] font-black uppercase tracking-[0.2em] transition-colors ${
                          ageRange.min !== 18 || ageRange.max !== 24 ? "text-amber-600" : "text-stone-600 group-hover:text-amber-600"
                        }`}>Age</span>
                        <Filter className={`w-3 h-3 ${ageRange.min !== 18 || ageRange.max !== 24 ? 'text-amber-600' : 'text-stone-800'} group-hover:text-amber-600`} />
                      </button>
                      {activeFilter === 'age' && (
                        <div className="absolute top-full left-0 mt-2 w-48 glass rounded-2xl p-4 z-20 animate-in fade-in slide-in-from-top-2 duration-200" onClick={(e) => e.stopPropagation()}>
                          <div className="text-[9px] font-black text-stone-600 uppercase tracking-[0.2em] border-b border-stone-800/30 mb-4 pb-2">Age Range Filter</div>
                          <div className="space-y-4">
                            <div className="flex items-center gap-2">
                              <input 
                                type="number"
                                placeholder="MIN"
                                value={ageRange.min}
                                onChange={(e) => setAgeRange(prev => ({ ...prev, min: parseInt(e.target.value) || 0 }))}
                                className="w-full bg-stone-950/40 border border-stone-900/50 rounded-lg py-2 px-3 text-[11px] font-bold text-stone-300 focus:border-amber-700/50 outline-none placeholder:text-stone-800"
                              />
                              <span className="text-[9px] font-black text-stone-800">/</span>
                              <input 
                                type="number"
                                placeholder="MAX"
                                value={ageRange.max}
                                onChange={(e) => setAgeRange(prev => ({ ...prev, max: parseInt(e.target.value) || 0 }))}
                                className="w-full bg-stone-950/40 border border-stone-900/50 rounded-lg py-2 px-3 text-[11px] font-bold text-stone-300 focus:border-amber-700/50 outline-none placeholder:text-stone-800"
                              />
                            </div>
                            <div className="text-[9px] font-bold text-amber-700/60 uppercase tracking-widest text-center italic">Scanning: {ageRange.min}-{ageRange.max}y</div>
                          </div>
                        </div>
                      )}
                    </th>
                  )}

                  {visibleColumns.includes("measurements") && <th className="px-6 py-5 text-[10px] font-black text-stone-500 uppercase tracking-[0.2em] w-36 text-center">3S Matrix</th>}
                  {visibleColumns.includes("height") && <th className="px-6 py-5 text-[10px] font-black text-stone-500 uppercase tracking-[0.2em] text-center w-20">HT</th>}
                  {visibleColumns.includes("weight") && <th className="px-6 py-5 text-[10px] font-black text-stone-500 uppercase tracking-[0.2em] text-center w-20">WT</th>}
                  
                  {/* Cup Filter */}
                  {visibleColumns.includes("cup") && (
                    <th className="px-6 py-5 relative w-24">
                      <button 
                        onClick={(e) => { e.stopPropagation(); setActiveFilter(activeFilter === 'cup' ? null : 'cup'); }}
                        className={`flex items-center justify-center gap-2 w-full group cursor-pointer transition-all hover:scale-105 ${
                          cupRange.min !== 'A' || cupRange.max !== 'Z' ? "text-amber-600" : ""
                        }`}
                      >
                        <span className={`text-[10px] font-black uppercase tracking-[0.2em] transition-colors ${
                          cupRange.min !== 'A' || cupRange.max !== 'Z' ? "text-amber-600" : "text-stone-600 group-hover:text-amber-600"
                        }`}>Cup</span>
                        <Filter className={`w-3 h-3 ${cupRange.min !== 'A' || cupRange.max !== 'Z' ? 'text-amber-600' : 'text-stone-800'} group-hover:text-amber-600`} />
                      </button>
                      {activeFilter === 'cup' && (
                        <div className="absolute top-full left-0 mt-2 w-48 glass rounded-2xl p-4 z-20 animate-in fade-in slide-in-from-top-2 duration-200" onClick={(e) => e.stopPropagation()}>
                          <div className="text-[9px] font-black text-stone-600 uppercase tracking-[0.2em] border-b border-stone-800/30 mb-4 pb-2">Volume Parameter</div>
                          <div className="space-y-4">
                            <div className="flex items-center gap-2">
                              <select 
                                value={cupRange.min}
                                onChange={(e) => setCupRange(prev => ({ ...prev, min: e.target.value }))}
                                className="w-full bg-stone-950/40 border border-stone-900/50 rounded-lg py-2 px-3 text-[11px] font-bold text-stone-300 focus:border-amber-700/50 outline-none"
                              >
                                {['A','B','C','D','E','F','G','H','I','J','K'].map(c => <option key={c} value={c} className="bg-stone-900">-{c}</option>)}
                              </select>
                              <span className="text-[9px] font-black text-stone-800">/</span>
                              <select 
                                value={cupRange.max}
                                onChange={(e) => setCupRange(prev => ({ ...prev, max: e.target.value }))}
                                className="w-full bg-stone-950/40 border border-stone-900/50 rounded-lg py-2 px-3 text-[11px] font-bold text-stone-300 focus:border-amber-700/50 outline-none"
                              >
                                {['A','B','C','D','E','F','G','H','I','J','K'].map(c => <option key={c} value={c} className="bg-stone-900">{c}+</option>)}
                              </select>
                            </div>
                            <div className="text-[9px] font-bold text-orange-700/60 uppercase tracking-widest text-center italic">Scanning: {cupRange.min}-{cupRange.max}</div>
                          </div>
                        </div>
                      )}
                    </th>
                  )}

                  {visibleColumns.includes("price") && <th className="px-6 py-5 text-[10px] font-black text-stone-500 uppercase tracking-[0.2em] w-32">Rate</th>}
                  {visibleColumns.includes("shop") && <th className="px-6 py-5 text-[10px] font-black text-stone-500 uppercase tracking-[0.2em] w-40">Store</th>}
                  
                  {/* Sector Filter */}
                  {visibleColumns.includes("area") && (
                    <th className="px-6 py-5 relative w-32">
                      <button 
                         onClick={(e) => { e.stopPropagation(); setActiveFilter(activeFilter === 'area' ? null : 'area'); }}
                         className={`flex items-center justify-center gap-2 w-full group cursor-pointer transition-all hover:scale-105 ${
                           selectedAreas.length > 0 ? "text-amber-600" : ""
                         }`}
                      >
                        <span className={`text-[10px] font-black uppercase tracking-[0.2em] transition-colors ${
                          selectedAreas.length > 0 ? "text-amber-600" : "text-stone-600 group-hover:text-amber-600"
                        }`}>Sector</span>
                        <Filter className={`w-3 h-3 ${selectedAreas.length > 0 ? 'text-amber-600' : 'text-stone-800'} group-hover:text-amber-600`} />
                      </button>
                      {activeFilter === 'area' && (
                        <div className="absolute top-full left-0 mt-2 w-48 glass rounded-2xl p-4 z-20 animate-in fade-in slide-in-from-top-2 duration-200" onClick={(e) => e.stopPropagation()}>
                          <div className="text-[9px] font-black text-stone-600 uppercase tracking-[0.2em] border-b border-stone-800/30 mb-4 pb-2">Sector Select</div>
                          <div className="max-h-48 overflow-y-auto pr-2 custom-scrollbar space-y-1">
                            {filterOptions.areas.map(area => (
                              <label key={area} className="flex items-center gap-3 px-2 py-1.5 rounded-lg hover:bg-amber-900/10 cursor-pointer group/item transition-colors">
                                <input 
                                  type="checkbox"
                                  checked={selectedAreas.includes(area)}
                                  onChange={() => toggleFilter('area', area)}
                                  className="w-3 h-3 rounded bg-stone-950/40 border-stone-900 text-amber-700/80 focus:ring-0 focus:ring-offset-0"
                                />
                                <span className={`text-[10px] font-bold uppercase tracking-wide transition-colors ${
                                  selectedAreas.includes(area) ? 'text-amber-700/80' : 'text-stone-600 group-hover/item:text-stone-400'
                                }`}>{area}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      )}
                    </th>
                  )}

                  {visibleColumns.includes("measurements") && <th className="px-6 py-5 text-[10px] font-black text-stone-600 uppercase tracking-[0.2em] text-center w-28">Matrix</th>}
                  {visibleColumns.includes("height") && <th className="px-6 py-5 text-[10px] font-black text-stone-600 uppercase tracking-[0.2em] text-center w-20">Ht</th>}
                  {visibleColumns.includes("weight") && <th className="px-6 py-5 text-[10px] font-black text-stone-600 uppercase tracking-[0.2em] text-center w-20">Wt</th>}
                  {visibleColumns.includes("price") && <th className="px-6 py-5 text-[10px] font-black text-stone-600 uppercase tracking-[0.2em] w-24">Rate</th>}
                  {visibleColumns.includes("shop") && <th className="px-6 py-5 text-[10px] font-black text-stone-600 uppercase tracking-[0.2em] w-32">Base</th>}
                  {visibleColumns.includes("availability") && <th className="px-6 py-5 text-[10px] font-black text-stone-600 uppercase tracking-[0.2em] text-center w-28">Reliability</th>}
                  {visibleColumns.includes("reviews") && <th className="px-6 py-5 text-[10px] font-black text-stone-600 uppercase tracking-[0.2em] text-center w-24">Intel Clips</th>}
                  <th className="px-8 py-5 text-[10px] font-black text-stone-600 uppercase tracking-[0.2em] text-right w-20">Cmd</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-800/20">
                {filteredProfiles.map((p, idx) => (
                  <tr 
                    key={p.profile_url}
                    className="group hover:bg-stone-900/10 transition-all duration-200"
                  >
                    {visibleColumns.includes("photo") && (
                      <td className="px-6 py-6" style={{ zIndex: 10 }}>
                        <a 
                          href={p.profile_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className={`block w-20 h-28 mx-auto rounded-xl overflow-hidden border border-stone-800 group-hover:border-amber-700/40 transition-all duration-300 shadow-[0_4px_24px_rgba(0,0,0,0.5)] group-hover:scale-[2] group-hover:z-50 group-hover:shadow-[0_20px_50px_rgba(0,0,0,0.8)] relative bg-stone-950/60 ${
                            idx < 3 ? 'origin-top-left' : idx > filteredProfiles.length - 4 ? 'origin-bottom-left' : 'origin-left'
                          }`}
                        >
                          <img 
                            src={p.local_image_path || "https://placehold.co/180x240?text=?"} 
                            alt={p.name}
                            className="w-full h-full object-cover transition-all duration-700 group-hover:scale-110 filter brightness-[0.8] group-hover:brightness-95 contrast-[1.05]"
                          />
                        </a>
                      </td>
                    )}
                    {visibleColumns.includes("name") && (
                      <td className="px-6 py-6">
                        <div className="flex flex-col gap-1">
                          <span className="text-sm font-black text-stone-400 group-hover:text-amber-600 transition-colors uppercase tracking-tight">{p.name}</span>
                          <span className="text-[9px] text-stone-700 font-mono tracking-widest uppercase opacity-60">ID://{p.profile_url.split('/').slice(-2, -1)}</span>
                        </div>
                      </td>
                    )}
                    {visibleColumns.includes("age") && (
                      <td className="px-6 py-6 text-center">
                        <span className="text-xs font-black text-stone-600 group-hover:text-stone-400 transition-colors">{p.latest_snapshot?.age || "??"}</span>
                      </td>
                    )}
                    {visibleColumns.includes("measurements") && (
                      <td className="px-6 py-6 text-center">
                        <span className="text-[11px] font-bold text-stone-700 group-hover:text-orange-700 transition-colors font-mono tracking-tighter">{p.measurements || "VOID"}</span>
                      </td>
                    )}
                    {visibleColumns.includes("height") && (
                      <td className="px-6 py-6 text-center text-xs font-bold text-stone-700 group-hover:text-stone-500">{p.height_cm}<span className="text-[9px] text-stone-800 ml-0.5">CM</span></td>
                    )}
                    {visibleColumns.includes("weight") && (
                      <td className="px-6 py-6 text-center text-xs font-bold text-stone-700 group-hover:text-stone-500">
                        {p.weight_kg && !p.weight_kg.includes("N/A") ? (
                          <>
                            {p.weight_kg.replace(/kg/i, '')}
                            <span className="text-[9px] text-stone-800 ml-0.5">KG</span>
                          </>
                        ) : "—"}
                      </td>
                    )}
                    {visibleColumns.includes("cup") && (
                      <td className="px-6 py-6 text-center">
                        <span className="text-sm font-black text-amber-900/30 group-hover:text-amber-700 transition-colors drop-shadow-[0_0_8px_rgba(180,83,9,0.2)]">{p.cup_size}</span>
                      </td>
                    )}
                    {visibleColumns.includes("price") && (
                      <td className="px-6 py-6 text-center">
                        <span className="text-xs font-black text-stone-500 group-hover:text-stone-200 transition-colors whitespace-nowrap">
                          {p.latest_snapshot?.price_yen ? `¥${p.latest_snapshot.price_yen.toLocaleString()}` : "—"}
                        </span>
                      </td>
                    )}
                    {visibleColumns.includes("shop") && (
                      <td className="px-6 py-6 font-medium">
                        <span className="text-xs text-stone-700 group-hover:text-stone-500 truncate block transition-colors max-w-[120px]">{p.shop_name || "—"}</span>
                      </td>
                    )}
                    {visibleColumns.includes("area") && (
                      <td className="px-6 py-6">
                        <div className="flex items-center gap-2 text-[10px] font-black text-stone-700 uppercase tracking-tighter group-hover:text-amber-800 transition-colors">
                          {p.latest_snapshot?.area || "VOID"}
                        </div>
                      </td>
                    )}
                    {visibleColumns.includes("availability") && (
                      <td className="px-6 py-6 text-center">
                        <span className={`text-[9px] font-black px-3 py-1 rounded-full border uppercase tracking-[0.1em] ${
                          p.latest_snapshot?.availability?.includes("OK") 
                            ? "bg-emerald-950/10 text-emerald-800 border-emerald-900/10 shadow-[0_0_12px_rgba(16,185,129,0.05)]" 
                            : "bg-rose-950/10 text-rose-800 border-rose-900/10 shadow-[0_0_12px_rgba(244,63,94,0.05)]"
                        } transition-all duration-300`}>
                          {p.latest_snapshot?.availability || "OFFLINE"}
                        </span>
                      </td>
                    )}
                    {visibleColumns.includes("reviews") && (
                      <td className="px-6 py-6 text-center">
                         <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-stone-950/20 border border-stone-900/20 text-[10px] font-black text-stone-700 group-hover:text-stone-500 transition-colors">
                           <Eye className="w-3 h-3 text-stone-800 group-hover:text-amber-800" />
                           {p.latest_snapshot?.review_count || 0}
                         </div>
                      </td>
                    )}
                    <td className="px-8 py-6 text-right">
                      <button className="p-2.5 bg-stone-950/30 border border-stone-900 rounded-xl hover:bg-amber-900/10 hover:border-amber-700/20 transition-all group/btn hover:scale-110 active:scale-95">
                        <ChevronRight className="w-4 h-4 text-stone-800 group-hover/btn:text-amber-700" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </main>
  );
}
