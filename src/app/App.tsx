import { useState, useEffect } from 'react';
import { Search, Calendar, MapPin, Heart, Sun, Moon, Home, Compass, Star, User, Share2, X, Users, Clock, CalendarPlus, ArrowLeft, Globe, Menu, LogIn, LogOut } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import InstallPrompt from './components/InstallPrompt';
import { supabase } from '../lib/supabase';
import { signInWithGoogle, signOut, loadFavorites, addFavorite, removeFavorite, trackActivity } from '../lib/auth';
import type { User as SupabaseUser } from '@supabase/supabase-js';

const categories = ['Todos', 'Teatro', 'Stand-up', 'Música', 'Cine'];
const dateFilters = ['Hoy', 'Este fin de semana'];
const searchSuggestions = ['Conciertos rock', 'Teatro clásico', 'Stand-up esta semana', 'Jazz en vivo', 'Cine independiente'];

const subCategories: { [key: string]: string[] } = {
  'Teatro': ['Clásica', 'Drama', 'Comedia', 'Musical'],
  'Música': ['Rock', 'Jazz', 'Tributo', 'Electrónica', 'Clásica'],
  'Stand-up': [],
  'Cine': []
};

const categoryColors = {
  'Teatro': { bg: 'from-rose-600 to-pink-700', badge: 'bg-rose-600', light: 'from-rose-500 to-pink-600' },
  'Stand-up': { bg: 'from-amber-600 to-orange-700', badge: 'bg-amber-600', light: 'from-amber-500 to-orange-600' },
  'Música': { bg: 'from-purple-600 to-indigo-700', badge: 'bg-purple-600', light: 'from-purple-500 to-indigo-600' },
  'Cine': { bg: 'from-cyan-600 to-blue-700', badge: 'bg-cyan-600', light: 'from-cyan-500 to-blue-600' }
};

const events = [
  {
    id: 1,
    title: 'Festival de Música Electrónica',
    category: 'Música',
    genre: 'Electrónica',
    date: '15 Abr 2026',
    time: '21:00',
    location: 'Parque Central',
    image: 'https://images.unsplash.com/photo-1706419202046-e4982f00b082?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
    attendees: 2500,
    featured: true,
    description: 'Una noche épica con los mejores DJs de la escena electrónica internacional. Sonido envolvente y visuales impactantes.',
    price: '€45',
    match: 92
  },
  {
    id: 2,
    title: 'Romeo y Julieta',
    category: 'Teatro',
    genre: 'Clásica',
    date: '18 Abr 2026',
    time: '20:00',
    location: 'Teatro Nacional',
    image: 'https://images.unsplash.com/photo-1719935115623-4857df23f3c6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
    attendees: 800,
    featured: true,
    description: 'La obra clásica de Shakespeare cobra vida en una producción contemporánea que reinterpreta el amor y el conflicto.',
    director: 'María González',
    duration: '2h 30min',
    cast: 'Compañía Nacional de Teatro',
    price: '€35',
    match: 88
  },
  {
    id: 3,
    title: 'Noche de Comedia en Vivo',
    category: 'Stand-up',
    date: '20 Abr 2026',
    time: '22:00',
    location: 'Comedy Club Central',
    image: 'https://images.unsplash.com/photo-1717988241394-48c24220d13d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
    attendees: 1200,
    featured: false,
    description: 'Los mejores comediantes locales te harán reír sin parar. Una noche de humor fresco e irreverente.',
    price: '€20',
    match: 76
  },
  {
    id: 4,
    title: 'Concierto Rock en Vivo',
    category: 'Música',
    genre: 'Rock',
    date: '22 Abr 2026',
    time: '20:30',
    location: 'Estadio Municipal',
    image: 'https://images.unsplash.com/photo-1644959166965-8606f1ce1f06?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
    attendees: 5000,
    featured: true,
    description: 'Las bandas de rock más icónicas se reúnen en un concierto masivo. Pura energía y guitarra eléctrica.',
    price: '€55',
    match: 95
  },
  {
    id: 5,
    title: 'Noche de Jazz',
    category: 'Música',
    genre: 'Jazz',
    date: '25 Abr 2026',
    time: '21:30',
    location: 'Teatro Principal',
    image: 'https://images.unsplash.com/photo-1549452026-91574599e7f6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
    attendees: 600,
    featured: false,
    description: 'Sumérgete en los sonidos del jazz clásico y contemporáneo con músicos de renombre mundial.',
    price: '€40',
    match: 84
  },
  {
    id: 6,
    title: 'Premiere: La Última Frontera',
    category: 'Cine',
    date: '28 Abr 2026',
    time: '19:00',
    location: 'Cinépolis Luxury',
    image: 'https://images.unsplash.com/photo-1675674683873-1232862e3c64?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
    attendees: 3000,
    featured: false,
    description: 'Estreno exclusivo del thriller de ciencia ficción más esperado del año. Efectos especiales de última generación.',
    price: '€15',
    match: 71
  },
  {
    id: 7,
    title: 'Hamlet: Edición Moderna',
    category: 'Teatro',
    genre: 'Drama',
    date: '30 Abr 2026',
    time: '19:30',
    location: 'Teatro Municipal',
    image: 'https://images.unsplash.com/photo-1569342380852-035f42d9ca41?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
    attendees: 400,
    featured: false,
    description: 'Una reinterpretación audaz de la tragedia de Shakespeare ambientada en el mundo corporativo actual.',
    director: 'Carlos Ruiz',
    duration: '3h 15min',
    cast: 'Teatro Experimental',
    price: '€38',
    match: 79
  },
  {
    id: 8,
    title: 'Stand-up Internacional',
    category: 'Stand-up',
    date: '5 May 2026',
    time: '21:00',
    location: 'Auditorio Central',
    image: 'https://images.unsplash.com/photo-1770129966285-3945aee30f8b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
    attendees: 10000,
    featured: true,
    description: 'Los comediantes más famosos del mundo llegan a la ciudad. Una noche histórica de risas garantizadas.',
    price: '€65',
    match: 89
  },
  {
    id: 9,
    title: 'Festival de Cine Independiente',
    category: 'Cine',
    date: '8 May 2026',
    time: '18:00',
    location: 'Cine Royal',
    image: 'https://images.unsplash.com/photo-1612389930565-6975454dc7cc?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
    attendees: 1500,
    featured: false,
    description: 'Descubre nuevas voces del cine mundial. Proyecciones, charlas con directores y networking.',
    price: '€12',
    match: 82
  },
  {
    id: 10,
    title: 'Tributo a Queen',
    category: 'Música',
    genre: 'Tributo',
    date: '10 May 2026',
    time: '21:00',
    location: 'Arena Central',
    image: 'https://images.unsplash.com/photo-1549452026-91574599e7f6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
    attendees: 3500,
    featured: false,
    description: 'La banda tributo más fiel a Queen recrea la magia de Freddie Mercury y sus compañeros.',
    price: '€48',
    match: 90
  },
  {
    id: 11,
    title: 'La Comedia de los Enredos',
    category: 'Teatro',
    genre: 'Comedia',
    date: '12 Abr 2026',
    time: '20:30',
    location: 'Teatro de la Comedia',
    image: 'https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
    attendees: 450,
    featured: true,
    description: 'Una hilarante comedia sobre malentendidos y situaciones absurdas que te harán llorar de risa.',
    director: 'Ana López',
    duration: '1h 45min',
    cast: 'Compañía de la Risa',
    price: '€28',
    match: 85
  },
  {
    id: 12,
    title: 'El Fantasma de la Ópera',
    category: 'Teatro',
    genre: 'Musical',
    date: '16 Abr 2026',
    time: '19:00',
    location: 'Gran Teatro',
    image: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
    attendees: 1200,
    featured: true,
    description: 'El musical más emblemático de todos los tiempos regresa con una producción espectacular.',
    director: 'Roberto Martínez',
    duration: '2h 45min',
    cast: 'Orquesta Sinfónica y Ballet Nacional',
    price: '€65',
    match: 93
  },
  {
    id: 13,
    title: 'Noches de Humor',
    category: 'Stand-up',
    date: '11 Abr 2026',
    time: '22:30',
    location: 'La Risoterapia',
    image: 'https://images.unsplash.com/photo-1585699324551-f6c309eedeca?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
    attendees: 300,
    featured: false,
    description: 'Descubre nuevos talentos del stand-up local en una noche íntima llena de risas.',
    price: '€15',
    match: 72
  },
  {
    id: 14,
    title: 'Orquesta Sinfónica en Concierto',
    category: 'Música',
    genre: 'Clásica',
    date: '13 Abr 2026',
    time: '20:00',
    location: 'Auditorio Nacional',
    image: 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
    attendees: 1800,
    featured: false,
    description: 'Obras maestras de Beethoven y Mozart interpretadas por la Orquesta Sinfónica Nacional.',
    price: '€50',
    match: 81
  },
  {
    id: 15,
    title: 'Cine Bajo las Estrellas',
    category: 'Cine',
    date: '14 Abr 2026',
    time: '21:30',
    location: 'Parque de la Ciudad',
    image: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
    attendees: 2000,
    featured: true,
    description: 'Proyección al aire libre de clásicos del cine. Trae tu manta y disfruta de una noche mágica.',
    price: '€8',
    match: 78
  },
  {
    id: 16,
    title: 'Comedy Show con Invitados',
    category: 'Stand-up',
    date: '17 Abr 2026',
    time: '21:00',
    location: 'Teatro Risas',
    image: 'https://images.unsplash.com/photo-1527224857830-43a7acc85260?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
    attendees: 850,
    featured: false,
    description: 'Los mejores comediantes de la ciudad comparten escenario con invitados internacionales.',
    price: '€25',
    match: 83
  },
  {
    id: 17,
    title: 'Festival de Rock Alternativo',
    category: 'Música',
    genre: 'Rock',
    date: '19 Abr 2026',
    time: '18:00',
    location: 'Explanada del Rock',
    image: 'https://images.unsplash.com/photo-1501612780327-45045538702b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
    attendees: 4200,
    featured: true,
    description: 'Cuatro bandas emergentes de rock alternativo en un festival que durará hasta la medianoche.',
    price: '€35',
    match: 91
  },
  {
    id: 18,
    title: 'Macbeth',
    category: 'Teatro',
    genre: 'Drama',
    date: '21 Abr 2026',
    time: '20:30',
    location: 'Teatro Clásico',
    image: 'https://images.unsplash.com/photo-1503095396549-807759245b35?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
    attendees: 520,
    featured: false,
    description: 'La tragedia de Shakespeare sobre ambición y poder llevada al escenario con una puesta minimalista.',
    director: 'Pedro Sánchez',
    duration: '2h 15min',
    cast: 'Teatro Experimental Moderno',
    price: '€32',
    match: 77
  },
  {
    id: 19,
    title: 'Jazz & Blues Night',
    category: 'Música',
    genre: 'Jazz',
    date: '23 Abr 2026',
    time: '22:00',
    location: 'Blue Note Club',
    image: 'https://images.unsplash.com/photo-1415201364774-f6f0bb35f28f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
    attendees: 380,
    featured: false,
    description: 'Una velada íntima con los mejores exponentes del jazz y blues de la región.',
    price: '€35',
    match: 86
  },
  {
    id: 20,
    title: 'Maratón de Películas de Horror',
    category: 'Cine',
    date: '24 Abr 2026',
    time: '20:00',
    location: 'Cineclub Terror',
    image: 'https://images.unsplash.com/photo-1440404653325-ab127d49abc1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
    attendees: 650,
    featured: false,
    description: 'Tres películas de horror clásicas en una noche para los amantes del género.',
    price: '€18',
    match: 68
  },
  {
    id: 21,
    title: 'Stand-up: Gira Nacional',
    category: 'Stand-up',
    date: '26 Abr 2026',
    time: '21:30',
    location: 'Palacio de Congresos',
    image: 'https://images.unsplash.com/photo-1611348524140-53c9a25263d6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
    attendees: 2800,
    featured: true,
    description: 'El comediante más famoso del país presenta su nuevo show en exclusiva.',
    price: '€42',
    match: 88
  },
  {
    id: 22,
    title: 'El Lago de los Cisnes',
    category: 'Teatro',
    genre: 'Musical',
    date: '27 Abr 2026',
    time: '19:30',
    location: 'Teatro Real',
    image: 'https://images.unsplash.com/photo-1518834107812-67b0b7c58434?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
    attendees: 950,
    featured: false,
    description: 'Ballet clásico interpretado por el Ballet Nacional con música en vivo.',
    director: 'Carmen Ruiz',
    duration: '2h 20min',
    cast: 'Ballet Nacional',
    price: '€58',
    match: 82
  },
  {
    id: 23,
    title: 'EDM Sunset Festival',
    category: 'Música',
    genre: 'Electrónica',
    date: '29 Abr 2026',
    time: '19:00',
    location: 'Playa del Sol',
    image: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
    attendees: 6000,
    featured: true,
    description: 'Festival de música electrónica con vistas al atardecer. Los mejores DJs internacionales.',
    price: '€52',
    match: 94
  },
  {
    id: 24,
    title: 'Cine Francés Contemporáneo',
    category: 'Cine',
    date: '1 May 2026',
    time: '18:30',
    location: 'Cine Arte',
    image: 'https://images.unsplash.com/photo-1478720568477-152d9b164e26?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
    attendees: 420,
    featured: false,
    description: 'Ciclo de películas francesas contemporáneas con subtítulos en español.',
    price: '€10',
    match: 75
  },
  {
    id: 25,
    title: 'La Casa de Bernarda Alba',
    category: 'Teatro',
    genre: 'Drama',
    date: '2 May 2026',
    time: '20:00',
    location: 'Teatro Lorca',
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
    attendees: 680,
    featured: false,
    description: 'La obra maestra de García Lorca sobre represión y libertad en una nueva interpretación.',
    director: 'Isabel Fernández',
    duration: '2h 10min',
    cast: 'Compañía de Teatro Clásico',
    price: '€36',
    match: 80
  },
  {
    id: 26,
    title: 'Tributo a The Beatles',
    category: 'Música',
    genre: 'Tributo',
    date: '3 May 2026',
    time: '21:00',
    location: 'Sala Liverpool',
    image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
    attendees: 1400,
    featured: false,
    description: 'Revive la magia de The Beatles con la mejor banda tributo de Europa.',
    price: '€38',
    match: 87
  },
  {
    id: 27,
    title: 'Comedia Improvisada',
    category: 'Stand-up',
    date: '4 May 2026',
    time: '22:00',
    location: 'El Sótano Comedy',
    image: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
    attendees: 180,
    featured: false,
    description: 'Show de improvisación donde los comediantes crean humor en tiempo real con ayuda del público.',
    price: '€12',
    match: 73
  },
  {
    id: 28,
    title: 'Sinfonía de Primavera',
    category: 'Música',
    genre: 'Clásica',
    date: '6 May 2026',
    time: '19:30',
    location: 'Palacio de la Música',
    image: 'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
    attendees: 2200,
    featured: true,
    description: 'Concierto especial de primavera con obras de Vivaldi, Chopin y Debussy.',
    price: '€55',
    match: 85
  },
  {
    id: 29,
    title: 'Mucho Ruido y Pocas Nueces',
    category: 'Teatro',
    genre: 'Comedia',
    date: '7 May 2026',
    time: '21:00',
    location: 'Teatro de la Villa',
    image: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
    attendees: 540,
    featured: false,
    description: 'La comedia romántica de Shakespeare adaptada a la época actual con humor fresco.',
    director: 'Laura Jiménez',
    duration: '1h 50min',
    cast: 'Compañía Joven de Teatro',
    price: '€26',
    match: 79
  },
  {
    id: 30,
    title: 'Noche de Cine Clásico',
    category: 'Cine',
    date: '9 May 2026',
    time: '20:30',
    location: 'Cine Retro',
    image: 'https://images.unsplash.com/photo-1542204165-65bf26472b9b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
    attendees: 890,
    featured: false,
    description: 'Proyección especial de clásicos de Hollywood en pantalla grande con audio remasterizado.',
    price: '€14',
    match: 76
  }
];

export default function App() {
  const [dbEvents, setDbEvents] = useState<any[]>(events);
  const [loading, setLoading] = useState(true);
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
  const [selectedCity, setSelectedCity] = useState('Santiago');
  const [isScrolled, setIsScrolled] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [displayedEventsCount, setDisplayedEventsCount] = useState(10);
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [authLoading, setAuthLoading] = useState(false);

  // Auth: cargar sesión inicial y escuchar cambios
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser) {
        const saved = await loadFavorites(currentUser.id);
        setFavorites(saved);
      } else {
        setFavorites(new Set());
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleSignIn = async () => {
    setAuthLoading(true);
    try { await signInWithGoogle(); }
    catch (err) { console.error('Error signing in:', err); }
    finally { setAuthLoading(false); }
  };

  const handleSignOut = async () => {
    await signOut();
    setShowProfile(false);
  };

  // Cargar eventos reales desde Supabase
  useEffect(() => {
    async function fetchEvents() {
      try {
        const { data, error } = await supabase
          .from('events')
          .select('*, venues(name, comuna)')
          .order('datetime', { ascending: true });

        console.log('Supabase response:', { data, error });
        if (error) throw error;
        if (data) {
          console.log('Events from DB:', data.length);
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
              category: e.category || 'Otros',
              genre: e.subcategory || '',
              price: e.price ? `$${e.price}` : 'Ver sitio',
              featured: true,
              match: 90,
              attendees: 0,
            };
          });
          setDbEvents(mappedEvents);
        }
      } catch (err) {
        console.error('Error fetching events:', err);
        setLoading(false);
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
    const dateParts = event.date.split(' ');
    const day = parseInt(dateParts[0]);
    const month = dateParts[1];
    const year = dateParts[2];

    const eventDate = new Date(2026, 3, day); // Abril = mes 3 (0-indexed)
    const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sab'];
    const dayName = dayNames[eventDate.getDay()];

    return `${dayName} ${day} ${month} ${year}, ${event.time} hrs`;
  };

  const getEventDateTag = (event: typeof events[0]) => {
    const today = new Date(2026, 3, 9); // 9 Abril 2026
    const eventDate = new Date(2026, 3, parseInt(event.date.split(' ')[0]));

    if (eventDate.getDate() === today.getDate()) {
      return 'HOY';
    }

    // Fin de semana: 12-13 Abril 2026
    const weekend = [12, 13];
    if (weekend.includes(eventDate.getDate())) {
      return 'ESTE FINDE';
    }

    return null;
  };

  const filterByDate = (event: typeof events[0]) => {
    if (!selectedDateFilter) return true;

    const today = new Date(2026, 3, 9); // 9 Abril 2026
    const eventDate = new Date(2026, 3, parseInt(event.date.split(' ')[0]));

    if (selectedDateFilter === 'Hoy') {
      return eventDate.getDate() === today.getDate();
    }

    if (selectedDateFilter === 'Este fin de semana') {
      // Fin de semana: 12-13 Abril 2026
      const weekend = [12, 13];
      return weekend.includes(eventDate.getDate());
    }

    return true;
  };

  // Usar datos reales si están disponibles, si no mostrar loading
  const activeEvents = dbEvents.length > 0 ? dbEvents : [];

  const featuredEvents = activeEvents.filter(event => {
    const matchesCategory = selectedCategory === 'Todos' || event.category === selectedCategory;
    const matchesSubCategory = !selectedSubCategory || event.genre === selectedSubCategory;
    const matchesDate = filterByDate(event);
    return matchesCategory && matchesSubCategory && matchesDate;
  });

  const favoriteEvents = activeEvents.filter(event => favorites.has(event.id));

  const filteredEvents = activeEvents.filter(event => {
    const matchesCategory = selectedCategory === 'Todos' || event.category === selectedCategory;
    const matchesSubCategory = !selectedSubCategory || event.genre === selectedSubCategory;
    const matchesSearch = event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         event.location.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDate = filterByDate(event);
    return matchesCategory && matchesSubCategory && matchesSearch && matchesDate;
  });

  const handleCardClick = (eventId: number) => {
    const event = activeEvents.find(e => e.id === eventId);
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
        if (user) { removeFavorite(user.id, eventId); trackActivity(user.id, 'unfavorite', eventId); }
      } else {
        newSet.add(eventId);
        if (user) { addFavorite(user.id, eventId); trackActivity(user.id, 'favorite', eventId); }
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

                      {categories.filter(c => c !== 'Todos').map((category) => (
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
                          {subCategories[selectedCategory]?.length > 0 ? (
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

                                {subCategories[selectedCategory].map((subCat) => (
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

                                {subCategories[selectedCategory].map((subCat) => (
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

                        {categories.filter(c => c !== 'Todos').map((category) => (
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
                            {subCategories[selectedCategory]?.length > 0 ? (
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

                                  {subCategories[selectedCategory].map((subCat) => (
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

                                  {subCategories[selectedCategory].map((subCat) => (
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
                    const colors = categoryColors[event.category as keyof typeof categoryColors];

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
                              {event.genre && (
                                <span className="bg-black/50 backdrop-blur-sm text-white text-xs px-3 py-1 rounded-full border border-white/20">
                                  {event.genre}
                                </span>
                              )}
                              {getEventDateTag(event) && (
                                <span className="bg-emerald-600 text-white text-xs px-3 py-1 rounded-full font-medium">
                                  {getEventDateTag(event)}
                                </span>
                              )}
                            </div>
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
                          </div>

                          <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                            <h3 className="text-xl mb-2">{event.title}</h3>
                            <div className="flex items-center gap-2 text-sm text-neutral-300 mb-1">
                              <Calendar size={14} />
                              <span>{formatEventDate(event)}</span>
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

            <div className="px-4 pt-4 pb-8">
              <h2 className={`text-2xl mb-4 ${isLightMode ? 'text-neutral-900' : 'text-white'}`}>Todos los eventos</h2>
              <div className="space-y-3">
                {filteredEvents.slice(0, displayedEventsCount).map((event) => {
                  const isFavorite = favorites.has(event.id);
                  const colors = categoryColors[event.category as keyof typeof categoryColors];

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
                            <div className="absolute top-2 left-2 flex flex-col gap-1">
                              <span className={`${colors.badge} text-white text-xs px-2 py-0.5 rounded-full`}>
                                {event.category}
                              </span>
                              {getEventDateTag(event) && (
                                <span className="bg-emerald-600 text-white text-xs px-2 py-0.5 rounded-full font-medium">
                                  {getEventDateTag(event)}
                                </span>
                              )}
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
                              {event.genre && (
                                <span className={`text-xs ${isLightMode ? 'text-neutral-600' : 'text-neutral-400'}`}>
                                  {event.genre}
                                </span>
                              )}
                            </div>
                            <div className="space-y-1">
                              <div className={`flex items-center gap-1.5 text-xs ${isLightMode ? 'text-neutral-600' : 'text-neutral-400'}`}>
                                <Calendar size={12} />
                                <span>{formatEventDate(event)}</span>
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

              {filteredEvents.length > displayedEventsCount && (
                <div className="flex justify-center mt-6">
                  <button
                    onClick={() => setDisplayedEventsCount(prev => Math.min(prev + 10, filteredEvents.length))}
                    className={`px-6 py-3 rounded-lg ${isLightMode ? 'bg-neutral-100 hover:bg-neutral-200 text-neutral-900' : 'bg-neutral-900 hover:bg-neutral-800 text-white'} transition-colors`}
                  >
                    Cargar más eventos
                  </button>
                </div>
              )}
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
                        const colors = categoryColors[selectedEvent.category as keyof typeof categoryColors];
                        return (
                          <>
                            <span className={`${colors.badge} text-white text-sm px-3 py-1.5 rounded-full`}>
                              {selectedEvent.category}
                            </span>
                            {selectedEvent.genre && (
                              <span className="bg-black/50 backdrop-blur-sm text-white text-sm px-3 py-1.5 rounded-full border border-white/20">
                                {selectedEvent.genre}
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
                      <p className={`${isLightMode ? 'text-neutral-900' : 'text-white'}`}>{selectedEvent.attendees.toLocaleString()}</p>
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
                    <img src={user.user_metadata.avatar_url} alt="avatar" className="w-24 h-24 rounded-full mx-auto mb-4 object-cover" />
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
                  {!user ? (
                    <button
                      onClick={handleSignIn}
                      disabled={authLoading}
                      className="mt-4 flex items-center gap-2 mx-auto px-6 py-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-medium transition-colors disabled:opacity-50"
                    >
                      <LogIn size={18} />
                      {authLoading ? 'Conectando...' : 'Iniciar sesión con Google'}
                    </button>
                  ) : (
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
                        <option>Madrid</option>
                        <option>Barcelona</option>
                        <option>Valencia</option>
                        <option>Sevilla</option>
                        <option>Bilbao</option>
                        <option>Málaga</option>
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

      <InstallPrompt isLightMode={isLightMode} />
    </div>
  );
}
