export const STATUS_COLOR_MAP = {
  // Application pipeline
  Applied: {
    bg: "var(--surface)",
    text: "var(--text-secondary)",
    border: "var(--border)",
  },
  Reviewed: {
    bg: "rgba(46, 64, 112, 0.1)",
    text: "var(--secondary)",
    border: "var(--secondary)",
  },
  Shortlisted: {
    bg: "rgba(201, 168, 76, 0.12)",
    text: "var(--accent-dark)",
    border: "var(--accent)",
  },
  Interview: {
    bg: "rgba(176, 125, 42, 0.12)",
    text: "var(--warning)",
    border: "var(--warning)",
  },
  Offered: {
    bg: "rgba(30, 107, 60, 0.12)",
    text: "var(--success)",
    border: "var(--success)",
  },
  Rejected: {
    bg: "rgba(139, 26, 26, 0.1)",
    text: "var(--danger)",
    border: "var(--danger)",
  },
} as const;

export type ApplicationStatus = keyof typeof STATUS_COLOR_MAP;
