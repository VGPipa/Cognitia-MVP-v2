import React, { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { Send, User, Bot, Sparkles, Loader2, RotateCcw, Trash2 } from "lucide-react";

interface Message {
  role: 'agent' | 'user';
  content: string;
  type: 'text' | 'options';
  options?: string[];
}

const ChatPoeta = () => {
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [step, setStep] = useState("start");
  const [loading, setLoading] = useState(false);
  
  // Contexto del agente: tema y estilo elegidos
  const [context, setContext] = useState({
    topic: '',
    style: ''
  });

  const scrollRef = useRef<HTMLDivElement>(null);
  
  // La URL se obtiene de las variables de entorno de Vite
  const API_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:8000";

  // Inicializar chat al cargar el componente
  useEffect(() => {
    const initChat = async () => {
      try {
        const res = await fetch(`${API_URL}/chat/init`);
        const data = await res.json();
        setMessages(data.messages);
        setStep(data.current_step);
      } catch (error) {
        toast({
          title: "Error de conexión",
          description: "No se pudo conectar con el servidor de IA.",
          variant: "destructive"
        });
      }
    };
    initChat();
  }, [API_URL, toast]);

  // Auto-scroll al final cuando hay nuevos mensajes
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const sendMessage = async (content: string) => {
    if (!content.trim() || loading) return;

    // 1. Agregar mensaje del usuario localmente
    const userMsg: Message = { role: 'user', content, type: 'text' };
    const updatedMessages = [...messages, userMsg];
    
    setMessages(updatedMessages);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/chat/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          messages: updatedMessages, 
          current_step: step,
          topic: context.topic,
          style: context.style 
        })
      });

      if (!res.ok) throw new Error("Error en el servidor");

      const data = await res.json();

      // 2. Lógica de "Cancelar" o "Reset":
      // Si el backend nos devuelve un tópico vacío y un paso inicial, limpiamos todo.
      if (data.topic === "" && data.current_step === "awaiting_topic") {
        setMessages(data.messages); // Solo dejamos el nuevo saludo del agente
        setContext({ topic: '', style: '' });
      } else {
        // Flujo normal: acumulamos mensajes
        setMessages([...updatedMessages, ...data.messages]);
        // Actualizamos contexto con lo que devuelva el agente
        setContext({
          topic: data.topic !== undefined ? data.topic : context.topic,
          style: data.style !== undefined ? data.style : context.style
        });
      }

      setStep(data.current_step);

    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo procesar la respuesta de la IA.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRestart = () => window.location.reload();

  return (
    <div className="flex flex-col items-center justify-center p-4 md:p-8 bg-background min-h-[85vh]">
      <Card className="w-full max-w-2xl h-[700px] flex flex-col shadow-2xl border-primary/20 relative">
        
        <CardHeader className="border-b bg-muted/30 py-4 flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-primary text-lg">
            <Sparkles className="w-5 h-5" />
            Agente Literario Cognitia
          </CardTitle>
          <div className="flex gap-2">
            <Button variant="ghost" size="icon" onClick={handleRestart} title="Reiniciar chat">
              <RotateCcw className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
          <ScrollArea className="flex-1 p-4 md:p-6">
            <div className="space-y-6 pb-4">
              {messages.map((m, i) => (
                <div 
                  key={i} 
                  className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}
                >
                  <div className={`flex gap-3 max-w-[85%] ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 shadow-sm ${
                      m.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'
                    }`}>
                      {m.role === 'user' ? <User size={18} /> : <Bot size={18} />}
                    </div>
                    
                    <div className="flex flex-col gap-2">
                      <div className={`p-4 rounded-2xl text-sm leading-relaxed shadow-sm ${
                        m.role === 'user' 
                          ? 'bg-primary text-primary-foreground rounded-tr-none' 
                          : 'bg-muted rounded-tl-none border border-border'
                      }`}>
                        <div className="whitespace-pre-wrap font-sans">{m.content}</div>
                        
                        {/* Renderizado de BOTONES de OPCIONES */}
                        {m.type === 'options' && m.options && (
                          <div className="flex flex-wrap gap-2 mt-4 pt-3 border-t border-primary/10">
                            {m.options.map((opt) => (
                              <Button 
                                key={opt} 
                                size="sm" 
                                variant={opt === 'Cancelar' ? 'destructive' : 'success'} 
                                className={`font-bold transition-all ${opt !== 'Cancelar' ? 'hover:bg-success/90' : ''}`}
                                onClick={() => sendMessage(opt)}
                                disabled={loading}
                              >
                                {opt === 'Cancelar' && <Trash2 className="w-3 h-3 mr-1" />}
                                {opt}
                              </Button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start items-center gap-3 text-muted-foreground animate-pulse">
                  <div className="bg-muted p-2 rounded-full"><Loader2 className="w-4 h-4 animate-spin" /></div>
                  <span className="text-xs uppercase tracking-widest font-medium">El agente está pensando...</span>
                </div>
              )}
              <div ref={scrollRef} />
            </div>
          </ScrollArea>

          {/* ÁREA DE ENTRADA DE TEXTO */}
          <div className="p-4 border-t bg-background flex gap-2 items-center">
            <Input 
              className="flex-1 h-12 text-base focus-visible:ring-primary shadow-none border-none bg-muted/50"
              placeholder={
                step === 'completed' 
                  ? "Poesía finalizada ✨" 
                  : messages[messages.length - 1]?.type === 'options' 
                    ? "Selecciona una opción arriba..." 
                    : "Escribe tu idea aquí..."
              } 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendMessage(input)}
              // Se bloquea si el agente está cargando, si el flujo terminó, o si hay botones activos
              disabled={loading || step === 'completed' || messages[messages.length - 1]?.type === 'options'}
            />
            <Button 
              onClick={() => sendMessage(input)} 
              variant="gradient" 
              size="icon" 
              className="h-12 w-12 shrink-0 rounded-full shadow-lg"
              disabled={loading || !input.trim() || messages[messages.length - 1]?.type === 'options'}
            >
              <Send className="w-5 h-5" />
            </Button>
          </div>
        </CardContent>
      </Card>
      
      <div className="mt-4 flex flex-col items-center gap-1 opacity-60">
        <p className="text-[10px] uppercase tracking-widest font-bold text-primary">Powered by LangGraph & FastAPI</p>
        <p className="text-xs italic text-center text-muted-foreground">
          Generador de poesía dinámica para el área de Comunicación.
        </p>
      </div>
    </div>
  );
};

export default ChatPoeta;