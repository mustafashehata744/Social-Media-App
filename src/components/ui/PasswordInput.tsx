import { useState, type InputHTMLAttributes } from 'react'
import { Eye, EyeOff } from 'lucide-react'

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  wrapperClassName?: string
}

export default function PasswordInput({ wrapperClassName = '', ...props }: Props) {
  const [visible, setVisible] = useState(false)
  return (
    <div className={`relative ${wrapperClassName}`}>
      <input {...props} type={visible ? 'text' : 'password'} className="input pl-11" />
      <button
        type="button"
        onClick={() => setVisible((value) => !value)}
        className="absolute left-3 top-1/2 -translate-y-1/2 text-muted transition hover:text-primary"
        aria-label={visible ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
      >
        {visible ? <EyeOff size={18} /> : <Eye size={18} />}
      </button>
    </div>
  )
}
