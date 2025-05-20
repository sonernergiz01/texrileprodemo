import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import { MobileProvider } from "@/hooks/use-mobile";
import { ProtectedRoute } from "@/lib/protected-route";
import { lazy, Suspense } from "react";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import HomePage from "@/pages/home-page";
import YonetimDashboard from "@/pages/yonetim/dashboard";
import React from 'react';
import { CircleDollarSign, Factory, LineChart } from "lucide-react";
import ProcessTransferPage from "@/pages/weaving/process-transfer";
import FinishingProcessesListPage from "@/pages/finishing/processes-list";
import { FinancialReportPage, ProductionReportPage, SalesReportPage } from "@/pages/yonetim/empty-route";

// Dokuma, İplik ve Kartela için yeni bileşenler
import WeaveProductionCard from "@/pages/weaving/production-card";
import YarnIssueCard from "@/pages/yarn-warehouse/issue-card";
import YarnIssueCards from "@/pages/yarn-warehouse/issue-cards";
import FabricSampleCard from "@/pages/fabric-samples/card";

// Admin pages
import UserManagement from "@/pages/admin/user-management";
import Roles from "@/pages/admin/roles";
import OperatorManagement from "@/pages/admin/operator-management";
// Labels pages
import LabelManagement from "@/pages/labels/label-management";

// Lazy loaded Admin pages
const AdminLabelManagement = lazy(() => import("@/pages/admin/label-management"));
const AdminMachinesManagement = lazy(() => import("@/pages/admin/machines-management"));

// Lazy loaded Kartela pages
const KartelaIndex = lazy(() => import("@/pages/fabric-samples/kartela"));
const KartelaDetails = lazy(() => import("@/pages/fabric-samples/kartela/[id]"));
const KartelaShip = lazy(() => import("@/pages/fabric-samples/kartela/ship"));
const KartelaReports = lazy(() => import("@/pages/fabric-samples/kartela/reports"));
const KartelaQrPrint = lazy(() => import("@/pages/fabric-samples/kartela/qr-print"));

// Lazy loaded Boya Reçeteleri pages
const DyeRecipesList = lazy(() => import("@/pages/dye-recipes/list"));
const DyeRecipeNew = lazy(() => import("@/pages/dye-recipes/new"));
const DyeRecipeDetails = lazy(() => import("@/pages/dye-recipes/detail"));
const DyeRecipeChemicals = lazy(() => import("@/pages/dye-recipes/chemicals"));
const DyeRecipeTemplates = lazy(() => import("@/pages/dye-recipes/templates"));
const DyeRecipeReports = lazy(() => import("@/pages/dye-recipes/reports"));
const DyeRecipePendingAssignments = lazy(() => import("@/pages/dye-recipes/pending-assignments"));

// Sales pages
import Orders from "@/pages/sales/orders";
import CustomerManagement from "@/pages/sales/customer-management";
import SalesReports from "@/pages/sales/reports";
import CrmPage from "@/pages/sales/crm";
import OpportunitiesPage from "@/pages/sales/opportunities";
import PrintOrderPage from "@/pages/sales/print-order";
import OrderDetailsPage from "@/pages/sales/order-details";
// Artık yeni ve basit yeni ALT sipariş sayfası kullanıyoruz
import AddChildOrderPage from "@/pages/sales/add-child-order";
import SampleRequestsPage from "@/pages/sales/sample-requests";

// Production pages
import ScannerPage from "@/pages/production/scanner";
import OrdersListPage from "@/pages/production/orders-list";
import OrderTrackingPage from "@/pages/production/order-tracking";

// Planning pages
import PlanningOrders from "@/pages/planning/orders";
import ProductionSteps from "@/pages/planning/production-steps";
import RouteTemplates from "@/pages/planning/route-templates";
import RouteTemplateSteps from "@/pages/planning/route-template-steps";
import ProductionCards from "@/pages/planning/production-cards";
import TrackingDashboard from "@/pages/planning/tracking-dashboard";
import PlanningGantt from "@/pages/planning/planningGantt";
import AdvancedDashboard from "@/pages/planning/advanced-dashboard";

// Yeni Gelişmiş Planlama Sayfaları - Lazy Loaded
const CapacityPlanning = lazy(() => import("@/pages/planning/capacity-planning"));
const PlanningCalendar = lazy(() => import("@/pages/planning/planning-calendar"));
const SimulationCenter = lazy(() => import("@/pages/planning/simulation-center"));
const KpiManagement = lazy(() => import("@/pages/planning/kpi-management"));
const ProductionOptimization = lazy(() => import("@/pages/planning/production-optimization"));
const LiveMonitoring = lazy(() => import("@/pages/planning/live-monitoring"));

// Quality Control pages
import QualityControlIndex from "@/pages/quality/index";
import QualityControl from "@/pages/quality/control";

// Weaving (Dokuma) pages
import WeavingWorkOrders from "@/pages/weaving/work-orders";
import WarpPreparation from "@/pages/weaving/warp-preparation";
import WeavingMachines from "@/pages/weaving/machines";

// Product Development (ÜRGE) pages
import FabricDesign from "@/pages/product-development/fabric-design";
import WeavePatterns from "@/pages/product-development/weave-patterns";
import FabricTypes from "@/pages/product-development/fabric-types-new";

// Raw Quality Control pages
import QualityInspection from "@/pages/raw-quality/inspection";
import QualityDefects from "@/pages/raw-quality/defects";

// Yarn Spinning pages
import YarnSpinningWorkOrders from "@/pages/yarn-spinning/work-orders";
import YarnSpinningMachines from "@/pages/yarn-spinning/machines";

// Sample Department pages
import SampleRequests from "@/pages/samples/requests";
import SampleTracking from "@/pages/samples/tracking";
import SampleCards from "@/pages/samples/cards";

// Laboratory pages
import YarnTests from "@/pages/laboratory/yarn-tests";
import FabricTests from "@/pages/laboratory/fabric-tests";

// Kartela pages
import FabricSwatches from "@/pages/kartela/fabric-swatches";
import ColorSwatches from "@/pages/kartela/color-swatches";

// Quality Control pages
import FinalInspection from "@/pages/quality-control/final-inspection";
import Issues from "@/pages/quality-control/issues";
import Reports from "@/pages/quality-control/reports";

// Üretim Takip (Production Tracking) pages
import RefakatCardsPage from "@/pages/production-tracking/refakat-cards";
import RefakatCardNewPage from "@/pages/production-tracking/refakat-card-new";
import RefakatCardDetailPage from "@/pages/production-tracking/refakat-card-detail";
import BarcodeScanPage from "@/pages/production-tracking/barcode-scan";

// Yarn Warehouse pages
import YarnInventory from "@/pages/yarn-warehouse/inventory";
import YarnMovements from "@/pages/yarn-warehouse/movements";
import YarnReports from "@/pages/yarn-warehouse/reports";
import YarnTypes from "@/pages/yarn-warehouse/yarn-types";

// Inventory pages
import RawMaterials from "@/pages/inventory/raw-materials";

// Warehouse pages
import WarehouseInventory from "@/pages/warehouse/inventory";
import WarehouseMovements from "@/pages/warehouse/movements";
import WarehouseReports from "@/pages/warehouse/reports";

// Shipment pages
const ShipmentPlanning = lazy(() => import("@/pages/shipment/planning"));
const ShipmentDocuments = lazy(() => import("@/pages/shipment/documents"));
const ShipmentPackaging = lazy(() => import("@/pages/shipment/packaging"));
const ShipmentTracking = lazy(() => import("@/pages/shipment/tracking"));

// Maintenance pages
const Maintenance = lazy(() => import("@/pages/maintenance"));
const MaintenanceCreate = lazy(() => import("@/pages/maintenance/create"));
const MaintenanceDetails = lazy(() => import("@/pages/maintenance/[id]"));
const MaintenanceCreateRequest = lazy(() => import("@/pages/maintenance/create-request"));
const MaintenanceReports = lazy(() => import("@/pages/maintenance/reports"));

// Maintenance Plans pages
const MaintenancePlans = lazy(() => import("@/pages/maintenance/plans"));
const MaintenancePlanCreate = lazy(() => import("@/pages/maintenance/plans/create"));
const MaintenancePlanDetails = lazy(() => import("@/pages/maintenance/plans/[id]"));

// Notification pages
const Notifications = lazy(() => import("@/pages/notifications"));
const NotificationTest = lazy(() => import("@/pages/admin/notification-test"));
const NotificationManagement = lazy(() => import("@/pages/admin/notification-management"));

function Router() {
  return (
    <Switch>
      <Route path="/auth" component={AuthPage} />
      
      {/* Home page route */}
      <ProtectedRoute path="/" component={HomePage} />
      
      {/* Şirket Yönetimi */}
      <ProtectedRoute path="/yonetim" component={YonetimDashboard} />
      <ProtectedRoute path="/yonetim/dashboard" component={YonetimDashboard} />
      <ProtectedRoute path="/yonetim/finansal-rapor" component={FinancialReportPage} />
      <ProtectedRoute path="/yonetim/uretim-raporu" component={ProductionReportPage} />
      <ProtectedRoute path="/yonetim/satis-raporu" component={SalesReportPage} />
      
      {/* Admin routes */}
      <ProtectedRoute path="/admin/users" component={UserManagement} />
      <ProtectedRoute path="/admin/roles" component={Roles} />
      <ProtectedRoute path="/admin/operators" component={OperatorManagement} />
      <ProtectedRoute path="/admin/labels" component={() => (
        <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin h-10 w-10 border-4 border-blue-500 rounded-full border-t-transparent"></div></div>}>
          <AdminLabelManagement />
        </Suspense>
      )} />
      <ProtectedRoute path="/admin/notification-test" component={() => (
        <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin h-10 w-10 border-4 border-blue-500 rounded-full border-t-transparent"></div></div>}>
          <NotificationTest />
        </Suspense>
      )} />
      <ProtectedRoute path="/admin/notification-management" component={() => (
        <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin h-10 w-10 border-4 border-blue-500 rounded-full border-t-transparent"></div></div>}>
          <NotificationManagement />
        </Suspense>
      )} />
      <ProtectedRoute path="/admin/machines-management" component={() => (
        <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin h-10 w-10 border-4 border-blue-500 rounded-full border-t-transparent"></div></div>}>
          <AdminMachinesManagement />
        </Suspense>
      )} />
      
      {/* Sales routes */}
      <ProtectedRoute path="/sales/orders" component={Orders} />
      <ProtectedRoute path="/sales/orders/:id" component={OrderDetailsPage} />  
      <ProtectedRoute path="/sales/add-child-order" component={AddChildOrderPage} />
      <ProtectedRoute path="/sales/customers" component={CustomerManagement} />
      <ProtectedRoute path="/sales/crm" component={CrmPage} />
      <ProtectedRoute path="/sales/opportunities" component={OpportunitiesPage} />
      <ProtectedRoute path="/sales/reports" component={SalesReports} />
      <ProtectedRoute path="/sales/print-order/:id" component={PrintOrderPage} />
      <ProtectedRoute path="/sales/sample-requests" component={SampleRequestsPage} />
      
      {/* Planning routes - Dünya Standartları */}
      <ProtectedRoute path="/planning/advanced-dashboard" component={AdvancedDashboard} />
      <ProtectedRoute path="/planning/gantt" component={PlanningGantt} />
      <ProtectedRoute path="/planning/templates" component={RouteTemplates} />
      <ProtectedRoute path="/planning/templates/:id/steps" component={RouteTemplateSteps} />
      
      {/* Yeni Gelişmiş Planlama Sayfaları */}
      <ProtectedRoute path="/planning/capacity" component={() => (
        <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin h-10 w-10 border-4 border-blue-500 rounded-full border-t-transparent"></div></div>}>
          <CapacityPlanning />
        </Suspense>
      )} />
      <ProtectedRoute path="/planning/calendar" component={() => (
        <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin h-10 w-10 border-4 border-blue-500 rounded-full border-t-transparent"></div></div>}>
          <PlanningCalendar />
        </Suspense>
      )} />
      <ProtectedRoute path="/planning/simulation" component={() => (
        <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin h-10 w-10 border-4 border-blue-500 rounded-full border-t-transparent"></div></div>}>
          <SimulationCenter />
        </Suspense>
      )} />
      <ProtectedRoute path="/planning/kpis" component={() => (
        <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin h-10 w-10 border-4 border-blue-500 rounded-full border-t-transparent"></div></div>}>
          <KpiManagement />
        </Suspense>
      )} />
      <ProtectedRoute path="/planning/optimization" component={() => (
        <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin h-10 w-10 border-4 border-blue-500 rounded-full border-t-transparent"></div></div>}>
          <ProductionOptimization />
        </Suspense>
      )} />
      <ProtectedRoute path="/planning/monitoring" component={() => (
        <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin h-10 w-10 border-4 border-blue-500 rounded-full border-t-transparent"></div></div>}>
          <LiveMonitoring />
        </Suspense>
      )} />
      
      {/* Eski rotalar erişim için geçici olarak tutuldu */}
      <ProtectedRoute path="/planning/orders" component={PlanningOrders} />
      <ProtectedRoute path="/planning/production-steps/:planId?" component={ProductionSteps} />
      <ProtectedRoute path="/planning/production-cards" component={ProductionCards} />
      <ProtectedRoute path="/planning/tracking-dashboard" component={TrackingDashboard} />
      <ProtectedRoute path="/planning/planningGantt" component={PlanningGantt} />
      
      {/* Planlama routes (Türkçe) */}
      <ProtectedRoute path="/planlama/gantt" component={PlanningGantt} />
      <ProtectedRoute path="/planlama/gelismis-dashboard" component={AdvancedDashboard} />
      
      {/* Weaving (Dokuma) routes */}
      <ProtectedRoute path="/weaving/work-orders" component={WeavingWorkOrders} />
      <ProtectedRoute path="/weaving/warp-preparation" component={WarpPreparation} />
      <ProtectedRoute path="/weaving/machines" component={WeavingMachines} />
      <ProtectedRoute path="/weaving/production-card" component={WeaveProductionCard} />
      <ProtectedRoute path="/weaving/production-card/:id" component={WeaveProductionCard} />
      <ProtectedRoute path="/weaving/process-transfer/:id" component={ProcessTransferPage} />
      
      {/* Finishing (Terbiye/Apre) routes */}
      <ProtectedRoute path="/finishing/processes" component={FinishingProcessesListPage} />
      
      {/* Product Development (ÜRGE) routes */}
      <ProtectedRoute path="/product-development/fabric-design" component={FabricDesign} />
      <ProtectedRoute path="/product-development/weave-patterns" component={WeavePatterns} />
      <ProtectedRoute path="/product-development/fabric-types" component={FabricTypes} />
      
      {/* Raw Quality Control routes */}
      <ProtectedRoute path="/raw-quality/inspection" component={QualityInspection} />
      <ProtectedRoute path="/raw-quality/defects" component={QualityDefects} />
      
      {/* Yarn Spinning routes */}
      <ProtectedRoute path="/yarn-spinning/work-orders" component={YarnSpinningWorkOrders} />
      <ProtectedRoute path="/yarn-spinning/machines" component={YarnSpinningMachines} />
      <ProtectedRoute path="/yarn-spinning/twisting-orders" component={React.lazy(() => import('./pages/yarn-spinning/twisting-orders'))} />
      <ProtectedRoute path="/yarn-spinning/twisting-orders/new" component={React.lazy(() => import('./pages/yarn-spinning/new-twisting-order'))} />
      <ProtectedRoute path="/yarn-spinning/twisting-orders/edit/:id" component={React.lazy(() => import('./pages/yarn-spinning/edit-twisting-order'))} />
      
      {/* Sample Department routes */}
      <ProtectedRoute path="/samples/requests" component={SampleRequests} />
      <ProtectedRoute path="/samples/tracking" component={SampleTracking} />
      <ProtectedRoute path="/samples/cards" component={SampleCards} />
      
      {/* Laboratory routes */}
      <ProtectedRoute path="/laboratory/yarn-tests" component={YarnTests} />
      <ProtectedRoute path="/laboratory/fabric-tests" component={FabricTests} />
      
      {/* Kartela routes */}
      <ProtectedRoute path="/kartela/fabric-swatches" component={FabricSwatches} />
      <ProtectedRoute path="/kartela/color-swatches" component={ColorSwatches} />
      <ProtectedRoute path="/fabric-samples/card" component={FabricSampleCard} />
      <ProtectedRoute path="/fabric-samples/card/:id" component={FabricSampleCard} />
      
      {/* Yeni Kartela Modülü Routes */}
      <ProtectedRoute path="/fabric-samples/kartela/ship" component={() => (
        <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin h-10 w-10 border-4 border-blue-500 rounded-full border-t-transparent"></div></div>}>
          <KartelaShip />
        </Suspense>
      )} />
      <ProtectedRoute path="/fabric-samples/kartela/reports" component={() => (
        <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin h-10 w-10 border-4 border-blue-500 rounded-full border-t-transparent"></div></div>}>
          <KartelaReports />
        </Suspense>
      )} />
      <ProtectedRoute path="/fabric-samples/kartela/qr-print" component={() => (
        <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin h-10 w-10 border-4 border-blue-500 rounded-full border-t-transparent"></div></div>}>
          <KartelaQrPrint />
        </Suspense>
      )} />
      <ProtectedRoute path="/fabric-samples/kartela/:id" component={() => (
        <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin h-10 w-10 border-4 border-blue-500 rounded-full border-t-transparent"></div></div>}>
          <KartelaDetails />
        </Suspense>
      )} />
      <ProtectedRoute path="/fabric-samples/kartela" component={() => (
        <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin h-10 w-10 border-4 border-blue-500 rounded-full border-t-transparent"></div></div>}>
          <KartelaIndex />
        </Suspense>
      )} />
      
      {/* Quality Control routes */}
      <ProtectedRoute path="/quality" component={QualityControlIndex} />
      <ProtectedRoute path="/quality/control" component={QualityControl} />
      <ProtectedRoute path="/quality/control/:id" component={QualityControl} />
      <ProtectedRoute path="/quality/final-inspection" component={FinalInspection} />
      <ProtectedRoute path="/quality/issues" component={Issues} />
      <ProtectedRoute path="/quality/reports" component={Reports} />
      
      {/* Boya Reçeteleri routes */}
      <ProtectedRoute path="/dye-recipes/list" component={() => (
        <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin h-10 w-10 border-4 border-blue-500 rounded-full border-t-transparent"></div></div>}>
          <DyeRecipesList />
        </Suspense>
      )} />
      
      {/* Üretim Takip (Production Tracking) routes */}
      <ProtectedRoute path="/production-tracking/refakat-cards" component={RefakatCardsPage} />
      <ProtectedRoute path="/production-tracking/refakat-cards/:id" component={RefakatCardDetailPage} />
      <ProtectedRoute path="/production-tracking/refakat-card-new" component={RefakatCardNewPage} />
      <ProtectedRoute path="/production-tracking/barcode-scan" component={BarcodeScanPage} />
      <ProtectedRoute path="/dye-recipes/new" component={() => (
        <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin h-10 w-10 border-4 border-blue-500 rounded-full border-t-transparent"></div></div>}>
          <DyeRecipeNew />
        </Suspense>
      )} />
      <ProtectedRoute path="/dye-recipes/chemicals" component={() => (
        <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin h-10 w-10 border-4 border-blue-500 rounded-full border-t-transparent"></div></div>}>
          <DyeRecipeChemicals />
        </Suspense>
      )} />
      <ProtectedRoute path="/dye-recipes/templates" component={() => (
        <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin h-10 w-10 border-4 border-blue-500 rounded-full border-t-transparent"></div></div>}>
          <DyeRecipeTemplates />
        </Suspense>
      )} />
      <ProtectedRoute path="/dye-recipes/reports" component={() => (
        <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin h-10 w-10 border-4 border-blue-500 rounded-full border-t-transparent"></div></div>}>
          <DyeRecipeReports />
        </Suspense>
      )} />
      <ProtectedRoute path="/dye-recipes/pending-assignments" component={() => (
        <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin h-10 w-10 border-4 border-blue-500 rounded-full border-t-transparent"></div></div>}>
          <DyeRecipePendingAssignments />
        </Suspense>
      )} />
      <ProtectedRoute path="/dye-recipes/:id" component={() => (
        <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin h-10 w-10 border-4 border-blue-500 rounded-full border-t-transparent"></div></div>}>
          <DyeRecipeDetails />
        </Suspense>
      )} />
      
      {/* Yarn Warehouse routes */}
      <ProtectedRoute path="/yarn-warehouse/inventory" component={YarnInventory} />
      <ProtectedRoute path="/yarn-warehouse/movements" component={YarnMovements} />
      <ProtectedRoute path="/yarn-warehouse/reports" component={YarnReports} />
      <ProtectedRoute path="/yarn-warehouse/yarn-types" component={YarnTypes} />
      <ProtectedRoute path="/yarn-warehouse/issue-card" component={YarnIssueCard} />
      <ProtectedRoute path="/yarn-warehouse/issue-card/:id" component={YarnIssueCard} />
      <ProtectedRoute path="/yarn-warehouse/issue-cards" component={YarnIssueCards} />
      <ProtectedRoute path="/yarn-warehouse/issue-cards/:id" component={YarnIssueCard} />
      
      {/* Inventory routes */}
      <ProtectedRoute path="/inventory/raw-materials" component={RawMaterials} />
      
      {/* Warehouse routes */}
      <ProtectedRoute path="/warehouse/inventory" component={WarehouseInventory} />
      <ProtectedRoute path="/warehouse/movements" component={WarehouseMovements} />
      <ProtectedRoute path="/warehouse/reports" component={WarehouseReports} />
      
      {/* Shipment routes */}
      <ProtectedRoute path="/shipment/planning" component={() => (
        <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin h-10 w-10 border-4 border-blue-500 rounded-full border-t-transparent"></div></div>}>
          <ShipmentPlanning />
        </Suspense>
      )} />
      <ProtectedRoute path="/shipment/documents" component={() => (
        <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin h-10 w-10 border-4 border-blue-500 rounded-full border-t-transparent"></div></div>}>
          <ShipmentDocuments />
        </Suspense>
      )} />
      <ProtectedRoute path="/shipment/packaging" component={() => (
        <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin h-10 w-10 border-4 border-blue-500 rounded-full border-t-transparent"></div></div>}>
          <ShipmentPackaging />
        </Suspense>
      )} />
      <ProtectedRoute path="/shipment/tracking" component={() => (
        <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin h-10 w-10 border-4 border-blue-500 rounded-full border-t-transparent"></div></div>}>
          <ShipmentTracking />
        </Suspense>
      )} />
      
      {/* Labels Management routes */}
      <ProtectedRoute path="/labels/management" component={LabelManagement} />
      
      {/* Maintenance routes */}
      <ProtectedRoute path="/maintenance" component={() => (
        <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin h-10 w-10 border-4 border-blue-500 rounded-full border-t-transparent"></div></div>}>
          <Maintenance />
        </Suspense>
      )} />
      <ProtectedRoute path="/maintenance/create" component={() => (
        <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin h-10 w-10 border-4 border-blue-500 rounded-full border-t-transparent"></div></div>}>
          <MaintenanceCreate />
        </Suspense>
      )} />
      <ProtectedRoute path="/maintenance/create-request" component={() => (
        <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin h-10 w-10 border-4 border-blue-500 rounded-full border-t-transparent"></div></div>}>
          <MaintenanceCreateRequest />
        </Suspense>
      )} />
      <ProtectedRoute path="/maintenance/reports" component={() => (
        <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin h-10 w-10 border-4 border-blue-500 rounded-full border-t-transparent"></div></div>}>
          <MaintenanceReports />
        </Suspense>
      )} />
      
      {/* Maintenance Plans routes */}
      <ProtectedRoute path="/maintenance/plans" component={() => (
        <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin h-10 w-10 border-4 border-blue-500 rounded-full border-t-transparent"></div></div>}>
          <MaintenancePlans />
        </Suspense>
      )} />
      <ProtectedRoute path="/maintenance/plans/create" component={() => (
        <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin h-10 w-10 border-4 border-blue-500 rounded-full border-t-transparent"></div></div>}>
          <MaintenancePlanCreate />
        </Suspense>
      )} />
      <ProtectedRoute path="/maintenance/plans/:id" component={() => (
        <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin h-10 w-10 border-4 border-blue-500 rounded-full border-t-transparent"></div></div>}>
          <MaintenancePlanDetails />
        </Suspense>
      )} />
      
      {/* Maintenance Details route - Bu route'u en sona taşıdık ki özel adlar (:id parametresi olarak yorumlanmasın) */}
      <ProtectedRoute path="/maintenance/:id" component={() => (
        <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin h-10 w-10 border-4 border-blue-500 rounded-full border-t-transparent"></div></div>}>
          <MaintenanceDetails />
        </Suspense>
      )} />
      
      {/* Notifications routes */}
      <ProtectedRoute path="/notifications" component={() => (
        <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin h-10 w-10 border-4 border-blue-500 rounded-full border-t-transparent"></div></div>}>
          <Notifications />
        </Suspense>
      )} />
      
      {/* Production routes */}
      <ProtectedRoute path="/production/scanner" component={ScannerPage} />
      <ProtectedRoute path="/production/orders" component={OrdersListPage} />
      <ProtectedRoute path="/production/order-tracking/:id" component={OrderTrackingPage} />
      
      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  // Oturum kontrolünü App bileşeni içinde değil, Router içinde yapmalıyız
  // Döngüye girmemek için geçici yönlendirmeyi kaldırıyoruz

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <MobileProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </MobileProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
