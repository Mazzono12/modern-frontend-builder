import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index.tsx";
import Login from "./pages/Login.tsx";
import { AppLayout } from "./components/AppLayout";
import Dashboard from "./pages/Dashboard.tsx";
import Inbox from "./pages/Inbox.tsx";
import Campaigns from "./pages/Campaigns.tsx";
import Chatbot from "./pages/Chatbot.tsx";
import Analytics from "./pages/Analytics.tsx";
import { ComingSoon } from "./components/ComingSoon";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/login" element={<Login />} />
          <Route path="/app" element={<AppLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="inbox" element={<Inbox />} />
            <Route path="campaigns" element={<Campaigns />} />
            <Route path="chatbot" element={<Chatbot />} />
            <Route path="calling" element={<ComingSoon title="Calling & IVR" description="Chamadas WhatsApp, menus DTMF e roteamento." />} />
            <Route path="analytics" element={<Analytics />} />
            <Route path="contacts" element={<ComingSoon title="Contatos" description="CRM unificado da sua base de clientes." />} />
            <Route path="templates" element={<ComingSoon title="Templates" description="Mensagens aprovadas pela Meta." />} />
            <Route path="settings" element={<ComingSoon title="Configurações" description="Workspace, integrações e API keys." />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
