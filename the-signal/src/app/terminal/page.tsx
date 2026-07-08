'use client';

/**
 * DIMENSION 08 — THE COMMUNICATION CORE
 * Route: /terminal
 * Accent: Deep Emerald #059669
 *
 * Terminal-style contact interface.
 * No traditional form boxes — command-line aesthetic.
 */

import { useState, useCallback, useRef } from 'react';
import { DimensionLink } from '@/components/DimensionLink';
import { getAudioEngine } from '@/lib/audio-engine';

const ACCENT = '#059669';

const LINKS = [
  { cmd: 'link_mailto', label: 'EMAIL', value: 'yyaasshh@gmail.com', href: 'mailto:yyaasshh@gmail.com' },
  { cmd: 'link_linkedin', label: 'LINKEDIN', value: 'linkedin.com/in/yashovardhan-thopte', href: 'https://linkedin.com/in/yashovardhan-thopte' },
  { cmd: 'link_github', label: 'GITHUB', value: 'github.com/yashovardhan', href: 'https://github.com/yashovardhan' },
  { cmd: 'link_kaggle', label: 'KAGGLE', value: 'kaggle.com/yash', href: 'https://kaggle.com/yash' },
];

interface FormState {
  name: string;
  email: string;
  message: string;
}

interface FormErrors {
  name?: string;
  email?: string;
  message?: string;
}

export default function TerminalPage() {
  const [form, setForm] = useState<FormState>({ name: '', email: '', message: '' });
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitted, setSubmitted] = useState(false);
  const [activeLink, setActiveLink] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const validate = useCallback((): FormErrors => {
    const errs: FormErrors = {};
    if (!form.name.trim()) errs.name = 'NAME FIELD REQUIRED';
    if (!form.email.trim()) errs.email = 'EMAIL FIELD REQUIRED';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'INVALID EMAIL FORMAT';
    if (!form.message.trim()) errs.message = 'MESSAGE FIELD REQUIRED';
    return errs;
  }, [form]);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const errs = validate();
      if (Object.keys(errs).length > 0) {
        setErrors(errs);
        return;
      }
      setErrors({});
      getAudioEngine().triggerPulse();
      // In production: send to API route
      setSubmitted(true);
    },
    [validate]
  );

  const handleChange = useCallback((field: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  }, []);

  return (
    <div
      className="fixed inset-0 flex flex-col justify-center px-8 md:px-16 lg:px-24 overflow-y-auto"
      style={{ zIndex: 10 }}
      role="main"
      aria-label="Communication Core — Contact"
    >
      <div className="max-w-3xl py-24">

        {/* Header */}
        <div className="mb-16">
          <p className="text-label mb-3 fade-in-1" style={{ color: ACCENT }}>
            DIMENSION_08 // COMMUNICATION CORE
          </p>
          <h1 className="text-signal-xl fade-in-2" style={{ color: '#ffffff' }}>
            COMM
            <br />
            <span style={{ color: ACCENT }}>CORE</span>
          </h1>
          <p className="text-meta mt-4 fade-in-3" style={{ color: ACCENT }}>
            ESTABLISHING SECURE CONNECTION STRING...
          </p>
        </div>

        {/* Connection directory */}
        <section className="mb-16" aria-labelledby="links-heading">
          <p className="text-label mb-6" style={{ color: ACCENT }}>
            CONNECTION DIRECTORY
          </p>
          <h2 id="links-heading" className="sr-only">Contact Links</h2>
          <div className="flex flex-col gap-3">
            {LINKS.map((link) => (
              <a
                key={link.cmd}
                href={link.href}
                target={link.href.startsWith('mailto') ? undefined : '_blank'}
                rel="noopener noreferrer"
                className="flex items-center gap-4 group"
                style={{ textDecoration: 'none' }}
                onMouseEnter={() => { setActiveLink(link.cmd); getAudioEngine().triggerPulse(); }}
                onMouseLeave={() => setActiveLink(null)}
                aria-label={`${link.label}: ${link.value}`}
              >
                <span
                  className="text-meta"
                  style={{
                    color: activeLink === link.cmd ? ACCENT : 'rgba(255,255,255,0.3)',
                    transition: 'color 0.2s',
                    minWidth: '14ch',
                  }}
                >
                  EXEC: {link.cmd}
                </span>
                <span
                  className="text-label"
                  style={{
                    color: activeLink === link.cmd ? '#ffffff' : 'rgba(255,255,255,0.5)',
                    transition: 'color 0.2s',
                  }}
                >
                  ➔ {link.value}
                </span>
              </a>
            ))}
          </div>
        </section>

        {/* Contact form */}
        <section aria-labelledby="form-heading">
          <p className="text-label mb-6" style={{ color: ACCENT }}>
            SECURE MESSAGE TRANSMISSION
          </p>
          <h2 id="form-heading" className="sr-only">Send a Message</h2>

          {submitted ? (
            <div
              className="p-6"
              style={{ border: `1px solid ${ACCENT}`, background: `${ACCENT}10` }}
              role="status"
              aria-live="polite"
            >
              <p className="text-label" style={{ color: ACCENT }}>
                ✓ TRANSMISSION RECEIVED
              </p>
              <p className="text-meta mt-2" style={{ color: 'rgba(255,255,255,0.5)' }}>
                ALL CORE SYSTEMS DEPLOYED. MESSAGE QUEUED FOR SECURE DELIVERY.
              </p>
            </div>
          ) : (
            <form
              ref={formRef}
              onSubmit={handleSubmit}
              noValidate
              aria-label="Contact form"
              className="flex flex-col gap-6"
            >
              {/* Name */}
              <div>
                <label
                  htmlFor="contact-name"
                  className="text-meta block mb-2"
                  style={{ color: ACCENT }}
                >
                  INPUT: NAME
                </label>
                <input
                  id="contact-name"
                  type="text"
                  value={form.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  className="w-full bg-transparent text-label px-4 py-3 outline-none"
                  style={{
                    border: `1px solid ${errors.name ? '#DC2626' : `${ACCENT}44`}`,
                    color: '#ffffff',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.75rem',
                    letterSpacing: '0.1em',
                  }}
                  aria-required="true"
                  aria-invalid={!!errors.name}
                  aria-describedby={errors.name ? 'name-error' : undefined}
                  autoComplete="name"
                />
                {errors.name && (
                  <p id="name-error" className="text-meta mt-1" style={{ color: '#DC2626' }} role="alert">
                    {errors.name}
                  </p>
                )}
              </div>

              {/* Email */}
              <div>
                <label
                  htmlFor="contact-email"
                  className="text-meta block mb-2"
                  style={{ color: ACCENT }}
                >
                  INPUT: EMAIL
                </label>
                <input
                  id="contact-email"
                  type="email"
                  value={form.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  className="w-full bg-transparent text-label px-4 py-3 outline-none"
                  style={{
                    border: `1px solid ${errors.email ? '#DC2626' : `${ACCENT}44`}`,
                    color: '#ffffff',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.75rem',
                    letterSpacing: '0.1em',
                  }}
                  aria-required="true"
                  aria-invalid={!!errors.email}
                  aria-describedby={errors.email ? 'email-error' : undefined}
                  autoComplete="email"
                />
                {errors.email && (
                  <p id="email-error" className="text-meta mt-1" style={{ color: '#DC2626' }} role="alert">
                    {errors.email}
                  </p>
                )}
              </div>

              {/* Message */}
              <div>
                <label
                  htmlFor="contact-message"
                  className="text-meta block mb-2"
                  style={{ color: ACCENT }}
                >
                  INPUT: MESSAGE
                </label>
                <textarea
                  id="contact-message"
                  value={form.message}
                  onChange={(e) => handleChange('message', e.target.value)}
                  rows={5}
                  className="w-full bg-transparent text-label px-4 py-3 outline-none resize-none"
                  style={{
                    border: `1px solid ${errors.message ? '#DC2626' : `${ACCENT}44`}`,
                    color: '#ffffff',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.75rem',
                    letterSpacing: '0.1em',
                  }}
                  aria-required="true"
                  aria-invalid={!!errors.message}
                  aria-describedby={errors.message ? 'message-error' : undefined}
                />
                {errors.message && (
                  <p id="message-error" className="text-meta mt-1" style={{ color: '#DC2626' }} role="alert">
                    {errors.message}
                  </p>
                )}
              </div>

              <button
                type="submit"
                className="text-label px-8 py-4 transition-all duration-300 self-start"
                style={{
                  border: `1px solid ${ACCENT}`,
                  color: ACCENT,
                  background: 'transparent',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.75rem',
                  letterSpacing: '0.2em',
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                }}
                onMouseEnter={(e) => {
                  (e.target as HTMLButtonElement).style.background = `${ACCENT}20`;
                }}
                onMouseLeave={(e) => {
                  (e.target as HTMLButtonElement).style.background = 'transparent';
                }}
              >
                TRANSMIT MESSAGE ▶
              </button>
            </form>
          )}
        </section>

        {/* Status footer */}
        <p className="text-meta mt-12" style={{ color: 'rgba(255,255,255,0.2)' }}>
          ALL CORE SYSTEMS DEPLOYED. SYSTEM READY FOR SECURE INTERACTION.
        </p>

        {/* Navigation */}
        <div className="flex gap-8 mt-8 pb-8">
          <DimensionLink to="vision">← THE VISION</DimensionLink>
          <DimensionLink to="core">SYSTEM CORE →</DimensionLink>
        </div>
      </div>
    </div>
  );
}
