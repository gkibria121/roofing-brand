import Link from "next/link";

export function PageHeader({
  eyebrow,
  title,
  intro,
  crumbs,
}: {
  eyebrow: string;
  title: string;
  intro: string;
  crumbs: { name: string; href?: string }[];
}) {
  return (
    <div className="border-b border-slate-200 bg-gradient-to-b from-brand-50 to-white">
      <div className="container-x py-14 sm:py-20">
        <nav aria-label="Breadcrumb" className="text-sm text-slate-500">
          <ol className="flex items-center gap-2">
            <li><Link href="/" className="hover:text-accent-700">Home</Link></li>
            {crumbs.map((c) => (
              <li key={c.name} className="flex items-center gap-2">
                <span aria-hidden="true">/</span>
                <span aria-current="page" className="font-semibold text-slate-700">{c.name}</span>
              </li>
            ))}
          </ol>
        </nav>
        <p className="eyebrow mt-6">{eyebrow}</p>
        <h1 className="mt-3 max-w-3xl text-4xl font-extrabold sm:text-5xl">{title}</h1>
        <p className="mt-5 max-w-2xl text-lg text-slate-600">{intro}</p>
      </div>
    </div>
  );
}
