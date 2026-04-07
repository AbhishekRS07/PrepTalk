/**
 * Shared Framer Motion animation variants used across dashboard pages.
 * Import the ones you need instead of redefining them per file.
 */

/** Stagger wrapper — animate children one after another */
export const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12, delayChildren: 0.05 } },
};

/** Fade up for headings / single lines */
export const lineVariants = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
};

/**
 * Fade up for sections — accepts a custom `i` delay multiplier.
 * Usage: <motion.div custom={i} variants={sectionVariants} />
 */
export const sectionVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.5, delay: i * 0.12, ease: [0.22, 1, 0.36, 1] },
  }),
};

/**
 * Fade up for cards in a list — slightly tighter timing than sectionVariants.
 * Usage: <motion.div custom={i} variants={fadeUp} />
 */
export const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.45, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] },
  }),
};

/** List container — stagger for list items */
export const listContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06, delayChildren: 0.05 } },
};

/** Individual list item inside a listContainer */
export const listItem = {
  hidden: { opacity: 0, y: 18, scale: 0.98 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } },
};
