import { useState, useEffect } from 'react';
import { Search, Calendar, MapPin, Heart, Sun, Moon, Home, Compass, Star, User, Share2, X, Users, Clock, CalendarPlus, ArrowLeft, Globe, Menu, LogIn, LogOut, Brain } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import InstallPrompt from './components/InstallPrompt';
import { supabase } from '../lib/supabase';
import { signInWithGoogle, signOut, loadFavorites, addFavorite, removeFavorite, trackActivity } from '../lib/auth';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import LoginScreen from './components/LoginScreen';
import AdminUrlito from './AdminUrlito';

const DEFAULT_CATEGORIES = ['Musica', 'Teatro', 'Stand-up', 'Cine'];
const dateFilters = ['Hoy', 'Este fin de semana'];
const searchSuggestions = ['Conciertos rock', 'Teatro clásico', 'Stand-up esta semana', 'Jazz en vivo', 'Cine independiente'];

const subCategories: { [key: string]: string[] } = {
  'Musica': ['Rock', 'Jazz', 'Electrónica', 'Clásica', 'Folclor', 'Cumbia', 'Salsa', 'Reggae', 'Hip-Hop', 'K-POP', 'Tropical', 'Tributo'],
  'Teatro': ['Drama', 'Comedia', 'Musical', 'Infantil', 'Títeres', 'Clásico'],
  'Stand-up': ['Humor', 'Improvisación'],
  'Fiesta': ['Nocturna', 'Electrónica', 'Temática', 'Tropical', 'Salsa'],
  'Familia': ['Infantil', 'Circo', 'Títeres', 'Nocturna', 'Temática', 'Feria', 'Museo'],
  'Deportes': ['Fútbol', 'Baloncesto', 'Artes Marciales', 'Tenis', 'Ciclismo', 'Rugby', 'Boxeo', 'Esquí'],
  'Cine': ['Ficción', 'Documental', 'Animación', 'Drama', 'Musical', 'Internacional'],
  'Danza': ['Ballet', 'Contemporánea', 'Flamenco', 'Tango', 'Folclórica', 'Urbana'],
  'Gastronomia': [],
  'Exposicion': ['Arte', 'Historia', 'Ciencia'],
  'Educacion': ['Taller', 'Curso', 'Seminario', 'Conferencia'],
};

const categoryColors: Record<string, { bg: string; badge: string; light: string }> = {
  'Musica':      { bg: 'from-purple-600 to-indigo-700',  badge: 'bg-purple-600',  light: 'from-purple-500 to-indigo-600' },
  'Teatro':      { bg: 'from-rose-600 to-pink-700',      badge: 'bg-rose-600',    light: 'from-rose-500 to-pink-600' },
  'Stand-up':    { bg: 'from-amber-600 to-orange-700',   badge: 'bg-amber-600',   light: 'from-amber-500 to-orange-600' },
  'Fiesta':      { bg: 'from-fuchsia-600 to-pink-700',   badge: 'bg-fuchsia-600', light: 'from-fuchsia-500 to-pink-600' },
  'Familia':     { bg: 'from-green-600 to-emerald-700',  badge: 'bg-green-600',   light: 'from-green-500 to-emerald-600' },
  'Deportes':    { bg: 'from-blue-600 to-indigo-700',    badge: 'bg-blue-600',    light: 'from-blue-500 to-indigo-600' },
  'Cine':        { bg: 'from-cyan-600 to-blue-700',      badge: 'bg-cyan-600',    light: 'from-cyan-500 to-blue-600' },
  'Danza':       { bg: 'from-pink-600 to-rose-700',      badge: 'bg-pink-600',    light: 'from-pink-500 to-rose-600' },
  'Gastronomia': { bg: 'from-orange-600 to-red-700',     badge: 'bg-orange-600',  light: 'from-orange-500 to-red-600' },
  'Exposicion':  { bg: 'from-teal-600 to-cyan-700',      badge: 'bg-teal-600',    light: 'from-teal-500 to-cyan-600' },
  'Educacion':   { bg: 'from-sky-600 to-blue-700',       badge: 'bg-sky-600',     light: 'from-sky-500 to-blue-600' },
};

const defaultColors = { bg: 'from-neutral-600 to-neutral-700', badge: 'bg-neutral-600', light: 'from-neutral-500 to-neutral-600' };

// Static fallback events (moved inside component as initial state if needed)
const staticEvents = [
  {
    id: 1,
    title: 'Cargando eventos...',
    category: 'Música',
    subcategory: 'Electrónica',
    date: '...',
    time: '...',
    location: '...',
    image: 'https://images.unsplash.com/photo-1706419202046-e4982f00b082?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
    attendees: 0,
    featured: true,
    description: 'Cargando contenido desde la base de datos...',
    price: '...',
    match: 0
  }
];

export default function App() {
  const [events, setEvents] = useState<any[]>(staticEvents);
  const [loading, setLoading] = useState(true);
  const [activeCategories, setActiveCategories] = useState<string[]>(['Musica', 'Teatro', 'Stand-up', 'Cine']);
  const [activeComunas, setActiveComunas] = useState<string[]>([]);
  const [activeSubcategories, setActiveSubcategories] = useState<Record<string, string[]>>(subCategories);
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [selectedSubCategory, setSelectedSubCategory] = useState<string | null>(null);
  const [selectedDateFilter, setSelectedDateFilter] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [favorites, setFavorites] = useState<Set<number>>(new Set());
  const [isLightMode, setIsLightMode] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<any | null>(null);
  const [showSearchBar, setShowSearchBar] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('Español');
  const [selectedCity, setSelectedCity] = useState('');
  const [isScrolled, setIsScrolled] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [authReady, setAuthReady] = useState(false);
  const [showAdminUrlito, setShowAdminUrlito] = useState(false);

  // Auth: cargar sesión inicial y escuchar cambios
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
      setAuthReady(true);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser) {
        const savedFavorites = await loadFavorites(currentUser.id);
        setFavorites(savedFavorites);
      } else {
        setFavorites(new Set());
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignIn = async () => {
    setAuthLoading(true);
    try {
      await signInWithGoogle();
    } catch (err) {
      console.error('Error signing in:', err);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    setShowProfile(false);
  };

  // Cargar config desde admin
  useEffect(() => {
    async function loadConfig() {
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
    }
    loadConfig();
  }, []);

  useEffect(() => {
    async function fetchEvents() {
      try {
        const { data, error } = await supabase
          .from('events')
          .select('*, venues(name, comuna)')
          .in('category', activeCategories.length > 0 ? activeCategories : ['Musica', 'Teatro', 'Stand-up', 'Cine'])
          .gte('datetime', new Date().toISOString())
          .order('datetime', { ascending: true })
          .limit(50);

        if (error) throw error;
        if (data) {
          // Map DB columns to UI expectations
          const mappedEvents = data.map((e: any) => {
            const dateObj = new Date(e.datetime);
            const timeStr = isNaN(dateObj.getTime()) ? '20:00' : dateObj.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
            const locationStr = e.venues ? `${e.venues.name}${e.venues.comuna ? `, ${e.venues.comuna}` : ''}` : 'Ubicación por confirmar';
            
            return {
              id: e.id,
              title: e.title,
              description: e.description,
              image: e.image_url || 'https://images.unsplash.com/photo-1706419202046-e4982f00b082?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
              date: e.datetime || 'Próximamente',
              time: timeStr,
              location: locationStr,
              category: e.category || 'Categoría por definir',
              subcategory: e.subcategory || null,
              comuna: e.venues?.comuna || null,
              price: e.price ? `$${e.price}` : 'Gratis / No indicado',
              featured: true,
              match: 90
            };
          });
          setEvents(mappedEvents);
        }
      } catch (err) {
        console.error('Error fetching events:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchEvents();
  }, []);

  useEffect(() => {
    // Set theme-color meta tag
    let metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (!metaThemeColor) {
      metaThemeColor = document.createElement('meta');
      metaThemeColor.setAttribute('name', 'theme-color');
      document.head.appendChild(metaThemeColor);
    }
    metaThemeColor.setAttribute('content', isLightMode ? '#ffffff' : '#0a0a0a');
  }, [isLightMode]);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const formatEventDate = (event: typeof events[0]) => {
    try {
      const dbDate = new Date(event.date);
      if (isNaN(dbDate.getTime())) return event.date;
      
      const day = dbDate.getDate();
      const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
      const month = monthNames[dbDate.getMonth()];
      const year = dbDate.getFullYear();
      const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sab'];
      const dayName = dayNames[dbDate.getDay()];
      
      return `${dayName} ${day} ${month} ${year}, ${event.time} hrs`;
    } catch {
      return event.date;
    }
  };

  const getEventDateTag = (event: typeof events[0]) => {
    try {
      const today = new Date();
      const eventDate = new Date(event.date);
      
      if (isNaN(eventDate.getTime())) return null;

      if (eventDate.getDate() === today.getDate() && eventDate.getMonth() === today.getMonth() && eventDate.getFullYear() === today.getFullYear()) {
        return 'HOY';
      }
      return null;
    } catch {
      return null;
    }
  };

  const filterByDate = (event: typeof events[0]) => {
    if (!selectedDateFilter) return true;
    try {
      const today = new Date();
      const eventDate = new Date(event.date);
      
      if (isNaN(eventDate.getTime())) return true;

      if (selectedDateFilter === 'Hoy') {
        return eventDate.getDate() === today.getDate() && eventDate.getMonth() === today.getMonth() && eventDate.getFullYear() === today.getFullYear();
      }

      if (selectedDateFilter === 'Este fin de semana') {
        return eventDate.getDay() === 0 || eventDate.getDay() === 6;
      }

      return true;
    } catch {
      return true;
    }
  };

  const matchesCity = (event: any) => !selectedCity || event.comuna === selectedCity;

  const featuredEvents = events.filter(event => {
    const matchesCategory = selectedCategory === 'Todos' || event.category === selectedCategory;
    const matchesSubCategory = !selectedSubCategory || event.subcategory === selectedSubCategory;
    const matchesDate = filterByDate(event);
    return event.featured && matchesCategory && matchesSubCategory && matchesDate && matchesCity(event);
  });

  const favoriteEvents = events.filter(event => favorites.has(event.id));

  const filteredEvents = events.filter(event => {
    const matchesCategory = selectedCategory === 'Todos' || event.category === selectedCategory;
    const matchesSubCategory = !selectedSubCategory || event.subcategory === selectedSubCategory;
    const matchesSearch = event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         event.location.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDate = filterByDate(event);
    return matchesCategory && matchesSubCategory && matchesSearch && matchesDate && matchesCity(event);
  });

  const handleCardClick = (eventId: number) => {
    const event = events.find(e => e.id === eventId);
    if (event) {
      setSelectedEvent(event);
      if (user) trackActivity(user.id, 'view', eventId, { title: event.title, category: event.category });
    }
  };

  const toggleFavorite = (eventId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setFavorites(prev => {
      const newSet = new Set(prev);
      if (newSet.has(eventId)) {
        newSet.delete(eventId);
        if (user) {
          removeFavorite(user.id, eventId);
          trackActivity(user.id, 'unfavorite', eventId);
        }
      } else {
        newSet.add(eventId);
        if (user) {
          addFavorite(user.id, eventId);
          trackActivity(user.id, 'favorite', eventId);
        }
      }
      return newSet;
    });
  };

  const handleShare = (event: typeof events[0], e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedEvent(event);
  };

  const closeModal = () => {
    setSelectedEvent(null);
  };

  // Auth guard
  if (!authReady) return (
    <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );
  if (!user) return <LoginScreen />;

  return (
    <div className={`min-h-screen ${isLightMode ? 'bg-neutral-50' : 'bg-neutral-950'}`}>
      <header className={`fixed top-0 w-full z-50 ${isLightMode ? 'bg-white/95' : 'bg-neutral-950/95'} backdrop-blur-xl border-b ${isLightMode ? 'border-neutral-200' : 'border-neutral-800'} transition-all ${isScrolled ? 'py-2' : ''}`}>
        <div>
          {!showSearchBar ? (
            <>
              {isScrolled ? (
                <div className="px-4 py-2 flex items-center gap-2">
                  <button
                    onClick={() => setShowMenu(true)}
                    className={`p-1.5 rounded-full ${isLightMode ? 'hover:bg-neutral-200' : 'hover:bg-neutral-800'} transition-colors flex-shrink-0`}
                  >
                    <Menu size={18} className={isLightMode ? 'text-neutral-900' : 'text-white'} />
                  </button>
                  <h1 className={`text-base tracking-tight flex-shrink-0 ${isLightMode ? 'text-neutral-900' : 'text-white'}`}>
                    Eventos
                  </h1>
                  <div className="flex gap-2 overflow-x-auto flex-1 scrollbar-hide order-2 md:order-1">
                  {selectedCategory === 'Todos' ? (
                    <>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          setSelectedCategory('Todos');
                        }}
                        className={`px-5 py-2 rounded-lg flex-shrink-0 transition-all text-sm ${
                          isLightMode
                            ? 'bg-neutral-900 text-white'
                            : 'bg-white text-neutral-900'
                        }`}
                      >
                        All
                      </button>

                      {activeCategories.map((category) => (
                        <button
                          type="button"
                          key={category}
                          onClick={(e) => {
                            e.preventDefault();
                            setSelectedCategory(category);
                            setSelectedSubCategory(null);
                          }}
                          className={`px-5 py-2 rounded-lg flex-shrink-0 transition-all text-sm ${
                            isLightMode
                              ? 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                              : 'bg-neutral-900 text-neutral-400 hover:bg-neutral-800'
                          }`}
                        >
                          {category}
                        </button>
                      ))}
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          setSelectedCategory('Todos');
                          setSelectedSubCategory(null);
                          setSelectedDateFilter(null);
                        }}
                        className={`flex items-center justify-center p-2 rounded-lg flex-shrink-0 transition-all ${
                          isLightMode
                            ? 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                            : 'bg-neutral-900 text-neutral-400 hover:bg-neutral-800'
                        }`}
                      >
                        <X size={20} />
                      </button>

                      {selectedSubCategory ? (
                        <>
                          {selectedDateFilter ? (
                            <div className={`flex items-center gap-0 rounded-lg flex-shrink-0 overflow-hidden ${
                              isLightMode ? 'bg-neutral-900' : 'bg-white'
                            }`}>
                              <button
                                onClick={() => {
                                  setSelectedSubCategory(null);
                                  setSelectedDateFilter(null);
                                }}
                                className={`px-5 py-2 text-sm ${
                                  isLightMode ? 'text-white' : 'text-neutral-900'
                                }`}
                              >
                                {selectedCategory}
                              </button>
                              <div className={`w-px h-4 ${isLightMode ? 'bg-neutral-700' : 'bg-neutral-300'}`} />
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.preventDefault();
                                  setSelectedSubCategory(null);
                                }}
                                className={`px-5 py-2 text-sm ${
                                  isLightMode ? 'text-white' : 'text-neutral-900'
                                }`}
                              >
                                {selectedSubCategory}
                              </button>
                              <div className={`w-px h-4 ${isLightMode ? 'bg-neutral-700' : 'bg-neutral-300'}`} />
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.preventDefault();
                                  setSelectedDateFilter(null);
                                }}
                                className={`px-5 py-2 text-sm ${
                                  isLightMode ? 'text-white' : 'text-neutral-900'
                                }`}
                              >
                                {selectedDateFilter}
                              </button>
                            </div>
                          ) : (
                            <>
                              <div className={`flex items-center gap-0 rounded-lg flex-shrink-0 overflow-hidden ${
                                isLightMode ? 'bg-neutral-900' : 'bg-white'
                              }`}>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    setSelectedSubCategory(null);
                                  }}
                                  className={`px-5 py-2 text-sm ${
                                    isLightMode ? 'text-white' : 'text-neutral-900'
                                  }`}
                                >
                                  {selectedCategory}
                                </button>
                                <div className={`w-px h-4 ${isLightMode ? 'bg-neutral-700' : 'bg-neutral-300'}`} />
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    setSelectedSubCategory(null);
                                  }}
                                  className={`px-5 py-2 text-sm ${
                                    isLightMode ? 'text-white' : 'text-neutral-900'
                                  }`}
                                >
                                  {selectedSubCategory}
                                </button>
                              </div>

                              {dateFilters.map((dateFilter) => (
                                <button
                                  type="button"
                                  key={dateFilter}
                                  onClick={(e) => {
                                    e.preventDefault();
                                    setSelectedDateFilter(dateFilter);
                                  }}
                                  className={`px-5 py-2 rounded-lg flex-shrink-0 transition-all text-sm ${
                                    isLightMode
                                      ? 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                                      : 'bg-neutral-900 text-neutral-400 hover:bg-neutral-800'
                                  }`}
                                >
                                  {dateFilter}
                                </button>
                              ))}
                            </>
                          )}
                        </>
                      ) : (
                        <>
                          {activeSubcategories[selectedCategory]?.length > 0 ? (
                            selectedDateFilter ? (
                              <>
                                <div className={`flex items-center gap-0 rounded-lg flex-shrink-0 overflow-hidden ${
                                  isLightMode ? 'bg-neutral-900' : 'bg-white'
                                }`}>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      setSelectedDateFilter(null);
                                    }}
                                    className={`px-5 py-2 text-sm ${
                                      isLightMode ? 'text-white' : 'text-neutral-900'
                                    }`}
                                  >
                                    {selectedCategory}
                                  </button>
                                  <div className={`w-px h-4 ${isLightMode ? 'bg-neutral-700' : 'bg-neutral-300'}`} />
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      setSelectedDateFilter(null);
                                    }}
                                    className={`px-5 py-2 text-sm ${
                                      isLightMode ? 'text-white' : 'text-neutral-900'
                                    }`}
                                  >
                                    {selectedDateFilter}
                                  </button>
                                </div>

                                {activeSubcategories[selectedCategory].map((subCat) => (
                                  <button
                                    type="button"
                                    key={subCat}
                                    onClick={(e) => {
                                      e.preventDefault();
                                      setSelectedSubCategory(subCat);
                                    }}
                                    className={`px-5 py-2 rounded-lg flex-shrink-0 transition-all text-sm ${
                                      isLightMode
                                        ? 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                                        : 'bg-neutral-900 text-neutral-400 hover:bg-neutral-800'
                                    }`}
                                  >
                                    {subCat}
                                  </button>
                                ))}
                              </>
                            ) : (
                              <>
                                <button
                                  className={`px-5 py-2 rounded-lg flex-shrink-0 transition-all text-sm ${
                                    isLightMode
                                      ? 'bg-neutral-900 text-white'
                                      : 'bg-white text-neutral-900'
                                  }`}
                                >
                                  {selectedCategory}
                                </button>

                                {activeSubcategories[selectedCategory].map((subCat) => (
                                  <button
                                    type="button"
                                    key={subCat}
                                    onClick={(e) => {
                                      e.preventDefault();
                                      setSelectedSubCategory(subCat);
                                    }}
                                    className={`px-5 py-2 rounded-lg flex-shrink-0 transition-all text-sm ${
                                      isLightMode
                                        ? 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                                        : 'bg-neutral-900 text-neutral-400 hover:bg-neutral-800'
                                    }`}
                                  >
                                    {subCat}
                                  </button>
                                ))}
                              </>
                            )
                          ) : selectedDateFilter ? (
                            <div className={`flex items-center gap-0 rounded-lg flex-shrink-0 overflow-hidden ${
                              isLightMode ? 'bg-neutral-900' : 'bg-white'
                            }`}>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.preventDefault();
                                  setSelectedDateFilter(null);
                                }}
                                className={`px-5 py-2 text-sm ${
                                  isLightMode ? 'text-white' : 'text-neutral-900'
                                }`}
                              >
                                {selectedCategory}
                              </button>
                              <div className={`w-px h-4 ${isLightMode ? 'bg-neutral-700' : 'bg-neutral-300'}`} />
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.preventDefault();
                                  setSelectedDateFilter(null);
                                }}
                                className={`px-5 py-2 text-sm ${
                                  isLightMode ? 'text-white' : 'text-neutral-900'
                                }`}
                              >
                                {selectedDateFilter}
                              </button>
                            </div>
                          ) : (
                            <>
                              <button
                                className={`px-5 py-2 rounded-lg flex-shrink-0 transition-all text-sm ${
                                  isLightMode
                                    ? 'bg-neutral-900 text-white'
                                    : 'bg-white text-neutral-900'
                                }`}
                              >
                                {selectedCategory}
                              </button>

                              {dateFilters.map((dateFilter) => (
                                <button
                                  type="button"
                                  key={dateFilter}
                                  onClick={(e) => {
                                    e.preventDefault();
                                    setSelectedDateFilter(dateFilter);
                                  }}
                                  className={`px-5 py-2 rounded-lg flex-shrink-0 transition-all text-sm ${
                                    isLightMode
                                      ? 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                                      : 'bg-neutral-900 text-neutral-400 hover:bg-neutral-800'
                                  }`}
                                >
                                  {dateFilter}
                                </button>
                              ))}
                            </>
                          )}
                        </>
                      )}
                    </>
                  )}
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0 order-1 md:order-2">
                    <button
                      onClick={() => setShowSearchBar(true)}
                      className={`p-1.5 rounded-full ${isLightMode ? 'hover:bg-neutral-200' : 'hover:bg-neutral-800'} transition-colors`}
                    >
                      <Search size={18} className={isLightMode ? 'text-neutral-900' : 'text-white'} />
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setShowMenu(true)}
                        className={`p-2 rounded-full ${isLightMode ? 'hover:bg-neutral-200' : 'hover:bg-neutral-800'} transition-colors`}
                      >
                        <Menu size={22} className={isLightMode ? 'text-neutral-900' : 'text-white'} />
                      </button>
                      <h1 className={`text-xl tracking-tight ${isLightMode ? 'text-neutral-900' : 'text-white'}`}>
                        Eventos
                      </h1>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setShowSearchBar(true)}
                        className={`p-2 rounded-full ${isLightMode ? 'hover:bg-neutral-200' : 'hover:bg-neutral-800'} transition-colors`}
                      >
                        <Search size={22} className={isLightMode ? 'text-neutral-900' : 'text-white'} />
                      </button>
                    </div>
                  </div>

                  <div className="flex gap-2 overflow-x-auto px-4 pb-3 scrollbar-hide">
                    {selectedCategory === 'Todos' ? (
                      <>
                        <button
                          onClick={() => setSelectedCategory('Todos')}
                          className={`px-5 py-2 rounded-lg flex-shrink-0 transition-all text-sm ${
                            isLightMode
                              ? 'bg-neutral-900 text-white'
                              : 'bg-white text-neutral-900'
                          }`}
                        >
                          All
                        </button>

                        {activeCategories.map((category) => (
                          <button
                            key={category}
                            onClick={() => {
                              setSelectedCategory(category);
                              setSelectedSubCategory(null);
                            }}
                            className={`px-5 py-2 rounded-lg flex-shrink-0 transition-all text-sm ${
                              isLightMode
                                ? 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                                : 'bg-neutral-900 text-neutral-400 hover:bg-neutral-800'
                            }`}
                          >
                            {category}
                          </button>
                        ))}
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => {
                            setSelectedCategory('Todos');
                            setSelectedSubCategory(null);
                            setSelectedDateFilter(null);
                          }}
                          className={`flex items-center justify-center p-2 rounded-lg flex-shrink-0 transition-all ${
                            isLightMode
                              ? 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                              : 'bg-neutral-900 text-neutral-400 hover:bg-neutral-800'
                          }`}
                        >
                          <X size={20} />
                        </button>

                        {selectedSubCategory ? (
                          <>
                            {selectedDateFilter ? (
                              <div className={`flex items-center gap-0 rounded-lg flex-shrink-0 overflow-hidden ${
                                isLightMode ? 'bg-neutral-900' : 'bg-white'
                              }`}>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    setSelectedSubCategory(null);
                                    setSelectedDateFilter(null);
                                  }}
                                  className={`px-5 py-2 text-sm ${
                                    isLightMode ? 'text-white' : 'text-neutral-900'
                                  }`}
                                >
                                  {selectedCategory}
                                </button>
                                <div className={`w-px h-4 ${isLightMode ? 'bg-neutral-700' : 'bg-neutral-300'}`} />
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    setSelectedSubCategory(null);
                                  }}
                                  className={`px-5 py-2 text-sm ${
                                    isLightMode ? 'text-white' : 'text-neutral-900'
                                  }`}
                                >
                                  {selectedSubCategory}
                                </button>
                                <div className={`w-px h-4 ${isLightMode ? 'bg-neutral-700' : 'bg-neutral-300'}`} />
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    setSelectedDateFilter(null);
                                  }}
                                  className={`px-5 py-2 text-sm ${
                                    isLightMode ? 'text-white' : 'text-neutral-900'
                                  }`}
                                >
                                  {selectedDateFilter}
                                </button>
                              </div>
                            ) : (
                              <>
                                <div className={`flex items-center gap-0 rounded-lg flex-shrink-0 overflow-hidden ${
                                  isLightMode ? 'bg-neutral-900' : 'bg-white'
                                }`}>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      setSelectedSubCategory(null);
                                    }}
                                    className={`px-5 py-2 text-sm ${
                                      isLightMode ? 'text-white' : 'text-neutral-900'
                                    }`}
                                  >
                                    {selectedCategory}
                                  </button>
                                  <div className={`w-px h-4 ${isLightMode ? 'bg-neutral-700' : 'bg-neutral-300'}`} />
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      setSelectedSubCategory(null);
                                    }}
                                    className={`px-5 py-2 text-sm ${
                                      isLightMode ? 'text-white' : 'text-neutral-900'
                                    }`}
                                  >
                                    {selectedSubCategory}
                                  </button>
                                </div>

                                {dateFilters.map((dateFilter) => (
                                  <button
                                    type="button"
                                    key={dateFilter}
                                    onClick={(e) => {
                                      e.preventDefault();
                                      setSelectedDateFilter(dateFilter);
                                    }}
                                    className={`px-5 py-2 rounded-lg flex-shrink-0 transition-all text-sm ${
                                      isLightMode
                                        ? 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                                        : 'bg-neutral-900 text-neutral-400 hover:bg-neutral-800'
                                    }`}
                                  >
                                    {dateFilter}
                                  </button>
                                ))}
                              </>
                            )}
                          </>
                        ) : (
                          <>
                            {activeSubcategories[selectedCategory]?.length > 0 ? (
                              selectedDateFilter ? (
                                <>
                                  <div className={`flex items-center gap-0 rounded-lg flex-shrink-0 overflow-hidden ${
                                    isLightMode ? 'bg-neutral-900' : 'bg-white'
                                  }`}>
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.preventDefault();
                                        setSelectedDateFilter(null);
                                      }}
                                      className={`px-5 py-2 text-sm ${
                                        isLightMode ? 'text-white' : 'text-neutral-900'
                                      }`}
                                    >
                                      {selectedCategory}
                                    </button>
                                    <div className={`w-px h-4 ${isLightMode ? 'bg-neutral-700' : 'bg-neutral-300'}`} />
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.preventDefault();
                                        setSelectedDateFilter(null);
                                      }}
                                      className={`px-5 py-2 text-sm ${
                                        isLightMode ? 'text-white' : 'text-neutral-900'
                                      }`}
                                    >
                                      {selectedDateFilter}
                                    </button>
                                  </div>

                                  {activeSubcategories[selectedCategory].map((subCat) => (
                                    <button
                                      type="button"
                                      key={subCat}
                                      onClick={(e) => {
                                        e.preventDefault();
                                        setSelectedSubCategory(subCat);
                                      }}
                                      className={`px-5 py-2 rounded-lg flex-shrink-0 transition-all text-sm ${
                                        isLightMode
                                          ? 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                                          : 'bg-neutral-900 text-neutral-400 hover:bg-neutral-800'
                                      }`}
                                    >
                                      {subCat}
                                    </button>
                                  ))}
                                </>
                              ) : (
                                <>
                                  <button
                                    className={`px-5 py-2 rounded-lg flex-shrink-0 transition-all text-sm ${
                                      isLightMode
                                        ? 'bg-neutral-900 text-white'
                                        : 'bg-white text-neutral-900'
                                    }`}
                                  >
                                    {selectedCategory}
                                  </button>

                                  {activeSubcategories[selectedCategory].map((subCat) => (
                                    <button
                                      key={subCat}
                                      onClick={() => setSelectedSubCategory(subCat)}
                                      className={`px-5 py-2 rounded-lg flex-shrink-0 transition-all text-sm ${
                                        isLightMode
                                          ? 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                                          : 'bg-neutral-900 text-neutral-400 hover:bg-neutral-800'
                                      }`}
                                    >
                                      {subCat}
                                    </button>
                                  ))}
                                </>
                              )
                            ) : selectedDateFilter ? (
                              <div className={`flex items-center gap-0 rounded-lg flex-shrink-0 overflow-hidden ${
                                isLightMode ? 'bg-neutral-900' : 'bg-white'
                              }`}>
                                <button
                                  onClick={() => setSelectedDateFilter(null)}
                                  className={`px-5 py-2 text-sm ${
                                    isLightMode ? 'text-white' : 'text-neutral-900'
                                  }`}
                                >
                                  {selectedCategory}
                                </button>
                                <div className={`w-px h-4 ${isLightMode ? 'bg-neutral-700' : 'bg-neutral-300'}`} />
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    setSelectedDateFilter(null);
                                  }}
                                  className={`px-5 py-2 text-sm ${
                                    isLightMode ? 'text-white' : 'text-neutral-900'
                                  }`}
                                >
                                  {selectedDateFilter}
                                </button>
                              </div>
                            ) : (
                              <>
                                <button
                                  className={`px-5 py-2 rounded-lg flex-shrink-0 transition-all text-sm ${
                                    isLightMode
                                      ? 'bg-neutral-900 text-white'
                                      : 'bg-white text-neutral-900'
                                  }`}
                                >
                                  {selectedCategory}
                                </button>

                                {dateFilters.map((dateFilter) => (
                                  <button
                                    key={dateFilter}
                                    onClick={() => setSelectedDateFilter(dateFilter)}
                                    className={`px-5 py-2 rounded-lg flex-shrink-0 transition-all text-sm ${
                                      isLightMode
                                        ? 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                                        : 'bg-neutral-900 text-neutral-400 hover:bg-neutral-800'
                                    }`}
                                  >
                                    {dateFilter}
                                  </button>
                                ))}
                              </>
                            )}
                          </>
                        )}
                      </>
                    )}
                  </div>
                </>
              )}
            </>
          ) : (
              <div>
                <div className="px-4 py-3 flex items-center gap-3">
                  <button
                    onClick={() => {
                      setShowSearchBar(false);
                      setSearchQuery('');
                    }}
                    className={`p-2 ${isLightMode ? 'text-neutral-900' : 'text-white'}`}
                  >
                    <ArrowLeft size={24} />
                  </button>
                  <div className={`flex-1 flex items-center gap-2 ${isLightMode ? 'bg-neutral-100' : 'bg-neutral-900'} rounded-lg px-4 py-2.5`}>
                    <Search size={20} className={isLightMode ? 'text-neutral-500' : 'text-neutral-400'} />
                    <input
                      type="text"
                      placeholder="Buscar eventos..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      autoFocus
                      className={`flex-1 bg-transparent ${isLightMode ? 'text-neutral-900 placeholder:text-neutral-500' : 'text-white placeholder:text-neutral-400'} focus:outline-none`}
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery('')}
                        className={isLightMode ? 'text-neutral-500' : 'text-neutral-400'}
                      >
                        <X size={18} />
                      </button>
                    )}
                  </div>
                </div>

                {!searchQuery && (
                  <div className="px-4 pb-3">
                    <p className={`text-xs mb-2 ${isLightMode ? 'text-neutral-600' : 'text-neutral-400'}`}>Búsquedas sugeridas</p>
                    <div className="space-y-2">
                      {searchSuggestions.map((suggestion, index) => (
                        <button
                          key={index}
                          onClick={() => setSearchQuery(suggestion)}
                          className={`w-full text-left px-4 py-2.5 ${isLightMode ? 'hover:bg-neutral-100' : 'hover:bg-neutral-900'} rounded-lg transition-colors flex items-center gap-3`}
                        >
                          <Search size={16} className={isLightMode ? 'text-neutral-400' : 'text-neutral-500'} />
                          <span className={isLightMode ? 'text-neutral-900' : 'text-white'}>{suggestion}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
      </header>

      <main className={`transition-all ${showSearchBar && !searchQuery ? 'pt-[280px]' : isScrolled ? 'pt-[52px]' : 'pt-[120px]'}`}>
        <div>

            {!searchQuery && (
              <div className="px-4 pb-3">
                <h2 className={`text-2xl mb-3 ${isLightMode ? 'text-neutral-900' : 'text-white'}`}>Destacados</h2>
                <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 snap-x snap-mandatory scrollbar-hide">
                  {featuredEvents.map((event) => {
                    const isFavorite = favorites.has(event.id);
                    const colors = categoryColors[event.category] || defaultColors;

                    return (
                      <div
                        key={event.id}
                        className="flex-shrink-0 w-[280px] snap-start cursor-pointer"
                        onClick={() => handleCardClick(event.id)}
                      >
                        <div className="relative w-full h-[380px] rounded-3xl overflow-hidden">
                          <img
                            src={event.image}
                            alt={event.title}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />

                          <div className="absolute top-3 left-3 right-3 flex items-start justify-between">
                            <div className="flex gap-1.5 flex-wrap max-w-[60%]">
                              <span className={`${colors.badge} text-white text-xs px-3 py-1 rounded-full`}>
                                {event.category}
                              </span>
                              {event.subcategory && (
                                <span className="bg-black/50 backdrop-blur-sm text-white text-xs px-3 py-1 rounded-full border border-white/20">
                                  {event.subcategory}
                                </span>
                              )}
                            </div>
                            <div className="flex flex-col gap-2 items-end">
                              <div className="flex gap-2">
                                <button
                                  onClick={(e) => handleShare(event, e)}
                                  className="bg-black/50 backdrop-blur-sm p-2 rounded-full hover:bg-black/70 transition-colors"
                                >
                                  <Share2 size={16} className="text-white" />
                                </button>
                                <button
                                  onClick={(e) => toggleFavorite(event.id, e)}
                                  className="bg-black/50 backdrop-blur-sm p-2 rounded-full hover:bg-black/70 transition-colors"
                                >
                                  <Heart
                                    size={16}
                                    className={isFavorite ? 'fill-red-500 text-red-500' : 'text-white'}
                                  />
                                </button>
                              </div>
                              <div className="bg-black/70 backdrop-blur-sm text-white text-xs px-2.5 py-1 rounded-full border border-white/30">
                                {event.match}%
                              </div>
                            </div>
                          </div>

                          <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                            <h3 className="text-xl mb-2">{event.title}</h3>
                            <div className="flex items-center gap-2 text-sm text-neutral-300 mb-1">
                              <Calendar size={14} />
                              <span>{formatEventDate(event)}</span>
                              {getEventDateTag(event) && (
                                <span className="bg-emerald-600 text-white text-[10px] px-1.5 py-0.5 rounded-full font-medium">
                                  {getEventDateTag(event)}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-sm text-neutral-300">
                              <MapPin size={14} />
                              <span>{event.location}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="px-4 pt-4">
              <h2 className={`text-2xl mb-4 ${isLightMode ? 'text-neutral-900' : 'text-white'}`}>Todos los eventos</h2>
              <div className="space-y-3">
                {filteredEvents.map((event) => {
                  const isFavorite = favorites.has(event.id);
                  const colors = categoryColors[event.category] || defaultColors;

                  return (
                    <div
                      key={event.id}
                      className="cursor-pointer"
                      onClick={() => handleCardClick(event.id)}
                    >
                      <div className={`${isLightMode ? 'bg-white border border-neutral-200' : 'bg-neutral-900'} rounded-2xl overflow-hidden hover:${isLightMode ? 'border-purple-300' : 'bg-neutral-800'} transition-all`}>
                        <div className="flex gap-3">
                          <div className="relative w-32 h-32 flex-shrink-0">
                            <img
                              src={event.image}
                              alt={event.title}
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                            <div className="absolute top-2 left-2">
                              <span className={`${colors.badge} text-white text-xs px-2 py-0.5 rounded-full`}>
                                {event.category}
                              </span>
                            </div>
                            <div className="absolute bottom-2 left-2">
                              <div className="bg-black/70 backdrop-blur-sm text-white text-xs px-2 py-0.5 rounded-full">
                                {event.match}%
                              </div>
                            </div>
                          </div>
                          <div className="flex-1 py-3 pr-3 flex flex-col justify-between">
                            <div>
                              <div className="flex items-start justify-between gap-2 mb-2">
                                <h3 className={`text-base leading-snug ${isLightMode ? 'text-neutral-900' : 'text-white'}`}>
                                  {event.title}
                                </h3>
                                <div className="flex gap-2 flex-shrink-0">
                                  <button
                                    onClick={(e) => handleShare(event, e)}
                                    className="hover:scale-110 transition-transform"
                                  >
                                    <Share2
                                      size={18}
                                      className={isLightMode ? 'text-neutral-400 hover:text-neutral-600' : 'text-neutral-500 hover:text-neutral-300'}
                                    />
                                  </button>
                                  <button
                                    onClick={(e) => toggleFavorite(event.id, e)}
                                    className="hover:scale-110 transition-transform"
                                  >
                                    <Heart
                                      size={18}
                                      className={isFavorite ? 'fill-red-500 text-red-500' : isLightMode ? 'text-neutral-400 hover:text-neutral-600' : 'text-neutral-500 hover:text-neutral-300'}
                                    />
                                  </button>
                                </div>
                              </div>
                              {event.subcategory && (
                                <span className={`text-xs ${isLightMode ? 'text-neutral-600' : 'text-neutral-400'}`}>
                                  {event.subcategory}
                                </span>
                              )}
                            </div>
                            <div className="space-y-1">
                              <div className={`flex items-center gap-1.5 text-xs ${isLightMode ? 'text-neutral-600' : 'text-neutral-400'}`}>
                                <Calendar size={12} />
                                <span>{formatEventDate(event)}</span>
                                {getEventDateTag(event) && (
                                  <span className="bg-emerald-600 text-white text-[10px] px-1.5 py-0.5 rounded-full font-medium">
                                    {getEventDateTag(event)}
                                  </span>
                                )}
                              </div>
                              <div className={`flex items-center gap-1.5 text-xs ${isLightMode ? 'text-neutral-600' : 'text-neutral-400'}`}>
                                <MapPin size={12} />
                                <span className="truncate">{event.location}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
        </div>
      </main>

      <AnimatePresence>
        {selectedEvent && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60] flex items-end"
            onClick={closeModal}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className={`w-full ${isLightMode ? 'bg-white' : 'bg-neutral-950'} rounded-t-3xl max-h-[90vh] overflow-y-auto`}
            >
              <div className="relative">
                <div className="h-80 relative">
                  <img
                    src={selectedEvent.image}
                    alt={selectedEvent.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />

                  <button
                    onClick={closeModal}
                    className="absolute top-4 right-4 bg-black/50 backdrop-blur-sm p-3 rounded-full"
                  >
                    <X size={20} className="text-white" />
                  </button>

                  <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                    <div className="flex gap-2 mb-3 flex-wrap">
                      {(() => {
                        const colors = categoryColors[selectedEvent.category] || defaultColors;
                        return (
                          <>
                            <span className={`${colors.badge} text-white text-sm px-3 py-1.5 rounded-full`}>
                              {selectedEvent.category}
                            </span>
                            {selectedEvent.subcategory && (
                              <span className="bg-black/50 backdrop-blur-sm text-white text-sm px-3 py-1.5 rounded-full border border-white/20">
                                {selectedEvent.subcategory}
                              </span>
                            )}
                            {getEventDateTag(selectedEvent) && (
                              <span className="bg-emerald-600 text-white text-sm px-3 py-1.5 rounded-full font-medium">
                                {getEventDateTag(selectedEvent)}
                              </span>
                            )}
                          </>
                        );
                      })()}
                    </div>
                    <h2 className="text-3xl mb-2">{selectedEvent.title}</h2>
                    <div className="flex items-center gap-2 text-sm">
                      <div className="bg-black/50 backdrop-blur-sm px-3 py-1 rounded-full border border-white/30">
                        {selectedEvent.match}% match
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-6">
                  <div className={`grid grid-cols-2 gap-3 mb-6`}>
                    <div className={`${isLightMode ? 'bg-neutral-100' : 'bg-neutral-900'} rounded-2xl p-4`}>
                      <div className="flex items-center gap-2 mb-1">
                        <Calendar size={18} className={isLightMode ? 'text-purple-600' : 'text-purple-400'} />
                        <span className={`text-xs ${isLightMode ? 'text-neutral-600' : 'text-neutral-400'}`}>Fecha y hora</span>
                      </div>
                      <p className={`${isLightMode ? 'text-neutral-900' : 'text-white'}`}>{selectedEvent.date}</p>
                      <p className={`text-sm ${isLightMode ? 'text-neutral-700' : 'text-neutral-300'}`}>{selectedEvent.time}</p>
                    </div>

                    <div className={`${isLightMode ? 'bg-neutral-100' : 'bg-neutral-900'} rounded-2xl p-4`}>
                      <div className="flex items-center gap-2 mb-1">
                        <MapPin size={18} className={isLightMode ? 'text-purple-600' : 'text-purple-400'} />
                        <span className={`text-xs ${isLightMode ? 'text-neutral-600' : 'text-neutral-400'}`}>Ubicación</span>
                      </div>
                      <p className={`${isLightMode ? 'text-neutral-900' : 'text-white'}`}>{selectedEvent.location}</p>
                    </div>

                    <div className={`${isLightMode ? 'bg-neutral-100' : 'bg-neutral-900'} rounded-2xl p-4`}>
                      <div className="flex items-center gap-2 mb-1">
                        <Users size={18} className={isLightMode ? 'text-purple-600' : 'text-purple-400'} />
                        <span className={`text-xs ${isLightMode ? 'text-neutral-600' : 'text-neutral-400'}`}>Asistentes</span>
                      </div>
                      <p className={`${isLightMode ? 'text-neutral-900' : 'text-white'}`}>{selectedEvent.attendees?.toLocaleString() ?? '—'}</p>
                    </div>

                    {selectedEvent.duration && (
                      <div className={`${isLightMode ? 'bg-neutral-100' : 'bg-neutral-900'} rounded-2xl p-4`}>
                        <div className="flex items-center gap-2 mb-1">
                          <Clock size={18} className={isLightMode ? 'text-purple-600' : 'text-purple-400'} />
                          <span className={`text-xs ${isLightMode ? 'text-neutral-600' : 'text-neutral-400'}`}>Duración</span>
                        </div>
                        <p className={`${isLightMode ? 'text-neutral-900' : 'text-white'}`}>{selectedEvent.duration}</p>
                      </div>
                    )}
                  </div>

                  <div className="mb-6">
                    <h3 className={`text-lg mb-3 ${isLightMode ? 'text-neutral-900' : 'text-white'}`}>Descripción</h3>
                    <p className={`leading-relaxed ${isLightMode ? 'text-neutral-700' : 'text-neutral-300'}`}>
                      {selectedEvent.description}
                    </p>
                  </div>

                  {selectedEvent.category === 'Teatro' && selectedEvent.director && (
                    <div className="mb-6">
                      <h3 className={`text-lg mb-3 ${isLightMode ? 'text-neutral-900' : 'text-white'}`}>Información adicional</h3>
                      <div className="space-y-2">
                        <div className="flex">
                          <span className={`w-24 ${isLightMode ? 'text-neutral-600' : 'text-neutral-400'}`}>Director:</span>
                          <span className={isLightMode ? 'text-neutral-900' : 'text-white'}>{selectedEvent.director}</span>
                        </div>
                        <div className="flex">
                          <span className={`w-24 ${isLightMode ? 'text-neutral-600' : 'text-neutral-400'}`}>Elenco:</span>
                          <span className={isLightMode ? 'text-neutral-900' : 'text-white'}>{selectedEvent.cast}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="space-y-3">
                    <button className="w-full bg-purple-600 hover:bg-purple-700 text-white py-4 rounded-2xl transition-colors flex items-center justify-between px-6">
                      <span className="text-lg">Comprar entrada</span>
                      <span className="text-2xl">{selectedEvent.price}</span>
                    </button>

                    <div className="grid grid-cols-3 gap-3">
                      <button
                        onClick={(e) => toggleFavorite(selectedEvent.id, e)}
                        className={`${isLightMode ? 'bg-neutral-100 hover:bg-neutral-200 text-neutral-900' : 'bg-neutral-900 hover:bg-neutral-800 text-white'} py-3 rounded-2xl transition-colors flex items-center justify-center gap-2`}
                      >
                        <Heart
                          size={20}
                          className={favorites.has(selectedEvent.id) ? 'fill-red-500 text-red-500' : ''}
                        />
                        <span className="hidden sm:inline">{favorites.has(selectedEvent.id) ? 'Guardado' : 'Guardar'}</span>
                      </button>

                      <button className={`${isLightMode ? 'bg-neutral-100 hover:bg-neutral-200 text-neutral-900' : 'bg-neutral-900 hover:bg-neutral-800 text-white'} py-3 rounded-2xl transition-colors flex items-center justify-center gap-2`}>
                        <CalendarPlus size={20} />
                        <span className="hidden sm:inline">Calendario</span>
                      </button>

                      <button className={`${isLightMode ? 'bg-neutral-100 hover:bg-neutral-200 text-neutral-900' : 'bg-neutral-900 hover:bg-neutral-800 text-white'} py-3 rounded-2xl transition-colors flex items-center justify-center gap-2`}>
                        <Share2 size={20} />
                        <span className="hidden sm:inline">Compartir</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showProfile && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-end"
            onClick={() => setShowProfile(false)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className={`w-full ${isLightMode ? 'bg-white' : 'bg-neutral-950'} rounded-t-3xl max-h-[80vh] overflow-y-auto pb-8`}
            >
              <div className="sticky top-0 z-10 px-4 py-4 flex items-center justify-between border-b ${isLightMode ? 'bg-white border-neutral-200' : 'bg-neutral-950 border-neutral-800'}">
                <h2 className={`text-xl ${isLightMode ? 'text-neutral-900' : 'text-white'}`}>Perfil</h2>
                <button
                  onClick={() => setShowProfile(false)}
                  className={`p-2 rounded-full ${isLightMode ? 'hover:bg-neutral-200' : 'hover:bg-neutral-800'} transition-colors`}
                >
                  <X size={20} className={isLightMode ? 'text-neutral-900' : 'text-white'} />
                </button>
              </div>

              <div className="px-4 pt-6">
                <div className="text-center mb-8">
                  {user?.user_metadata?.avatar_url ? (
                    <img
                      src={user.user_metadata.avatar_url}
                      alt="avatar"
                      className="w-24 h-24 rounded-full mx-auto mb-4 object-cover"
                    />
                  ) : (
                    <div className={`w-24 h-24 rounded-full mx-auto mb-4 ${isLightMode ? 'bg-neutral-200' : 'bg-neutral-800'} flex items-center justify-center`}>
                      <User size={40} className={isLightMode ? 'text-neutral-600' : 'text-neutral-400'} />
                    </div>
                  )}
                  <h3 className={`text-2xl mb-1 ${isLightMode ? 'text-neutral-900' : 'text-white'}`}>
                    {user?.user_metadata?.full_name || user?.email || 'Mi Perfil'}
                  </h3>
                  <p className={`${isLightMode ? 'text-neutral-600' : 'text-neutral-400'}`}>
                    {user?.email || ''}
                  </p>
                  {!user && (
                    <button
                      onClick={handleSignIn}
                      disabled={authLoading}
                      className="mt-4 flex items-center gap-2 mx-auto px-6 py-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-medium transition-colors disabled:opacity-50"
                    >
                      <LogIn size={18} />
                      {authLoading ? 'Conectando...' : 'Iniciar sesión con Google'}
                    </button>
                  )}
                  {user && (
                    <button
                      onClick={handleSignOut}
                      className={`mt-4 flex items-center gap-2 mx-auto px-5 py-2 rounded-xl ${isLightMode ? 'bg-neutral-200 hover:bg-neutral-300 text-neutral-700' : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-300'} text-sm transition-colors`}
                    >
                      <LogOut size={15} />
                      Cerrar sesión
                    </button>
                  )}
                </div>

                <div className="space-y-3">
                  <div className={`${isLightMode ? 'bg-neutral-100' : 'bg-neutral-900'} rounded-2xl p-4 flex items-center justify-between`}>
                    <div className="flex items-center gap-3">
                      <Heart className={isLightMode ? 'text-purple-600' : 'text-purple-400'} size={20} />
                      <span className={isLightMode ? 'text-neutral-900' : 'text-white'}>Eventos favoritos</span>
                    </div>
                    <span className={`${isLightMode ? 'text-neutral-600' : 'text-neutral-400'}`}>{favorites.size}</span>
                  </div>

                  <div className={`${isLightMode ? 'bg-neutral-100' : 'bg-neutral-900'} rounded-2xl p-4 flex items-center justify-between`}>
                    <div className="flex items-center gap-3">
                      <Calendar className={isLightMode ? 'text-purple-600' : 'text-purple-400'} size={20} />
                      <span className={isLightMode ? 'text-neutral-900' : 'text-white'}>Mis entradas</span>
                    </div>
                    <span className={`${isLightMode ? 'text-neutral-600' : 'text-neutral-400'}`}>0</span>
                  </div>

                  {user?.email === 'bcamusc@gmail.com' && (
                    <div 
                      onClick={() => { setShowProfile(false); setShowAdminUrlito(true); }}
                      className={`cursor-pointer ${isLightMode ? 'bg-indigo-100 hover:bg-indigo-200' : 'bg-indigo-900/30 hover:bg-indigo-900/50'} rounded-2xl p-4 flex items-center justify-between border border-indigo-500/20 transition-colors`}
                    >
                      <div className="flex items-center gap-3">
                        <Brain className={isLightMode ? 'text-indigo-600' : 'text-indigo-400'} size={20} />
                        <span className={isLightMode ? 'text-indigo-900 font-medium' : 'text-indigo-100 font-medium'}>Entrenar URLito (Admin)</span>
                      </div>
                    </div>
                  )}

                  <div className={`${isLightMode ? 'bg-neutral-100' : 'bg-neutral-900'} rounded-2xl p-4`}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <MapPin className={isLightMode ? 'text-purple-600' : 'text-purple-400'} size={20} />
                        <span className={isLightMode ? 'text-neutral-900' : 'text-white'}>Ciudad</span>
                      </div>
                      <select
                        value={selectedCity}
                        onChange={(e) => setSelectedCity(e.target.value)}
                        className={`px-4 py-2 rounded-lg ${isLightMode ? 'bg-white text-neutral-900' : 'bg-neutral-800 text-white'} focus:outline-none cursor-pointer`}
                      >
                        <option value="">Todas</option>
                        {activeComunas.map(comuna => (
                          <option key={comuna} value={comuna}>{comuna}</option>
                        ))}
                      </select>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Globe className={isLightMode ? 'text-purple-600' : 'text-purple-400'} size={20} />
                        <span className={isLightMode ? 'text-neutral-900' : 'text-white'}>Idioma</span>
                      </div>
                      <select
                        value={selectedLanguage}
                        onChange={(e) => setSelectedLanguage(e.target.value)}
                        className={`px-4 py-2 rounded-lg ${isLightMode ? 'bg-white text-neutral-900' : 'bg-neutral-800 text-white'} focus:outline-none cursor-pointer`}
                      >
                        <option>Español</option>
                        <option>English</option>
                        <option>Français</option>
                        <option>Deutsch</option>
                      </select>
                    </div>
                  </div>

                  <div className={`${isLightMode ? 'bg-neutral-100' : 'bg-neutral-900'} rounded-2xl p-4`}>
                    <div className="flex items-center justify-between">
                      <span className={isLightMode ? 'text-neutral-900' : 'text-white'}>Tema</span>
                      <button
                        onClick={() => setIsLightMode(!isLightMode)}
                        className={`px-4 py-2 rounded-lg ${isLightMode ? 'bg-white' : 'bg-neutral-800'} flex items-center gap-2`}
                      >
                        {isLightMode ? (
                          <>
                            <Sun size={16} className="text-neutral-900" />
                            <span className="text-neutral-900">Claro</span>
                          </>
                        ) : (
                          <>
                            <Moon size={16} className="text-white" />
                            <span className="text-white">Oscuro</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showMenu && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]"
            onClick={() => setShowMenu(false)}
          >
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className={`w-80 h-full ${isLightMode ? 'bg-white' : 'bg-neutral-950'} shadow-2xl`}
            >
              <div className={`p-4 border-b ${isLightMode ? 'border-neutral-200' : 'border-neutral-800'} flex items-center justify-between`}>
                <h2 className={`text-xl font-semibold ${isLightMode ? 'text-neutral-900' : 'text-white'}`}>Menú</h2>
                <button
                  onClick={() => setShowMenu(false)}
                  className={`p-2 rounded-full ${isLightMode ? 'hover:bg-neutral-200' : 'hover:bg-neutral-800'} transition-colors`}
                >
                  <X size={20} className={isLightMode ? 'text-neutral-900' : 'text-white'} />
                </button>
              </div>

              <div className="p-4 space-y-3">
                <button
                  onClick={() => {
                    setShowMenu(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg ${isLightMode ? 'hover:bg-neutral-100' : 'hover:bg-neutral-900'} transition-colors`}
                >
                  <Home size={20} className={isLightMode ? 'text-neutral-900' : 'text-white'} />
                  <span className={`${isLightMode ? 'text-neutral-900' : 'text-white'}`}>Inicio</span>
                </button>

                <button
                  onClick={() => {
                    setShowMenu(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg ${isLightMode ? 'hover:bg-neutral-100' : 'hover:bg-neutral-900'} transition-colors`}
                >
                  <Compass size={20} className={isLightMode ? 'text-neutral-900' : 'text-white'} />
                  <span className={`${isLightMode ? 'text-neutral-900' : 'text-white'}`}>Explorar</span>
                </button>

                <button
                  onClick={() => {
                    setShowMenu(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg ${isLightMode ? 'hover:bg-neutral-100' : 'hover:bg-neutral-900'} transition-colors`}
                >
                  <Heart size={20} className={isLightMode ? 'text-neutral-900' : 'text-white'} />
                  <span className={`${isLightMode ? 'text-neutral-900' : 'text-white'}`}>Favoritos</span>
                  <span className={`ml-auto ${isLightMode ? 'text-neutral-600' : 'text-neutral-400'} text-sm`}>{favorites.size}</span>
                </button>

                <button
                  onClick={() => {
                    setShowMenu(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg ${isLightMode ? 'hover:bg-neutral-100' : 'hover:bg-neutral-900'} transition-colors`}
                >
                  <Calendar size={20} className={isLightMode ? 'text-neutral-900' : 'text-white'} />
                  <span className={`${isLightMode ? 'text-neutral-900' : 'text-white'}`}>Mis Entradas</span>
                </button>

                <div className={`border-t ${isLightMode ? 'border-neutral-200' : 'border-neutral-800'} my-3`} />

                <button
                  onClick={() => {
                    setShowMenu(false);
                    setShowProfile(true);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg ${isLightMode ? 'hover:bg-neutral-100' : 'hover:bg-neutral-900'} transition-colors`}
                >
                  <User size={20} className={isLightMode ? 'text-neutral-900' : 'text-white'} />
                  <span className={`${isLightMode ? 'text-neutral-900' : 'text-white'}`}>Perfil</span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {showAdminUrlito && (
        <AdminUrlito 
          onClose={() => setShowAdminUrlito(false)} 
          isLightMode={isLightMode} 
        />
      )}

      <InstallPrompt isLightMode={isLightMode} />
    </div>
  );
}
