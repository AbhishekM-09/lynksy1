import { Link } from 'react-router-dom'
import { Link as LinkIcon } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-cream p-6 text-center">
      <div className="w-20 h-20 bg-orange/10 text-orange rounded-full flex items-center justify-center mb-8">
        <LinkIcon size={40} />
      </div>
      <h1 className="text-4xl font-extrabold font-syne text-ink mb-4">404 — Not Found</h1>
      <p className="text-muted text-lg max-w-md mb-10 leading-relaxed">
        The link page you're looking for doesn't exist, was moved, or has been deactivated by its creator.
      </p>
      <div className="flex flex-col sm:flex-row items-center gap-4">
        <Link to="/" className="btn-primary btn-lg">
          Create your own link →
        </Link>
        <Link to="/login" className="btn-outline font-bold">
          Log in to your account
        </Link>
      </div>
    </div>
  )
}
