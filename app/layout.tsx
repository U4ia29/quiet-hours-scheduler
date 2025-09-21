// app/layout.tsx
import type { Metadata, Viewport } from "next"; //Import Viewport
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

// The metadata object no longer contains the viewport
export const metadata: Metadata = {
  title: "Quiet Hours Scheduler",
  description: "A personal space for focused study sessions.",
};

//Export the viewport as its own object
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1.0,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="min-h-screen bg-background text-text-main flex flex-col items-center justify-center p-4">
          {children}
        </div>
      </body>
    </html>
  );
}