export default function SectionTitle({ kicker, title, id }: { kicker?: string; title: string; id?: string }) {
  return (
    <div className="mb-6">
      {kicker && <p className="font-script text-2xl text-gold">{kicker}</p>}
      <h2 id={id} className="font-display text-4xl uppercase leading-none sm:text-5xl">
        {title}
      </h2>
      <div className="rule mt-4 w-40" />
    </div>
  );
}
