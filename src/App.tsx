import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "./components/ThemeProvider";
import Index from "./pages/Index.tsx";
import Login from "./pages/Login.tsx";
import { AppLayout } from "./components/AppLayout";
import Dashboard from "./pages/Dashboard.tsx";
import Inbox from "./pages/Inbox.tsx";
import Campaigns from "./pages/Campaigns.tsx";
import Chatbot from "./pages/Chatbot.tsx";
import Analytics from "./pages/Analytics.tsx";
import Pipeline from "./pages/Pipeline.tsx";
import Contacts from "./pages/Contacts.tsx";
import Settings from "./pages/Settings.tsx";
import Integrations from "./pages/Integrations.tsx";
import Templates from "./pages/Templates.tsx";
import N8N from "./pages/N8N.tsx";
import Groups from "./pages/Groups.tsx";
import SmsBlast from "./pages/SmsBlast.tsx";
import { ComingSoon } from "./components/ComingSoon";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const App = () => (
  <ThemeProvider>
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
              <Route path="pipeline" element={<Pipeline />} />
              <Route path="campaigns" element={<Campaigns />} />
              <Route path="chatbot" element={<Chatbot />} />
              <Route path="calling" element={<ComingSoon title="Calling & IVR" description="Chamadas WhatsApp, menus DTMF e roteamento." />} />
              <Route path="analytics" element={<Analytics />} />
              <Route path="contacts" element={<Contacts />} />
              <Route path="groups" element={<Groups />} />
              <Route path="templates" element={<Templates />} />
              <Route path="settings" element={<Settings />} />
              <Route path="integrations" element={<Integrations />} />
              <Route path="n8n" element={<N8N />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
