import { useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import DashboardLayout from "./layouts/DashboardLayout";
import Dashboard from "./pages/Dashboard";
import InboxPage from "./pages/InboxPage";
import BroadcastPage from "./pages/BroadcastPage";
import CreateBroadcastPage from "./pages/CreateBroadcastPage";
import DripCampaignPage from "./pages/DripCampaignPage";
import CreateDripPage from "./pages/CreateDripPage";
import TemplatesPage from "./pages/TemplatesPage";
import CreateTemplatePage from "./pages/CreateTemplatePage";
import GenericPage from "./pages/GenericPage";
import ContactsPage from "./pages/ContactsPage";
import LeadMagnetsPage from "./pages/LeadMagnetsPage";
import LeadMagnetBuilderPage from "./pages/LeadMagnetBuilderPage";
import PublicLeadCapturePage from "./pages/PublicLeadCapturePage";
import WebsiteWidgetPage from "./pages/WebsiteWidgetPage";
import ChatBotPage from "./pages/ChatBotPage";
import ChatBotBuilderPage from "./pages/ChatBotBuilderPage";
import QRCodePage from "./pages/QRCodePage";
import FlowsPage from "./pages/FlowsPage";
import IntegrationsPage from "./pages/IntegrationsPage";
import { CatalogSettingPage, CatalogManagementPage, OrdersPage, PaymentSetupPage } from "./pages/EcommercePages";
import { PaymentsHistoryPage, PaymentsSetupPage } from "./pages/PaymentsPages";
import {
  AccountBillingPage,
  AccountApiLogsPage,
  AccountMessageAnalyticsPage,
  AccountWebhooksPage,
  AccountMetaDirectPage,
  AccountFoundationPage,
} from "./pages/PaymentsPages";
import AccountPage from "./pages/account/AccountPage";
import LoginPage from "./pages/auth/LoginPage";
import RegisterPage from "./pages/auth/RegisterPage";
import OnboardingPage from "./pages/auth/OnboardingPage";
import { GuestRoute, RequireAuth, RequireBusiness } from "./components/RouteGuards";
import { useAuthStore } from "./store/authStore";
import { bootstrapAuth } from "./hooks/useAuth";

function DashboardRoutes() {
  return (
    <DashboardLayout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/inbox" element={<InboxPage />} />
        <Route path="/campaign/broadcast" element={<BroadcastPage />} />
        <Route path="/campaign/broadcast/create" element={<CreateBroadcastPage />} />
        <Route path="/campaign/drip" element={<DripCampaignPage />} />
        <Route path="/campaign/drip/create" element={<CreateDripPage />} />
        <Route path="/templates" element={<TemplatesPage />} />
        <Route path="/templates/create" element={<CreateTemplatePage />} />
        <Route path="/contacts" element={<ContactsPage />} />
        <Route path="/lead-magnets" element={<LeadMagnetsPage />} />
        <Route path="/lead-magnets/website-widget" element={<WebsiteWidgetPage />} />
        <Route path="/lead-magnets/qr-code" element={<QRCodePage />} />
        <Route path="/lead-magnets/:id" element={<LeadMagnetBuilderPage />} />
        <Route path="/chat-bot" element={<ChatBotPage />} />
        <Route path="/chat-bot/:id" element={<ChatBotBuilderPage />} />
        <Route path="/flows" element={<FlowsPage />} />
        <Route path="/integrations" element={<IntegrationsPage />} />
        <Route path="/e-commerce/catalog-setting" element={<CatalogSettingPage />} />
        <Route path="/e-commerce/catalog-management" element={<CatalogManagementPage />} />
        <Route path="/e-commerce/order" element={<OrdersPage />} />
        <Route path="/e-commerce/payment-setup" element={<PaymentSetupPage />} />
        <Route path="/payments/history" element={<PaymentsHistoryPage />} />
        <Route path="/payments/setup" element={<PaymentsSetupPage />} />
        <Route path="/account/setup" element={<AccountPage />} />
        <Route path="/account/settings" element={<AccountPage />} />
        <Route path="/account/billing" element={<AccountBillingPage />} />
        <Route path="/account/message-analytics" element={<AccountMessageAnalyticsPage />} />
        <Route path="/account/api-logs" element={<AccountApiLogsPage />} />
        <Route path="/account/webhooks" element={<AccountWebhooksPage />} />
        <Route path="/account/meta-direct-apis" element={<AccountMetaDirectPage />} />
        <Route path="/account/foundation" element={<AccountFoundationPage />} />
        <Route path="*" element={<GenericPage />} />
      </Routes>
    </DashboardLayout>
  );
}

export default function App() {
  const bootstrapped = useAuthStore((s) => s.bootstrapped);

  useEffect(() => {
    bootstrapAuth();
  }, []);

  if (!bootstrapped) {
    return (
      <div className="grid min-h-screen place-items-center bg-[#f4f7fb] text-sm text-slate-500">
        Loading workspace…
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/capture/:slug" element={<PublicLeadCapturePage />} />
      <Route path="/login" element={<GuestRoute><LoginPage /></GuestRoute>} />
      <Route path="/register" element={<GuestRoute><RegisterPage /></GuestRoute>} />
      <Route path="/onboarding" element={<RequireAuth><OnboardingPage /></RequireAuth>} />
      <Route
        path="/*"
        element={
          <RequireAuth>
            <RequireBusiness>
              <DashboardRoutes />
            </RequireBusiness>
          </RequireAuth>
        }
      />
    </Routes>
  );
}
