"use client";

import { useState, useEffect, lazy, Suspense } from "react";
import { useAdmin } from "@/contexts/AdminContext";
import { useIsMobile } from "@/hooks/useMobileDetect";
import { useDarkMode } from "@/hooks/useDarkMode";
import {
  Menu,
  Settings,
  MessageSquare,
  BookOpen,
  LogOut,
  Shield,
  AlertTriangle,
  Gift,
  Package,
  ShoppingCart,
  Users,
  Tag,
  BarChart3,
  Cog,
  Megaphone,
  Star,
  FileText,
  Store,
  Layout,
  Mail,
  Wrench,
  ClipboardList,
  PanelLeft,
  Truck,
  HardDrive,
  Sparkles,
  Trash2,
  Code,
  Calendar,
  Brain,
  Loader2,
  Bell,
  History,
  Workflow,
  Moon,
  Sun,
} from "lucide-react";
import AdminSidebar from "./AdminSidebar";

// Lazy load heavy admin components for code splitting
const ContactSubmissions = lazy(() => import("./ContactSubmissions"));
const StoryManagement = lazy(() => import("./StoryManagement"));
const SurveyManagement = lazy(() => import("./SurveyManagement"));
const ProductManagement = lazy(() => import("./ProductManagement"));
const ProductInquiryJobs = lazy(() => import("./ProductInquiryJobs"));
const OrderManagement = lazy(() => import("./OrderManagement"));
const OrderFulfillment = lazy(() => import("./OrderFulfillment"));
const CustomerManagement = lazy(() => import("./CustomerManagement"));
const ReviewManagement = lazy(() => import("./ReviewManagement"));
const DiscountManagement = lazy(() => import("./DiscountManagement"));
const AnalyticsDashboard = lazy(() => import("./AnalyticsDashboard"));
const SettingsPanel = lazy(() => import("./SettingsPanel"));
const PromotionsManagement = lazy(() => import("./PromotionsManagement"));
const BlogManagement = lazy(() => import("./BlogManagement"));
const AdminSettings = lazy(() => import("./AdminSettings"));
const AutomationsManagement = lazy(() => import("./AutomationsManagement"));
const FileManagement = lazy(() => import("./FileManagement"));
const EventManagement = lazy(() => import("./EventManagement"));
const EventEditor = lazy(() => import("./EventEditor"));
const EventBookings = lazy(() => import("./EventBookings"));
const EventFormsManagement = lazy(() => import("./EventFormsManagement"));
const EventFormEditor = lazy(() => import("./EventFormEditor"));
const ProductImageAnalyzer = lazy(() => import("./ProductImageAnalyzer"));
const NotificationPreferences = lazy(() => import("./NotificationPreferences"));
const NotificationLogs = lazy(() => import("./NotificationLogs"));
const AgendaManagement = lazy(() => import("./AgendaManagement"));
const SocialCalendar = lazy(() => import("./SocialCalendar"));
const MobileAppShell = lazy(() => import("./mobile/MobileAppShell"));

// Loading fallback component
function ComponentLoader() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="flex flex-col items-center space-y-3">
        <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
        <p className="text-gray-600 dark:text-slate-400">Loading...</p>
      </div>
    </div>
  );
}

type AdminSection =
  | "dashboard"
  | "agenda"
  | "products"
  | "product-inquiries"
  | "orders"
  | "fulfillment"
  | "shipping-guide"
  | "customers"
  | "discounts"
  | "promotions"
  | "blog"
  | "automations"
  | "social-calendar"
  | "files"
  | "contacts"
  | "stories"
  | "survey"
  | "settings"
  | "admin-settings"
  | "reviews"
  | "events"
  | "event-editor"
  | "event-bookings"
  | "event-forms"
  | "event-form-editor"
  | "image-analyzer"
  | "notification-preferences"
  | "notification-logs";

// Access Denied component for unauthorized sections
function AccessDenied() {
  return (
    <div className="flex flex-col items-center justify-center h-64 text-center">
      <Shield className="h-16 w-16 text-red-400 mb-4" />
      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
        Access Denied
      </h2>
      <p className="text-gray-600 dark:text-gray-400">
        You don't have permission to access this section.
      </p>
    </div>
  );
}

interface Notification {
  id: string;
  type: string;
  title?: string;
  message: string;
  created_at: string;
  read: boolean;
  metadata?: any;
}

export default function AdminDashboard() {
  const [activeSection, setActiveSection] = useState<AdminSection>("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [eventEditorId, setEventEditorId] = useState<string | undefined>(
    undefined,
  );
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const {
    logout,
    isMaintenanceMode,
    user,
    isSuperAdmin,
    hasPermission,
    isDeveloper,
  } = useAdmin();
  const isMobile = useIsMobile();
  const { isDarkMode, toggleDarkMode } = useDarkMode();

  // Read URL parameters on mount and when URL changes
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);

      // Read section parameter
      const section = params.get("section");
      if (section && section !== activeSection) {
        setActiveSection(section as AdminSection);
      }

      // Read id parameter for event editor
      const id = params.get("id");
      setEventEditorId(id || undefined);
    }
  }, []);

  // Listen for URL changes (for navigation within admin panel)
  useEffect(() => {
    const handleUrlChange = () => {
      if (typeof window !== "undefined") {
        const params = new URLSearchParams(window.location.search);

        const section = params.get("section");
        if (section && section !== activeSection) {
          setActiveSection(section as AdminSection);
        }

        const id = params.get("id");
        setEventEditorId(id || undefined);
      }
    };

    window.addEventListener("popstate", handleUrlChange);
    return () => window.removeEventListener("popstate", handleUrlChange);
  }, [activeSection]);

  // Listen for custom navigation events from settings quick links
  useEffect(() => {
    const handleAdminNavigate = (e: CustomEvent<string>) => {
      const section = e.detail;
      if (section) {
        setActiveSection(section as AdminSection);
        // Update URL
        const url = new URL(window.location.href);
        url.searchParams.set("section", section);
        window.history.pushState({}, "", url.toString());
      }
    };

    window.addEventListener(
      "admin-navigate",
      handleAdminNavigate as EventListener,
    );
    return () =>
      window.removeEventListener(
        "admin-navigate",
        handleAdminNavigate as EventListener,
      );
  }, []);

  // Close sidebar on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSidebarOpen(false);
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, []);

  const handleLogout = async () => {
    if (confirm("Are you sure you want to logout?")) {
      await logout();
    }
  };

  const fetchNotifications = async () => {
    setNotificationsLoading(true);
    try {
      const response = await fetch("/api/admin/notifications?limit=10", {
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications || []);
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setNotificationsLoading(false);
    }
  };

  useEffect(() => {
    if (showNotifications) {
      fetchNotifications();
    }
  }, [showNotifications]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  // Standalone items (always visible, not in groups)
  const standaloneItems = [
    {
      id: "dashboard" as AdminSection,
      label: "Dashboard",
      icon: BarChart3,
    },
    {
      id: "agenda" as AdminSection,
      label: "Team Agenda",
      icon: Calendar,
    },
  ];

  // Grouped sidebar items
  const sidebarGroups = [
    {
      id: "store",
      label: "Store Management",
      icon: Store,
      defaultOpen: true,
      items: [
        {
          id: "orders" as AdminSection,
          label: "All Orders",
          icon: ShoppingCart,
        },
        {
          id: "products" as AdminSection,
          label: "Products",
          icon: Package,
        },
        {
          id: "customers" as AdminSection,
          label: "Customers",
          icon: Users,
        },
        {
          id: "reviews" as AdminSection,
          label: "Reviews",
          icon: Star,
        },
        {
          id: "discounts" as AdminSection,
          label: "Discounts",
          icon: Tag,
        },
        {
          id: "promotions" as AdminSection,
          label: "Promotions Hub",
          icon: Megaphone,
        },
      ],
    },
    {
      id: "shipping",
      label: "Shipping & Fulfillment",
      icon: Truck,
      defaultOpen: false,
      items: [
        {
          id: "fulfillment" as AdminSection,
          label: "Order Fulfillment",
          icon: ClipboardList,
        },
      ],
    },
    {
      id: "website",
      label: "Content & Marketing",
      icon: Layout,
      defaultOpen: false,
      items: [
        {
          id: "social-calendar" as AdminSection,
          label: "Social Media Calendar",
          icon: Calendar,
        },
        {
          id: "automations" as AdminSection,
          label: "Automations & Workflows",
          icon: Workflow,
        },
        {
          id: "blog" as AdminSection,
          label: "Blog Posts",
          icon: FileText,
        },
      ],
    },
    {
      id: "engagement",
      label: "Customer Engagement",
      icon: MessageSquare,
      defaultOpen: false,
      items: [
        {
          id: "stories" as AdminSection,
          label: "Customer Stories",
          icon: BookOpen,
        },
        {
          id: "contacts" as AdminSection,
          label: "Contact Forms",
          icon: MessageSquare,
        },
        {
          id: "survey" as AdminSection,
          label: "Survey & Newsletter",
          icon: Gift,
        },
      ],
    },
    {
      id: "events",
      label: "Events",
      icon: Calendar,
      defaultOpen: false,
      items: [
        {
          id: "events" as AdminSection,
          label: "All Events",
          icon: Calendar,
        },
        {
          id: "event-bookings" as AdminSection,
          label: "Bookings",
          icon: ClipboardList,
        },
        {
          id: "event-forms" as AdminSection,
          label: "Forms",
          icon: FileText,
        },
      ],
    },
    {
      id: "system",
      label: "Settings",
      icon: Cog,
      defaultOpen: false,
      items: [
        {
          id: "settings" as AdminSection,
          label: "Store Settings",
          icon: Cog,
        },
        {
          id: "admin-settings" as AdminSection,
          label: "Admin Settings",
          icon: Settings,
          badge: isMaintenanceMode ? "MAINT" : undefined,
          badgeColor: isMaintenanceMode ? "bg-red-500" : undefined,
        },
        {
          id: "notification-preferences" as AdminSection,
          label: "Notifications",
          icon: Bell,
        },
        {
          id: "notification-logs" as AdminSection,
          label: "Notification Logs",
          icon: History,
        },
        {
          id: "files" as AdminSection,
          label: "File Management",
          icon: HardDrive,
        },
      ],
    },
    // Developer Tools - Super Admin or Developer sub-level only
    ...(isSuperAdmin || isDeveloper
      ? [
          {
            id: "developer",
            label: "Developer Tools",
            icon: Code,
            defaultOpen: false,
            superAdminOnly: true,
            items: [
              {
                id: "product-inquiries" as AdminSection,
                label: "Product Inquiry Jobs",
                icon: ClipboardList,
              },
              {
                id: "image-analyzer" as AdminSection,
                label: "AI Image Analyzer",
                icon: Brain,
                badge: "BETA",
                badgeColor: "bg-amber-500",
              },
            ],
          },
        ]
      : []),
  ];

  // Sections that require Super Admin or Developer access
  const developerSections: AdminSection[] = [
    "product-inquiries",
    "image-analyzer",
  ];

  const renderContent = () => {
    // Check if section requires Super Admin or Developer access
    if (
      developerSections.includes(activeSection) &&
      !isSuperAdmin &&
      !isDeveloper
    ) {
      return <AccessDenied />;
    }

    // Get the component to render
    const getComponent = () => {
      switch (activeSection) {
        case "dashboard":
          return <AnalyticsDashboard />;
        case "agenda":
          return <AgendaManagement />;
        case "social-calendar":
          return <SocialCalendar />;
        case "products":
          return <ProductManagement />;
        case "product-inquiries":
          return <ProductInquiryJobs />;
        case "fulfillment":
          return <OrderFulfillment />;
        case "orders":
          return <OrderManagement />;
        case "customers":
          return <CustomerManagement />;
        case "reviews":
          return <ReviewManagement />;
        case "discounts":
          return <DiscountManagement />;
        case "promotions":
          return <PromotionsManagement />;
        case "automations":
          return <AutomationsManagement />;
        case "blog":
          return <BlogManagement />;
        case "files":
          return <FileManagement />;
        case "image-analyzer":
          return <ProductImageAnalyzer />;
        case "contacts":
          return <ContactSubmissions />;
        case "survey":
          return <SurveyManagement />;
        case "stories":
          return <StoryManagement />;
        case "settings":
          return <SettingsPanel />;
        case "admin-settings":
          return <AdminSettings />;
        case "events":
          return <EventManagement />;
        case "event-editor":
          return (
            <EventEditor
              eventId={eventEditorId}
              onSave={() => setActiveSection("events")}
              onCancel={() => setActiveSection("events")}
            />
          );
        case "event-bookings":
          return <EventBookings />;
        case "event-forms":
          return <EventFormsManagement />;
        case "event-form-editor":
          return (
            <EventFormEditor
              formId={eventEditorId}
              onSave={() => setActiveSection("event-forms")}
              onCancel={() => setActiveSection("event-forms")}
            />
          );
        case "notification-preferences":
          return <NotificationPreferences />;
        case "notification-logs":
          return <NotificationLogs />;
        default:
          return <AnalyticsDashboard />;
      }
    };

    // Wrap lazy-loaded components with Suspense
    return <Suspense fallback={<ComponentLoader />}>{getComponent()}</Suspense>;
  };

  // Render mobile app shell on mobile devices
  if (isMobile) {
    return (
      <Suspense fallback={<ComponentLoader />}>
        <MobileAppShell
          activeSection={activeSection}
          onSectionChange={setActiveSection}
          renderDesktopContent={renderContent}
        />
      </Suspense>
    );
  }

  // Desktop layout
  return (
    <div className="h-screen bg-slate-50 dark:bg-slate-900 flex flex-col">
      {/* Header */}
      <header className="bg-white dark:bg-slate-800 shadow-sm border-b border-slate-200 dark:border-slate-700 z-40 flex-shrink-0">
        <div className="px-3 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 sm:space-x-4">
              {/* Mobile Menu Toggle */}
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                aria-label="Open menu"
              >
                <PanelLeft className="h-5 w-5 text-slate-600 dark:text-slate-300" />
              </button>

              <div className="flex items-center space-x-2 sm:space-x-3">
                <div className="p-1.5 sm:p-2 bg-teal-100 dark:bg-teal-900/30 rounded-lg">
                  <Shield className="h-5 w-5 sm:h-6 sm:w-6 text-teal-600 dark:text-teal-400" />
                </div>
                <div>
                  <h1 className="text-sm sm:text-lg font-bold text-slate-900 dark:text-slate-100">
                    <span className="hidden sm:inline">Kind Kandles Admin</span>
                    <span className="sm:hidden">Admin</span>
                  </h1>
                  <p className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">
                    Manage your store
                  </p>
                </div>
              </div>
              {isMaintenanceMode && (
                <div className="flex items-center space-x-1 sm:space-x-2 bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full">
                  <AlertTriangle className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="text-xs sm:text-sm font-medium hidden sm:inline">
                    Maintenance Mode
                  </span>
                  <span className="text-xs sm:hidden">MAINT</span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              {/* Dark Mode Toggle */}
              <button
                onClick={toggleDarkMode}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                title={
                  isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"
                }
              >
                {isDarkMode ? (
                  <Sun className="h-5 w-5 text-slate-600 dark:text-slate-300" />
                ) : (
                  <Moon className="h-5 w-5 text-slate-600 dark:text-slate-300" />
                )}
              </button>

              {/* Notification Bell */}
              <div className="relative">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                  title="Notifications"
                >
                  <Bell className="h-5 w-5 text-slate-600 dark:text-slate-300" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full"></span>
                  )}
                </button>

                {/* Notifications Dropdown */}
                {showNotifications && (
                  <>
                    {/* Backdrop */}
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setShowNotifications(false)}
                    />

                    {/* Dropdown Menu */}
                    <div className="absolute right-0 top-full mt-2 w-96 max-w-[calc(100vw-2rem)] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl z-50 max-h-[500px] flex flex-col">
                      {/* Header */}
                      <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
                        <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                          Notifications
                        </h3>
                        {unreadCount > 0 && (
                          <span className="px-2 py-0.5 text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 rounded-full">
                            {unreadCount} new
                          </span>
                        )}
                      </div>

                      {/* Notifications List */}
                      <div className="flex-1 overflow-y-auto">
                        {notificationsLoading ? (
                          <div className="flex items-center justify-center py-8">
                            <Loader2 className="h-6 w-6 animate-spin text-teal-600" />
                          </div>
                        ) : notifications.length === 0 ? (
                          <div className="flex flex-col items-center justify-center py-8 px-4">
                            <Bell className="h-12 w-12 text-slate-300 dark:text-slate-600 mb-3" />
                            <p className="text-sm text-slate-500 dark:text-slate-400 text-center">
                              No notifications yet
                            </p>
                          </div>
                        ) : (
                          <div className="divide-y divide-slate-200 dark:divide-slate-700">
                            {notifications.map((notification) => (
                              <div
                                key={notification.id}
                                className={`px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors ${
                                  !notification.read
                                    ? "bg-blue-50 dark:bg-blue-900/10"
                                    : ""
                                }`}
                              >
                                <div className="flex items-start gap-3">
                                  <div
                                    className={`p-2 rounded-lg flex-shrink-0 ${
                                      notification.type === "error"
                                        ? "bg-red-100 dark:bg-red-900/30"
                                        : notification.type === "success"
                                          ? "bg-green-100 dark:bg-green-900/30"
                                          : notification.type === "warning"
                                            ? "bg-amber-100 dark:bg-amber-900/30"
                                            : "bg-blue-100 dark:bg-blue-900/30"
                                    }`}
                                  >
                                    <Bell
                                      className={`h-4 w-4 ${
                                        notification.type === "error"
                                          ? "text-red-600 dark:text-red-400"
                                          : notification.type === "success"
                                            ? "text-green-600 dark:text-green-400"
                                            : notification.type === "warning"
                                              ? "text-amber-600 dark:text-amber-400"
                                              : "text-blue-600 dark:text-blue-400"
                                      }`}
                                    />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    {notification.title && (
                                      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-1">
                                        {notification.title}
                                      </p>
                                    )}
                                    <p className="text-sm text-slate-700 dark:text-slate-300">
                                      {notification.message}
                                    </p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                      {new Date(
                                        notification.created_at,
                                      ).toLocaleString()}
                                    </p>
                                  </div>
                                  {!notification.read && (
                                    <div className="h-2 w-2 bg-blue-500 rounded-full flex-shrink-0 mt-2"></div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Footer */}
                      {notifications.length > 0 && (
                        <div className="px-4 py-3 border-t border-slate-200 dark:border-slate-700">
                          <button
                            onClick={() => {
                              setActiveSection("notification-logs");
                              setShowNotifications(false);
                            }}
                            className="w-full text-sm text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 font-medium"
                          >
                            View all notifications
                          </button>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <AdminSidebar
          groups={sidebarGroups}
          standaloneItems={standaloneItems}
          activeSection={activeSection}
          onSectionChange={setActiveSection}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          user={user}
          onLogout={handleLogout}
        />

        {/* Main Content */}
        <main className="flex-1 p-3 sm:p-4 lg:p-6 overflow-y-auto">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}
