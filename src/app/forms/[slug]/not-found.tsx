import Link from 'next/link';
import { FileQuestion } from 'lucide-react';

export default function FormNotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
        <div className="w-16 h-16 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <FileQuestion className="h-10 w-10 text-pink-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Form Not Found
        </h1>
        <p className="text-gray-600 mb-6">
          The form you're looking for doesn't exist or may have been removed.
        </p>
        <Link
          href="/"
          className="inline-block px-6 py-3 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors"
        >
          Return Home
        </Link>
      </div>
    </div>
  );
}
