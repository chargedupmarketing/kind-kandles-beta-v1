"use client";

import { useState, useEffect, ReactNode, lazy, Suspense } from "react";
import { useAdmin } from "@/contexts/AdminContext";
import { useDarkMode } from "@/hooks/useDarkMode";
import BottomTabBar from "./BottomTabBar";
import MobileDashboard from "./MobileDashboard";
import MobileProducts from "./MobileProducts";
import MobileShippingGuide from "./MobileShippingGuide";
import MoreMenu from "./MoreMenu";
import MobileOrders from "./MobileOrders";
import {
  Shield,
  AlertTriangle,
  LogOut,
  Bell,
  User,
  Moon,
  Sun,
  Loader2,
} from "lucide-react";

// Lazy load desktop components for stories and fulfillment
const StoryManagement = lazy(() => import("../StoryManagement"));
const OrderFulfillment = lazy(() => import("../OrderFulfillment"));
const SocialCalendarMobile = lazy(() => import("./SocialCalendarMobile"));

export type MobileTab =
  | "dashboard"
  | "fulfillment"
  | "products"
  | "stories"
  | "more";
export type AdminSection =
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

interface Notification {
  id: string;
  notification_type: string;
  recipient_email: string;
  subject: string;
  status: string;
  channel: string;
  created_at: string;
  error_message?: string;
}

interface MobileAppShellProps {
  children?: ReactNode;
  activeSection: AdminSection;
  onSectionChange: (section: AdminSection) => void;
  renderDesktopContent: () => ReactNode;
}

export default function MobileAppShell({
  activeSection,
  onSectionChange,
  renderDesktopContent,
}: MobileAppShellProps) {
  const [activeTab, setActiveTab] = useState<MobileTab>("dashboard");
  const [pendingOrderCount, setPendingOrderCount] = useState(0);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const { logout, isMaintenanceMode, user } = useAdmin();
  const { isDarkMode, toggleDarkMode } = useDarkMode();

  // Map sections to tabs
  useEffect(() => {
    if (activeSection === "dashboard") setActiveTab("dashboard");
    else if (activeSection === "fulfillment") setActiveTab("fulfillment");
    else if (activeSection === "products") setActiveTab("products");
    else if (activeSection === "stories") setActiveTab("stories");
    else setActiveTab("more");
  }, [activeSection]);

  // Fetch pending order count
  useEffect(() => {
    const fetchPendingOrders = async () => {
      try {
        const response = await fetch("/api/orders?status=pending&limit=1", {
          headers: { Authorization: "Bearer admin-token" },
        });
        const data = await response.json();
        setPendingOrderCount(data.total || 0);
      } catch (error) {
        console.error("Error fetching pending orders:", error);
      }
    };

    fetchPendingOrders();
    const interval = setInterval(fetchPendingOrders, 30000);
    return () => clearInterval(interval);
  }, []);

  // Fetch notifications when popup opens
  useEffect(() => {
    if (showNotifications) {
      const fetchNotifications = async () => {
        setNotificationsLoading(true);
        try {
          const response = await fetch(
            "/api/admin/notifications/logs?limit=10",
            {
              credentials: "include",
            },
          );
          if (response.ok) {
            const data = await response.json();
            setNotifications(data.logs || []);
          }
        } catch (error) {
          console.error("Error fetching notifications:", error);
        } finally {
          setNotificationsLoading(false);
        }
      };
      fetchNotifications();
    }
  }, [showNotifications]);

  const handleTabChange = (tab: MobileTab) => {
    setActiveTab(tab);
    // Map tab to section
    switch (tab) {
      case "dashboard":
        onSectionChange("dashboard");
        break;
      case "fulfillment":
        onSectionChange("fulfillment");
        break;
      case "products":
        onSectionChange("products");
        break;
      case "stories":
        onSectionChange("stories");
        break;
      case "more":
        // Don't change section, just show the menu
        break;
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "error":
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case "success":
        return <Bell className="h-4 w-4 text-green-500" />;
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-amber-500" />;
      default:
        return <Bell className="h-4 w-4 text-blue-500" />;
    }
  };

  const formatNotificationTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const handleLogout = async () => {
    if (confirm("Are you sure you want to logout?")) {
      await logout();
    }
  };

  const LoadingSpinner = () => (
    <div className="flex items-center justify-center py-12">
      <Loader2 className="h-8 w-8 animate-spin text-teal-600 dark:text-teal-400" />
    </div>
  );

  const renderContent = () => {
    // Handle special sections that need custom mobile views
    if (activeSection === "shipping-guide") {
      return (
        <MobileShippingGuide onBack={() => onSectionChange("dashboard")} />
      );
    }

    if (activeSection === "social-calendar") {
      return (
        <Suspense fallback={<LoadingSpinner />}>
          <div className="p-4">
            <SocialCalendarMobile />
          </div>
        </Suspense>
      );
    }

    switch (activeTab) {
      case "dashboard":
        return (
          <MobileDashboard
            onNavigate={onSectionChange}
            pendingOrderCount={pendingOrderCount}
          />
        );
      case "fulfillment":
        return (
          <Suspense fallback={<LoadingSpinner />}>
            <div className="p-4">
              <OrderFulfillment />
            </div>
          </Suspense>
        );
      case "products":
        return <MobileProducts onNavigate={onSectionChange} />;
      case "stories":
        return (
          <Suspense fallback={<LoadingSpinner />}>
            <div className="p-4">
              <StoryManagement />
            </div>
          </Suspense>
        );
      case "more":
        return (
          <MoreMenu
            activeSection={activeSection}
            onSectionChange={onSectionChange}
            renderContent={renderDesktopContent}
          />
        );
      default:
        return (
          <MobileDashboard
            onNavigate={onSectionChange}
            pendingOrderCount={pendingOrderCount}
          />
        );
    }
  };

  const unreadCount = notifications.filter(
    (n) => n.status === "pending" || n.status === "failed",
  ).length;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col">
      {/* Mobile Header */}
      <header className="bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 sticky top-0 z-40 safe-area-top shadow-sm">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Logo & Title */}
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-br from-teal-500 to-teal-600 rounded-xl">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-base font-bold text-gray-900 dark:text-white leading-none">
                  Kind Kandles
                </h1>
                <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                  Admin Panel
                </p>
              </div>
            </div>

            {/* Right Actions */}
            <div className="flex items-center space-x-1">
              {/* Maintenance Mode Badge */}
              {isMaintenanceMode && (
                <div className="flex items-center space-x-1 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-2 py-1 rounded-full">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  <span className="text-[10px] font-bold">MAINT</span>
                </div>
              )}

              {/* Dark Mode Toggle */}
              <button
                onClick={toggleDarkMode}
                className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-xl transition-colors"
                title={
                  isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"
                }
              >
                {isDarkMode ? (
                  <Sun className="h-5 w-5 text-gray-600 dark:text-slate-300" />
                ) : (
                  <Moon className="h-5 w-5 text-gray-600 dark:text-slate-300" />
                )}
              </button>

              {/* Notifications */}
              <div className="relative">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-xl transition-colors"
                  title="Notifications"
                >
                  <Bell className="h-5 w-5 text-gray-600 dark:text-slate-300" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                  )}
                </button>

                {/* Notification Dropdown */}
                {showNotifications && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setShowNotifications(false)}
                    />
                    <div className="absolute right-0 top-full mt-2 w-80 max-w-[calc(100vw-2rem)] bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl shadow-xl z-50 max-h-[400px] flex flex-col">
                      {/* Header */}
                      <div className="px-4 py-3 border-b border-gray-200 dark:border-slate-700 flex items-center justify-between">
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          Notifications
                        </h3>
                        {unreadCount > 0 && (
                          <span className="px-2 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-xs font-medium rounded-full">
                            {unreadCount} new
                          </span>
                        )}
                      </div>

                      {/* Notification List */}
                      <div className="flex-1 overflow-y-auto">
                        {notificationsLoading ? (
                          <div className="flex items-center justify-center py-8">
                            <Loader2 className="h-6 w-6 animate-spin text-teal-600 dark:text-teal-400" />
                          </div>
                        ) : notifications.length === 0 ? (
                          <div className="py-8 text-center text-gray-500 dark:text-slate-400">
                            <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">No notifications yet</p>
                          </div>
                        ) : (
                          <div className="divide-y divide-gray-100 dark:divide-slate-700">
                            {notifications.map((notification) => (
                              <div
                                key={notification.id}
                                className={`px-4 py-3 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors ${
                                  notification.status === "pending" ||
                                  notification.status === "failed"
                                    ? "bg-blue-50/50 dark:bg-blue-900/10"
                                    : ""
                                }`}
                              >
                                <div className="flex items-start gap-3">
                                  <div className="flex-shrink-0 mt-0.5">
                                    {getNotificationIcon(
                                      notification.status === "failed"
                                        ? "error"
                                        : notification.notification_type,
                                    )}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                      {notification.subject}
                                    </p>
                                    <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                                      {notification.recipient_email}
                                    </p>
                                    <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">
                                      {formatNotificationTime(
                                        notification.created_at,
                                      )}
                                    </p>
                                  </div>
                                  {(notification.status === "pending" ||
                                    notification.status === "failed") && (
                                    <div className="flex-shrink-0">
                                      <span className="w-2 h-2 bg-blue-500 rounded-full block"></span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Footer */}
                      <div className="px-4 py-3 border-t border-gray-200 dark:border-slate-700">
                        <button
                          onClick={() => {
                            setShowNotifications(false);
                            onSectionChange("notification-logs");
                            setActiveTab("more");
                          }}
                          className="w-full text-center text-sm text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 font-medium"
                        >
                          View all notifications
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* User Menu */}
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-xl transition-colors"
                >
                  <User className="h-5 w-5 text-gray-600 dark:text-slate-300" />
                </button>

                {showUserMenu && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setShowUserMenu(false)}
                    />
                    <div className="absolute right-0 top-full mt-1 w-44 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl shadow-xl z-50 overflow-hidden">
                      <div className="px-4 py-3 border-b border-gray-100 dark:border-slate-700">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {user?.name || user?.email || "Admin"}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-slate-400 capitalize mt-0.5">
                          {user?.role?.replace("_", " ") || "Admin"}
                        </p>
                      </div>
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center space-x-2 px-4 py-3 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                      >
                        <LogOut className="h-4 w-4" />
                        <span className="text-sm">Logout</span>
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-auto pb-20">{renderContent()}</main>

      {/* Bottom Tab Bar */}
      <BottomTabBar
        activeTab={activeTab}
        onTabChange={handleTabChange}
        pendingOrderCount={pendingOrderCount}
      />
    </div>
  );
}
