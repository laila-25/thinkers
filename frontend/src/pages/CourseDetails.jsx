import { useEffect, useState } from "react";
import { Clock3, Globe2, Signal, ShieldCheck, Star } from "lucide-react";
import { useNavigate, useParams } from "react-router";
import { Helmet } from "react-helmet-async";
import api from "../api/client";
import Button from "../components/Button";
import CourseReviews from "../components/CourseReviews";
import useAuth from "../context/useAuth";
import AIStudyTools from "../features/ai/AIStudyTools";
import { useTranslation } from "react-i18next";
import PageBackground from "../components/PageBackground";

export default function CourseDetails() {
  const { t, i18n } = useTranslation('courses');
  const { slug } = useParams(),
    navigate = useNavigate(),
    { isAuthenticated } = useAuth();
  const [course, setCourse] = useState(null),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    api
      .get(`/api/courses/${slug}`, { signal: controller.signal })
      .then((r) => setCourse(r.data.data))
      .catch(() => { if (!controller.signal.aborted) setError(t('details.notFound')); });
    return () => controller.abort();
  }, [slug, t]);
  const enroll = async () => {
    if (course.type === "paid") return navigate(`/checkout/${course.id}`);
    if (!isAuthenticated) return navigate("/login");
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
        e.response?.data?.message || t('details.enrollmentFailed'),
      );
    } finally {
      setBusy(false);
    }
  };
  if (error && !course)
    return (
      <PageBackground variant="course" className="min-h-[65vh]"><div className="section-shell py-24 text-center text-red-700">
        {error}
      </div></PageBackground>
    );
  if (!course)
    return <PageBackground variant="course" className="min-h-[65vh]"><div className="py-24 text-center">{t('details.loading')}</div></PageBackground>;
  const price =
    course.type === "free"
      ? t('catalog.free')
      : new Intl.NumberFormat(i18n.language, {
          style: "currency",
          currency: course.currency,
        }).format(course.price);
  return (
    <PageBackground variant="course" className="min-h-screen">
      <Helmet>
        <title>{`Thinkers | ${course.title}`}</title>
      </Helmet>
      <section className="border-b border-slate-200 bg-[radial-gradient(circle_at_82%_25%,rgba(245,197,66,0.24),transparent_26%),linear-gradient(180deg,rgba(255,253,245,.88),rgba(250,250,247,.72))] py-20 backdrop-blur-[2px] dark:border-slate-700 dark:bg-[radial-gradient(circle_at_82%_25%,rgba(245,197,66,.12),transparent_28%),linear-gradient(180deg,rgba(15,23,42,.9),rgba(15,26,44,.8))]">
        <div className="section-shell grid gap-12 lg:grid-cols-[1fr_360px]">
          <div>
            <p className="section-kicker">
              {course.category?.name}
            </p>
            <h1 className="mt-5 max-w-4xl text-4xl font-bold tracking-[-0.04em] text-slate-950 sm:text-5xl lg:text-6xl">
              {course.title}
            </h1>
            <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-600">
              {course.short_description}
            </p>
            <p className="mt-7 text-sm text-slate-500">
              {t('details.createdBy')}{" "}
              <strong className="text-slate-900">{course.instructor?.name}</strong>
            </p>
            <div className="mt-6 flex items-center gap-2 text-amber-600">
              <Star className="h-5 w-5 fill-current" />
              <strong>
                {course.review_count
                  ? Number(course.average_rating).toFixed(1)
                  : t('card.new')}
              </strong>
              <span className="text-slate-500">
                ({t('reviews.count', { count: course.review_count })})
              </span>
            </div>
            <div className="mt-7 flex flex-wrap gap-5 text-sm text-slate-600">
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
                {t('details.duration', { count: course.duration })}
              </span>
            </div>
          </div>
          <aside className="self-start rounded-[1.5rem] border border-white/70 bg-white/88 p-7 text-slate-900 shadow-[0_30px_80px_-38px_rgba(99,69,18,.42)] backdrop-blur-xl dark:border-slate-700 dark:bg-slate-900/88">
            <div className="text-3xl font-bold tracking-[-0.04em]">{price}</div>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              {t('details.access')}
            </p>
            <Button
              className="mt-6 w-full"
              onClick={enroll}
              disabled={busy}
            >
              {busy
                ? t('details.enrolling')
                : course.type === "free"
                  ? t('details.enroll')
                  : t('checkout:continue')}
            </Button>
            {error && <p className="mt-4 text-sm text-red-700">{error}</p>}
            <div className="mt-6 flex gap-3 border-t border-slate-200 pt-5 text-sm text-slate-600">
              <ShieldCheck className="h-5 w-5 text-[#F5C542]" />
              {t('details.reviewed')}
            </div>
          </aside>
        </div>
      </section>
      <section className="section-shell grid gap-12 py-20 lg:grid-cols-[1fr_280px]">
        <div>
          <h2 className="text-3xl font-bold tracking-[-0.04em] text-slate-950">
            {t('details.about')}
          </h2>
          <div className="lesson-content mt-6 text-lg leading-8 text-slate-600" dangerouslySetInnerHTML={{ __html: course.description || '' }} />
        </div>
        <div className="rounded-[1.5rem] border border-white/70 bg-white/82 p-6 shadow-[0_24px_70px_-44px_rgba(15,23,42,.38)] backdrop-blur-xl dark:border-slate-700 dark:bg-slate-900/82">
          <h3 className="font-bold text-slate-950">{t('details.overview')}</h3>
          <p className="mt-5 capitalize text-slate-600">{course.level}</p>
          <p className="mt-3 text-slate-600">{course.language}</p>
          <p className="mt-3 text-slate-600">{t('details.duration', { count: course.duration })}</p>
        </div>
      </section>
      {isAuthenticated && <AIStudyTools context={{ courseTitle: course.title, description: course.description, category: course.category?.name, level: course.level, duration: course.duration, nextLesson: t('details.begin') }} />}
      <CourseReviews course={course} />
    </PageBackground>
  );
}
