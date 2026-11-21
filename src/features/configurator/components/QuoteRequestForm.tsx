"use client";

import { useCallback, useEffect, useId, useRef, useState, type ReactNode } from "react";
import { services } from "@/lib/services";
import { site } from "@/lib/site";
import {
  MAX_ATTACHMENTS,
  MAX_ATTACHMENT_BYTES,
  type CustomQuoteInquiry,
} from "../domain/schemas";
import {
  validateCustomQuoteField,
  validateCustomQuoteInquiry,
  type CustomQuoteField,
} from "../domain/validation";

export interface AttachedFile {
  id: string;
  name: string;
  size: number;
  type: string;
}

export interface QuoteSubmissionPayload {
  subject: string;
  body: string;
  confirmation?: ReactNode;
}

export const QUICK_QUOTE_SERVICE_OPTIONS: readonly string[] = [
  ...services.map((s) => s.title),
  "Roofing + Custom Fencing",
  "Roof Inspection",
  "Other",
];

const FIELD_LABELS: Partial<Record<CustomQuoteField, string>> = {
  service: "Service",
  name: "Your name",
  address: "Your address",
  phone: "Your phone number",
  email: "Your email",
  notes: "Notes",
  acceptedTerms: "Terms of Use",
};

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

type QuoteRequestFormProps = {
  serviceOptions: readonly string[];
  defaultService?: string;
  allowEmptyService?: boolean;
  defaultAddress?: string;
  submitLabel?: string;
  autoFocusFirstField?: boolean;
  compact?: boolean;
  className?: string;
  formAriaLabelledBy?: string;
  buildSubmission?: (data: CustomQuoteInquiry, attachments: readonly AttachedFile[]) => QuoteSubmissionPayload;
};

/**
 * Reusable quote request form matching the shared Zod schema (`CustomQuoteInquirySchema`),
 * supporting drag-and-drop attachments, blur-time field validation, and accessible live feedback.
 */
export function QuoteRequestForm({
  serviceOptions,
  defaultService = "",
  allowEmptyService = false,
  defaultAddress = "",
  submitLabel = "Get a quote",
  autoFocusFirstField = false,
  compact = false,
  className = "",
  formAriaLabelledBy,
  buildSubmission,
}: QuoteRequestFormProps) {
  const uid = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const interactedRef = useRef<Set<CustomQuoteField>>(new Set());
  const announceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const announcedFieldRef = useRef<CustomQuoteField | null>(null);

  const [service, setService] = useState(defaultService);
  const [name, setName] = useState("");
  const [addressValue, setAddressValue] = useState(defaultAddress);
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [marketingOptIn, setMarketingOptIn] = useState(true);
  const [attachments, setAttachments] = useState<AttachedFile[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [announcement, setAnnouncement] = useState("");
  const [submittedConfirmation, setSubmittedConfirmation] = useState<ReactNode | null>(null);

  useEffect(() => {
    return () => {
      if (announceTimerRef.current) clearTimeout(announceTimerRef.current);
    };
  }, []);

  const firstFieldRef = useCallback(
    (el: HTMLSelectElement | null) => {
      if (!el) return;
      if (autoFocusFirstField) {
        el.setAttribute("autofocus", "");
      } else {
        el.removeAttribute("autofocus");
      }
    },
    [autoFocusFirstField],
  );

  function cancelPendingAnnouncement(field?: CustomQuoteField) {
    if (field && announcedFieldRef.current !== field) return;
    if (announceTimerRef.current) {
      clearTimeout(announceTimerRef.current);
      announceTimerRef.current = null;
    }
    if (!field || announcedFieldRef.current === field) {
      announcedFieldRef.current = null;
      setAnnouncement("");
    }
  }

  function scheduleErrorAnnouncement(field: CustomQuoteField, message: string) {
    cancelPendingAnnouncement();
    announcedFieldRef.current = field;
    const prefix = FIELD_LABELS[field] ? `${FIELD_LABELS[field]}: ` : "";
    announceTimerRef.current = setTimeout(() => {
      setAnnouncement(`${prefix}${message}`);
    }, 500);
  }

  function markInteractedAndClear(field: CustomQuoteField) {
    interactedRef.current.add(field);
    cancelPendingAnnouncement(field);
    if (fieldErrors[field]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  }

  function handleFieldBlur<K extends CustomQuoteField>(field: K, value: unknown) {
    if (!interactedRef.current.has(field)) return;
    const err = validateCustomQuoteField(field, value);
    if (err) {
      setFieldErrors((prev) => (prev[field] === err ? prev : { ...prev, [field]: err }));
      scheduleErrorAnnouncement(field, err);
    } else {
      cancelPendingAnnouncement(field);
      setFieldErrors((prev) => {
        if (!prev[field]) return prev;
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  }

  function addFiles(list: FileList | null) {
    if (!list || list.length === 0) return;
    setFileError(null);
    const incoming = Array.from(list);
    const oversized = incoming.find((f) => f.size > MAX_ATTACHMENT_BYTES);
    if (oversized) {
      setFileError(`"${oversized.name}" exceeds the 10 MB per-file limit.`);
      return;
    }
    setAttachments((prev) => {
      const merged = [...prev];
      for (const file of incoming) {
        if (merged.length >= MAX_ATTACHMENTS) {
          setFileError(`You can attach up to ${MAX_ATTACHMENTS} files.`);
          break;
        }
        const duplicate = merged.some((m) => m.name === file.name && m.size === file.size);
        if (!duplicate) {
          merged.push({
            id: `${file.name}-${file.size}-${Date.now()}-${merged.length}`,
            name: file.name,
            size: file.size,
            type: file.type || "application/octet-stream",
          });
        }
      }
      return merged;
    });
  }

  function removeAttachment(id: string) {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
    setFileError(null);
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    cancelPendingAnnouncement();
    const form = e.currentTarget;
    const parsed = validateCustomQuoteInquiry({
      service,
      name,
      address: addressValue,
      phone,
      email,
      notes,
      acceptedTerms,
      marketingOptIn,
      attachments: attachments.map(({ name: n, size, type }) => ({ name: n, size, type })),
    });

    if (!parsed.success) {
      setFieldErrors(parsed.fieldErrors);
      setSubmittedConfirmation(null);
      for (const key of Object.keys(parsed.fieldErrors)) {
        interactedRef.current.add(key as CustomQuoteField);
      }
      const firstBad = Object.keys(parsed.fieldErrors)[0];
      if (firstBad) {
        const el = form.elements.namedItem(firstBad) as HTMLElement | null;
        el?.focus();
      }
      return;
    }

    setFieldErrors({});
    const payload = buildSubmission
      ? buildSubmission(parsed.data, attachments)
      : {
          subject: `Quote Request — ${parsed.data.service}`,
          body: [
            `Quote Request — ${parsed.data.service}`,
            `Property Address: ${parsed.data.address}`,
            `Customer: ${parsed.data.name} | ${parsed.data.phone} | ${parsed.data.email}`,
            `Marketing Updates: ${parsed.data.marketingOptIn ? "Yes" : "No"}`,
            ...(parsed.data.notes ? ["", `Notes: ${parsed.data.notes}`] : []),
            ...(attachments.length > 0
              ? ["", `Attached files referenced: ${attachments.map((a) => a.name).join(", ")}`]
              : []),
          ].join("\n"),
        };

    window.location.assign(
      `mailto:${site.email}?subject=${encodeURIComponent(payload.subject)}&body=${encodeURIComponent(payload.body)}`,
    );

    setSubmittedConfirmation(
      payload.confirmation ?? (
        <>
          Your quote request for <strong>{parsed.data.service}</strong> has been prepared in your email app. Press send
          to finish, or call{" "}
          <a href={`tel:${site.phoneHref}`} className="font-bold underline">
            {site.phone}
          </a>
          .
        </>
      ),
    );
  }

  const fieldBase =
    "field-control block w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-medium text-brand-900 placeholder:font-normal placeholder:text-slate-400 focus:border-brand-700";

  return (
    <form onSubmit={handleSubmit} noValidate aria-labelledby={formAriaLabelledBy} className={className}>
      <div aria-live="polite" className="sr-only">
        {announcement}
      </div>

      <div className={compact ? "space-y-2.5" : "space-y-4"}>
        {/* Service select */}
        <div className="relative pt-1.5">
          <label
            htmlFor={`${uid}-service`}
            className="absolute left-3 top-0 z-10 rounded bg-white px-1 text-xs font-semibold text-slate-600"
          >
            Service <span className="text-accent-700" aria-hidden="true">*</span>
          </label>
          <div className="relative">
            <select
              ref={firstFieldRef}
              id={`${uid}-service`}
              name="service"
              required
              value={service}
              onChange={(e) => {
                const next = e.target.value;
                setService(next);
                markInteractedAndClear("service");
              }}
              onBlur={() => handleFieldBlur("service", service)}
              aria-invalid={fieldErrors.service ? "true" : "false"}
              aria-describedby={fieldErrors.service ? `${uid}-service-err` : undefined}
              className={`${fieldBase} appearance-none pr-10 ${service === "" ? "font-normal text-slate-500" : ""}`}
            >
              {(allowEmptyService || defaultService === "") && (
                <option value="" disabled>
                  Select a service…
                </option>
              )}
              {serviceOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
            <svg
              className="pointer-events-none absolute right-3.5 top-1/2 size-4 -translate-y-1/2 text-brand-900"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="m6 9 6 6 6-6" />
            </svg>
          </div>
          {fieldErrors.service && (
            <p id={`${uid}-service-err`} className="mt-1 text-xs font-medium text-red-700">
              <span role="img" aria-label="Error">⚠</span> {fieldErrors.service}
            </p>
          )}
        </div>

        {/* Your name */}
        <div className="relative pt-1.5">
          <label
            htmlFor={`${uid}-name`}
            className="absolute left-3 top-0 z-10 rounded bg-white px-1 text-xs font-semibold text-slate-600"
          >
            Your name <span className="text-accent-700" aria-hidden="true">*</span>
          </label>
          <input
            id={`${uid}-name`}
            name="name"
            type="text"
            required
            autoComplete="name"
            enterKeyHint="next"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              markInteractedAndClear("name");
            }}
            onBlur={() => handleFieldBlur("name", name)}
            placeholder="Jane Smith"
            aria-invalid={fieldErrors.name ? "true" : "false"}
            aria-describedby={fieldErrors.name ? `${uid}-name-err` : undefined}
            className={fieldBase}
          />
          {fieldErrors.name && (
            <p id={`${uid}-name-err`} className="mt-1 text-xs font-medium text-red-700">
              <span role="img" aria-label="Error">⚠</span> {fieldErrors.name}
            </p>
          )}
        </div>

        {/* Your address */}
        <div className="relative pt-1.5">
          <label
            htmlFor={`${uid}-address`}
            className="absolute left-3 top-0 z-10 rounded bg-white px-1 text-xs font-semibold text-slate-600"
          >
            Your address <span className="text-accent-700" aria-hidden="true">*</span>
          </label>
          <input
            id={`${uid}-address`}
            name="address"
            type="text"
            required
            autoComplete="street-address"
            enterKeyHint="next"
            value={addressValue}
            onChange={(e) => {
              setAddressValue(e.target.value);
              markInteractedAndClear("address");
            }}
            onBlur={() => handleFieldBlur("address", addressValue)}
            placeholder="123 Main St, Richardson, TX 75081"
            aria-invalid={fieldErrors.address ? "true" : "false"}
            aria-describedby={fieldErrors.address ? `${uid}-address-err` : undefined}
            className={fieldBase}
          />
          {fieldErrors.address && (
            <p id={`${uid}-address-err`} className="mt-1 text-xs font-medium text-red-700">
              <span role="img" aria-label="Error">⚠</span> {fieldErrors.address}
            </p>
          )}
        </div>

        {/* Your phone number */}
        <div className="relative pt-1.5">
          <label
            htmlFor={`${uid}-phone`}
            className="absolute left-3 top-0 z-10 rounded bg-white px-1 text-xs font-semibold text-slate-600"
          >
            Your phone number <span className="text-accent-700" aria-hidden="true">*</span>
          </label>
          <input
            id={`${uid}-phone`}
            name="phone"
            type="tel"
            required
            autoComplete="tel"
            enterKeyHint="next"
            value={phone}
            onChange={(e) => {
              setPhone(e.target.value);
              markInteractedAndClear("phone");
            }}
            onBlur={() => handleFieldBlur("phone", phone)}
            placeholder="(555) 123-4567"
            aria-invalid={fieldErrors.phone ? "true" : "false"}
            aria-describedby={fieldErrors.phone ? `${uid}-phone-err` : undefined}
            className={fieldBase}
          />
          {fieldErrors.phone && (
            <p id={`${uid}-phone-err`} className="mt-1 text-xs font-medium text-red-700">
              <span role="img" aria-label="Error">⚠</span> {fieldErrors.phone}
            </p>
          )}
        </div>

        {/* Your email */}
        <div className="relative pt-1.5">
          <label
            htmlFor={`${uid}-email`}
            className="absolute left-3 top-0 z-10 rounded bg-white px-1 text-xs font-semibold text-slate-600"
          >
            Your email <span className="text-accent-700" aria-hidden="true">*</span>
          </label>
          <input
            id={`${uid}-email`}
            name="email"
            type="email"
            required
            autoComplete="email"
            autoCorrect="off"
            autoCapitalize="none"
            spellCheck={false}
            enterKeyHint="next"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              markInteractedAndClear("email");
            }}
            onBlur={() => handleFieldBlur("email", email)}
            placeholder="you@example.com"
            aria-invalid={fieldErrors.email ? "true" : "false"}
            aria-describedby={fieldErrors.email ? `${uid}-email-err` : undefined}
            className={fieldBase}
          />
          {fieldErrors.email && (
            <p id={`${uid}-email-err`} className="mt-1 text-xs font-medium text-red-700">
              <span role="img" aria-label="Error">⚠</span> {fieldErrors.email}
            </p>
          )}
        </div>

        {/* Notes (optional) */}
        <div className="relative pt-1.5">
          <label
            htmlFor={`${uid}-notes`}
            className="absolute left-3 top-0 z-10 rounded bg-white px-1 text-xs font-semibold text-slate-600"
          >
            Notes (optional)
          </label>
          <textarea
            id={`${uid}-notes`}
            name="notes"
            rows={compact ? 2 : 3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Share gate access details, HOA preferences, or timeline notes…"
            aria-invalid="false"
            className="field-control block w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-brand-900 placeholder:text-slate-400 focus:border-brand-700"
          />
        </div>

        {/* Drag and drop / Attach File bar */}
        <div>
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragActive(true);
            }}
            onDragLeave={() => setDragActive(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragActive(false);
              addFiles(e.dataTransfer.files);
            }}
            className={`flex flex-wrap items-center justify-between gap-3 rounded-xl border border-dashed px-4 ${
              compact ? "py-2" : "py-3"
            } transition-colors ${
              dragActive
                ? "border-accent-600 bg-orange-50/60"
                : "border-slate-300 bg-slate-50/70"
            }`}
          >
            <span className="text-xs font-medium text-slate-600">
              Drag and drop files here or click the button
            </span>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,.pdf"
              className="sr-only"
              onChange={(e) => {
                addFiles(e.target.files);
                e.target.value = "";
              }}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-brand-900 shadow-xs transition-colors hover:border-brand-700 hover:bg-brand-50"
            >
              <svg viewBox="0 0 24 24" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48" />
              </svg>
              Attach File
            </button>
          </div>
          {fileError && (
            <p className="mt-1 text-xs font-medium text-red-700">
              <span role="img" aria-label="Error">⚠</span> {fileError}
            </p>
          )}
          {attachments.length > 0 && (
            <ul className="mt-2 flex flex-wrap gap-2">
              {attachments.map((file) => (
                <li
                  key={file.id}
                  className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-brand-900"
                >
                  <span className="max-w-[180px] truncate">{file.name}</span>
                  <span className="text-slate-400">({formatFileSize(file.size)})</span>
                  <button
                    type="button"
                    onClick={() => removeAttachment(file.id)}
                    aria-label={`Remove ${file.name}`}
                    className="text-slate-500 hover:text-red-600"
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Terms of Use checkbox (required) */}
        <div>
          <label htmlFor={`${uid}-terms`} className="brand-checkbox-label text-xs font-medium text-slate-700">
            <input
              id={`${uid}-terms`}
              name="acceptedTerms"
              type="checkbox"
              checked={acceptedTerms}
              onChange={(e) => {
                const checked = e.target.checked;
                setAcceptedTerms(checked);
                markInteractedAndClear("acceptedTerms");
              }}
              onBlur={() => handleFieldBlur("acceptedTerms", acceptedTerms)}
              aria-invalid={fieldErrors.acceptedTerms ? "true" : "false"}
              aria-describedby={fieldErrors.acceptedTerms ? `${uid}-terms-err` : undefined}
              className="brand-checkbox"
            />
            <span>
              I agree to the{" "}
              <span className="font-semibold text-brand-900 underline underline-offset-2">Terms of Use</span>
            </span>
          </label>
          {fieldErrors.acceptedTerms && (
            <p id={`${uid}-terms-err`} className="mt-1 text-xs font-medium text-red-700">
              <span role="img" aria-label="Error">⚠</span> {fieldErrors.acceptedTerms}
            </p>
          )}
        </div>

        {/* Primary CTA button */}
        <button type="submit" className="btn btn-primary btn-lg w-full">
          {submitLabel}
        </button>

        {/* Optional marketing checkbox */}
        <label htmlFor={`${uid}-marketing`} className="brand-checkbox-label text-xs font-medium text-slate-600">
          <input
            id={`${uid}-marketing`}
            name="marketingOptIn"
            type="checkbox"
            checked={marketingOptIn}
            onChange={(e) => setMarketingOptIn(e.target.checked)}
            className="brand-checkbox"
          />
          <span>Email me interesting insights and company news</span>
        </label>

        {submittedConfirmation && (
          <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-3.5 text-xs font-medium text-emerald-900">
            {submittedConfirmation}
          </div>
        )}
      </div>
    </form>
  );
}
