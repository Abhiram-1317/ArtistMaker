"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, useInView, useScroll, useTransform } from "framer-motion";
import { Badge, Button } from "@genesis/ui";

/* -------------------------------------------------------------------------- */
/*                               Data / Config                                */
/* -------------------------------------------------------------------------- */

const genres = [
  "Cinematic",
  "Animation",
  "Anime",
  "Sci-Fi",
  "Fantasy",
  "Horror",
  "Documentary",
] as const;

const showcaseMovies = [
  {
    id: 1,
    title: "Echoes of Eternity",
    genre: "Sci-Fi",
    thumbnail: "https://images.unsplash.com/photo-1534996858221-380b92700493?w=600&q=80",
    views: "2.4M",
    likes: "186K",
    duration: "1:42:30",
  },
  {
    id: 2,
    title: "Whispers in the Dark",
    genre: "Horror",
    thumbnail: "https://images.unsplash.com/photo-1509281373149-e957c6296406?w=600&q=80",
    views: "1.8M",
    likes: "142K",
    duration: "1:28:15",
  },
  {
    id: 3,
    title: "Neon Dreams",
    genre: "Animation",
    thumbnail: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=600&q=80",
    views: "3.1M",
    likes: "245K",
    duration: "1:55:00",
  },
  {
    id: 4,
    title: "The Last Frontier",
    genre: "Fantasy",
    thumbnail: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&q=80",
    views: "1.2M",
    likes: "98K",
    duration: "2:01:42",
  },
  {
    id: 5,
    title: "Rise of Olympus",
    genre: "Cinematic",
    thumbnail: "https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=600&q=80",
    views: "4.5M",
    likes: "320K",
    duration: "2:15:30",
  },
  {
    id: 6,
    title: "Digital Horizon",
    genre: "Documentary",
    thumbnail: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600&q=80",
    views: "890K",
    likes: "67K",
    duration: "1:35:20",
  },
] as const;

const steps = [
  {
    number: "01",
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
      </svg>
    ),
    title: "Write Your Vision",
    description:
      "Describe your movie idea in natural language. Set the genre, mood, characters, and story — our AI understands creative intent like a seasoned director.",
    color: "from-genesis-500 to-neon-purple",
  },
  {
    number: "02",
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
      </svg>
    ),
    title: "AI Generates Your Film",
    description:
      "Our cinematic AI engine composes scenes, designs shots, generates visuals, adds audio, and renders everything in stunning quality — automatically.",
    color: "from-neon-pink to-genesis-500",
  },
  {
    number: "03",
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" />
      </svg>
    ),
    title: "Share & Collaborate",
    description:
      "Export in 4K, share with your audience, or collaborate with your team in real-time. Iterate on scenes, refine shots, and publish when ready.",
    color: "from-neon-cyan to-neon-blue",
  },
] as const;

const avatars = [
  "https://i.pravatar.cc/80?img=1",
  "https://i.pravatar.cc/80?img=2",
  "https://i.pravatar.cc/80?img=3",
  "https://i.pravatar.cc/80?img=4",
  "https://i.pravatar.cc/80?img=5",
];

/* -------------------------------------------------------------------------- */
/*                           Animation variants                               */
/* -------------------------------------------------------------------------- */

const ease = [0.22, 1, 0.36, 1] as [number, number, number, number];

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.6, ease },
  }),
};

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.5, ease },
  },
};

/* -------------------------------------------------------------------------- */
/*                           Reusable sub-components                          */
/* -------------------------------------------------------------------------- */

function SectionHeading({
  badge,
  title,
  highlight,
  description,
}: {
  badge?: string;
  title: string;
  highlight: string;
  description: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={inView ? "visible" : "hidden"}
      variants={staggerContainer}
      className="text-center mb-16 lg:mb-20"
    >
      {badge && (
        <motion.div variants={fadeInUp}>
          <span className="inline-flex items-center gap-2 rounded-full bg-genesis-950/60 px-4 py-1.5 text-sm text-genesis-300 ring-1 ring-genesis-800/50 mb-6">
            {badge}
          </span>
        </motion.div>
      )}
      <motion.h2
        variants={fadeInUp}
        className="font-heading text-3xl font-bold text-white sm:text-4xl lg:text-5xl"
      >
        {title}{" "}
        <span className="gradient-text">{highlight}</span>
      </motion.h2>
      <motion.p
        variants={fadeInUp}
        className="mt-4 text-lg text-gray-400 max-w-2xl mx-auto text-balance"
      >
        {description}
      </motion.p>
    </motion.div>
  );
}

function MovieCard({ movie, index }: { movie: (typeof showcaseMovies)[number]; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={inView ? "visible" : "hidden"}
      variants={fadeInUp}
      custom={index}
    >
      <div className="group relative overflow-hidden rounded-xl bg-surface-raised border border-white/[0.06] transition-all duration-500 hover:border-genesis-500/30 hover:shadow-[0_0_40px_-10px_rgba(168,85,247,0.25)]">
        {/* Thumbnail */}
        <div className="relative aspect-[16/10] overflow-hidden">
          <Image
            src={movie.thumbnail}
            alt={movie.title}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover transition-transform duration-700 group-hover:scale-110"
          />
          {/* Overlay on hover */}
          <div className="absolute inset-0 bg-gradient-to-t from-surface via-surface/40 to-transparent opacity-60 group-hover:opacity-80 transition-opacity duration-500" />

          {/* Play button on hover */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/10 backdrop-blur-md border border-white/20 shadow-xl">
              <svg className="w-6 h-6 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
          </div>

          {/* Duration badge */}
          <div className="absolute bottom-2 right-2 rounded bg-black/70 px-1.5 py-0.5 text-[11px] font-medium text-white backdrop-blur-sm">
            {movie.duration}
          </div>

          {/* Genre badge */}
          <div className="absolute top-3 left-3">
            <Badge variant="default" className="bg-genesis-600/80 text-white backdrop-blur-sm border-0 text-[11px]">
              {movie.genre}
            </Badge>
          </div>
        </div>

        {/* Info */}
        <div className="p-4">
          <h3 className="font-heading font-semibold text-white truncate text-[15px]">
            {movie.title}
          </h3>
          <div className="mt-2 flex items-center gap-4 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.64 0 8.577 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.64 0-8.577-3.007-9.963-7.178z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {movie.views}
            </span>
            <span className="flex items-center gap-1">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
              </svg>
              {movie.likes}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function StepCard({ step, index }: { step: (typeof steps)[number]; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={inView ? "visible" : "hidden"}
      variants={fadeInUp}
      custom={index}
    >
      <div className="relative group h-full">
        {/* Connector line (hidden on mobile, visible between cards on lg) */}
        {index < steps.length - 1 && (
          <div className="hidden lg:block absolute top-16 -right-3 w-6 border-t border-dashed border-genesis-700/40 z-20" />
        )}

        <div className="relative overflow-hidden rounded-2xl bg-white/[0.02] border border-white/[0.06] p-8 h-full transition-all duration-500 hover:bg-white/[0.04] hover:border-genesis-500/20 hover:shadow-[0_0_60px_-15px_rgba(168,85,247,0.15)]">
          {/* Step number watermark */}
          <div className="absolute -top-4 -right-2 text-[120px] font-heading font-bold text-white/[0.02] leading-none select-none pointer-events-none">
            {step.number}
          </div>

          {/* Icon */}
          <div className={`inline-flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br ${step.color} bg-opacity-10 text-white mb-6 shadow-lg`}>
            {step.icon}
          </div>

          {/* Step label */}
          <div className="flex items-center gap-3 mb-3">
            <span className="text-xs font-bold text-genesis-400 tracking-wider uppercase">
              Step {step.number}
            </span>
          </div>

          <h3 className="font-heading text-xl font-bold text-white mb-3">
            {step.title}
          </h3>

          <p className="text-sm text-gray-400 leading-relaxed">
            {step.description}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

/* -------------------------------------------------------------------------- */
/*                              Main Page                                     */
/* -------------------------------------------------------------------------- */

export default function LandingPage() {
  const [selectedGenre, setSelectedGenre] = useState<string>(genres[0]);
  const [prompt, setPrompt] = useState("");
  const [genreOpen, setGenreOpen] = useState(false);

  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const heroOpacity = useTransform(scrollYProgress, [0, 1], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 1], [1, 0.95]);
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 100]);

  return (
    <div className="relative overflow-x-hidden">
      {/* ────────────────────────── HERO SECTION ────────────────────────── */}
      <section ref={heroRef} className="relative min-h-screen flex flex-col">
        {/* Background video / cinematic gradient fallback */}
        <div className="absolute inset-0 z-0">
          <video
            autoPlay
            muted
            loop
            playsInline
            poster="https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=1920&q=80"
            className="absolute inset-0 w-full h-full object-cover hidden sm:block"
          >
            {/* Fallback: the poster image shows if video can't load */}
          </video>
          {/* Dark overlay gradient */}
          <div className="absolute inset-0 bg-gradient-to-b from-surface/80 via-surface/90 to-surface" />
          {/* Radial accent glow */}
          <div className="absolute inset-0 bg-hero-glow opacity-60" />
          {/* Animated gradient spheres */}
          <div className="absolute top-1/4 -left-32 w-96 h-96 bg-genesis-600/20 rounded-full blur-[128px] animate-float" />
          <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-neon-pink/10 rounded-full blur-[128px] animate-float" style={{ animationDelay: "3s" }} />
        </div>

        {/* Navigation */}
        <header className="relative z-20 border-b border-white/[0.06] backdrop-blur-md bg-surface/30 safe-top">
          <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 sm:py-4 lg:px-8">
            <Link href="/" className="flex items-center gap-2.5 group">
              <span className="text-2xl transition-transform duration-300 group-hover:scale-110">🎬</span>
              <span className="font-heading text-xl font-bold gradient-text">
                Genesis
              </span>
            </Link>
            <div className="hidden md:flex items-center gap-8">
              <a href="#showcase" className="text-sm text-gray-400 hover:text-white transition-colors">
                Showcase
              </a>
              <a href="#how-it-works" className="text-sm text-gray-400 hover:text-white transition-colors">
                How It Works
              </a>
              <Link href="/login" className="text-sm text-gray-400 hover:text-white transition-colors">
                Sign in
              </Link>
              <Link href="/register">
                <Button size="sm">Get Started</Button>
              </Link>
            </div>
            {/* Mobile menu button */}
            <div className="md:hidden flex items-center gap-3">
              <Link href="/login" className="text-sm text-gray-400">
                Sign in
              </Link>
              <Link href="/register">
                <Button size="sm">Start Free</Button>
              </Link>
            </div>
          </nav>
        </header>

        {/* Hero content */}
        <motion.div
          style={{ opacity: heroOpacity, scale: heroScale, y: heroY }}
          className="relative z-10 flex-1 flex items-center justify-center px-4 sm:px-6"
        >
            <div className="mx-auto max-w-4xl text-center w-full py-8 sm:py-12">
            {/* Glass badge */}
            <motion.div
              initial={{ opacity: 0, y: 20, filter: "blur(10px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{ delay: 0.2, duration: 0.8, ease }}
            >
              <span className="inline-flex items-center gap-2 rounded-full bg-white/[0.04] backdrop-blur-xl px-5 py-2 text-sm text-genesis-200 ring-1 ring-white/[0.08] mb-8 shadow-lg shadow-genesis-500/5">
                <span className="text-base">✨</span>
                The Future of Filmmaking is Here
              </span>
            </motion.div>

            {/* Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 30, filter: "blur(10px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{ delay: 0.4, duration: 0.8, ease }}
              className="font-heading text-4xl xs:text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-bold tracking-tight leading-[1.05]"
            >
              <span className="text-white">Create Cinematic</span>
              <br />
              <span className="gradient-text">Movies with AI</span>
            </motion.h1>

            {/* Subheadline */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.8, ease }}
              className="mt-6 text-lg sm:text-xl text-gray-400 max-w-2xl mx-auto text-balance leading-relaxed"
            >
              Transform your imagination into production-quality films. Write a prompt,
              choose your style, and let our AI director bring your vision to life
              — no camera, crew, or studio required.
            </motion.p>

            {/* ──── Prompt Bar ──── */}
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: 0.8, duration: 0.8, ease }}
              className="mt-10 mx-auto max-w-2xl"
            >
              <div className="group relative rounded-2xl bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] p-2 shadow-2xl shadow-genesis-500/5 transition-all duration-500 hover:border-genesis-500/20 hover:shadow-genesis-500/10 focus-within:border-genesis-500/30 focus-within:shadow-genesis-500/15">
                {/* Glow effect behind the bar */}
                <div className="absolute -inset-0.5 rounded-2xl bg-gradient-to-r from-genesis-600/20 via-neon-pink/10 to-genesis-600/20 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 blur-xl transition-opacity duration-500 -z-10" />

                <div className="flex flex-col sm:flex-row items-stretch gap-2">
                  {/* Genre dropdown */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setGenreOpen(!genreOpen)}
                      className="flex items-center gap-2 h-12 px-4 rounded-xl bg-white/[0.04] border border-white/[0.06] text-sm text-gray-300 hover:bg-white/[0.08] hover:text-white transition-all duration-200 min-w-[140px] justify-between w-full sm:w-auto"
                    >
                      <span className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-genesis-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 01-1.125-1.125M3.375 19.5h1.5C5.496 19.5 6 18.996 6 18.375m-3.75 0V5.625m0 12.75v-1.5c0-.621.504-1.125 1.125-1.125m18.375 2.625V5.625m0 12.75c0 .621-.504 1.125-1.125 1.125m1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125m0 3.75h-1.5A1.125 1.125 0 0118 18.375M20.625 4.5H3.375m17.25 0c.621 0 1.125.504 1.125 1.125M20.625 4.5h-1.5C18.504 4.5 18 5.004 18 5.625m3.75 0v1.5c0 .621-.504 1.125-1.125 1.125M3.375 4.5c-.621 0-1.125.504-1.125 1.125M3.375 4.5h1.5C5.496 4.5 6 5.004 6 5.625m-3.75 0v1.5c0 .621.504 1.125 1.125 1.125m0 0h1.5m-1.5 0c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125m1.5-3.75C5.496 8.25 6 7.746 6 7.125v-1.5M4.875 8.25C5.496 8.25 6 8.754 6 9.375v1.5m0-5.25v5.25m0-5.25C6 5.004 6.504 4.5 7.125 4.5h9.75c.621 0 1.125.504 1.125 1.125m1.125 2.625h1.5m-1.5 0A1.125 1.125 0 0118 7.125v-1.5m1.125 2.625c-.621 0-1.125.504-1.125 1.125v1.5m2.625-2.625c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125M18 5.625v5.25M7.125 12h9.75m-9.75 0A1.125 1.125 0 016 10.875M7.125 12C6.504 12 6 12.504 6 13.125m0-2.25C6 11.496 5.496 12 4.875 12M18 10.875c0 .621-.504 1.125-1.125 1.125M18 10.875c0 .621.504 1.125 1.125 1.125m-2.25 0c.621 0 1.125.504 1.125 1.125m-12 5.25v-5.25m0 5.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125m-12 0v-1.5c0-.621-.504-1.125-1.125-1.125M18 18.375v-5.25m0 5.25v-1.5c0-.621.504-1.125 1.125-1.125M18 13.125v1.5c0 .621.504 1.125 1.125 1.125M18 13.125c0-.621.504-1.125 1.125-1.125M6 13.125v1.5c0 .621-.504 1.125-1.125 1.125M6 13.125C6 12.504 5.496 12 4.875 12m-1.5 0h1.5m-1.5 0c-.621 0-1.125-.504-1.125-1.125v-1.5c0-.621.504-1.125 1.125-1.125M19.125 12h1.5m0 0c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125m1.5 3.75c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125m-17.25 0h1.5m14.25 0h1.5" />
                        </svg>
                        {selectedGenre}
                      </span>
                      <svg className={`w-3.5 h-3.5 text-gray-500 transition-transform duration-200 ${genreOpen ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                      </svg>
                    </button>

                    {/* Dropdown */}
                    {genreOpen && (
                      <div className="absolute top-full left-0 mt-2 w-48 rounded-xl bg-surface-raised/95 backdrop-blur-xl border border-white/[0.08] shadow-2xl shadow-black/40 py-1 z-50">
                        {genres.map((g) => (
                          <button
                            key={g}
                            type="button"
                            onClick={() => { setSelectedGenre(g); setGenreOpen(false); }}
                            className={`w-full px-4 py-2.5 text-left text-sm transition-colors ${
                              selectedGenre === g
                                ? "text-genesis-300 bg-genesis-500/10"
                                : "text-gray-400 hover:text-white hover:bg-white/[0.04]"
                            }`}
                          >
                            {g}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Text input */}
                  <input
                    type="text"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Describe your movie... e.g. 'A noir detective story set in 2084 Tokyo'"
                    className="flex-1 h-12 px-4 bg-transparent text-white placeholder:text-gray-500 text-sm focus:outline-none min-w-0"
                  />

                  {/* Create button */}
                  <Button
                    size="lg"
                    className="shrink-0 rounded-xl px-6 gap-2"
                    iconRight={
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                      </svg>
                    }
                  >
                    Create Movie
                  </Button>
                </div>
              </div>
            </motion.div>

            {/* Social proof */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.0, duration: 0.8, ease }}
              className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              {/* Avatar stack */}
              <div className="flex -space-x-3">
                {avatars.map((src, i) => (
                  <div
                    key={i}
                    className="relative w-9 h-9 rounded-full border-2 border-surface overflow-hidden ring-1 ring-white/10"
                    style={{ zIndex: avatars.length - i }}
                  >
                    <Image
                      src={src}
                      alt=""
                      fill
                      sizes="36px"
                      className="object-cover"
                    />
                  </div>
                ))}
                <div className="flex w-9 h-9 items-center justify-center rounded-full bg-genesis-600/40 border-2 border-surface text-[10px] font-bold text-genesis-200 ring-1 ring-genesis-500/30">
                  50K+
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <div className="flex gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <span><strong className="text-white">50,000+</strong> filmmakers creating movies</span>
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5, duration: 1 }}
          className="relative z-10 flex justify-center pb-8"
        >
          <a
            href="#showcase"
            className="flex flex-col items-center gap-2 text-gray-500 hover:text-genesis-400 transition-colors group"
          >
            <span className="text-xs uppercase tracking-widest font-medium">Scroll to explore</span>
            <motion.div
              animate={{ y: [0, 8, 0] }}
              transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
              </svg>
            </motion.div>
          </a>
        </motion.div>
      </section>

      {/* ──────────────────────── SHOWCASE SECTION ──────────────────────── */}
      <section id="showcase" className="relative z-10 py-24 lg:py-32">
        {/* Top divider glow */}
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-genesis-500/30 to-transparent" />

        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <SectionHeading
            badge="🎬 Featured Films"
            title="Made with"
            highlight="Genesis AI"
            description="Explore stunning films created entirely by our community using AI. From sci-fi epics to intimate documentaries — see what's possible."
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {showcaseMovies.map((movie, i) => (
              <MovieCard key={movie.id} movie={movie} index={i} />
            ))}
          </div>

          {/* View all link */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
            className="mt-12 text-center"
          >
            <Link href="/register">
              <Button variant="secondary" size="lg" iconRight={
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              }>
                View All Films
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ──────────────────── HOW IT WORKS SECTION ─────────────────────── */}
      <section id="how-it-works" className="relative z-10 py-24 lg:py-32 overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-genesis-950/20 to-transparent" />
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-genesis-500/20 to-transparent" />

        <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
          <SectionHeading
            badge="⚡ Simple & Powerful"
            title="How it"
            highlight="works"
            description="Go from idea to cinematic masterpiece in three simple steps. No technical skills needed — just your imagination."
          />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-6">
            {steps.map((step, i) => (
              <StepCard key={step.number} step={step} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* ──────────────────────── CTA SECTION ──────────────────────────── */}
      <section className="relative z-10 py-24 lg:py-32">
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-genesis-500/20 to-transparent" />

        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={scaleIn}
          >
            <div className="relative overflow-hidden rounded-3xl border border-white/[0.06]">
              {/* Background */}
              <div className="absolute inset-0 bg-gradient-to-br from-genesis-950 via-surface-raised to-genesis-950" />
              <div className="absolute inset-0 bg-hero-glow opacity-40" />
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-genesis-600/10 rounded-full blur-[120px]" />

              {/* Content */}
              <div className="relative z-10 px-6 py-16 sm:px-16 sm:py-28 text-center">
                <motion.div
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  variants={staggerContainer}
                >
                  <motion.h2
                    variants={fadeInUp}
                    className="font-heading text-3xl sm:text-5xl lg:text-6xl font-bold text-white"
                  >
                    Ready to create your
                    <br />
                    <span className="gradient-text">first masterpiece?</span>
                  </motion.h2>
                  <motion.p
                    variants={fadeInUp}
                    className="mx-auto mt-6 max-w-xl text-lg text-gray-400"
                  >
                    Join 50,000+ creators already using Project Genesis to turn their
                    stories into stunning cinema. Start free — no credit card required.
                  </motion.p>
                  <motion.div
                    variants={fadeInUp}
                    className="mt-10 flex flex-col sm:flex-row justify-center gap-4"
                  >
                    <Link href="/register">
                      <Button size="lg" className="text-base px-8 py-4 shadow-xl shadow-genesis-500/20">
                        Start Creating Free
                      </Button>
                    </Link>
                    <a href="#how-it-works">
                      <Button variant="secondary" size="lg" className="text-base px-8 py-4">
                        Learn More
                      </Button>
                    </a>
                  </motion.div>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ────────────────────────── FOOTER ──────────────────────────────── */}
      <footer className="relative z-10 border-t border-white/[0.06] safe-bottom">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 sm:gap-6">
            <div className="flex items-center gap-2.5">
              <span className="text-xl">🎬</span>
              <span className="font-heading text-sm font-bold gradient-text-subtle">
                Project Genesis
              </span>
            </div>

            <div className="flex items-center gap-6 text-sm text-gray-500">
              <a href="#showcase" className="hover:text-gray-300 transition-colors">Showcase</a>
              <a href="#how-it-works" className="hover:text-gray-300 transition-colors">How It Works</a>
              <Link href="/login" className="hover:text-gray-300 transition-colors">Sign In</Link>
              <Link href="/register" className="hover:text-gray-300 transition-colors">Get Started</Link>
            </div>

            <p className="text-sm text-gray-600">
              &copy; {new Date().getFullYear()} Project Genesis. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
