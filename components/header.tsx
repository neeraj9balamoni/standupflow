"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signIn, signOut } from "next-auth/react";
import { useTheme } from "./providers";
import { useStandupStore } from "./store";
import Image from "next/image";
import {
  Sun,
  Moon,
  Sparkles,
  LogOut,
  Ticket,
  ArrowRight,
  Menu,
  X,
} from "lucide-react";

const NAV_ITEMS = [
  { href: "/", label: "Home" },
  { href: "/history", label: "History" },
  { href: "/insights", label: "Smarter Together" },
  { href: "/feedback", label: "Feedback" },
];

export function Header() {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const { theme, toggleTheme } = useTheme();
  const { ticketsLeft, ticketsTotal } = useStandupStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="site-header sticky top-0 z-50 w-full border-b border-slate-200/80 dark:border-slate-800/80 bg-white/85 dark:bg-slate-950/85 backdrop-blur-md transition-colors">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Left: Brand Wordmark (links to /) */}
        <Link
          href="/"
          id="brand-wordmark"
          onClick={() => setMobileMenuOpen(false)}
          className="flex items-center gap-2.5 group shrink-0"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-400 flex items-center justify-center text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
            <Sparkles size={18} className="size-[18px] w-[18px] h-[18px]" />
          </div>
          <div className="flex flex-col">
            <span className="font-extrabold text-lg tracking-tight text-slate-900 dark:text-white">
              Standup Flow
            </span>
          </div>
        </Link>

        {/* Center: Desktop Navigation Links */}
        <nav
          id="desktop-nav"
          className="hidden md:flex items-center gap-1 bg-slate-100/70 dark:bg-slate-900/70 p-1 rounded-xl border border-slate-200/60 dark:border-slate-800/60"
        >
          {NAV_ITEMS.map((item) => {
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                id={`nav-link-${item.label.toLowerCase().replace(/\s+/g, "-")}`}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 ${
                  isActive
                    ? "bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-xs font-bold"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-slate-800/50"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Right: Theme Toggle, Ticket Counter, Auth Buttons, Mobile Hamburger */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Ticket Counter (When Signed In) */}
          {session?.user && ticketsLeft !== null && ticketsLeft !== undefined && (
            <div
              id="header-ticket-counter"
              className="hidden lg:flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 shadow-xs"
            >
              <Ticket size={14} className="size-3.5 w-3.5 h-3.5 text-blue-500" />
              <span>
                <strong
                  className={
                    ticketsLeft <= 1
                      ? "text-amber-500 font-bold"
                      : "text-blue-500"
                  }
                >
                  {ticketsLeft}
                </strong>
                /{ticketsTotal ?? 6} tickets
              </span>
            </div>
          )}

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            id="theme-toggle-btn"
            aria-label="Toggle Theme"
            className="p-2 rounded-xl text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            {theme === "dark" ? (
              <Sun size={16} className="size-4 w-4 h-4 text-amber-400" />
            ) : (
              <Moon size={16} className="size-4 w-4 h-4 text-slate-700" />
            )}
          </button>

          {/* Auth State */}
          {status === "loading" ? (
            <div className="w-20 h-8 rounded-lg bg-slate-200 dark:bg-slate-800 animate-pulse" />
          ) : session?.user ? (
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="flex items-center gap-2">
                {session.user.image ? (
                  <Image
                    src={session.user.image}
                    alt={session.user.name || "User Avatar"}
                    width={32}
                    height={32}
                    unoptimized
                    className="w-8 h-8 rounded-full border border-slate-300 dark:border-slate-700 object-cover"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
                    {session.user.name
                      ? session.user.name.charAt(0).toUpperCase()
                      : "U"}
                  </div>
                )}
                <span className="text-xs font-medium text-slate-700 dark:text-slate-300 hidden xl:inline max-w-[120px] truncate">
                  {session.user.name || session.user.email}
                </span>
              </div>
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                id="signout-btn"
                title="Sign out"
                className="p-2 text-slate-500 hover:text-red-500 dark:text-slate-400 dark:hover:text-red-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
              >
                <LogOut size={16} className="size-4 w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => signIn(undefined, { callbackUrl: "/" })}
              id="google-signin-btn"
              className="inline-flex items-center gap-2 px-3 py-1.5 sm:px-3.5 sm:py-1.5 text-xs sm:text-sm font-semibold rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-950 hover:bg-slate-800 dark:hover:bg-slate-100 transition shadow-sm cursor-pointer shrink-0"
            >
              <svg
                className="size-4 w-4 h-4 shrink-0"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span className="hidden sm:inline">Sign in with Google</span>
              <span className="sm:hidden">Sign in</span>
              <ArrowRight
                size={14}
                className="size-3.5 w-3.5 h-3.5 hidden sm:inline"
              />
            </button>
          )}

          {/* Mobile Hamburger Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            id="mobile-menu-btn"
            aria-label="Toggle navigation menu"
            className="md:hidden p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            {mobileMenuOpen ? (
              <X size={20} className="size-5 w-5 h-5" />
            ) : (
              <Menu size={20} className="size-5 w-5 h-5" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div
          id="mobile-menu"
          className="md:hidden border-t border-slate-200/80 dark:border-slate-800/80 bg-white/95 dark:bg-slate-950/95 backdrop-blur-xl px-4 py-4 space-y-2 animate-in slide-in-from-top-2 duration-150 shadow-xl"
        >
          {session?.user && ticketsLeft !== null && ticketsLeft !== undefined && (
            <div className="flex items-center justify-between px-3 py-2 mb-2 rounded-xl bg-slate-100 dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-300">
              <span className="flex items-center gap-1.5">
                <Ticket size={14} className="size-3.5 w-3.5 h-3.5 text-blue-500" />
                Remaining Tickets:
              </span>
              <span className="font-bold text-blue-600 dark:text-blue-400">
                {ticketsLeft} / {ticketsTotal ?? 6}
              </span>
            </div>
          )}

          <div className="grid grid-cols-1 gap-1">
            {NAV_ITEMS.map((item) => {
              const isActive =
                item.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  id={`mobile-nav-${item.label
                    .toLowerCase()
                    .replace(/\s+/g, "-")}`}
                  className={`w-full text-left px-3.5 py-2.5 rounded-xl text-sm font-semibold transition cursor-pointer flex items-center justify-between ${
                    isActive
                      ? "bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 font-bold"
                      : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900"
                  }`}
                >
                  <span>{item.label}</span>
                  {isActive && (
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-blue-400" />
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </header>
  );
}
