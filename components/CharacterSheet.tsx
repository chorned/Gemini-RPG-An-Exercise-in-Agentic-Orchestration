import React from 'react';
import { Character, Stat } from '../types';

interface CharacterSheetProps {
  character: Character;
}

const CharacterSheet: React.FC<CharacterSheetProps> = ({ character }) => {
    
  const getModifier = (statValue: number) => {
    const modifier = Math.floor((statValue - 10) / 2);
    return modifier >= 0 ? `+${modifier}` : modifier;
  };
    
  return (
    <div className="p-4 bg-gray-800 rounded-lg shadow-lg border border-gray-700 space-y-4 h-full">
      <h2 className="text-2xl font-medieval text-amber-300 text-center">{character.name}</h2>
      <p className="text-center text-gray-400 italic">{character.gender} {character.race} {character.class}</p>
      
      <div className="grid grid-cols-3 gap-2 text-center">
        {Object.entries(character.stats).map(([stat, value]) => (
          <div key={stat} className="p-2 bg-gray-900/50 rounded-md border border-gray-700">
            <div className="text-xs font-bold text-gray-400">{stat}</div>
            <div className="text-xl font-bold text-white">{value}</div>
            {/* FIX: Cast value to number as Object.entries returns value as unknown type. */}
            <div className="text-sm text-amber-400 font-semibold">{getModifier(value as number)}</div>
          </div>
        ))}
      </div>
      
      <div>
        <h3 className="font-bold text-amber-400 border-b border-gray-600 pb-1 mb-2">Description</h3>
        <p className="text-sm text-gray-300">{character.description}</p>
      </div>

       <div>
        <h3 className="font-bold text-amber-400 border-b border-gray-600 pb-1 mb-2">Weapon</h3>
        <p className="text-sm text-gray-300">{character.weapon}</p>
      </div>
    </div>
  );
};

export default CharacterSheet;