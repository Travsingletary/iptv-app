import React from 'react'
import { VideoPlayer } from './components/VideoPlayer'
import { ChannelGuide } from './components/ChannelGuide'
import { ProgramInfo } from './components/ProgramInfo'
import { useStreamStore } from './store/streamStore'

function App() {
  const { currentChannel, currentProgram } = useStreamStore()

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <header className="bg-gray-900 border-b border-gray-800 p-4">
        <h1 className="text-xl font-bold">SteadyStream Core</h1>
      </header>

      {/* Main Content */}
      <main className="flex flex-col lg:flex-row h-[calc(100vh-80px)]">
        {/* Video Player Section */}
        <section className="flex-1 relative">
          <VideoPlayer 
            channel={currentChannel}
            className="w-full h-full"
          />
          
          {/* Program Info Overlay */}
          {currentProgram && (
            <div className="absolute bottom-4 left-4 right-4">
              <ProgramInfo program={currentProgram} />
            </div>
          )}
        </section>

        {/* Channel Guide Sidebar */}
        <aside className="w-full lg:w-80 bg-gray-900 border-l border-gray-800">
          <ChannelGuide />
        </aside>
      </main>
    </div>
  )
}

export default App