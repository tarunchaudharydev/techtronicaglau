"use client";

import { motion, type Variants } from "framer-motion";

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 40 },
  visible: (index: number) => ({ opacity: 1, y: 0, transition: { delay: index * 0.15, duration: 0.6, ease: "easeOut" } }),
};

export default function MissionVisionValue({ items }: { items: { label: string; text: string }[] }) {
  return <div className="mx-auto grid max-w-6xl gap-8 px-6 text-center md:grid-cols-3">
    {items.map((item, index) => <motion.div key={item.label} custom={index} variants={cardVariants} initial="hidden" whileInView="visible" viewport={{ once: true }} whileHover={{ y: -8, scale: 1.03 }} transition={{ type: "spring", stiffness: 300, damping: 20 }} className="rounded-xl bg-gray-50 p-8 shadow-md">
      <h3 className="mb-3 text-xl font-semibold text-indigo-600">{item.label}</h3>
      <p className="text-gray-700">{item.text}</p>
    </motion.div>)}
  </div>;
}
