import React, { useState, useCallback, useEffect } from 'react';
import { GameState, Character, DMResponse, Action, DiceCheckResult, AppView, ApiMetadata } from './types';
import { PASSWORD, STORY_BEATS } from './constants';
import { getGameTurn, generateSceneImage } from './services/geminiService';
import PasswordScreen from './components/PasswordScreen';
import CharacterCreationScreen from './components/CharacterCreationScreen';
import GameScreen from './components/GameScreen';
import LoadingSpinner from './components/LoadingSpinner';
import DemystifyModal from './components/DemystifyModal';

const App: React.FC = () => {
  const [view, setView] = useState<AppView>('password');
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentDMResponse, setCurrentDMResponse] = useState<DMResponse | null>(null);
  const [sceneImage, setSceneImage] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const [isPlayerDead, setIsPlayerDead] = useState(false);
  const [isAdventureOver, setIsAdventureOver] = useState(false);
  const [lastApiMetadata, setLastApiMetadata] = useState<ApiMetadata | null>(null);
  const [showDemystifyModal, setShowDemystifyModal] = useState(false);

  const handleLogin = (password: string) => {
    if (password === atob(PASSWORD)) {
      setView('character_creation');
    } else {
      alert('Incorrect password.');
    }
  };

  const startGame = async (character: Character, artStyle: string) => {
    const initialGameState: GameState = {
      character,
      artStyle,
      inventory: [],
      storyLog: [],
      currentBeat: 'HOOK',
      visualLore: '',
    };
    setGameState(initialGameState);
    setIsPlayerDead(false);
    setIsAdventureOver(false);
    setView('game');
    await processGameTurn(initialGameState, { actionId: 'start_game' });
  };

  const processGameTurn = useCallback(async (currentState: GameState, action: Action, diceResult?: DiceCheckResult) => {
    setLoading('The Dungeon Master is weaving the next part of your tale...');
    setError(null);
    setSceneImage(null); 
    setImageError(null);
    
    try {
      const { dmResponse, apiMetadata } = await getGameTurn(currentState, action, diceResult);
      
      // Handle auto-roll for custom actions
      if (dmResponse.required_check && !diceResult) {
        setLoading(`Your action requires a ${dmResponse.required_check.stat} check (DC ${dmResponse.required_check.dc})! The dice are rolled automatically...`);

        const characterStats = currentState.character.stats;
        const modifier = Math.floor((characterStats[dmResponse.required_check.stat] - 10) / 2);
        const roll = Math.ceil(Math.random() * 20);
        const total = roll + modifier;
        const result: DiceCheckResult = total >= dmResponse.required_check.dc ? 'success' : 'fail';
        
        // Give a little time for the user to read the message
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Re-call this function with the same action but now with the dice result
        await processGameTurn(currentState, action, result);
        return; // Exit to avoid processing the intermediate response
      }


      const newStoryLog = [...currentState.storyLog, dmResponse.scene_description];
      let newBeat = currentState.currentBeat;
      let adventureOver = false;

      if (dmResponse.beat_complete) {
        const currentIndex = STORY_BEATS.indexOf(currentState.currentBeat);
        if (currentIndex < STORY_BEATS.length - 1) {
          newBeat = STORY_BEATS[currentIndex + 1];
        }
        // If the RESOLUTION beat is completed, the story ends.
        if (currentState.currentBeat === 'RESOLUTION') {
            adventureOver = true;
        }
      }
      
      const newLoreUpdates = dmResponse.visual_lore_updates || [];
      // Use a Set to avoid duplicate lore entries over time
      const currentLoreSet = new Set(currentState.visualLore.split('; ').filter(Boolean));
      newLoreUpdates.forEach(update => currentLoreSet.add(update.trim()));
      const newVisualLore = Array.from(currentLoreSet).join('; ');

      const newGameState: GameState = {
        ...currentState,
        storyLog: newStoryLog,
        currentBeat: newBeat,
        visualLore: newVisualLore,
      };

      setGameState(newGameState);
      setCurrentDMResponse(dmResponse);
      setLastApiMetadata(apiMetadata);
      setIsAdventureOver(adventureOver);

      if (dmResponse.player_dead) {
        setIsPlayerDead(true);
      }
      
      // Automatically generate the image for the new scene
      let imageLoadingMessage = "The Visualization Agent is painting your scene...";
      if (dmResponse.player_dead) {
          imageLoadingMessage = "The Visualization Agent is painting your final moments...";
      } else if (adventureOver) {
          imageLoadingMessage = "The Visualization Agent is painting your story's conclusion...";
      }
      setLoading(imageLoadingMessage);
      setImageError(null);
      
      try {
          const imageUrl = await generateSceneImage(dmResponse.scene_description, newGameState.character, newGameState.artStyle, newGameState.visualLore);
          setSceneImage(imageUrl);
      } catch(err) {
          console.error(err);
          const errorMessage = err instanceof Error ? err.message : "The Visualization Agent failed to capture the scene. The magic may be weak.";
          setImageError(errorMessage);
      }

    } catch (err) {
      console.error(err);
      setError('The connection to the ethereal plane was lost. Please try again.');
    } finally {
      setLoading(null);
    }
  }, []);
  
  const handleAction = (action: Action, diceResult?: DiceCheckResult) => {
      if (gameState && !isPlayerDead && !isAdventureOver) {
          processGameTurn(gameState, action, diceResult);
      }
  };

  const renderView = () => {
    switch (view) {
      case 'password':
        return <PasswordScreen onLogin={handleLogin} />;
      case 'character_creation':
        return <CharacterCreationScreen onCharacterCreate={startGame} />;
      case 'game':
        if (gameState && currentDMResponse) {
          return (
            <GameScreen
              gameState={gameState}
              dmResponse={currentDMResponse}
              onAction={handleAction}
              sceneImage={sceneImage}
              loadingText={loading}
              isPlayerDead={isPlayerDead}
              isAdventureOver={isAdventureOver}
              imageError={imageError}
            />
          );
        }
        return <LoadingSpinner text="Preparing your adventure..." />;
      default:
        return <div>Something went wrong.</div>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-200 flex flex-col items-center p-4 relative">
      {view === 'game' && lastApiMetadata && (
        <button 
          onClick={() => setShowDemystifyModal(true)} 
          className="absolute top-6 right-6 z-20 p-2 bg-gray-700/50 rounded-full hover:bg-gray-600/70 transition-colors"
          aria-label="Demystify API Call"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-amber-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </button>
      )}
      <div className="w-full max-w-5xl mx-auto flex flex-col items-center">
        <h1 className="text-4xl sm:text-5xl font-medieval text-amber-300 my-6 text-center">Gemini RPG Adventure</h1>
        {renderView()}
      </div>
      
      {showDemystifyModal && lastApiMetadata && (
        <DemystifyModal metadata={lastApiMetadata} onClose={() => setShowDemystifyModal(false)} />
      )}
    </div>
  );
};

export default App;
