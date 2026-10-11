"use client";

import { useState } from "react";
import PolicyLayout from "./PolicyLayout";
import { contentObject, contentText } from "@/lib/data/content-fields";
import type { Json } from "@/types/database";

type FAQRecord = { id: string; content: Json };

export default function FAQ({ faqs }: { faqs: FAQRecord[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <PolicyLayout title="Frequently Asked Questions">
      <div className="space-y-4">
        {faqs.map((faq, index) => {
          const isOpen = openIndex === index;
          const content = contentObject(faq.content);

          return (
            <div
              key={faq.id}
              className="border border-gray-200 rounded-xl p-5 transition-all duration-300
                         hover:border-indigo-500 hover:shadow-md bg-white dark:bg-slate-900"
            >
              <button
                onClick={() => setOpenIndex(isOpen ? null : index)}
                className="w-full flex items-center justify-between text-left"
              >
                <h3 className="text-lg font-semibold text-gray-900">
                  {contentText(content.question)}
                </h3>

                <span
                  className={`text-2xl font-bold text-indigo-600 transition-transform duration-300 ${
                    isOpen ? "rotate-45" : ""
                  }`}
                >
                  +
                </span>
              </button>

              <div
                className={`overflow-hidden transition-all duration-300 ${
                  isOpen ? "max-h-40 mt-3 opacity-100" : "max-h-0 opacity-0"
                }`}
              >
                <p className="text-gray-600 leading-relaxed">{contentText(content.answer)}</p>
              </div>
            </div>
          );
        })}
      </div>
    </PolicyLayout>
  );
}
