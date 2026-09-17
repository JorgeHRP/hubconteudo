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
        <h1 className="text-2xl font-bold gradient-text">Área Admin</h1>
        <p className="text-muted-foreground text-sm mt-1">Envie atualizações e informações para incluir no dashboard</p>
      </div>

      <div className="glass-card flex flex-col h-[60vh]">
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.type === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[80%] rounded-xl p-4 ${msg.type === "user" ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"}`}>
                <p className="text-sm">{msg.text}</p>
                <p className={`text-xs mt-1 ${msg.type === "user" ? "text-primary-foreground/60" : "text-muted-foreground"}`}>{msg.timestamp}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="border-t p-4 flex gap-3">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Envie uma atualização para o dashboard..."
            className="resize-none"
            rows={2}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
          />
          <Button onClick={handleSend} className="self-end" style={{ background: "var(--gradient-primary)" }}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Admin;


