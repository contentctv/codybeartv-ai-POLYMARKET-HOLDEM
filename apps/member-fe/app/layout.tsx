import type { Metadata } from "next";
import type { ReactNode } from "react";
import { MemberShell } from "../components/member-shell";
import "./globals.css";

export const metadata: Metadata = {
  title: "CodyBearTV Member",
  description: "Paper member shell. Connect, disconnect, and one Bitcoin Jungle tip rail.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <MemberShell>{children}</MemberShell>
      </body>
    </html>
  );
}
