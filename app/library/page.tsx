import type { Metadata } from "next";
import LibrarySection from "@/components/library/LibrarySection";

export const metadata: Metadata = {
  title: "Library | Techtronica",
  description: "Browse academic resources, projects, research, and patents published by Techtronica.",
};

export default function LibraryPage() {
  return <LibrarySection />;
}
