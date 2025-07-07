import { useState } from 'react'

function App() {
  const [count, setCount] = useState(0)

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
        <h1 className="text-3xl font-bold text-center text-gray-800 mb-6">
          🎥 Stream Manager
        </h1>
        <div className="text-center">
          <p className="text-gray-600 mb-4">
            DevOps Infrastructure Test
          </p>
          <button 
            onClick={() => setCount((count) => count + 1)}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            Count: {count}
          </button>
          <div className="mt-6 space-y-2">
            <div className="text-sm text-green-600">
              ✅ React App Running
            </div>
            <div className="text-sm text-green-600">
              ✅ Tailwind CSS Working
            </div>
            <div className="text-sm text-green-600">
              ✅ TypeScript Configured
            </div>
            <div className="text-sm text-green-600">
              ✅ Vite Development Server
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App