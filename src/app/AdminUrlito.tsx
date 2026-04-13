import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { X, Check, Brain, Sparkles, Send } from 'lucide-react';

export default function AdminUrlito({ onClose, isLightMode }: { onClose: () => void, isLightMode: boolean }) {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [memoryInput, setMemoryInput] = useState<{ [key: number]: { correction: string, reasoning: string } }>({});
  const [smartInput, setSmartInput] = useState<{ [key: number]: string }>({});
  const [loadingEvents, setLoadingEvents] = useState<{ [key: number]: boolean }>({});

  useEffect(() => {
    async function fetchUrlitoEvents() {
      // Pedimos los 15 eventos más recientes procesados por URLito
      const { data } = await supabase
        .from('events')
        .select('*, venues(*)')
        .eq('urlito_processed', true)
        .order('updated_at', { ascending: false })
        .limit(15);
        
      if (data) {
        setEvents(data);
        const initialInputs: any = {};
        data.forEach((e: any) => {
          const dateStr = e.datetime ? new Date(e.datetime) : null;
          initialInputs[e.id] = {
            correction: JSON.stringify({
              nombre: e.clean_title || e.title,
              artistas: [], // Llena esto si hubo artistas ignorados
              fecha: dateStr && !isNaN(dateStr.getTime()) ? dateStr.toISOString().split('T')[0] : "",
              hora: dateStr && !isNaN(dateStr.getTime()) ? dateStr.toTimeString().split(' ')[0] : "",
              lugar: e.venues?.name || "",
              direccion: e.venues?.address || "",
              comuna: e.venues?.comuna || "",
              url_mapa: e.venues?.maps_url || "",
              precio: e.price || 0,
              categoria: e.category || "",
              subcategoria: e.subcategory || "",
              tags: [],
              url_foto: e.image_url || "",
              descripcion: "..." // Opcional, solo corrígelo si la descripción de la IA fue muy mala
            }, null, 2),
            reasoning: ''
          };
        });
        setMemoryInput(initialInputs);
        setSmartInput(data.reduce((acc: any, e: any) => ({ ...acc, [e.id]: '' }), {}));
      }
      setLoading(false);
    }
    fetchUrlitoEvents();
  }, []);

  const handleSmartSubmit = async (eventId: number, originalDesc: string) => {
    const instruction = smartInput[eventId];
    if (!instruction?.trim()) {
      alert("Por favor ingresa la orden para Mistral.");
      return;
    }
    setLoadingEvents({ ...loadingEvents, [eventId]: true });
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/admin/urlito/smart-feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event_id: eventId,
          original_text: originalDesc || "Sin descripción",
          ai_output: memoryInput[eventId]?.correction || "{}", 
          user_instruction: instruction
        })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || "Error en el servidor");
      
      alert(data.message + "\n\n🧠 Regla Inyectada Automáticamente:\n" + data.reasoning);
      setSmartInput({ ...smartInput, [eventId]: '' });
    } catch (err: any) {
      alert("Error en Corrección Mágica: " + err.message);
    } finally {
      setLoadingEvents({ ...loadingEvents, [eventId]: false });
    }
  };

  const handleSubmit = async (eventId: number, originalDesc: string) => {
    const input = memoryInput[eventId];
    if (!input.reasoning.trim()) {
      alert("Por favor ingresa un razonamiento para que URLito aprenda.");
      return;
    }
    
    // Insertamos directo en la tabla de memoria que la IA consultará (Few-Shot)
    const { error } = await supabase.from('urlito_memory').insert({
      event_id: eventId,
      original_text: originalDesc || "Sin descripción guardada",
      ai_output: "{}", 
      user_correction: input.correction,
      reasoning: input.reasoning
    });

    if (error) {
      alert("Error guardando memoria: " + error.message);
    } else {
      alert("🧠 ¡Aprendizaje inyectado correctamente en Memoria!");
      // Limpiar el campo de reasoning después de enviar
      setMemoryInput({
        ...memoryInput,
        [eventId]: { ...memoryInput[eventId], reasoning: '' }
      });
    }
  };

  const bgColor = isLightMode ? 'bg-neutral-50 text-neutral-900' : 'bg-[#0a0a0a] text-white';
  const cardColor = isLightMode ? 'bg-white' : 'bg-neutral-900';

  return (
    <div className={`fixed inset-0 z-50 overflow-y-auto ${bgColor}`}>
      <div className="p-4 flex items-center justify-between border-b border-neutral-700/50 bg-indigo-900/10 backdrop-blur-md sticky top-0">
        <div className="flex items-center gap-3">
          <Brain className="text-indigo-500" size={28} />
          <h1 className="text-xl font-bold tracking-tight">URLito Training Academy</h1>
        </div>
        <button onClick={onClose} className="p-2 bg-neutral-800/50 rounded-full hover:bg-neutral-700 transition">
          <X size={20} className={isLightMode ? 'text-neutral-900' : 'text-white'} />
        </button>
      </div>

      <div className="p-4 space-y-6 max-w-3xl mx-auto pb-24">
        <p className="text-sm opacity-80 mb-6">
          Revisa las extracciones recientes hechas por la IA. Si encuentras un error, corrige el JSON y escribe la regla mental ("Razonamiento") que quieres que URLito memorice para la próxima vez que procese un ticket parecido.
        </p>

        {loading ? (
          <div className="flex justify-center p-10"><span className="animate-pulse">Cargando eventos procesados...</span></div>
        ) : (
          events.map(ev => (
            <div key={ev.id} className={`p-5 rounded-2xl ${cardColor} flex flex-col gap-5 border border-indigo-500/20 shadow-xl`}>
              <div>
                <h3 className="font-bold text-lg leading-tight mb-2">{ev.title}</h3>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm opacity-90">
                  <div className="truncate"><strong className="text-indigo-400">SubCat:</strong> {ev.subcategory || 'N/A'}</div>
                  <div><strong className="text-indigo-400">Precio:</strong> {ev.price || 'Gratis'}</div>
                  <div className="col-span-2 truncate"><strong className="text-indigo-400">URL:</strong> <a href={ev.url} target="_blank" rel="noreferrer" className="underline">{ev.url}</a></div>
                </div>
              </div>

              <div className="border-t border-neutral-800 pt-4 flex flex-col gap-3">
                <div className="bg-teal-900/10 p-3 rounded-xl border border-teal-500/20">
                  <label className="text-xs font-bold uppercase tracking-wider text-teal-400 mb-2 flex items-center gap-2">
                    <Sparkles size={14}/> Dictado Mágico (IA corrige el JSON por ti):
                  </label>
                  <div className="flex gap-2">
                    <textarea 
                      className={`flex-1 ${isLightMode ? 'bg-white' : 'bg-neutral-950'} border border-teal-800/50 rounded-lg p-3 text-sm h-16 focus:ring-1 focus:ring-teal-500 outline-none`}
                      placeholder="Dicta aquí. Ej: 'Pon el precio a 5000 y el artista es Coco Legrand'"
                      value={smartInput[ev.id] || ''}
                      onChange={(e) => setSmartInput({ ...smartInput, [ev.id]: e.target.value })}
                    />
                    <button 
                      onClick={() => handleSmartSubmit(ev.id, ev.description)}
                      disabled={loadingEvents[ev.id]}
                      className="bg-teal-600 hover:bg-teal-500 text-white font-bold px-4 rounded-xl transition-transform active:scale-95 disabled:opacity-50 flex items-center justify-center flex-col gap-1"
                      title="Enviar orden a Mistral"
                    >
                      {loadingEvents[ev.id] ? <span className="animate-spin text-xl">💫</span> : <Send size={20} />}
                    </button>
                  </div>
                </div>
                
                <div className="text-center my-1 text-[10px] uppercase font-bold tracking-widest text-neutral-500">--- Ó Edición Manual de JSON ---</div>

                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-1 block">1. Corrige el Dato (Opcional):</label>
                  <textarea 
                    className={`w-full ${isLightMode ? 'bg-neutral-100' : 'bg-neutral-950'} border border-neutral-800 rounded-lg p-3 text-xs font-mono h-24 focus:ring-1 focus:ring-indigo-500 outline-none`}
                    value={memoryInput[ev.id]?.correction}
                    onChange={(e) => setMemoryInput({
                      ...memoryInput,
                      [ev.id]: { ...memoryInput[ev.id], correction: e.target.value }
                    })}
                  />
                </div>

                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-1 block">2. Inyectar Lógica (Requerido):</label>
                  <textarea 
                    className={`w-full ${isLightMode ? 'bg-neutral-100' : 'bg-neutral-950'} border border-neutral-800 rounded-lg p-3 text-sm h-16 focus:ring-1 focus:ring-indigo-500 outline-none`}
                    placeholder="Ej: Si ves la palabra 'Tributo', la subcategoría siempre debe ser 'Música > Tributo'."
                    value={memoryInput[ev.id]?.reasoning}
                    onChange={(e) => setMemoryInput({
                      ...memoryInput,
                      [ev.id]: { ...memoryInput[ev.id], reasoning: e.target.value }
                    })}
                  />
                </div>

                <button 
                  onClick={() => handleSubmit(ev.id, ev.description)}
                  className="mt-1 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2.5 px-4 rounded-xl transition-transform active:scale-95"
                >
                  <Brain size={18} /> Inyectar a Memoria
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
