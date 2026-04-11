import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { User } from '@supabase/supabase-js';

const ADMIN_EMAIL = 'bcamusc@gmail.com';

const ALL_CATEGORIES = ['Musica', 'Teatro', 'Stand-up', 'Cine', 'Fiesta', 'Familia', 'Deportes', 'Danza', 'Gastronomia', 'Exposicion', 'Educacion'];

const ALL_SUBCATEGORIES: Record<string, string[]> = {
  'Musica':      ['Rock', 'Jazz', 'Electrónica', 'Clásica', 'Folclor', 'Cumbia', 'Salsa', 'Reggae', 'Hip-Hop', 'K-POP', 'Tropical', 'Tributo'],
  'Teatro':      ['Drama', 'Comedia', 'Musical', 'Infantil', 'Títeres', 'Clásico'],
  'Stand-up':    ['Humor', 'Improvisación'],
  'Fiesta':      ['Nocturna', 'Electrónica', 'Temática', 'Tropical', 'Salsa'],
  'Familia':     ['Infantil', 'Circo', 'Títeres', 'Nocturna', 'Temática', 'Feria', 'Museo'],
  'Deportes':    ['Fútbol', 'Baloncesto', 'Artes Marciales', 'Tenis', 'Ciclismo', 'Rugby', 'Boxeo', 'Esquí'],
  'Cine':        ['Ficción', 'Documental', 'Animación', 'Drama', 'Musical', 'Internacional'],
  'Danza':       ['Ballet', 'Contemporánea', 'Flamenco', 'Tango', 'Folclórica', 'Urbana'],
  'Gastronomia': [],
  'Exposicion':  ['Arte', 'Historia', 'Ciencia'],
  'Educacion':   ['Taller', 'Curso', 'Seminario', 'Conferencia'],
};

const ALL_COMUNAS = [
  'Santiago', 'Providencia', 'Las Condes', 'Ñuñoa', 'Vitacura', 'Maipú',
  'La Florida', 'Puente Alto', 'San Bernardo', 'Recoleta', 'Peñalolén',
  'San Miguel', 'Huechuraba', 'Valparaíso', 'Viña del Mar', 'Temuco',
  'Concepción', 'Talca', 'Chillán', 'Valdivia', 'Antofagasta', 'La Serena',
  'Iquique', 'Puerto Montt', 'Curicó', 'Osorno', 'Melipilla', 'Pichilemu',
];

export default function Admin() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [activeCategories, setActiveCategories] = useState<string[]>([]);
  const [activeSubcategories, setActiveSubcategories] = useState<Record<string, string[]>>({});
  const [activeComunas, setActiveComunas] = useState<string[]>([]);

  // Auth check
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  // Load settings
  useEffect(() => {
    async function load() {
      setLoading(true);
      const { data } = await supabase
        .from('app_settings')
        .select('id, value')
        .in('id', ['categories', 'subcategories', 'comunas']);

      if (data) {
        for (const row of data) {
          if (row.id === 'categories') setActiveCategories(row.value);
          if (row.id === 'subcategories') setActiveSubcategories(row.value);
          if (row.id === 'comunas') setActiveComunas(row.value);
        }
      }
      setLoading(false);
    }
    load();
  }, []);

  const toggleCategory = (cat: string) => {
    setActiveCategories(prev =>
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    );
  };

  const toggleSubcategory = (cat: string, sub: string) => {
    setActiveSubcategories(prev => {
      const current = prev[cat] || [];
      const updated = current.includes(sub)
        ? current.filter(s => s !== sub)
        : [...current, sub];
      return { ...prev, [cat]: updated };
    });
  };

  const toggleComuna = (comuna: string) => {
    setActiveComunas(prev =>
      prev.includes(comuna) ? prev.filter(c => c !== comuna) : [...prev, comuna]
    );
  };

  const selectAllComunas = () => setActiveComunas([...ALL_COMUNAS]);
  const clearAllComunas = () => setActiveComunas([]);

  const save = async () => {
    setSaving(true);
    const updates = [
      { id: 'categories', value: activeCategories, updated_at: new Date().toISOString() },
      { id: 'subcategories', value: activeSubcategories, updated_at: new Date().toISOString() },
      { id: 'comunas', value: activeComunas, updated_at: new Date().toISOString() },
    ];
    await supabase.from('app_settings').upsert(updates);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  // Not logged in
  if (!user) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
        <div className="text-center">
          <p className="text-white text-xl mb-4">Acceso restringido</p>
          <button
            onClick={() => supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin + '/admin' } })}
            className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl"
          >
            Iniciar sesión con Google
          </button>
        </div>
      </div>
    );
  }

  // Not admin
  if (user.email !== ADMIN_EMAIL) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
        <p className="text-white text-xl">No tienes permisos para acceder aquí.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
        <p className="text-white">Cargando configuración...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-white p-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-semibold">Admin — Eventio</h1>
        <button
          onClick={save}
          disabled={saving}
          className="px-6 py-2 bg-purple-600 hover:bg-purple-700 rounded-xl font-medium transition-colors disabled:opacity-50"
        >
          {saving ? 'Guardando...' : saved ? '✓ Guardado' : 'Guardar cambios'}
        </button>
      </div>

      {/* Categorías */}
      <section className="mb-8">
        <h2 className="text-lg font-medium mb-3 text-neutral-300">Categorías visibles</h2>
        <div className="flex flex-wrap gap-2">
          {ALL_CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => toggleCategory(cat)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                activeCategories.includes(cat)
                  ? 'bg-purple-600 text-white'
                  : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </section>

      {/* Subcategorías por categoría activa */}
      {activeCategories.map(cat => (
        ALL_SUBCATEGORIES[cat]?.length > 0 && (
          <section key={cat} className="mb-6">
            <h2 className="text-base font-medium mb-2 text-neutral-400">{cat} — subcategorías</h2>
            <div className="flex flex-wrap gap-2">
              {ALL_SUBCATEGORIES[cat].map(sub => (
                <button
                  key={sub}
                  onClick={() => toggleSubcategory(cat, sub)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                    (activeSubcategories[cat] || []).includes(sub)
                      ? 'bg-purple-500 text-white'
                      : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700'
                  }`}
                >
                  {sub}
                </button>
              ))}
            </div>
          </section>
        )
      ))}

      {/* Comunas */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-medium text-neutral-300">Comunas visibles</h2>
          <div className="flex gap-2">
            <button onClick={selectAllComunas} className="text-xs text-purple-400 hover:text-purple-300">Todas</button>
            <span className="text-neutral-600">|</span>
            <button onClick={clearAllComunas} className="text-xs text-neutral-400 hover:text-neutral-300">Ninguna</button>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {ALL_COMUNAS.map(comuna => (
            <button
              key={comuna}
              onClick={() => toggleComuna(comuna)}
              className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                activeComunas.includes(comuna)
                  ? 'bg-blue-600 text-white'
                  : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700'
              }`}
            >
              {comuna}
            </button>
          ))}
        </div>
      </section>

      <p className="text-neutral-600 text-sm">Logueado como {user.email}</p>
    </div>
  );
}
