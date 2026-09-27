import { ArrowRight } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

const EASE = [0.22, 1, 0.36, 1] as const;

/**
 * Homepage hero: Math Reasoning Canvas is the single primary call to action.
 * The wrapper ignores pointer events so the 3D universe stays interactive around
 * the panel; only the panel itself receives clicks and focus.
 * Once the visitor starts exploring the universe (`compact`), the panel collapses
 * into a pill above the filter bar so nodes at the centre of the scene stay reachable.
 */
export default function HomeHero({ compact }: { compact: boolean }) {
  const { t } = useTranslation();
  const reduceMotion = useReducedMotion();
  const enter = (delay: number) =>
    reduceMotion
      ? { initial: { opacity: 1 }, animate: { opacity: 1 }, transition: { duration: 0 } }
      : { initial: { opacity: 0, y: 14 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.7, delay, ease: EASE } };
  const exit = reduceMotion ? { opacity: 0, transition: { duration: 0 } } : { opacity: 0, y: 8, transition: { duration: 0.2 } };

  const cta = (
    <Link
      to="/canvas"
      data-testid="home-primary-cta"
      className={`group inline-flex min-h-[48px] shrink-0 items-center gap-2 rounded-full bg-cyan-300 font-semibold text-slate-950 shadow-[0_0_28px_rgba(34,211,238,0.35)] transition-[background-color,box-shadow,transform] duration-200 hover:bg-cyan-200 hover:shadow-[0_0_36px_rgba(34,211,238,0.5)] focus:outline-none focus-visible:ring-4 focus-visible:ring-white/80 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0d1117] active:scale-[0.98] motion-reduce:transition-none motion-reduce:active:scale-100 ${compact ? 'px-5 py-2.5 text-sm' : 'px-7 py-3 text-base'}`}
    >
      {t('hero.cta')}
      <ArrowRight aria-hidden className="h-5 w-5 transition-transform duration-200 group-hover:translate-x-0.5 motion-reduce:transition-none motion-reduce:group-hover:translate-x-0" />
    </Link>
  );

  return (
    <AnimatePresence mode="wait" initial={false}>
      {compact ? (
        <div key="compact" className="pointer-events-none absolute inset-x-0 bottom-28 flex justify-center px-4 sm:bottom-32">
          <motion.section
            {...enter(0)}
            exit={exit}
            aria-label="Math Reasoning Canvas"
            data-testid="home-hero"
            data-variant="compact"
            className="pointer-events-auto flex max-w-full items-center gap-4 rounded-full border border-white/10 bg-[#0d1117]/75 py-1.5 pl-5 pr-1.5 shadow-[0_12px_40px_rgba(0,0,0,0.45),0_0_40px_rgba(99,102,241,0.12)] backdrop-blur-xl"
          >
            <span className="truncate font-['Space_Grotesk'] text-sm font-semibold text-white">
              Math Reasoning <span className="text-cyan-300">Canvas</span>
            </span>
            {cta}
          </motion.section>
        </div>
      ) : (
        <div key="full" className="pointer-events-none absolute inset-x-0 top-32 bottom-28 flex items-center justify-center px-4 sm:bottom-32">
          <motion.section
            {...enter(0.15)}
            exit={exit}
            aria-labelledby="home-hero-title"
            data-testid="home-hero"
            data-variant="full"
            className="pointer-events-auto relative w-full max-w-xl rounded-3xl border border-white/10 bg-[#0d1117]/70 px-6 py-8 text-center shadow-[0_24px_80px_rgba(0,0,0,0.45),0_0_60px_rgba(99,102,241,0.12)] backdrop-blur-xl sm:px-10 sm:py-10"
          >
            <div aria-hidden className="pointer-events-none absolute inset-x-10 -top-px h-px bg-gradient-to-r from-transparent via-cyan-300/60 to-transparent" />
            <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-cyan-300/90">{t('hero.eyebrow')}</p>
            <h2 id="home-hero-title" className="mt-3 font-['Space_Grotesk'] text-4xl font-bold leading-[1.05] tracking-tight text-white sm:text-5xl lg:text-6xl">
              Math Reasoning{' '}
              <span className="bg-gradient-to-r from-indigo-300 via-sky-300 to-cyan-300 bg-clip-text text-transparent">Canvas</span>
            </h2>
            <p className="mt-4 text-lg font-medium text-slate-100 sm:text-xl">{t('hero.subtitle')}</p>
            <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-slate-300 sm:text-base">{t('hero.body')}</p>
            <motion.div {...enter(0.35)} className="mt-7 flex justify-center">{cta}</motion.div>
            <p className="mt-5 text-xs text-slate-400">{t('hero.features')}</p>
          </motion.section>
        </div>
      )}
    </AnimatePresence>
  );
}
