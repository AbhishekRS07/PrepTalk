import { SignUp } from "@clerk/nextjs";
import Image from "next/image";
import Link from "next/link";

export default function Page() {
  return (
    <div className="min-h-screen bg-background flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 gradient-primary relative overflow-hidden flex-col justify-between p-12">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-white/10 rounded-full" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-white/10 rounded-full" />

        <Link href="/" className="flex items-center gap-2 relative z-10">
          <Image src="/logo.svg" width={36} height={36} alt="PrepTalk" />
          <span className="font-bold text-xl text-white">PrepTalk</span>
        </Link>

        <div className="relative z-10">
          <h2 className="text-4xl font-bold text-white leading-tight mb-4">
            Your interview<br />journey starts here.
          </h2>
          <p className="text-white/80 text-lg leading-relaxed">
            Join thousands of candidates who use PrepTalk to land their dream jobs.
          </p>
        </div>

        <p className="text-white/50 text-sm relative z-10">© {new Date().getFullYear()} PrepTalk</p>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <Link href="/" className="flex items-center gap-2 mb-10 lg:hidden">
          <Image src="/logo.svg" width={32} height={32} alt="PrepTalk" />
          <span className="font-bold text-lg">PrepTalk</span>
        </Link>
        <SignUp />
      </div>
    </div>
  );
}
