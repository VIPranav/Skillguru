import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SkillPath AI",
  description: "AI-powered personalized learning roadmap and career growth coach",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="dark h-full">
      <body className="min-h-full flex flex-col bg-[#0b0c0f] text-[#e8eaf0] font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
