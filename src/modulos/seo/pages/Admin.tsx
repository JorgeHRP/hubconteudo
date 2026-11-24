import { useState } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface Message {
  id: number;
  text: string;
  timestamp: string;
  type: "user" | "system";
}

const Admin = () => {
  const [messages, setMessages] = useState<Message[]>([
    { id: 1, text: "Dashboard criado com dados de exemplo. Envie atualizações aqui para incluir nos relatórios.", timestamp: "2026-04-07 10:00", type: "system" },
  ]);
  const [input, setInput] = useState("");

  const handleSend = () => {
    if (!input.trim()) return;
    setMessages(prev => [...prev, {
      id: Date.now(),
      text: input,
      timestamp: new Date().toLocaleString("pt-BR"),
      type: "user",
    }]);
    setInput("");
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-lg font-semibold leading-tight text-foreground sm:text-xl">Área Admin</h2>
        <p className="text-muted-foreground text-sm mt-1">Envie atualizações e informações para incluir no dashboard</p>
      </div>

      <div className="flex h-[60vh] min-h-[320px] flex-col overflow-hidden rounded-lg border bg-card shadow-card">
        <div className="flex-1 space-y-3 overflow-y-auto p-4 sm:p-5">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.type === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[85%] rounded-lg px-3 py-2.5 ${msg.type === "user" ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"}`}>
                <p className="whitespace-pre-wrap break-words text-sm">{msg.text}</p>
                <p className={`mt-1 text-xs ${msg.type === "user" ? "text-primary-foreground/70" : "text-muted-foreground"}`}>{msg.timestamp}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="flex gap-2 border-t bg-muted/30 p-3">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Envie uma atualização para o dashboard..."
            aria-label="Mensagem"
            className="resize-none bg-card"
            rows={2}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
          />
          <Button onClick={handleSend} size="icon" className="shrink-0 self-end" aria-label="Enviar atualização">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Admin;


