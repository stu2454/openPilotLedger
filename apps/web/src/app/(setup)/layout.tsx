export default function SetupLayout({ children }: { children: React.ReactNode }) {
  // This layout exists to ensure views are initialised at least once.
  // In production you'd run a migration job or init script instead.
  fetch("/api/_setup").catch(()=>{});
  return children as any;
}
