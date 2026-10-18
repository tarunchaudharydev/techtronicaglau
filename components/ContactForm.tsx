"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Lottie from "react-lottie-player";
import {
  FiMapPin,
  FiClock,
  FiMail,
  FiPhone,
  FiLinkedin,
  FiInstagram,
  FiYoutube,
  FiSend,
} from "react-icons/fi";

import contactAnimation from "@/public/contact.json";
import {
  techtronicaErrorMessage,
  techtronicaSuccessMessage,
} from "@/lib/techtronica/messages";

const socialLinks = [
  {
    href: "https://www.linkedin.com/company/techtronica-society2016/",
    icon: FiLinkedin,
    label: "LinkedIn",
  },
  {
    href: "https://www.instagram.com/techtronica_glau",
    icon: FiInstagram,
    label: "Instagram",
  },
  {
    href: "https://www.youtube.com/@techtronica",
    icon: FiYoutube,
    label: "YouTube",
  },
];

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0 },
};

export default function ContactSection() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    topic: "",
    message: "",
    website: "",
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const result = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(
          typeof result.error === "string"
            ? result.error
            : techtronicaErrorMessage.contactSubmit,
        );
      }

      setSuccess(true);
      setForm({ name: "", email: "", topic: "", message: "", website: "" });
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : techtronicaErrorMessage.generic,
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="bg-gradient-to-br from-white dark:from-slate-950 via-sky-50 dark:via-slate-900 to-purple-100 dark:to-black py-16 lg:py-20">
      <div className="max-w-6xl mx-auto px-4 space-y-16">
        {/* Header */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="show"
          className="text-center max-w-3xl mx-auto space-y-3"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-foreground dark:text-white">
            Contact
          </h2>
          <p className="text-sm md:text-base text-muted">
            Have a question, idea, or collaboration proposal? Send us a message
            and we’ll get back to you.
          </p>
        </motion.div>

        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="show"
          className="grid gap-10 lg:grid-cols-2 items-center bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800 p-6 sm:p-10"
        >
          <div className="hidden lg:block">
            <Lottie
              loop
              play
              animationData={contactAnimation}
              className="max-w-md mx-auto"
            />
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <h3 className="text-xl font-semibold text-foreground dark:text-white">
              Leave Us a Message
            </h3>

            <div className="relative">
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                required
                className="peer contact-input"
                placeholder=" "
              />
              <label className="floating-label">Your Name</label>
            </div>

            <div className="relative">
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                required
                className="peer contact-input"
                placeholder=" "
              />
              <label className="floating-label">Email Address</label>
            </div>

            <div className="relative">
              <input
                name="topic"
                value={form.topic}
                onChange={handleChange}
                maxLength={160}
                className="peer contact-input"
                placeholder=" "
              />
              <label className="floating-label">Topic (optional)</label>
            </div>

            <div className="relative">
              <textarea
                name="message"
                rows={5}
                value={form.message}
                onChange={handleChange}
                required
                className="peer contact-input resize-none"
                placeholder=" "
              />
              <label className="floating-label">Your Message</label>
            </div>

            <div className="hidden" aria-hidden="true">
              <label htmlFor="contact-website">Leave this field empty</label>
              <input
                id="contact-website"
                name="website"
                value={form.website}
                onChange={handleChange}
                tabIndex={-1}
                autoComplete="off"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="techtronica-button-primary w-full disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                "Sending..."
              ) : (
                <>
                  <FiSend /> Send Message
                </>
              )}
            </button>

            {success && (
              <p role="status" className="techtronica-message techtronica-message-success text-center">
                {techtronicaSuccessMessage.contactSent}
              </p>
            )}
            {error && (
              <p role="alert" className="techtronica-message techtronica-message-error text-center">
                {error}
              </p>
            )}
          </form>
        </motion.div>

        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 text-sm"
        >
          {[
            {
              icon: <FiMapPin />,
              label: "Location",
              value: "GLA University, Mathura, Uttar Pradesh",
            },
            {
              icon: <FiClock />,
              label: "Working Hours",
              value: "Mon – Fri, 10:00 AM – 5:00 PM",
            },
            {
              icon: <FiMail />,
              label: "Email",
              value: "techtronica_ece@gla.ac.in",
            },
            { icon: <FiPhone />, label: "Phone", value: "+91 7088337100" },
          ].map((item, i) => (
            <div key={i} className="flex gap-3 items-start">
              <div className="text-sky-600 text-lg">{item.icon}</div>
              <div>
                <p className="font-medium text-foreground dark:text-white">
                  {item.label}
                </p>
                <p className="text-slate-500 text-xs">{item.value}</p>
              </div>
            </div>
          ))}
        </motion.div>

        <div className="rounded-3xl overflow-hidden border shadow-lg">
          <iframe
            title="GLA University Map"
            src="https://www.google.com/maps?q=GLA%20University%20Mathura&output=embed"
            className="w-full h-[320px]"
            loading="lazy"
          />
        </div>

        <div className="flex justify-center gap-4">
          {socialLinks.map(({ href, icon: Icon, label }) => (
            <a
              key={label}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={label}
              title={label}
              className="
            h-10 w-10 flex items-center justify-center rounded-full
            bg-slate-100 text-slate-700
            hover:bg-slate-200 hover:text-foreground dark:text-white
            transition
          "
            >
              <Icon className="h-5 w-5" />
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
