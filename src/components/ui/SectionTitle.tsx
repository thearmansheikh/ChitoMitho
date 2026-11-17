/** Section heading with a short red tab, used to give pages a steady rhythm. */
export default function SectionTitle({ id, children }: { id?: string; children: React.ReactNode }) {
  return (
    <h2 id={id} className="flex items-center gap-2.5 text-xl font-bold">
      <span aria-hidden className="h-6 w-1.5 rounded-full bg-brand-red" />
      {children}
    </h2>
  );
}
