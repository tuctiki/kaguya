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
  { id: "photo", label: "Obj", alwaysVisible: true },
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
  const [sortBy, setSortBy] = useState("Newest");
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
                             p.latest_snapshot?.area.toLowerCase().includes(search.toLowerCase());
        
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
        return 0;
      });
  }, [profiles, search, cupRange, selectedAreas, ageRange, sortBy]);

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen bg-black">
      <div className="animate-pulse text-pink-500 text-2xl font-bold tracking-widest">KAGUYA</div>
    </div>
  );

  return (
    <main className="min-h-screen bg-[#050505] text-gray-300 font-sans selection:bg-pink-500/30" onClick={() => setActiveFilter(null)}>
      {/* Main Content */}
      <section className="container mx-auto p-10 max-w-7xl overflow-x-hidden">
        <header className="flex flex-col gap-8 mb-12 border-b border-[#111] pb-10">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-pink-500 rounded-full pink-glow flex items-center justify-center shrink-0">
                <Tag className="text-white w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                   <span className="w-1.5 h-1.5 bg-pink-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(236,72,153,1)]"></span>
                   <span className="text-[10px] font-black text-pink-500 uppercase tracking-[0.3em]">Surveillance Active</span>
                </div>
                <h1 className="text-6xl font-black text-white tracking-tighter uppercase italic leading-none">kaguya</h1>
              </div>
            </div>

            <div className="flex flex-col items-end gap-2 text-right">
              <div className="text-[10px] text-gray-700 font-black uppercase tracking-[0.3em]">
                KAGUYA SYSTEM V2.5 • INTEL DASHBOARD
              </div>
              <div className="flex items-center gap-2 opacity-50">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full shadow-[0_0_5px_rgba(34,197,94,1)]"></div>
                <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Node: Tokyo/Mainframe</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col md:flex-row items-center gap-6 bg-[#0a0a0a] border border-[#1a1a1a] p-4 rounded-lg shadow-2xl">
            <div className="relative flex-1 group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-700 group-focus-within:text-pink-500 transition-colors" />
              <input 
                type="text" 
                placeholder="INTEL SCAN (NAME OR SECTOR)..."
                className="w-full bg-black border border-[#222] rounded-md py-3 pl-11 pr-4 text-[12px] font-black focus:border-pink-500 outline-none transition-all text-white placeholder:text-gray-800 tracking-wider"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-black border border-[#222] rounded-md px-4 py-2.5">
                <SortAsc className="w-4 h-4 text-gray-600" />
                <select 
                  className="bg-transparent text-[11px] font-black uppercase tracking-widest text-gray-400 outline-none cursor-pointer hover:text-white transition-colors"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  <option className="bg-black">Newest Intel</option>
                  <option className="bg-black">Price: Low</option>
                  <option className="bg-black">Price: High</option>
                </select>
              </div>

              <div className="relative">
                <button 
                  onClick={(e) => { e.stopPropagation(); setShowColumnSelector(!showColumnSelector); }}
                  className="flex items-center gap-2 bg-black border border-[#222] rounded-md px-4 py-2.5 text-[11px] font-black uppercase tracking-widest text-gray-400 hover:text-white hover:border-pink-500 transition-all shadow-lg"
                 >
                  <Settings className="w-4 h-4" />
                  Configurations
                </button>
                
                {showColumnSelector && (
                  <div className="absolute right-0 mt-3 w-56 bg-[#0a0a0a] border border-[#222] shadow-[0_20px_50px_rgba(0,0,0,0.8)] p-3 z-30 backdrop-blur-3xl" onClick={(e) => e.stopPropagation()}>
                    <div className="text-[10px] font-black text-gray-600 px-3 py-2 uppercase tracking-[0.2em] border-b border-[#222] mb-2">Display Parameters</div>
                    {COLUMNS.map(col => (
                      <button
                        key={col.id}
                        onClick={() => toggleColumn(col.id)}
                        disabled={col.alwaysVisible}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded text-[11px] font-bold transition-colors ${
                          col.alwaysVisible ? "opacity-30 cursor-default" : "hover:bg-pink-500/10 text-gray-500 hover:text-pink-400"
                        }`}
                      >
                        {col.label}
                        {visibleColumns.includes(col.id) && <Check className="w-3.5 h-3.5 text-pink-500" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {(selectedAreas.length > 0 || ageRange.min !== 18 || ageRange.max !== 24 || cupRange.min !== 'A' || cupRange.max !== 'Z') && (
            <div className="flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
              <span className="text-[10px] font-black text-gray-700 uppercase tracking-widest italic">Active Parameters:</span>
              <div className="flex flex-wrap gap-2">
                <div className="flex items-center gap-1.5 bg-pink-500/5 border border-pink-500/20 px-2.5 py-1 rounded text-[10px] font-black text-pink-500 uppercase">
                  Age {ageRange.min}-{ageRange.max}
                </div>
                <div className="flex items-center gap-1.5 bg-cyan-500/5 border border-cyan-500/20 px-2.5 py-1 rounded text-[10px] font-black text-cyan-500 uppercase">
                  Cup {cupRange.min}-{cupRange.max}
                </div>
                {selectedAreas.map(a => (
                  <div key={a} className="flex items-center gap-1.5 bg-white/5 border border-white/10 px-2.5 py-1 rounded text-[10px] font-black text-gray-400 uppercase">
                    {a}
                  </div>
                ))}
                <button 
                  onClick={() => { setSelectedAreas([]); setAgeRange({ min: 18, max: 24 }); setCupRange({ min: 'A', max: 'Z' }); }}
                  className="flex items-center gap-2 hover:bg-white/5 px-2.5 py-1 rounded text-[10px] font-black text-rose-600 uppercase transition-colors"
                >
                  Reset Recon
                </button>
              </div>
            </div>
          )}
        </header>

        {/* Table View */}
        <div className="rounded-lg border border-[#1a1a1a] bg-[#070707] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.5)] overflow-visible">
          <table className="w-full text-left border-collapse table-fixed">
            <thead className="sticky top-0 z-10">
              <tr className="bg-[#0a0a0a] border-b border-[#1a1a1a]">
                {visibleColumns.includes("photo") && <th className="px-6 py-4 text-[9px] font-black text-gray-600 uppercase tracking-[0.2em] w-32 text-center">Obj</th>}
                {visibleColumns.includes("name") && <th className="px-6 py-4 text-[9px] font-black text-gray-600 uppercase tracking-[0.2em] w-40">Identifier</th>}
                
                {/* Age Range Filter */}
                {visibleColumns.includes("age") && (
                  <th className="px-6 py-4 relative w-20">
                    <button 
                      onClick={(e) => { e.stopPropagation(); setActiveFilter(activeFilter === 'age' ? null : 'age'); }}
                      className="flex items-center justify-center gap-1.5 w-full group cursor-pointer"
                    >
                      <span className="text-[9px] font-black text-gray-600 uppercase tracking-[0.2em] group-hover:text-pink-500 transition-colors">Age</span>
                      <Filter className={`w-3 h-3 ${ageRange.min !== 18 || ageRange.max !== 24 ? 'text-pink-500' : 'text-gray-800'} group-hover:text-pink-500`} />
                    </button>
                    {activeFilter === 'age' && (
                      <div className="absolute top-full left-0 mt-1 w-40 bg-[#0a0a0a] border border-[#222] shadow-2xl p-4 z-20 backdrop-blur-3xl" onClick={(e) => e.stopPropagation()}>
                        <div className="text-[8px] font-black text-gray-600 uppercase tracking-widest border-b border-[#222] mb-3 pb-1">Age Range</div>
                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <input 
                              type="number"
                              placeholder="MIN"
                              value={ageRange.min}
                              onChange={(e) => setAgeRange(prev => ({ ...prev, min: parseInt(e.target.value) || 0 }))}
                              className="w-full bg-black border border-[#222] rounded py-1 px-2 text-[10px] font-black text-white focus:border-pink-500 outline-none placeholder:text-gray-800"
                            />
                            <span className="text-[8px] text-gray-700 italic">TO</span>
                            <input 
                              type="number"
                              placeholder="MAX"
                              value={ageRange.max}
                              onChange={(e) => setAgeRange(prev => ({ ...prev, max: parseInt(e.target.value) || 0 }))}
                              className="w-full bg-black border border-[#222] rounded py-1 px-2 text-[10px] font-black text-white focus:border-pink-500 outline-none placeholder:text-gray-800"
                            />
                          </div>
                          <div className="text-[8px] font-bold text-gray-700 uppercase tracking-tighter">IDENTIFYING {ageRange.min}-{ageRange.max}y</div>
                        </div>
                      </div>
                    )}
                  </th>
                )}

                {visibleColumns.includes("measurements") && <th className="px-6 py-4 text-[9px] font-black text-gray-600 uppercase tracking-[0.2em] w-32">3S</th>}
                {visibleColumns.includes("height") && <th className="px-6 py-4 text-[9px] font-black text-gray-600 uppercase tracking-[0.2em] text-center w-16">HT</th>}
                {visibleColumns.includes("weight") && <th className="px-6 py-4 text-[9px] font-black text-gray-600 uppercase tracking-[0.2em] text-center w-16">WT</th>}
                
                {/* Cup Range Filter */}
                {visibleColumns.includes("cup") && (
                  <th className="px-6 py-4 relative w-16">
                    <button 
                      onClick={(e) => { e.stopPropagation(); setActiveFilter(activeFilter === 'cup' ? null : 'cup'); }}
                      className="flex items-center justify-center gap-1.5 w-full group cursor-pointer"
                    >
                      <span className="text-[9px] font-black text-gray-600 uppercase tracking-[0.2em] group-hover:text-pink-500 transition-colors">Cup</span>
                      <Filter className={`w-3 h-3 ${cupRange.min !== 'A' || cupRange.max !== 'Z' ? 'text-pink-500' : 'text-gray-800'} group-hover:text-pink-500`} />
                    </button>
                    {activeFilter === 'cup' && (
                      <div className="absolute top-full left-0 mt-1 w-32 bg-[#0a0a0a] border border-[#222] shadow-2xl p-4 z-20 backdrop-blur-3xl" onClick={(e) => e.stopPropagation()}>
                        <div className="text-[8px] font-black text-gray-600 uppercase tracking-widest border-b border-[#222] mb-3 pb-1">Cup Range</div>
                        <div className="flex items-center gap-2">
                          <input 
                            type="text"
                            placeholder="MIN"
                            maxLength={1}
                            value={cupRange.min}
                            onChange={(e) => setCupRange(prev => ({ ...prev, min: e.target.value.toUpperCase() }))}
                            className="w-full bg-black border border-[#222] rounded py-1 px-2 text-[10px] font-black text-white focus:border-pink-500 outline-none text-center"
                          />
                          <span className="text-[8px] text-gray-700 italic">TO</span>
                          <input 
                            type="text"
                            placeholder="MAX"
                            maxLength={1}
                            value={cupRange.max}
                            onChange={(e) => setCupRange(prev => ({ ...prev, max: e.target.value.toUpperCase() }))}
                            className="w-full bg-black border border-[#222] rounded py-1 px-2 text-[10px] font-black text-white focus:border-pink-500 outline-none text-center"
                          />
                        </div>
                      </div>
                    )}
                  </th>
                )}

                {visibleColumns.includes("price") && <th className="px-6 py-4 text-[9px] font-black text-gray-600 uppercase tracking-[0.2em] w-28">Rate</th>}
                {visibleColumns.includes("shop") && <th className="px-6 py-4 text-[9px] font-black text-gray-600 uppercase tracking-[0.2em] w-32">Shop</th>}
                
                {visibleColumns.includes("area") && (
                  <th className="px-6 py-4 relative w-32">
                    <button 
                      onClick={(e) => { e.stopPropagation(); setActiveFilter(activeFilter === 'area' ? null : 'area'); }}
                      className="flex items-center gap-1.5 group cursor-pointer"
                    >
                      <span className="text-[9px] font-black text-gray-600 uppercase tracking-[0.2em] group-hover:text-pink-500 transition-colors">Sector</span>
                      <Filter className={`w-3 h-3 ${selectedAreas.length > 0 ? 'text-pink-500' : 'text-gray-800'} group-hover:text-pink-500`} />
                    </button>
                    {activeFilter === 'area' && (
                      <div className="absolute top-full left-0 mt-1 w-48 bg-[#0a0a0a] border border-[#222] shadow-2xl p-2 z-20 backdrop-blur-3xl overflow-y-auto max-h-64" onClick={(e) => e.stopPropagation()}>
                        <div className="text-[8px] font-black text-gray-600 px-2 py-1 uppercase tracking-widest border-b border-[#222] mb-1">Select Sector</div>
                        {filterOptions.areas.map(area => (
                          <button key={area} onClick={() => toggleFilter('area', area)} className="w-full flex items-center justify-between px-2 py-1.5 rounded text-[10px] font-bold text-gray-500 hover:bg-white/5 hover:text-white text-left">
                            {area} {selectedAreas.includes(area) && <Check className="w-3 h-3 text-pink-500" />}
                          </button>
                        ))}
                      </div>
                    )}
                  </th>
                )}

                {visibleColumns.includes("availability") && <th className="px-6 py-4 text-[9px] font-black text-gray-600 uppercase tracking-[0.2em] w-28 text-center">Status</th>}
                {visibleColumns.includes("reviews") && <th className="px-6 py-4 text-[9px] font-black text-gray-600 uppercase tracking-[0.2em] text-center w-16">Intel</th>}
                <th className="px-6 py-4 text-[9px] font-black text-gray-600 uppercase tracking-[0.2em] text-right w-16 px-8">Cmd</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#111]">
              {filteredProfiles.map((p) => (
                <tr 
                  key={p.profile_url}
                  className="group hover:bg-pink-500/[0.03] transition-colors duration-100"
                >
                  {visibleColumns.includes("photo") && (
                    <td className="px-6 py-4">
                      <a 
                        href={p.profile_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="block w-[88px] h-[120px] mx-auto rounded-md overflow-hidden border border-[#222] group-hover:border-pink-500/50 transition-all opacity-40 blur-[0.5px] group-hover:opacity-100 group-hover:blur-0 bg-neutral-900 shadow-2xl relative"
                      >
                        <img 
                          src={p.local_image_path || "https://placehold.co/180x240?text=?"} 
                          alt={p.name}
                          className="w-full h-full object-cover transition-all duration-500 group-hover:scale-110"
                        />
                      </a>
                    </td>
                  )}
                  {visibleColumns.includes("name") && (
                    <td className="px-6 py-2.5">
                      <div className="flex flex-col">
                        <span className="text-[12px] font-black text-white group-hover:text-pink-500 transition-colors uppercase tracking-tight">{p.name}</span>
                        <span className="text-[9px] text-gray-800 truncate font-mono opacity-40">{p.profile_url.split('/').pop()}</span>
                      </div>
                    </td>
                  )}
                  {visibleColumns.includes("age") && (
                    <td className="px-6 py-2.5 text-center">
                      <span className="text-xs font-bold text-gray-600 group-hover:text-gray-400 transition-colors">{p.latest_snapshot?.age || "??"}</span>
                    </td>
                  )}
                  {visibleColumns.includes("measurements") && (
                    <td className="px-6 py-2.5">
                      <span className="text-[10px] font-bold text-gray-600 group-hover:text-gray-400 transition-colors font-mono">{p.measurements || "N/A"}</span>
                    </td>
                  )}
                  {visibleColumns.includes("height") && (
                    <td className="px-6 py-2.5 text-center text-[11px] font-bold text-gray-700">{p.height_cm}cm</td>
                  )}
                  {visibleColumns.includes("weight") && (
                    <td className="px-6 py-2.5 text-center text-[11px] font-bold text-gray-700">{p.weight_kg || "—"}</td>
                  )}
                  {visibleColumns.includes("cup") && (
                    <td className="px-6 py-2.5 text-center text-[11px] font-black text-cyan-900 group-hover:text-cyan-400 transition-colors font-mono tracking-tighter">{p.cup_size}</td>
                  )}
                  {visibleColumns.includes("price") && (
                    <td className="px-6 py-2.5">
                      <span className="text-xs font-bold text-gray-500 group-hover:text-white transition-colors">
                        {p.latest_snapshot?.price_yen ? `¥${p.latest_snapshot.price_yen.toLocaleString()}` : "—"}
                      </span>
                    </td>
                  )}
                  {visibleColumns.includes("shop") && (
                    <td className="px-6 py-2.5">
                      <span className="text-[10px] font-bold text-gray-600 group-hover:text-gray-400 truncate block transition-colors">{p.shop_name || "—"}</span>
                    </td>
                  )}
                  {visibleColumns.includes("area") && (
                    <td className="px-6 py-2.5">
                      <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-700 uppercase tracking-tighter group-hover:text-gray-400">
                        <MapPin className="w-2.5 h-2.5 text-pink-950 group-hover:text-pink-800" />
                        {p.latest_snapshot?.area || "VOID"}
                      </div>
                    </td>
                  )}
                  {visibleColumns.includes("availability") && (
                    <td className="px-6 py-2.5 text-center px-10">
                      <span className={`text-[8px] font-black px-2 py-0.5 rounded-sm border uppercase tracking-tighter ${
                        p.latest_snapshot?.availability?.includes("OK") 
                          ? "bg-emerald-500/5 text-emerald-900 group-hover:text-emerald-500 border-emerald-500/10 group-hover:border-emerald-500/20" 
                          : "bg-red-500/5 text-red-900 group-hover:text-red-500 border-red-500/10 group-hover:border-red-500/20"
                      } transition-all`}>
                        {p.latest_snapshot?.availability || "OFFLINE"}
                      </span>
                    </td>
                  )}
                  {visibleColumns.includes("reviews") && (
                    <td className="px-6 py-2.5 text-center">
                       <div className="flex items-center justify-center gap-1 text-[10px] font-black text-gray-800 group-hover:text-gray-500 transition-colors">
                         <Eye className="w-2.5 h-2.5" />
                         {p.latest_snapshot?.review_count || 0}
                       </div>
                    </td>
                  )}
                  <td className="px-6 py-2.5 text-right px-8">
                    <button className="p-1.5 hover:bg-pink-500/10 rounded transition-colors group/btn">
                      <ChevronRight className="w-3.5 h-3.5 text-gray-800 group-hover/btn:text-pink-500" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
