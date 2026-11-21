import Link from "next/link";

export interface BreadcrumbCrumb {
  name: string;
  href?: string;
}

export function PageHeader({
  eyebrow,
  title,
  intro,
  crumbs,
  currentPath,
}: {
  eyebrow: string;
  title: string;
  intro: string;
  crumbs: BreadcrumbCrumb[];
  /** Canonical path of the current page so the final breadcrumb item stays a consistent link with aria-current="page". */
  currentPath?: string;
}) {
  return (
    <div className="border-b border-slate-200 bg-gradient-to-b from-brand-50 to-white">
      <div className="container-x py-14 sm:py-20">
        <nav aria-label="Breadcrumbs" className="breadcrumb text-sm text-slate-600">
          <ol>
            <li>
              <Link href="/" className="underline-offset-4 hover:text-accent-700 hover:underline">
                Home
              </Link>
            </li>
            {crumbs.map((c, idx) => {
              const isLast = idx === crumbs.length - 1;
              const targetHref = isLast ? (c.href ?? currentPath) : c.href;

              return (
                <li key={`${c.name}-${idx}`}>
                  {isLast ? (
                    targetHref ? (
                      <Link
                        href={targetHref}
                        aria-current="page"
                        className="font-semibold text-brand-900 hover:underline"
                      >
                        {c.name}
                      </Link>
                    ) : (
                      <span aria-current="page" className="font-semibold text-brand-900">
                        {c.name}
                      </span>
                    )
                  ) : targetHref ? (
                    <Link
                      href={targetHref}
                      className="underline-offset-4 hover:text-accent-700 hover:underline"
                    >
                      {c.name}
                    </Link>
                  ) : (
                    <span>{c.name}</span>
                  )}
                </li>
              );
            })}
          </ol>
        </nav>
        <p className="eyebrow mt-6">{eyebrow}</p>
        <h1 className="mt-3 max-w-3xl text-4xl font-extrabold sm:text-5xl">{title}</h1>
        <p className="mt-5 max-w-2xl text-lg text-slate-600">{intro}</p>
      </div>
    </div>
  );
}
