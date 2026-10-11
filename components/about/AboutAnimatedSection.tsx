"use client";

import { motion } from "framer-motion";
import Image from "next/image";

export default function AboutAnimatedSection({ heading, paragraphs, imageUrl }: {
  heading: string;
  paragraphs: string[];
  imageUrl: string;
}) {
  return <div className="mx-auto grid max-w-6xl items-center gap-12 px-6 md:grid-cols-2">
    <motion.div initial={{ opacity: 0, x: -40 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.7, ease: "easeOut" }}>
      <h2 className="mb-4 text-3xl font-bold text-gray-900 md:text-4xl">{heading}</h2>
      {paragraphs.map((paragraph, index) => <p className="mb-4 text-lg text-gray-700 last:mb-0" key={`${index}-${paragraph.slice(0, 20)}`}>{paragraph}</p>)}
    </motion.div>
    {imageUrl && <motion.div initial={{ opacity: 0, x: 40, scale: 0.95 }} whileInView={{ opacity: 1, x: 0, scale: 1 }} viewport={{ once: true }} transition={{ duration: 0.7, ease: "easeOut", delay: 0.1 }} className="relative h-80 w-full overflow-hidden rounded-xl shadow-lg">
      <Image src={imageUrl} alt={heading} fill className="object-cover" />
    </motion.div>}
  </div>;
}
