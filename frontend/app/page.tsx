"use client";

import { useState, useEffect, useMemo } from "react";
import { Filter, Search, SortAsc, MapPin, Ruler, User, Tag, ChevronRight } from "lucide-react";

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
  local_image_path: string | null;
  latest_snapshot?: Snapshot;
}

export default function Dashboard() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCup, setSelectedCup] = useState<string>("All");
  const [sortBy, setSortBy] = useState("Newest");

  useEffect(() => {
    fetch("/api/profiles")
      .then((res) => res.json())
      .then((data) => {
        setProfiles(data);
        setLoading(false);
      })
      .catch((err) => console.error("Fetch error:", err));
  }, []);

  const cups = useMemo(() => {
    const set = new Set(profiles.map((p) => p.cup_size).filter(Boolean));
    return ["All", ...Array.from(set).sort()];
  }, [profiles]);

  const filteredProfiles = useMemo(() => {
    return profiles
      .filter((p) => {
        const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || 
                             p.latest_snapshot?.area.toLowerCase().includes(search.toLowerCase());
        const matchesCup = selectedCup === "All" || p.cup_size === selectedCup;
        return matchesSearch && matchesCup;
      })
      .sort((a, b) => {
        if (sortBy === "Price: Low") return (a.latest_snapshot?.price_yen || 0) - (b.latest_snapshot?.price_yen || 0);
        if (sortBy === "Price: High") return (b.latest_snapshot?.price_yen || 0) - (a.latest_snapshot?.price_yen || 0);
        return 0; // Default to natural order for now
      });
  }, [profiles, search, selectedCup, sortBy]);

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen bg-black">
      <div className="animate-pulse text-pink-500 text-2xl font-bold tracking-widest">KAGUYA</div>
    </div>
  );

  return (
    <main className="min-h-screen flex flex-col md:flex-row bg-[#050505]">
      {/* Sidebar */}
      <aside className="w-full md:w-72 glass border-r border-[#222] p-6 space-y-8 sticky top-0 h-auto md:h-screen">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-pink-500 rounded-full pink-glow flex items-center justify-center">
            <Tag className="text-white w-4 h-4" />
          </div>
          <h1 className="text-2xl font-bold tracking-tighter text-white">kaguya</h1>
        </div>

        <div className="space-y-4">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-widest">Search</label>
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-500" />
            <input 
              type="text" 
              placeholder="Name or Area..."
              className="w-full bg-[#111] border border-[#222] rounded-lg py-2 pl-10 pr-4 text-sm focus:border-pink-500 outline-none transition-all"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-4">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-widest">Filters</label>
          <div className="space-y-2">
            <p className="text-sm text-gray-400">Cup Size</p>
            <div className="flex flex-wrap gap-2">
              {cups.map((cup) => (
                <button 
                  key={cup}
                  onClick={() => setSelectedCup(cup)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                    selectedCup === cup ? "bg-pink-500 text-white" : "bg-[#111] text-gray-500 hover:text-white"
                  }`}
                >
                  {cup}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="pt-8 text-[10px] text-gray-600">
          POWERED BY KAGUYA ENGINE • 2026
        </div>
      </aside>

      {/* Main Content */}
      <section className="flex-1 p-8 overflow-y-auto">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
          <div>
            <h2 className="text-3xl font-bold text-white mb-1">Cast Explorer</h2>
            <p className="text-gray-500 text-sm">Found {filteredProfiles.length} active profiles across Tokyo.</p>
          </div>
          
          <div className="flex items-center gap-4">
             <div className="flex items-center gap-2 bg-[#111] border border-[#222] rounded-lg px-3 py-1.5">
                <SortAsc className="w-4 h-4 text-gray-500" />
                <select 
                  className="bg-transparent text-sm text-gray-300 outline-none"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  <option>Newest</option>
                  <option>Price: Low</option>
                  <option>Price: High</option>
                </select>
             </div>
          </div>
        </header>

        {/* Gallery */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProfiles.map((p) => (
            <div 
              key={p.profile_url}
              className="group glass rounded-2xl overflow-hidden hover:border-pink-500 transition-colors duration-300"
            >
              <div className="relative aspect-[3/4] overflow-hidden bg-[#111]">
                <img 
                  src={p.local_image_path || "https://placehold.co/400x600?text=No+Photo"} 
                  alt={p.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-80" />
                <div className="absolute bottom-4 left-4 right-4">
                  <h3 className="text-xl font-bold text-white group-hover:text-pink-400 transition-colors uppercase tracking-tight">{p.name}</h3>
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    <span className="text-[10px] bg-pink-500/20 text-pink-400 px-2 py-0.5 rounded border border-pink-500/30">
                      {p.latest_snapshot?.age || "??"} yrs
                    </span>
                    <span className="text-[10px] bg-cyan-500/20 text-cyan-400 px-2 py-0.5 rounded border border-cyan-500/30">
                      {p.cup_size} Cup
                    </span>
                    <span className="text-[10px] bg-white/10 text-gray-300 px-2 py-0.5 rounded backdrop-blur border border-white/5">
                      {p.height_cm}cm
                    </span>
                  </div>
                </div>
              </div>
              <div className="p-4 space-y-3">
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <MapPin className="w-3 h-3 text-pink-500" />
                  <span className="truncate">{p.latest_snapshot?.area || "Unknown Area"}</span>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-white/5">
                  <div className="text-sm font-bold text-white">
                    {p.latest_snapshot?.price_yen ? `¥${p.latest_snapshot.price_yen.toLocaleString()}` : "Contact"}
                  </div>
                  <div className="text-[10px] uppercase font-bold text-gray-600 group-hover:text-pink-500 transition-colors flex items-center gap-1 cursor-pointer">
                    Details <ChevronRight className="w-3 h-3" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
