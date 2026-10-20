import type { Metadata } from "next";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function ManageLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <div className="workspace-ui min-h-screen">{children}</div>;
}
