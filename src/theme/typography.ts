// Vision §Design: tipografia pulita. A small, fixed set of text styles
// instead of ad hoc fontSize/fontWeight pairs scattered per screen.
export const typography = {
  title: { fontSize: 24, fontWeight: '700' as const },
  heading: { fontSize: 22, fontWeight: '700' as const },
  sectionTitle: { fontSize: 16, fontWeight: '700' as const },
  body: { fontSize: 16 },
  caption: { fontSize: 12 },
} as const;
