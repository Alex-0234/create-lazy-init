'use client'

import { useState } from "react"
import { Link } from "@/lib/router"
import Button from "@/components/ui/button"

import { EMAIL, FORMSPREE_ENDPOINT, PRIVACY_HREF } from "@/data/site"
import { CONTACT_FORM_TEXTS as TEXTS } from "@/data/texts"

export type ContactFormTexts = typeof TEXTS

interface ContactFormProps {
    email?: string
    endpoint?: string
    privacyHref?: string | null
    texts?: Partial<ContactFormTexts>
    configuration?: string
    variant?: 'dark' | 'light'
    showEmailNote?: boolean
    compact?: boolean
    className?: string
    fieldClassName?: string
}

type Status = 'idle' | 'sending' | 'sent' | 'mailto' | 'error'

export default function ContactForm({
    email = EMAIL,
    endpoint = FORMSPREE_ENDPOINT,
    privacyHref = PRIVACY_HREF,
    texts,
    configuration,
    variant = 'dark',
    showEmailNote = true,
    compact = false,
    className = '',
    fieldClassName = '',
}: ContactFormProps) {
    const [status, setStatus] = useState<Status>('idle')
    const t = { ...TEXTS, ...texts }

    const onLight = variant === 'light'

    /* krytí rámečků drží WCAG 1.4.11 (non-text contrast, min. 3:1 vůči pozadí) —
       na bílé to vychází na 50 %, na tmavé na 40 %. Níž jdou pole opticky ztratit. */
    const fieldClasses = `w-full border bg-transparent px-3 py-2 font-jet text-xs sm:px-4 sm:py-3 sm:text-sm focus:outline-none transition-colors ${
        onLight
            ? 'border-dark/50 text-dark placeholder:text-dark/60 focus:border-dark'
            : 'border-light/40 text-light placeholder:text-light/60 focus:border-light'
    } ${fieldClassName}`
    const muted = onLight ? 'text-dark/50' : 'text-light/50'
    const link = onLight
        ? 'text-dark/70 hover:text-dark'
        : 'text-light/70 hover:text-light'

    const onSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
        e.preventDefault()
        const form = e.currentTarget
        const data = new FormData(form)

        if (!endpoint) {
            const body = [
                `${t.name}: ${data.get('name')}`,
                `${t.email}: ${data.get('email')}`,
                '',
                String(data.get('message') ?? ''),
                ...(configuration ? ['', `--- ${t.configLabel} ---`, configuration] : []),
            ].join('\n')

            window.location.href = `mailto:${email}?subject=${encodeURIComponent(t.subject)}&body=${encodeURIComponent(body)}`
            setStatus('mailto')
            return
        }

        data.append('_subject', t.subject)
        if (configuration) data.append(t.configLabel, configuration)

        setStatus('sending')

        try {
            const res = await fetch(endpoint, {
                method: 'POST',
                headers: { Accept: 'application/json' },
                body: data,
            })

            if (!res.ok) throw new Error(String(res.status))

            form.reset()
            setStatus('sent')
        } catch {
            setStatus('error')
        }
    }

    return (
        <form onSubmit={onSubmit} className={`flex flex-col ${compact ? 'gap-2.5' : 'gap-3'} sm:gap-4 ${className}`}>
            <div className={`grid gap-3 sm:grid-cols-2 sm:gap-4 ${compact ? 'grid-cols-2' : 'grid-cols-1'}`}>
                <input name='name' type='text' required placeholder={t.name} aria-label={t.name} className={fieldClasses} />
                <input name='email' type='email' required placeholder={t.email} aria-label={t.email} className={fieldClasses} />
            </div>
            <textarea
                name='message'
                rows={3}
                placeholder={t.message}
                aria-label={t.message}
                className={`${fieldClasses} resize-none sm:min-h-28 ${compact ? 'min-h-16' : 'min-h-18'}`}
            />

            {configuration && (
                <p className={`font-jet text-xs ${muted}`}>
                    {t.configNote}
                </p>
            )}

            <div className='flex flex-wrap items-center gap-3 sm:gap-4'>
                <Button type='submit' variant='solid' size='fluid' surface={variant} disabled={status === 'sending'}>
                    {status === 'sending'
                        ? t.sending
                        : configuration ? t.submitWithConfig : t.submit}
                </Button>

                {status === 'sent' && (
                    <p role='status' className='font-jet text-xs text-confirm'>
                        {t.sent}
                    </p>
                )}
                {status === 'mailto' && (
                    <p role='status' className='font-jet text-xs text-confirm'>
                        {t.mailto}
                    </p>
                )}
                {status === 'error' && (
                    <p role='status' className={`font-jet text-xs ${link}`}>
                        {t.error}
                    </p>
                )}
            </div>

            {showEmailNote && (
                <p className={`font-jet text-xs ${muted}`}>
                    {t.emailNote}{' '}
                    <a href={`mailto:${email}`} className={`underline underline-offset-4 ${link}`}>
                        {email}
                    </a>
                </p>
            )}

            {privacyHref && (
                <p className={`font-jet ${compact ? 'text-[0.65rem] leading-snug' : 'text-xs'} sm:text-xs ${muted}`}>
                    {t.privacy}{' '}
                    <Link href={privacyHref} className={`py-1.5 underline underline-offset-4 ${link}`}>
                        {t.privacyLink}
                    </Link>
                </p>
            )}
        </form>
    )
}
