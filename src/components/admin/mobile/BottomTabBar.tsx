"use client";

import {
  BarChart3,
  ClipboardList,
  Package,
  BookOpen,
  MoreHorizontal,
} from "lucide-react";
import { hapticLight } from "@/lib/haptics";
import type { MobileTab } from "./MobileAppShell";

interface BottomTabBarProps {
  activeTab: MobileTab;
  onTabChange: (tab: MobileTab) => void;
  pendingOrderCount?: number;
}

interface TabConfig {
  id: MobileTab;
  label: string;
  icon: typeof BarChart3;
  activeColor: string;
  activeBg: string;
  darkActiveBg: string;
  badge?: number;
}

export default function BottomTabBar({
  activeTab,
  onTabChange,
  pendingOrderCount = 0,
}: BottomTabBarProps) {
  const tabs: TabConfig[] = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: BarChart3,
      activeColor: "text-teal-600 dark:text-teal-400",
      activeBg: "bg-teal-50",
      darkActiveBg: "dark:bg-teal-900/30",
    },
    {
      id: "fulfillment",
      label: "Fulfill",
      icon: ClipboardList,
      activeColor: "text-blue-600 dark:text-blue-400",
      activeBg: "bg-blue-50",
      darkActiveBg: "dark:bg-blue-900/30",
      badge: pendingOrderCount,
    },
    {
      id: "products",
      label: "Products",
      icon: Package,
      activeColor: "text-purple-600 dark:text-purple-400",
      activeBg: "bg-purple-50",
      darkActiveBg: "dark:bg-purple-900/30",
    },
    {
      id: "stories",
      label: "Stories",
      icon: BookOpen,
      activeColor: "text-violet-600 dark:text-violet-400",
      activeBg: "bg-violet-50",
      darkActiveBg: "dark:bg-violet-900/30",
    },
    {
      id: "more",
      label: "More",
      icon: MoreHorizontal,
      activeColor: "text-gray-700 dark:text-gray-300",
      activeBg: "bg-gray-100",
      darkActiveBg: "dark:bg-slate-700",
    },
  ];

  const handleTabPress = (tab: MobileTab) => {
    hapticLight();
    onTabChange(tab);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-800 border-t border-gray-200 dark:border-slate-700 z-50 safe-area-bottom shadow-lg">
      <div className="flex items-center justify-around h-18 px-2 py-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => handleTabPress(tab.id)}
              className={`relative flex flex-col items-center justify-center flex-1 py-2 rounded-xl transition-all active:scale-95 ${
                isActive ? `${tab.activeBg} ${tab.darkActiveBg}` : ""
              }`}
              aria-label={tab.label}
              aria-current={isActive ? "page" : undefined}
            >
              {/* Icon Container */}
              <div className="relative">
                <Icon
                  className={`h-5 w-5 transition-colors ${
                    isActive
                      ? tab.activeColor
                      : "text-gray-400 dark:text-slate-500"
                  }`}
                  strokeWidth={isActive ? 2.5 : 2}
                />

                {/* Badge */}
                {tab.badge !== undefined && tab.badge > 0 && (
                  <span className="absolute -top-1.5 -right-2.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
                    {tab.badge > 9 ? "9+" : tab.badge}
                  </span>
                )}
              </div>

              {/* Label */}
              <span
                className={`text-[10px] mt-1 font-medium transition-colors ${
                  isActive
                    ? tab.activeColor
                    : "text-gray-400 dark:text-slate-500"
                }`}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
