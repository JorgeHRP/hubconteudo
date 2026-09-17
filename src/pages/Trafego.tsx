import { Megaphone, Users, LayoutDashboard } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { PainelIncorporado } from "@/components/PainelIncorporado";
import { CarteiraDaFrente } from "@/components/CarteiraDaFrente";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Trafego() {
  return (
    <div className="animate-fade-in">
      <PageHeader
        icone={Megaphone}
        titulo="Gestão de Tráfego"
        subtitulo="Carteira de mídia paga e o painel de campanhas"
      />

      <Tabs defaultValue="clientes">
        <TabsList>
          <TabsTrigger value="clientes"><Users /> Clientes</TabsTrigger>
          <TabsTrigger value="painel"><LayoutDashboard /> Painel de campanhas</TabsTrigger>
        </TabsList>

        <TabsContent value="clientes">
          <CarteiraDaFrente tipo="trafego" />
        </TabsContent>

        <TabsContent value="painel">
          {/* O painel de campanhas continua sendo montado fora e embutido aqui. */}
          <PainelIncorporado
            chave="trafego"
            icone={Megaphone}
            titulo="Painel de campanhas"
            subtitulo="Campanhas de mídia paga rodando dentro da Central"
            semCabecalho
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
