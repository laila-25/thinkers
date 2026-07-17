import { useEffect, useState } from "react";
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  Check,
  CirclePlay,
  Globe2,
  MessageCircle,
  ShieldCheck,
  Sparkles,
  Star,
  UsersRound,
} from "lucide-react";
import { Link } from "react-router";
import { m, useMotionValue, useReducedMotion, useSpring, useTransform } from "framer-motion";
import api from "../api/client";
import Button from "../components/Button";
import CourseCard from "../components/CourseCard";
import CategoryCard from "../components/CategoryCard";

const benefits = [
  [
    ShieldCheck,
    "Quality reviewed",
    "Courses follow a clear approval workflow before they reach learners.",
  ],
  [
    CirclePlay,
    "Learn by doing",
    "Structured lessons, resources, progress tracking, and assessments in one place.",
  ],
  [
    UsersRound,
    "Expert-led learning",
    "Learn from approved instructors with practical, focused curricula.",
  ],
];

const heroItem = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.62, ease: [0.22, 1, 0.36, 1] } },
};

export default function Landing() {
  const reduceMotion = useReducedMotion();
  const pointerX = useMotionValue(0);
  const pointerY = useMotionValue(0);
  const smoothX = useSpring(pointerX, { stiffness: 75, damping: 22, mass: 0.55 });
  const smoothY = useSpring(pointerY, { stiffness: 75, damping: 22, mass: 0.55 });
  const contentX = useTransform(smoothX, value => value * -5);
  const contentY = useTransform(smoothY, value => value * -3);
  const artX = useTransform(smoothX, value => value * 14);
  const artY = useTransform(smoothY, value => value * 9);
  const glowX = useTransform(smoothX, value => value * 150);
  const glowY = useTransform(smoothY, value => value * 90);

  const trackPointer = event => {
    if (reduceMotion || event.pointerType !== 'mouse') return;
    const bounds = event.currentTarget.getBoundingClientRect();
    pointerX.set((event.clientX - bounds.left) / bounds.width - 0.5);
    pointerY.set((event.clientY - bounds.top) / bounds.height - 0.5);
  };

  const resetPointer = () => {
    pointerX.set(0);
    pointerY.set(0);
  };
  const [courses, setCourses] = useState([]),
    [categories, setCategories] = useState([]);
  useEffect(() => {
    api
      .get("/api/courses", { params: { per_page: 3 } })
      .then((r) => setCourses(r.data.data.slice(0, 3)))
      .catch(() => {});
    api
      .get("/api/categories")
      .then((r) => setCategories(r.data.data.slice(0, 6)))
      .catch(() => {});
  }, []);
  return (
    <div className="overflow-hidden bg-white">
      <section className="relative page-section pb-20 pt-28 sm:pt-32 lg:pb-28" onPointerMove={trackPointer} onPointerLeave={resetPointer}>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_78%_28%,rgba(245,197,66,0.20),transparent_26%),linear-gradient(180deg,rgba(255,251,235,0.72),rgba(255,255,255,0))]" />
        <m.div
          aria-hidden="true"
          className="pointer-events-none absolute left-[62%] top-[38%] hidden h-72 w-72 -ml-36 -mt-36 rounded-full bg-amber-300/15 blur-3xl lg:block"
          style={reduceMotion ? undefined : { x: glowX, y: glowY }}
        />
        <div className="section-shell relative grid items-center gap-14 lg:grid-cols-[0.88fr_1.12fr] xl:gap-20">
          <m.div
            className="max-w-2xl"
            style={reduceMotion ? undefined : { x: contentX, y: contentY }}
            initial={reduceMotion ? false : "hidden"}
            animate="visible"
            variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.11, delayChildren: 0.12 } } }}
          >
            <m.span variants={heroItem} className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50/70 px-4 py-2 text-sm font-semibold text-[#0B132B]">
              <Sparkles className="h-4 w-4 text-amber-500" /> Learn with
              purpose. Grow with confidence.
            </m.span>
            <m.h1 variants={heroItem} className="mt-7 text-5xl font-bold leading-[1.04] tracking-[-0.04em] text-[#0B132B] sm:text-6xl lg:text-[4.25rem]">
              Learning that turns ambition into{" "}
              <span className="relative whitespace-nowrap">
                real progress.
                <span className="absolute -bottom-1 left-0 h-2 w-full -rotate-1 rounded-full bg-[#F5C542]/45" />
              </span>
            </m.h1>
            <m.p variants={heroItem} className="mt-7 max-w-xl text-lg leading-8 text-slate-600">
              Build in-demand skills with expert-led courses, structured
              learning paths, and progress you can measure from day one.
            </m.p>
            <m.div variants={heroItem} className="mt-9 flex flex-col gap-3 sm:flex-row">
              <m.div
                initial={reduceMotion ? false : { scale: 1 }}
                animate={reduceMotion ? undefined : { scale: [1, 1.025, 1], boxShadow: ["0 0 0 rgba(245,197,66,0)", "0 0 24px rgba(245,197,66,0.28)", "0 0 0 rgba(245,197,66,0)"] }}
                transition={{ delay: 1.15, duration: 1.25, ease: "easeInOut" }}
                whileHover={reduceMotion ? undefined : { scale: 1.035, boxShadow: "0 0 26px rgba(245,197,66,0.32)" }}
                className="rounded-xl"
              >
                <Link to="/courses" className="group block">
                  <Button size="lg" className="w-full gap-2 px-7 sm:w-auto">
                    Explore Courses <ArrowRight className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
                  </Button>
                </Link>
              </m.div>
              <Link to="/register">
                <Button
                  size="lg"
                  variant="secondary"
                  className="w-full px-7 sm:w-auto"
                >
                  Become an Instructor
                </Button>
              </Link>
            </m.div>
            <m.div variants={heroItem} className="mt-9 flex flex-wrap gap-x-6 gap-y-3 text-sm font-medium text-slate-600">
              <span className="flex items-center gap-2">
                <span className="grid h-5 w-5 place-items-center rounded-full bg-amber-100">
                  <Check className="h-3.5 w-3.5 text-amber-700" />
                </span>
                Free courses available
              </span>
              <span className="flex items-center gap-2">
                <span className="grid h-5 w-5 place-items-center rounded-full bg-amber-100">
                  <Check className="h-3.5 w-3.5 text-amber-700" />
                </span>
                Track every milestone
              </span>
            </m.div>
          </m.div>
          <m.div style={reduceMotion ? undefined : { x: artX, y: artY }}>
            <HeroIllustration />
          </m.div>
        </div>
      </section>

      <FeaturesSection />
      <AboutSection />

      <section id="categories" className="bg-slate-50 page-section">
        <div className="section-shell">
          <div className="flex items-end justify-between">
            <div>
              <p className="section-kicker">Explore topics</p>
              <h2 className="section-title">Popular categories</h2>
            </div>
            <Link
              to="/courses"
              className="hidden font-semibold text-slate-700 sm:block"
            >
              Browse all <ArrowRight className="inline h-4 w-4" />
            </Link>
          </div>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {categories.length ? (
              categories.map((category, index) => (
                <CategoryCard key={category.id} category={category} index={index} />
              ))
            ) : (
              <p className="text-slate-500">
                Categories will appear here when available.
              </p>
            )}
          </div>
        </div>
      </section>

      <section className="page-section">
        <div className="section-shell">
          <div className="flex items-end justify-between">
            <div>
              <p className="section-kicker">Start learning</p>
              <h2 className="section-title">Featured courses</h2>
            </div>
            <Link
              to="/courses"
              className="hidden font-semibold text-slate-700 sm:block"
            >
              View all courses <ArrowRight className="inline h-4 w-4" />
            </Link>
          </div>
          <div className="mt-10 grid gap-7 md:grid-cols-2 lg:grid-cols-3">
            {courses.length ? (
              courses.map((course, index) => (
                <CourseCard key={course.id} course={course} index={index} />
              ))
            ) : (
              <div className="col-span-full rounded-2xl bg-slate-50 p-10 text-center text-slate-500">
                Published courses will appear after approval.
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="page-section">
        <div className="section-shell text-center">
          <p className="section-kicker">How it works</p>
          <h2 className="section-title">
            A simple path from interest to progress.
          </h2>
          <div className="mt-14 grid gap-8 md:grid-cols-3">
            {[
              [
                "01",
                "Find your course",
                "Browse reviewed courses and choose a learning goal.",
              ],
              [
                "02",
                "Learn step by step",
                "Follow focused sections, lessons, and resources.",
              ],
              [
                "03",
                "Prove your progress",
                "Complete assessments and watch your progress grow.",
              ],
            ].map(([n, title, text]) => (
              <div
                key={n}
                className="relative rounded-2xl bg-slate-50 p-8 text-left"
              >
                <span className="text-4xl font-bold text-amber-400">{n}</span>
                <h3 className="mt-5 text-xl font-bold">{title}</h3>
                <p className="mt-3 leading-7 text-slate-600">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-amber-50 page-section">
        <div className="section-shell grid items-center gap-12 lg:grid-cols-2">
          <div>
            <p className="section-kicker">For instructors</p>
            <h2 className="section-title">
              Turn your expertise into structured learning.
            </h2>
            <p className="mt-5 max-w-xl leading-7 text-slate-600">
              Build sections, lessons, videos, resources, and assessments with a
              professional workflow and clear moderation.
            </p>
            <Link to="/register" className="mt-8 inline-block">
              <Button size="lg">Start teaching</Button>
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              [BookOpen, "Flexible course builder"],
              [BarChart3, "Enrollment statistics"],
              [MessageCircle, "Clear review workflow"],
              [Globe2, "Reach learners anywhere"],
            ].map(([Icon, text]) => (
              <div
                key={text}
                className="flex items-center gap-4 rounded-2xl bg-white p-5 shadow-sm"
              >
                <Icon className="h-6 w-6 text-amber-600" />
                <strong>{text}</strong>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="page-section">
        <div className="section-shell">
          <div className="text-center">
            <p className="section-kicker">Learner stories</p>
            <h2 className="section-title">Built for meaningful progress.</h2>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {[
              [
                "“The structure keeps me focused without feeling overwhelmed.”",
                "Maya R.",
                "Product learner",
              ],
              [
                "“I can see exactly where I left off and what comes next.”",
                "Omar K.",
                "Software learner",
              ],
              [
                "“The course builder makes my material feel organized and professional.”",
                "Lina A.",
                "Instructor",
              ],
            ].map(([quote, name, role]) => (
              <figure
                key={name}
                className="rounded-2xl border border-slate-200 p-7"
              >
                <div className="flex gap-1 text-amber-500">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star key={i} className="h-4 w-4 fill-current" />
                  ))}
                </div>
                <blockquote className="mt-5 leading-7 text-slate-700">
                  {quote}
                </blockquote>
                <figcaption className="mt-6">
                  <strong>{name}</strong>
                  <span className="block text-sm text-slate-500">{role}</span>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-slate-50 page-section">
        <div className="mx-auto max-w-3xl px-4">
          <div className="text-center">
            <p className="section-kicker">FAQ</p>
            <h2 className="section-title">Questions, answered.</h2>
          </div>
          <div className="mt-10 space-y-3">
            {[
              [
                "Can I start for free?",
                "Yes. Published free courses can be enrolled in directly.",
              ],
              [
                "How are courses published?",
                "Instructor courses go through an admin review and approval workflow.",
              ],
              [
                "Can I track my learning?",
                "Yes. Lesson progress, quiz results, and overall completion are tracked.",
              ],
              [
                "Can I teach on Thinkers?",
                "Create an account, apply as an instructor, and wait for admin approval.",
              ],
            ].map(([q, a]) => (
              <details
                key={q}
                className="group rounded-2xl border border-slate-200 bg-white p-5"
              >
                <summary className="cursor-pointer list-none font-semibold text-slate-900">
                  {q}
                  <span className="float-right text-xl">+</span>
                </summary>
                <p className="mt-4 leading-7 text-slate-600">{a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section id="contact" className="page-section">
        <div className="section-shell">
          <div className="rounded-3xl bg-slate-950 px-6 py-14 text-center text-white sm:px-12">
            <h2 className="text-3xl font-bold tracking-[-0.04em] text-white sm:text-4xl">
              Ready to start learning?
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-slate-300">
              Explore the catalog or get in touch with the Thinkers team.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Link to="/courses">
                <Button size="lg">Explore courses</Button>
              </Link>
              <a href="mailto:hello@thinkers.local">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white/30 text-white hover:bg-white/10"
                >
                  Contact us
                </Button>
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function FeaturesSection() {
  return (
    <section id="features" className="bg-slate-50 page-section">
      <div className="section-shell">
        <div className="max-w-2xl">
          <p className="section-kicker">Why Thinkers</p>
          <h2 className="mt-3 text-3xl font-bold tracking-[-0.04em] text-[#0B132B] sm:text-4xl lg:text-5xl">Everything you need to keep learning moving.</h2>
        </div>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {benefits.map(([Icon, title, text]) => (
            <div key={title} className="rounded-2xl border border-slate-200 bg-white p-7 shadow-[0_18px_48px_-36px_rgba(15,23,42,0.28)]">
              <Icon className="h-7 w-7 text-[#0B132B]" />
              <h3 className="mt-6 text-xl font-bold tracking-[-0.03em] text-[#0B132B]">{title}</h3>
              <p className="mt-3 leading-7 text-[#4A4A4A]">{text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function AboutSection() {
  const values = [
    ['Focused', 'Learning paths without unnecessary noise.'],
    ['Flexible', 'Learn at your own pace, on any device.'],
    ['Measurable', 'Progress and assessment built in.'],
  ];

  return (
    <section id="about" className="page-section">
      <div className="section-shell grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
        <div>
          <p className="section-kicker">About Thinkers</p>
          <h2 className="section-title">A clearer way to learn online.</h2>
          <p className="mt-5 leading-7 text-slate-600">We built Thinkers around what matters: trustworthy instructors, thoughtfully structured content, and learning progress you can see.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          {values.map(([title, text]) => (
            <div key={title} className="rounded-2xl border border-slate-200 p-6">
              <h3 className="font-bold text-slate-950">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function HeroIllustration() {
  const reduceMotion = useReducedMotion();

  return (
    <m.div
      className="relative mx-auto w-full max-w-[760px] lg:mx-0"
      aria-label="Thinkers bulb logo animation"
      initial={reduceMotion ? false : { opacity: 0, scale: 0.92, y: 18 }}
      animate={reduceMotion ? undefined : { opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 1, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
    >
      <m.div
        className="relative mx-auto flex min-h-[520px] w-full items-center justify-center lg:min-h-[640px]"
        animate={reduceMotion ? undefined : { y: [0, -10, 0] }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
      >
        <m.div
          className="absolute h-[330px] w-[330px] rounded-full bg-[radial-gradient(circle,rgba(245,197,66,0.34)_0%,rgba(245,197,66,0.13)_38%,transparent_70%)] blur-2xl"
          initial={reduceMotion ? false : { opacity: 0, scale: 0.55 }}
          animate={reduceMotion ? { opacity: 0.38 } : { opacity: [0, 0.5, 0.35, 0.5], scale: [0.55, 1, 0.94, 1] }}
          transition={reduceMotion ? undefined : { duration: 7, times: [0, 0.3, 0.65, 1], repeat: Infinity, repeatDelay: 0.4, ease: "easeInOut" }}
        >
        </m.div>
        <m.img
          src="/favicon.png"
          alt="Thinkers light bulb"
          className="relative z-10 h-[300px] w-[300px] select-none object-contain sm:h-[360px] sm:w-[360px]"
          initial={reduceMotion ? false : { filter: "brightness(0.42) saturate(0.65) drop-shadow(0 0 0 rgba(245,197,66,0))" }}
          animate={reduceMotion ? undefined : { filter: ["brightness(0.42) saturate(0.65) drop-shadow(0 0 0 rgba(245,197,66,0))", "brightness(1) saturate(1) drop-shadow(0 0 22px rgba(245,197,66,0.46))", "brightness(0.94) saturate(1) drop-shadow(0 0 14px rgba(245,197,66,0.30))", "brightness(1) saturate(1) drop-shadow(0 0 22px rgba(245,197,66,0.46))"] }}
          transition={{ duration: 7, times: [0, 0.3, 0.65, 1], repeat: Infinity, repeatDelay: 0.4, ease: "easeInOut" }}
        />
      </m.div>
    </m.div>
  );
}
