import { Link } from 'react-router-dom'

/** Renders plain text with clickable #hashtags and @mentions. */
export default function RichText({ text, className }: { text: string; className?: string }) {
  const parts = text.split(/(#[\p{L}\p{N}_]{2,40}|@[\p{L}\p{N}_]{2,40})/gu)
  return (
    <span className={className}>
      {parts.map((part, index) => {
        if (part.startsWith('#')) {
          return <Link key={index} to={`/tag/${part.slice(1).toLowerCase()}`} className="font-bold text-primary hover:underline">{part}</Link>
        }
        if (part.startsWith('@')) {
          return <Link key={index} to={`/search?q=${encodeURIComponent(part)}`} className="font-bold text-primary hover:underline">{part}</Link>
        }
        return <span key={index}>{part}</span>
      })}
    </span>
  )
}
