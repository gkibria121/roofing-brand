type Props = { data: Record<string, unknown> | Record<string, unknown>[] };

/** Renders schema.org JSON-LD. `<` is escaped to prevent script injection. */
export function JsonLd({ data }: Props) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}
