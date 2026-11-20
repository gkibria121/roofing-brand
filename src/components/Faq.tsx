import { faqs } from "@/lib/services";

export function Faq() {
  return (
    <section className="section" aria-labelledby="faq-heading">
      <div className="container-x grid gap-10 lg:grid-cols-[1fr_1.6fr]">
        <div>
          <p className="eyebrow">FAQ</p>
          <h2 id="faq-heading" className="mt-3 text-3xl font-extrabold sm:text-4xl">Common roofing questions</h2>
          <p className="mt-4 text-slate-600">Can’t find your answer? Call us — we’re happy to help.</p>
        </div>
        <div className="divide-y divide-slate-200 rounded-2xl border border-slate-200">
          {faqs.map((f) => (
            <details key={f.q} className="group p-5 open:bg-slate-50">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-heading font-bold text-brand-900 [&::-webkit-details-marker]:hidden">
                {f.q}
                <svg className="size-5 shrink-0 transition-transform group-open:rotate-180" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </summary>
              <p className="mt-3 text-slate-600">{f.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
