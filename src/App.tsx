import { Suspense, lazy } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster } from "sonner";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { AppLayout } from "@/components/AppLayout";
import { AssistenteIA } from "@/components/AssistenteIA";
import type { AppModulo } from "@/lib/types";

import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import Feed from "@/pages/Feed";
import Colaboradores from "@/pages/Colaboradores";
import Calendario from "@/pages/Calendario";
import Solicitacoes from "@/pages/Solicitacoes";
import Repositorios from "@/pages/Repositorios";
import Contracheques from "@/pages/Contracheques";
import AtivosMarca from "@/pages/AtivosMarca";
import ManualInterno from "@/pages/ManualInterno";
import Politicas from "@/pages/Politicas";
import Treinamentos from "@/pages/Treinamentos";
import CS from "@/pages/CS";
import PainelCliente from "@/pages/PainelCliente";
import Vendas from "@/pages/Vendas";
import Admin from "@/pages/Admin";
import Perfil from "@/pages/Perfil";
import GestaoClientes from "@/pages/GestaoClientes";
import Empresas from "@/pages/Empresas";
import Tarefas from "@/pages/Tarefas";
import PortalCliente from "@/pages/PortalCliente";
import RelatorioViagens from "@/pages/RelatorioViagens";
import Financeiro from "@/pages/Financeiro";
import Trafego from "@/pages/Trafego";
const SeoGeo = lazy(() => import("@/pages/SeoGeo"));
import ProjetosRD from "@/pages/ProjetosRD";
import Inbound from "@/pages/Inbound";
import Sites, { SitesDoCliente } from "@/pages/Sites";
import RedesSociais, { RedesDoCliente } from "@/pages/RedesSociais";
import InboundCliente from "@/pages/InboundCliente";
import ImplantacaoDetalhe from "@/pages/ImplantacaoDetalhe";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: { queries: { refetchOnWindowFocus: false } },
});

function ProtectedRoute({
  children,
  modulo,
  somenteMaster,
}: {
  children: React.ReactNode;
  modulo?: AppModulo;
  somenteMaster?: boolean;
}) {
  const { isAuthenticated, loading, temModulo, isMaster } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center text-sm text-muted-foreground">
        Carregando…
      </div>
    );
  }
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (modulo && !temModulo(modulo)) return <Navigate to="/" replace />;
  if (somenteMaster && !isMaster) return <Navigate to="/" replace />;

  return (
    <AppLayout>
      {children}
      <AssistenteIA />
    </AppLayout>
  );
}

function Rotas() {
  const { isAuthenticated, loading } = useAuth();

  return (
    <Routes>
      {/* Painel do cliente: link exclusivo, sem login. */}
      <Route path="/painel/:token" element={<PortalCliente />} />
      <Route
        path="/login"
        element={!loading && isAuthenticated ? <Navigate to="/" replace /> : <Login />}
      />
      <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/feed" element={<ProtectedRoute><Feed /></ProtectedRoute>} />
      <Route path="/colaboradores" element={<ProtectedRoute><Colaboradores /></ProtectedRoute>} />
      <Route path="/calendario" element={<ProtectedRoute><Calendario /></ProtectedRoute>} />
      <Route path="/solicitacoes" element={<ProtectedRoute><Solicitacoes /></ProtectedRoute>} />
      <Route path="/repositorios" element={<ProtectedRoute><Repositorios /></ProtectedRoute>} />
      <Route path="/contracheques" element={<ProtectedRoute><Contracheques /></ProtectedRoute>} />
      <Route path="/ativos" element={<ProtectedRoute><AtivosMarca /></ProtectedRoute>} />
      <Route path="/manual" element={<ProtectedRoute><ManualInterno /></ProtectedRoute>} />
      <Route path="/politicas" element={<ProtectedRoute><Politicas /></ProtectedRoute>} />
      <Route path="/treinamentos" element={<ProtectedRoute><Treinamentos /></ProtectedRoute>} />
      <Route path="/viagens" element={<ProtectedRoute><RelatorioViagens /></ProtectedRoute>} />
      <Route path="/tarefas" element={<ProtectedRoute modulo="tarefas"><Tarefas /></ProtectedRoute>} />
      <Route path="/clientes" element={<ProtectedRoute modulo="clientes"><GestaoClientes /></ProtectedRoute>} />
      <Route path="/empresas" element={<ProtectedRoute modulo="clientes"><Empresas /></ProtectedRoute>} />
      <Route path="/cs" element={<ProtectedRoute modulo="cs"><CS /></ProtectedRoute>} />
      <Route path="/cs/:id" element={<ProtectedRoute modulo="cs"><PainelCliente /></ProtectedRoute>} />
      <Route path="/vendas" element={<ProtectedRoute modulo="vendas"><Vendas /></ProtectedRoute>} />
      <Route path="/financeiro" element={<ProtectedRoute modulo="financeiro"><Financeiro /></ProtectedRoute>} />
      <Route path="/trafego" element={<ProtectedRoute modulo="trafego"><Trafego /></ProtectedRoute>} />
      <Route
        path="/seo-geo/*"
        element={
          <ProtectedRoute modulo="seo_geo">
            <Suspense
              fallback={
                <p className="py-16 text-center text-sm text-muted-foreground">
                  Carregando o painel de SEO…
                </p>
              }
            >
              <SeoGeo />
            </Suspense>
          </ProtectedRoute>
        }
      />
      <Route path="/sites" element={<ProtectedRoute modulo="sites"><Sites /></ProtectedRoute>} />
      <Route path="/sites/:id" element={<ProtectedRoute modulo="sites"><SitesDoCliente /></ProtectedRoute>} />
      <Route path="/redes-sociais" element={<ProtectedRoute modulo="social"><RedesSociais /></ProtectedRoute>} />
      <Route path="/redes-sociais/:id" element={<ProtectedRoute modulo="social"><RedesDoCliente /></ProtectedRoute>} />
      <Route path="/inbound" element={<ProtectedRoute modulo="inbound"><Inbound /></ProtectedRoute>} />
      <Route path="/inbound/:id" element={<ProtectedRoute modulo="inbound"><InboundCliente /></ProtectedRoute>} />
      <Route path="/projetos-rd" element={<ProtectedRoute modulo="projetos_rd"><ProjetosRD /></ProtectedRoute>} />
      <Route path="/projetos-rd/:id" element={<ProtectedRoute modulo="projetos_rd"><ImplantacaoDetalhe /></ProtectedRoute>} />
      <Route path="/admin" element={<ProtectedRoute somenteMaster><Admin /></ProtectedRoute>} />
      <Route path="/perfil" element={<ProtectedRoute><Perfil /></ProtectedRoute>} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Rotas />
          <Toaster position="top-right" richColors />
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}
