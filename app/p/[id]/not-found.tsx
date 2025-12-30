export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <h1 className="text-3xl font-bold mb-4">404</h1>
          <p className="text-gray-600 mb-4">Paste not found</p>
          <p className="text-sm text-gray-500 mb-4">
            This paste may have expired, reached its view limit, or never existed.
          </p>
          <a href="/" className="text-blue-600 hover:underline">
            Create a new paste
          </a>
        </div>
      </div>
    </div>
  );
}

