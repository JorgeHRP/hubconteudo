import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import KeywordsEscolhidas from "./KeywordsEscolhidas";
import KeywordsTodas from "./KeywordsTodas";
import KeywordsGSC from "./KeywordsGSC";
import KeywordsGeral from "./KeywordsGeral";
import KeywordsVestibular from "./KeywordsVestibular";
import KeywordsESEG from "./KeywordsESEG";
import KeywordsInternacional from "./KeywordsInternacional";
import KeywordsRenata from "./KeywordsRenata";
import KeywordsSP from "./KeywordsSP";

const KeywordsHub = () => {
  return (
    <div className="space-y-6 max-w-7xl">
      <div>
        <h2 className="text-lg font-semibold leading-tight text-foreground sm:text-xl">Palavras-chave</h2>
        <p className="mt-0.5 text-sm text-muted-foreground">Gestão completa de palavras-chave por categoria</p>
      </div>
      <Tabs defaultValue="escolhidas" className="w-full">
        <TabsList className="mb-2 h-auto max-w-full flex-wrap justify-start gap-1 p-1">
          <TabsTrigger value="escolhidas">Escolhidas</TabsTrigger>
          <TabsTrigger value="todas">Todas Palavras-Chave</TabsTrigger>
          <TabsTrigger value="gsc">Google Search Console</TabsTrigger>
          <TabsTrigger value="geral">Geral</TabsTrigger>
          <TabsTrigger value="vestibular">Vestibular</TabsTrigger>
          <TabsTrigger value="eseg">ESEG</TabsTrigger>
          <TabsTrigger value="sp">São Paulo</TabsTrigger>
          <TabsTrigger value="internacional">Internacional</TabsTrigger>
          <TabsTrigger value="renata">Renata</TabsTrigger>
        </TabsList>
        <TabsContent value="escolhidas"><KeywordsEscolhidas /></TabsContent>
        <TabsContent value="todas"><KeywordsTodas /></TabsContent>
        <TabsContent value="gsc"><KeywordsGSC /></TabsContent>
        <TabsContent value="geral"><KeywordsGeral /></TabsContent>
        <TabsContent value="vestibular"><KeywordsVestibular /></TabsContent>
        <TabsContent value="eseg"><KeywordsESEG /></TabsContent>
        <TabsContent value="sp"><KeywordsSP /></TabsContent>
        <TabsContent value="internacional"><KeywordsInternacional /></TabsContent>
        <TabsContent value="renata"><KeywordsRenata /></TabsContent>
      </Tabs>
    </div>
  );
};

export default KeywordsHub;


