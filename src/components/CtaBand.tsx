import Link from "next/link";
import { site } from "@/lib/site";

export function CtaBand({
  title = "Ready for a roof or fence you can count on?",
  text,
}: {
  title?: string;
  text?: string;
} = {}) {
  return (
    <section className="bg-brand-900" aria-labelledby="cta-heading">
      <div className="container-x flex flex-col items-start justify-between gap-6 py-14 md:flex-row md:items-center">
        <div>
          <h2 id="cta-heading" className="text-3xl font-extrabold text-white">{title}</h2>
          <p className="mt-2 text-brand-100">
            {text ?? `Get a free, no-obligation written estimate from ${site.shortName}.`}
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link href="/estimate" className="btn btn-primary btn-lg">Get a Quote</Link>
          <a href={`tel:${site.phoneHref}`} className="btn btn-lg border-2 border-white/70 text-white hover:bg-white/10">
            Call {site.phone}
          </a>
        </div>
      </div>
    </section>
  );
}
