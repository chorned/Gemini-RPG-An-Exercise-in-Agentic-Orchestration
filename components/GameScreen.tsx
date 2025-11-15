import React, { useState, useEffect, useRef } from 'react';
import { GameState, DMResponse, Action, DiceCheckResult, DMOption } from '../types';
import { generateSpeech } from '../services/geminiService';
import { decode, decodeAudioData } from '../utils/audioUtils';
import CharacterSheet from './CharacterSheet';
import DiceRoller from './DiceRoller';
import LoadingSpinner from './LoadingSpinner';

interface GameScreenProps {
  gameState: GameState;
  dmResponse: DMResponse | null;
  onAction: (action: Action, diceResult?: DiceCheckResult) => void;
  sceneImage: string | null;
  loadingText: string | null;
  isPlayerDead: boolean;
  isAdventureOver: boolean;
  imageError: string | null;
}

const GameScreen: React.FC<GameScreenProps> = ({ gameState, dmResponse, onAction, sceneImage, loadingText, isPlayerDead, isAdventureOver, imageError }) => {
  const [showDiceRoller, setShowDiceRoller] = useState<DMOption | null>(null);
  const [customActionText, setCustomActionText] = useState('');
  const [audioState, setAudioState] = useState<'idle' | 'loading' | 'playing' | 'paused'>('idle');
  const [audioError, setAudioError] = useState<string | null>(null);

  const audioContextRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);

  const cleanupAudio = () => {
    if (audioSourceRef.current) {
        audioSourceRef.current.stop();
        audioSourceRef.current.disconnect();
        audioSourceRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
        audioContextRef.current = null;
    }
    setAudioState('idle');
    setAudioError(null);
  };

  useEffect(() => {
    setShowDiceRoller(null);
    cleanupAudio();
    return () => {
      cleanupAudio();
    };
  }, [dmResponse]);
  
  const handleOptionClick = (option: DMOption) => {
    if (option.check) {
      setShowDiceRoller(option);
    } else {
      onAction({ actionId: option.action_id });
    }
  };

  const handleDiceRollComplete = (result: DiceCheckResult) => {
    if (showDiceRoller) {
      onAction({ actionId: showDiceRoller.action_id }, result);
      setShowDiceRoller(null);
    }
  };
  
  const handleCustomActionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customActionText.trim()) return;
    onAction({ actionId: 'custom_action', customAction: customActionText.trim() });
    setCustomActionText('');
  };

  const handlePlayDescription = async () => {
    if (!dmResponse?.scene_description) return;

    cleanupAudio();
    setAudioState('loading');
    setAudioError(null);

    try {
      const base64Audio = await generateSpeech(dmResponse.scene_description);

      const sampleRate = 24000;
      const context = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate });
      audioContextRef.current = context;

      const audioBuffer = await decodeAudioData(
        decode(base64Audio),
        context,
        sampleRate,
        1, // mono
      );

      const source = context.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(context.destination);

      source.onended = () => {
        if (audioContextRef.current?.state !== 'suspended') {
          cleanupAudio();
        }
      };

      source.start();
      audioSourceRef.current = source;
      setAudioState('playing');
    } catch (err) {
      console.error("Failed to play audio:", err);
      setAudioError("The storyteller's voice faltered.");
      setAudioState('idle');
    }
  };

  const handlePauseResume = () => {
    if (!audioContextRef.current) return;

    if (audioContextRef.current.state === 'running') {
      audioContextRef.current.suspend().then(() => setAudioState('paused'));
    } else if (audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume().then(() => setAudioState('playing'));
    }
  };


  return (
    <div className="w-full grid grid-cols-1 lg:grid-cols-4 gap-6 animate-fade-in">
      <div className="lg:col-span-1">
        <CharacterSheet character={gameState.character} />
      </div>

      <div className="lg:col-span-3 p-6 bg-gray-800 rounded-lg shadow-lg border border-gray-700 space-y-6">
        
        {dmResponse && (
          <>
            <div className="prose prose-invert max-w-none text-gray-300">
              <p className="text-lg whitespace-pre-wrap">{dmResponse.scene_description}</p>
            </div>
            
            <div className="flex items-center space-x-3">
              {audioState === 'idle' && (
                <button onClick={handlePlayDescription} aria-label="Play scene description" className="p-2 bg-gray-700/50 rounded-full hover:bg-amber-900/50 transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-amber-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                  </svg>
                </button>
              )}
              {audioState === 'loading' && (
                <div className="p-2">
                   <svg className="animate-spin h-5 w-5 text-amber-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                </div>
              )}
              {(audioState === 'playing' || audioState === 'paused') && (
                <button onClick={handlePauseResume} aria-label={audioState === 'playing' ? 'Pause' : 'Resume'} className="p-2 bg-gray-700/50 rounded-full hover:bg-amber-900/50 transition-colors">
                  {audioState === 'playing' ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-amber-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 00-1 1v2a1 1 0 102 0V9a1 1 0 00-1-1zm5 0a1 1 0 00-1 1v2a1 1 0 102 0V9a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-amber-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
              )}
              {audioError && <p className="text-sm text-red-400">{audioError}</p>}
            </div>


            {loadingText && <LoadingSpinner text={loadingText} />}

            {sceneImage && !loadingText && (
              <div className="border-4 border-amber-800/50 rounded-lg overflow-hidden my-4 animate-fade-in">
                <img src={sceneImage} alt="Scene Visualization" className="w-full h-auto" />
              </div>
            )}

            {imageError && !loadingText && (
              <div className="text-center p-4 my-4 bg-red-900/20 border-2 border-red-500 rounded-lg animate-fade-in">
                <p className="font-semibold text-red-400">Visualization Failed</p>
                <p className="text-sm text-gray-300">{imageError}</p>
              </div>
            )}


            {isPlayerDead ? (
              <div className="text-center p-8 bg-red-900/20 border-2 border-red-500 rounded-lg animate-fade-in">
                <h2 className="text-5xl font-medieval text-red-400 mb-4">You Have Died</h2>
                <p className="text-gray-300 mb-6">Your adventure has come to a tragic end.</p>
                <p className="text-sm text-gray-400 italic mt-4">Reload the page to begin a new journey.</p>
              </div>
            ) : isAdventureOver ? (
              <div className="text-center p-8 bg-green-900/20 border-2 border-green-500 rounded-lg animate-fade-in">
                  <h2 className="text-5xl font-medieval text-green-400 mb-4">Your Adventure Concludes</h2>
                  <p className="text-gray-300 mb-6">You have reached the end of this chapter.</p>
                  <p className="text-sm text-gray-400 italic mt-4">Reload the page to begin a new journey.</p>
              </div>
            ) : (
              !loadingText && (
                <>
                  {!showDiceRoller ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {dmResponse.options.map((option) => (
                          <button
                            key={option.action_id}
                            onClick={() => handleOptionClick(option)}
                            className="text-left p-4 bg-gray-700/50 border border-gray-600 rounded-lg hover:bg-amber-900/50 hover:border-amber-500 transition-all duration-200"
                          >
                            <p className="font-semibold">{option.text}</p>
                            {option.check && <p className="text-xs text-amber-400 italic mt-1">Requires a {option.check.stat} check (DC {option.check.dc})</p>}
                          </button>
                        ))}
                        <form 
                            onSubmit={handleCustomActionSubmit}
                            className="flex flex-col p-4 bg-gray-700/50 border border-gray-600 rounded-lg hover:border-amber-500 focus-within:border-amber-500 transition-all duration-200"
                        >
                            <label htmlFor="custom-action-input" className="sr-only">Custom Action</label>
                            <textarea
                                id="custom-action-input"
                                value={customActionText}
                                onChange={(e) => setCustomActionText(e.target.value)}
                                placeholder="What do you do?"
                                className="bg-transparent focus:outline-none w-full text-gray-200 placeholder-gray-400 resize-none flex-grow"
                                rows={2}
                            />
                            <button
                                type="submit"
                                disabled={!customActionText.trim()}
                                className="self-end mt-2 px-3 py-1 bg-amber-600 text-white font-bold rounded-md text-sm transition-colors hover:bg-amber-700 disabled:bg-gray-600 disabled:cursor-not-allowed"
                            >
                                Do it
                            </button>
                        </form>
                      </div>
                    </div>
                  ) : (
                    <DiceRoller
                      check={showDiceRoller.check!}
                      stats={gameState.character.stats}
                      onRollComplete={handleDiceRollComplete}
                    />
                  )}
                </>
              )
            )}
          </>
        )}
      </div>
      <style>{`
        .animate-fade-in {
          animation: fadeIn 0.5s ease-in-out;
        }
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default GameScreen;