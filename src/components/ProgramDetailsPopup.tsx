import React from 'react';

interface ProgramDetailsPopupProps {
  isOpen: boolean;
  onClose: () => void;
  program?: {
    title: string;
    channel: string;
    startTime: string;
    endTime: string;
    description: string;
    genre: string;
    rating: number;
    cast?: string[];
  };
}

const ProgramDetailsPopup: React.FC<ProgramDetailsPopupProps> = ({ isOpen, onClose, program }) => {
  // Mock data if no program is provided
  const defaultProgram = {
    title: 'Premier League: Man United vs Liverpool',
    channel: 'Sky Sports Main Event',
    startTime: '15:00',
    endTime: '17:00',
    description: 'Live coverage of the Premier League match between Manchester United and Liverpool at Old Trafford. One of the biggest rivalries in English football with both teams looking to secure vital points in the race for Champions League qualification.',
    genre: 'Sports - Football',
    rating: 4.8,
    cast: ['Gary Neville', 'Jamie Carragher', 'David Jones', 'Roy Keane'],
  };

  const currentProgram = program || defaultProgram;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-900 text-white rounded-lg shadow-2xl w-[500px] max-w-[90vw] max-h-[80vh] overflow-hidden">
        <div className="relative">
          <div className="aspect-video bg-gray-800 flex items-center justify-center">
            <div className="text-center">
              <svg className="w-16 h-16 mx-auto text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              <p className="text-gray-600 mt-2">Preview not available</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 bg-black bg-opacity-50 rounded-full p-2 text-white hover:bg-opacity-70 transition-all"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <h2 className="text-2xl font-bold mb-1">{currentProgram.title}</h2>
            <p className="text-gray-400 text-sm">{currentProgram.channel}</p>
          </div>

          <div className="flex items-center space-x-4 text-sm">
            <div className="flex items-center space-x-1">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{currentProgram.startTime} - {currentProgram.endTime}</span>
            </div>
            <div className="flex items-center space-x-1">
              <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <span>{currentProgram.rating}/5</span>
            </div>
            <span className="bg-gray-800 px-2 py-1 rounded text-xs">{currentProgram.genre}</span>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Description</h3>
            <p className="text-gray-300 text-sm leading-relaxed">{currentProgram.description}</p>
          </div>

          {currentProgram.cast && currentProgram.cast.length > 0 && (
            <div>
              <h3 className="font-semibold mb-2">Featuring</h3>
              <div className="flex flex-wrap gap-2">
                {currentProgram.cast.map((person, index) => (
                  <span key={index} className="bg-gray-800 px-3 py-1 rounded-full text-sm">
                    {person}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="flex space-x-3 pt-4">
            <button className="flex-1 bg-blue-600 hover:bg-blue-700 py-2 rounded-lg font-semibold transition-colors">
              Watch Now
            </button>
            <button className="flex-1 bg-gray-700 hover:bg-gray-600 py-2 rounded-lg font-semibold transition-colors">
              Add to Favorites
            </button>
          </div>

          <p className="text-xs text-gray-400 text-center">Press I for program info</p>
        </div>
      </div>
    </div>
  );
};

export default ProgramDetailsPopup;