"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import ProgressBar from "@/components/ProgressBar";
import { useCardCollection } from "@/hooks/useCardCollection";
import { getPokemonByGeneration } from "@/data/pokemon";
import PremiumOverlay from "@/components/PremiumOverlay";
import { useSubscription } from "@/hooks/useSubscription";
import { ArrowDownTrayIcon, Squares2X2Icon, HeartIcon } from '@heroicons/react/24/outline';
import MyCardsModal from '@/components/MyCardsModal';

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { collection } = useCardCollection();
  const { isPremium, loading: subscriptionLoading } = useSubscription();
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [isMyCardsOpen, setIsMyCardsOpen] = useState(false);

  useEffect(() => {
    const getUser = async () => {
      const { data, error } = await supabase.auth.getUser();
      if (error || !data.user) {
        router.replace("/login");
        return;
      }
      setUser(data.user);
      setLoading(false);
    };
    getUser();
  }, [router]);

  // Calcul du nombre de Pokémon uniques possédés
  const ownedPokemon = new Set(Array.from(collection).map(item => item.pokemon_name));
  const ownedCount = ownedPokemon.size;
  const totalCount = 1025;

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError("");
    setPasswordSuccess("");
    setPasswordLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      setPasswordSuccess("Password updated successfully!");
      setShowPasswordForm(false);
      setNewPassword("");
    } catch (err: any) {
      setPasswordError(err?.message || "An error occurred");
    } finally {
      setPasswordLoading(false);
    }
  };

  function LinearProgressBar({ value, max }: { value: number; max: number }) {
    const percent = Math.round((value / max) * 100);
    return (
      <div className="w-full mb-2">
        <div className="w-full bg-gray-200 rounded-full h-4">
          <div
            className="bg-blue-600 h-4 rounded-full transition-all duration-300"
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>
    );
  }

  function CompletionOverTime({ collection }: { collection: Set<any> }) {
    // On veut l'évolution du nombre de Pokémon uniques possédés au fil du temps
    // 1. On trie les entrées par date d'ajout croissante
    // 2. On simule l'ajout progressif et on compte le nombre de Pokémon uniques à chaque date
    const items = Array.from(collection)
      .filter(item => item.created_at && item.pokemon_name)
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

    // Map date (YYYY-MM-DD) -> set de Pokémon possédés à cette date
    const dateMap = new Map<string, Set<string>>();
    let currentSet = new Set<string>();
    for (const item of items) {
      const date = item.created_at.slice(0, 10); // YYYY-MM-DD
      if (!dateMap.has(date)) {
        dateMap.set(date, new Set(currentSet));
      }
      currentSet.add(item.pokemon_name);
      dateMap.set(date, new Set(currentSet));
    }
    // Générer les points pour le graphique
    const points = Array.from(dateMap.entries()).map(([date, set]) => ({ date, count: set.size }));
    if (points.length === 0) return null;

    // Dimensions du graphique
    const width = 600;
    const height = 200;
    const padding = 40;
    const maxCount = Math.max(...points.map(p => p.count), 1);
    const minDate = new Date(points[0].date);
    const maxDate = new Date(points[points.length - 1].date);
    const dateToX = (dateStr: string) => {
      const date = new Date(dateStr).getTime();
      return padding + ((date - minDate.getTime()) / (maxDate.getTime() - minDate.getTime() || 1)) * (width - 2 * padding);
    };
    const countToY = (count: number) => height - padding - (count / maxCount) * (height - 2 * padding);

    // Générer la polyline
    const polyline = points.map(p => `${dateToX(p.date)},${countToY(p.count)}`).join(' ');

    // Helper pour formater la date en JJ/MM/AAAA
    function formatDateFR(dateStr: string) {
      const [y, m, d] = dateStr.split('-');
      return `${d}/${m}/${y}`;
    }

    return (
      <div className="mt-16 max-w-2xl mx-auto">
        <h2 className="text-xl font-bold mb-6">Progression over time</h2>
        <div className="overflow-x-auto w-full">
          <svg
            width="100%"
            height={height}
            viewBox={`0 0 ${width} ${height}`}
            className="bg-white rounded shadow"
            preserveAspectRatio="none"
          >
            {/* Axes */}
            <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#888" />
            <line x1={padding} y1={padding} x2={padding} y2={height - padding} stroke="#888" />
            {/* Graduation Y */}
            <text x={padding - 10} y={countToY(maxCount)} textAnchor="end" fontSize="12" fill="#888">{maxCount}</text>
            <text x={padding - 10} y={countToY(0)} textAnchor="end" fontSize="12" fill="#888">0</text>
            {/* Graduation X (dates) */}
            <text x={dateToX(points[0].date)} y={height - padding + 20} textAnchor="middle" fontSize="12" fill="#888">{formatDateFR(points[0].date)}</text>
            <text x={dateToX(points[points.length-1].date)} y={height - padding + 20} textAnchor="middle" fontSize="12" fill="#888">{formatDateFR(points[points.length-1].date)}</text>
            {/* Courbe */}
            <polyline fill="none" stroke="#2563eb" strokeWidth="3" points={polyline} />
            {/* Points */}
            {points.map((p, i) => (
              <circle key={i} cx={dateToX(p.date)} cy={countToY(p.count)} r={3} fill="#2563eb" />
            ))}
          </svg>
        </div>
      </div>
    );
  }

  function PieChartTypes({ collection }: { collection: Set<any> }) {
    // Compter le nombre de Pokémon uniques possédés par type principal
    const { POKEMONS } = require("@/data/pokemon");
    const ownedNames = new Set(Array.from(collection).map((item: any) => item.pokemon_name));
    const typeCounts: Record<string, number> = {};
    for (const p of POKEMONS) {
      if (ownedNames.has(p.name) && p.types.length > 0) {
        const type = p.types[0];
        typeCounts[type] = (typeCounts[type] || 0) + 1;
      }
    }
    const total = Object.values(typeCounts).reduce((a, b) => a + b, 0);
    const types = Object.keys(typeCounts);
    const colors: Record<string, string> = {
      Grass: '#22c55e', Poison: '#a21caf', Fire: '#ef4444', Flying: '#0ea5e9', Water: '#3b82f6', Bug: '#84cc16', Normal: '#a3a3a3', Electric: '#fde047', Ground: '#ca8a04', Fairy: '#f472b6', Fighting: '#dc2626', Psychic: '#ec4899', Rock: '#a16207', Steel: '#6b7280', Ice: '#06b6d4', Ghost: '#7c3aed', Dragon: '#7c3aed', Dark: '#334155'
    };
    // Pie chart dimensions
    const radius = 80;
    const cx = radius;
    const cy = radius;
    let acc = 0;
    const slices = types.map((type) => {
      const value = typeCounts[type];
      const angle = (value / total) * 2 * Math.PI;
      const x1 = cx + radius * Math.cos(acc);
      const y1 = cy + radius * Math.sin(acc);
      acc += angle;
      const x2 = cx + radius * Math.cos(acc);
      const y2 = cy + radius * Math.sin(acc);
      const largeArc = angle > Math.PI ? 1 : 0;
      const d = `M${cx},${cy} L${x1},${y1} A${radius},${radius} 0 ${largeArc} 1 ${x2},${y2} Z`;
      return { d, fill: colors[type] || '#888', type, value };
    });
    return (
      <div className="mt-16 max-w-2xl mx-auto">
        <h2 className="text-xl font-bold mb-6">Type distribution</h2>
        <div className="flex flex-col md:flex-row md:items-center gap-8">
          <svg width={radius * 2} height={radius * 2} className="mx-auto">
            {slices.map((s, i) => (
              <path key={i} d={s.d} fill={s.fill} stroke="#fff" strokeWidth={2} />
            ))}
          </svg>
          <div className="flex flex-col gap-2">
            {types.map((type) => (
              <div key={type} className="flex items-center gap-2">
                <span className="inline-block w-4 h-4 rounded-full" style={{ background: colors[type] || '#888' }} />
                <span className="font-medium text-gray-700">{type}</span>
                <span className="text-gray-500">{typeCounts[type]} ({Math.round((typeCounts[type] / total) * 100)}%)</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  function TopCollectedPokemon({ collection }: { collection: Set<any> }) {
    // Compter le nombre de cartes différentes par Pokémon possédé
    const countByName: Record<string, number> = {};
    for (const item of collection) {
      countByName[item.pokemon_name] = (countByName[item.pokemon_name] || 0) + 1;
    }
    const top = Object.entries(countByName)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
    return (
      <div className="mt-16 max-w-2xl mx-auto">
        <h2 className="text-xl font-bold mb-6">Top 5 most collected Pokémon</h2>
        <ol className="list-decimal pl-6 space-y-2">
          {top.map(([name, count], i) => (
            <li key={name} className="flex items-center gap-2">
              <span className="font-medium text-gray-700">{name}</span>
              <span className="text-gray-500">({count} cards)</span>
            </li>
          ))}
        </ol>
      </div>
    );
  }

  // Fonction d'export CSV
  function handleExportCSV() {
    const data = Array.from(collection) as Record<string, any>[];
    if (!data.length) return;
    const headers = ['card_id', 'set_name', 'series', 'pokemon_name'];
    const csv = [
      headers.join(','),
      ...data.map(item => headers.map(h => `"${(item[h] ?? '').toString().replace(/"/g, '""')}"`).join(','))
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'collection.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  if (loading || subscriptionLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  const AnalyticsSection = ({ children, hideButton = false }: { children: React.ReactNode, hideButton?: boolean }) => {
    if (!isPremium) {
      return <PremiumOverlay hideButton={hideButton}>{children}</PremiumOverlay>;
    }
    return <>{children}</>;
  };

  return (
    <div className="min-h-screen bg-gray-50 px-6 py-12">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-8">My profile</h1>
        <div className="flex flex-col md:flex-row md:items-center md:gap-12 gap-10">
          <div className="flex-1 space-y-10">
            <div>
              <span className="block text-sm font-medium text-gray-700">Username</span>
              <span className="block text-lg text-gray-900">{user?.user_metadata?.username || '-'}</span>
            </div>
            <div>
              <span className="block text-sm font-medium text-gray-700">Email</span>
              <span className="block text-lg text-gray-900">{user?.email}</span>
            </div>
            <div className="flex gap-4">
              {!showPasswordForm ? (
                <button
                  className="px-4 py-2 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  type="button"
                  onClick={() => { setShowPasswordForm(true); setPasswordError(""); setPasswordSuccess(""); }}
                >
                  Change password
                </button>
              ) : (
                <form onSubmit={handleChangePassword} className="space-y-4">
                  <input
                    type="password"
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    placeholder="New password"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    required
                  />
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={passwordLoading}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
                    >
                      {passwordLoading ? "Saving..." : "Save"}
                    </button>
                    <button
                      type="button"
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md font-medium hover:bg-gray-300"
                      onClick={() => { setShowPasswordForm(false); setNewPassword(""); setPasswordError(""); }}
                    >
                      Cancel
                    </button>
                  </div>
                  {passwordError && <div className="text-red-500 text-sm">{passwordError}</div>}
                  {passwordSuccess && <div className="text-green-600 text-sm">{passwordSuccess}</div>}
                </form>
              )}
            </div>
          </div>
          <div className="flex-shrink-0 flex justify-center md:justify-end">
            <AnalyticsSection hideButton={true}>
              <ProgressBar value={ownedCount} max={totalCount} />
            </AnalyticsSection>
          </div>
        </div>
        {/* Progression par génération */}
        <AnalyticsSection>
          <div className="mt-16">
            <h2 className="text-xl font-bold mb-6">Progress by generation</h2>
            <div className="space-y-8">
              {[1,2,3,4,5,6,7,8,9].map((gen) => {
                const pokemons = getPokemonByGeneration(gen);
                const total = pokemons.length;
                const owned = pokemons.filter(p => ownedPokemon.has(p.name)).length;
                const percent = Math.round((owned / total) * 100);
                const genNames = [
                  '', 'Kanto', 'Johto', 'Hoenn', 'Sinnoh', 'Unova', 'Kalos', 'Alola', 'Galar', 'Paldea'
                ];
                return (
                  <div key={gen} className="w-full">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-gray-700">Generation {gen} - {genNames[gen]}</span>
                      <span className="text-sm text-gray-500">{percent}% ({owned} / {total})</span>
                    </div>
                    <LinearProgressBar value={owned} max={total} />
                  </div>
                );
              })}
            </div>
            {/* Boutons sous la progression par génération */}
            <div className="flex flex-col sm:flex-row gap-4 mt-16 justify-center">
              <button
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                onClick={() => setIsMyCardsOpen(true)}
              >
                <Squares2X2Icon className="h-5 w-5" />
                View My Cards
              </button>
              <button
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                onClick={() => router.push('/wishlist')}
              >
                <HeartIcon className="h-5 w-5" />
                Create Wishlist
              </button>
              <button
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                onClick={handleExportCSV}
              >
                <ArrowDownTrayIcon className="h-5 w-5" />
                Export CSV
              </button>
            </div>
          </div>
        </AnalyticsSection>
        <AnalyticsSection>
          <CompletionOverTime collection={collection} />
        </AnalyticsSection>
        <AnalyticsSection>
          <PieChartTypes collection={collection} />
        </AnalyticsSection>
        <AnalyticsSection>
          <TopCollectedPokemon collection={collection} />
        </AnalyticsSection>
      </div>
      <MyCardsModal isOpen={isMyCardsOpen} onClose={() => setIsMyCardsOpen(false)} collection={collection} />
    </div>
  );
} 