"use client";
import { UserButton } from "@clerk/nextjs";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";

const navLinks = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/dashboard/questions", label: "Questions" },
  { href: "/dashboard/upgrade", label: "Upgrade" },
  { href: "/dashboard/how", label: "How it works" },
];

const Header = () => {
  const path = usePathname();

  return (
    <header className="sticky top-0 z-50 glass border-b border-border/50">
      <div className="mx-5 md:mx-20 lg:mx-36 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/dashboard" className="flex items-center gap-2">
          <Image src="/logo.svg" width={32} height={32} alt="PrepTalk" />
          <span className="font-bold text-base tracking-tight hidden sm:block">
            PrepTalk
          </span>
        </Link>

        {/* Nav */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                path === href
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary"
              )}
            >
              {label}
            </Link>
          ))}
        </nav>

        {/* Right */}
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <UserButton afterSignOutUrl="/" />
        </div>
      </div>
    </header>
  );
};

export default Header;
