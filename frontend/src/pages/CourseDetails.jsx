import { useEffect, useState } from "react";
import { Clock3, Globe2, Signal, ShieldCheck, Star } from "lucide-react";
import { useNavigate, useParams } from "react-router";
import { Helmet } from "react-helmet-async";
import api from "../api/client";
import Button from "../components/Button";
import CourseReviews from "../components/CourseReviews";
import useAuth from "../context/useAuth";

export default function CourseDetails() {
  const { slug } = useParams(),
    navigate = useNavigate(),
    { isAuthenticated } = useAuth();
  const [course, setCourse] = useState(null),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  useEffect(() => {
    api
      .get(`/api/courses/${slug}`)
      .then((r) => setCourse(r.data.data))
      .catch(() => setError("Course not found or no longer published."));
  }, [slug]);
  const enroll = async () => {
    if (!isAuthenticated) return navigate("/login");
    if (course.type !== "free")
      return setError("Paid enrollment is not available yet.");
    setBusy(true);
    try {
      const { data } = await api.post(`/api/courses/${course.id}/enroll`);
      navigate(`/learn/${data.data.id}`);
    } catch (e) {
      if (
        e.response?.status === 422 &&
        e.response?.data?.errors?.course?.[0]?.includes("already enrolled")
      ) {
        const { data } = await api.get("/api/enrollments");
        const existing = data.data?.find(
          (item) => item.course.id === course.id,
        );
        if (existing && existing.status !== "cancelled")
          return navigate(`/learn/${existing.id}`);
      }
      setError(
        e.response?.data?.message || "Enrollment could not be completed.",
      );
    } finally {
      setBusy(false);
    }
  };
  if (error && !course)
    return (
      <div className="section-shell py-24 text-center text-red-700">
        {error}
      </div>
    );
  if (!course)
    return <div className="py-24 text-center">Loading course...</div>;
  const price =
    course.type === "free"
      ? "Free"
      : new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: course.currency,
        }).format(course.price);
  return (
    <div>
      <Helmet>
        <title>{`Thinkers | ${course.title}`}</title>
      </Helmet>
      <section className="bg-[linear-gradient(180deg,#0B132B_0%,#101b35_100%)] py-20 text-white">
        <div className="section-shell grid gap-12 lg:grid-cols-[1fr_360px]">
          <div>
            <p className="section-kicker text-amber-300">
              {course.category?.name}
            </p>
            <h1 className="mt-5 max-w-4xl text-4xl font-bold tracking-[-0.04em] text-white sm:text-5xl lg:text-6xl">
              {course.title}
            </h1>
            <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-300">
              {course.short_description}
            </p>
            <p className="mt-7 text-sm text-slate-400">
              Created by{" "}
              <strong className="text-white">{course.instructor?.name}</strong>
            </p>
            <div className="mt-6 flex items-center gap-2 text-amber-300">
              <Star className="h-5 w-5 fill-current" />
              <strong>
                {course.review_count
                  ? Number(course.average_rating).toFixed(1)
                  : "New"}
              </strong>
              <span className="text-slate-400">
                ({course.review_count} reviews)
              </span>
            </div>
            <div className="mt-7 flex flex-wrap gap-5 text-sm text-slate-300">
              <span className="flex gap-2">
                <Signal className="h-5 w-5 text-[#F5C542]" />
                {course.level}
              </span>
              <span className="flex gap-2">
                <Globe2 className="h-5 w-5 text-[#F5C542]" />
                {course.language}
              </span>
              <span className="flex gap-2">
                <Clock3 className="h-5 w-5 text-[#F5C542]" />
                {course.duration} minutes
              </span>
            </div>
          </div>
          <aside className="self-start rounded-[1.5rem] border border-white/10 bg-white p-7 text-slate-900 shadow-[0_20px_60px_-30px_rgba(15,23,42,0.45)]">
            <div className="text-3xl font-bold tracking-[-0.04em]">{price}</div>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Full access to all published course content.
            </p>
            <Button
              className="mt-6 w-full"
              onClick={enroll}
              disabled={busy || course.type !== "free"}
            >
              {busy
                ? "Enrolling..."
                : course.type === "free"
                  ? "Enroll now"
                  : "Paid enrollment unavailable"}
            </Button>
            {error && <p className="mt-4 text-sm text-red-700">{error}</p>}
            <div className="mt-6 flex gap-3 border-t border-slate-200 pt-5 text-sm text-slate-600">
              <ShieldCheck className="h-5 w-5 text-[#F5C542]" />
              Reviewed learning experience
            </div>
          </aside>
        </div>
      </section>
      <section className="section-shell grid gap-12 py-20 lg:grid-cols-[1fr_280px]">
        <div>
          <h2 className="text-3xl font-bold tracking-[-0.04em] text-slate-950">
            About this course
          </h2>
          <div className="mt-6 whitespace-pre-line text-lg leading-8 text-slate-600">
            {course.description}
          </div>
        </div>
        <div className="rounded-[1.5rem] border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="font-bold text-slate-950">Course overview</h3>
          <p className="mt-5 capitalize text-slate-600">{course.level}</p>
          <p className="mt-3 text-slate-600">{course.language}</p>
          <p className="mt-3 text-slate-600">{course.duration} minutes</p>
        </div>
      </section>
      <CourseReviews course={course} />
    </div>
  );
}
