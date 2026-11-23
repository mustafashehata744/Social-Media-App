import { cn } from '@/lib/utils'

export default function TypingDots({ label = 'بيكتب...', className }: { label?: string; className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-2 text-xs font-bold text-primary', className)} aria-live="polite">
      <span className="flex gap-1">
        {[0, 150, 300].map((delay) => (
          <span
            key={delay}
            className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary"
            style={{ animationDelay: `${delay}ms`, animationDuration: '900ms' }}
          />
        ))}
      </span>
      {label}
    </span>
  )
}
