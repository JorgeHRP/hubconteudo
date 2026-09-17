import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import BacklinksAtual from "./BacklinksAtual";
import BacklinksJulho from "./BacklinksJulho";
import BacklinksMartech from "./BacklinksMartech";
import { useComecaVazio } from "@/modulos/seo/contexts/ProjetoSeoContext";
import { SecaoSemDados } from "@/modulos/seo/components/SecaoSemDados";

const BacklinksHub = () => {
  // Projeto em branco: o conteúdo escrito no código é da ESEG e não pode
  // aparecer como se fosse deste cliente.
  const comecaVazio = useComecaVazio();
  if (comecaVazio) {
    return (
      <SecaoSemDados
        titulo="Backlinks"
        descricao="Perfil de links e ações de link building"
        oQueEntraAqui="Aqui entram os backlinks conquistados para este cliente."
      />
    );
  }

  return (
    <Tabs defaultValue="julho" className="space-y-6 max-w-7xl">
      <TabsList className="glass-card">
        <TabsTrigger value="abril">Backlink Abril</TabsTrigger>
        <TabsTrigger value="julho">Backlink Julho</TabsTrigger>
        <TabsTrigger value="martech">Backlinks Conteúdo Martech</TabsTrigger>
      </TabsList>
      <TabsContent value="abril"><BacklinksAtual /></TabsContent>
      <TabsContent value="julho"><BacklinksJulho /></TabsContent>
      <TabsContent value="martech"><BacklinksMartech /></TabsContent>
    </Tabs>
  );
};

export default BacklinksHub;


