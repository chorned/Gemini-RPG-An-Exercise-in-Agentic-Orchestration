

import React, { useState, useEffect } from 'react';
import { Character, Stats, Stat } from '../types';
import { getCharacterCreationData } from '../services/geminiService';
import LoadingSpinner from './LoadingSpinner';
import { STAT_NAMES } from '../constants';

interface CharacterCreationScreenProps {
  onCharacterCreate: (character: Character, artStyle: string) => void;
}

const CharacterCreationScreen: React.FC<CharacterCreationScreenProps> = ({ onCharacterCreate }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [scene, setScene] = useState('');
  const [styleOptions, setStyleOptions] = useState<string[]>([]);
  const [statArray, setStatArray] = useState<number[]>([]);
  const [raceOptions, setRaceOptions] = useState<string[]>([]);
  const [classOptions, setClassOptions] = useState<string[]>([]);
  const [weaponOptions, setWeaponOptions] = useState<string[]>([]);

  const [character, setCharacter] = useState<Partial<Character>>({
    name: '',
    gender: '',
    race: '',
    class: '',
    weapon: '',
    description: '',
  });

  const [assignedStats, setAssignedStats] = useState<Partial<Stats>>({});
  const [selectedStyle, setSelectedStyle] = useState('');
  const [customArtStyle, setCustomArtStyle] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getCharacterCreationData();
        setScene(data.scene);
        setStyleOptions(data.style_options);
        setStatArray(data.stat_array);
        setRaceOptions(data.races);
        setClassOptions(data.classes);
        setWeaponOptions(data.weapons);
      } catch (err) {
        console.error(err);
        setError('Failed to retrieve character creation data from the arcane ether. Please refresh and try again.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleCharacterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setCharacter(prev => ({ ...prev, [name]: value }));
  };

  const handleStatChange = (stat: Stat, value: string) => {
    const numValue = parseInt(value, 10);
    // Un-assign the stat if it was previously assigned to another category
    const newAssignedStats = { ...assignedStats };
    for (const key in newAssignedStats) {
        if (newAssignedStats[key as Stat] === numValue) {
            delete newAssignedStats[key as Stat];
        }
    }
    
    setAssignedStats(prev => ({ ...newAssignedStats, [stat]: numValue }));
  };
  
  const getAvailableStats = (currentStat: Stat) => {
    const assignedValues = Object.values(assignedStats);
    const currentValue = assignedStats[currentStat];
    return statArray.filter(val => !assignedValues.includes(val) || val === currentValue);
  };

  const handleStyleSelect = (style: string) => {
    setSelectedStyle(style);
    setCustomArtStyle(''); 
  };

  const handleCustomStyleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const { value } = e.target;
    setCustomArtStyle(value);
    setSelectedStyle(value); 
  };


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (Object.keys(assignedStats).length !== 6 || !selectedStyle || !character.gender || !character.race || !character.class || !character.weapon) {
        alert("Please fill out all fields, assign all stats, and select or describe an art style.");
        return;
    }
    
    const finalCharacter: Character = {
        name: character.name || 'Nameless Wanderer',
        gender: character.gender,
        race: character.race,
        class: character.class,
        weapon: character.weapon,
        description: character.description || 'An ordinary person in extraordinary circumstances.',
        stats: assignedStats as Stats,
    };

    onCharacterCreate(finalCharacter, selectedStyle);
  };

  if (loading) return <LoadingSpinner text="Consulting the cosmic spirits for your destiny..." />;
  if (error) return <div className="text-red-400 text-center">{error}</div>;

  return (
    <div className="w-full max-w-4xl p-8 bg-gray-800 rounded-lg shadow-lg border border-gray-700 animate-fade-in">
        <p className="text-lg italic text-gray-400 mb-6 text-center">{scene}</p>
        <form onSubmit={handleSubmit} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <input name="name" placeholder="Character Name" onChange={handleCharacterChange} className="input-field" required />
                <select name="gender" value={character.gender} onChange={handleCharacterChange} className="input-field" required>
                    <option value="" disabled>Choose a Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Non-binary">Non-binary</option>
                </select>
                <select name="race" value={character.race} onChange={handleCharacterChange} className="input-field" required>
                    <option value="" disabled>Choose a Race</option>
                    {raceOptions.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
                <select name="class" value={character.class} onChange={handleCharacterChange} className="input-field" required>
                    <option value="" disabled>Choose a Class</option>
                    {classOptions.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <select name="weapon" value={character.weapon} onChange={handleCharacterChange} className="input-field" required>
                    <option value="" disabled>Choose a Weapon</option>
                    {weaponOptions.map(w => <option key={w} value={w}>{w}</option>)}
                </select>
            </div>
            <textarea name="description" placeholder="A brief description of your character..." onChange={handleCharacterChange} className="input-field w-full min-h-[100px]" required />
            
            <div>
              <h3 className="text-xl font-medieval text-amber-300 mb-4">Assign Your Stats</h3>
              <p className="text-sm text-gray-400 mb-4">Available Scores: {statArray.join(', ')}</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
                  {STAT_NAMES.map(stat => (
                      <div key={stat}>
                          <label className="block text-sm font-bold text-gray-300 mb-1">{stat}</label>
                          <select 
                            onChange={(e) => handleStatChange(stat, e.target.value)} 
                            value={assignedStats[stat] || ''}
                            className="input-field w-full"
                            required
                          >
                              <option value="" disabled>Select</option>
                              {getAvailableStats(stat).map(val => (
                                  <option key={val} value={val}>{val}</option>
                              ))}
                          </select>
                      </div>
                  ))}
              </div>
            </div>

            <div>
              <h3 className="text-xl font-medieval text-amber-300 mb-4">Choose Your Art Style</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {styleOptions.map(style => (
                      <button type="button" key={style} onClick={() => handleStyleSelect(style)} className={`p-4 rounded-md border-2 transition-all text-center h-full flex items-center justify-center ${selectedStyle === style ? 'bg-amber-500 border-amber-300 text-gray-900 font-bold' : 'bg-gray-700 border-gray-600 hover:border-amber-400'}`}>
                          <span>{style}</span>
                      </button>
                  ))}
                  <div className={`rounded-md border-2 transition-all ${customArtStyle && selectedStyle === customArtStyle ? 'border-amber-300' : 'border-gray-600 hover:border-amber-400'}`}>
                    <textarea 
                      placeholder="Or describe your own..."
                      className="w-full h-full bg-gray-700 text-gray-200 placeholder-gray-400 rounded p-3 text-sm focus:outline-none resize-none text-center"
                      value={customArtStyle}
                      onChange={handleCustomStyleChange}
                      rows={5}
                    />
                  </div>
              </div>
            </div>

            <button type="submit" className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg transition-colors text-lg">
                Begin Your Adventure
            </button>
        </form>
    </div>
  );
};

// Add a helper style for input fields
const globalStyles = `
.input-field {
    background-color: #1F2937;
    border: 1px solid #4B5563;
    color: #F3F4F6;
    padding: 0.75rem;
    border-radius: 0.375rem;
    width: 100%;
    transition: border-color 0.2s;
}
select.input-field {
    -moz-appearance: none;
    -webkit-appearance: none;
    appearance: none;
    background-image: url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23F59E0B%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22/%3E%3C/svg%3E');
    background-repeat: no-repeat, repeat;
    background-position: right .7em top 50%, 0 0;
    background-size: .65em auto, 100%;
}
select.input-field::-ms-expand {
    display: none;
}
.input-field:focus {
    outline: none;
    border-color: #F59E0B;
}
.input-field option {
    background-color: #1F2937;
    color: #F3F4F6;
}
.animate-fade-in {
    animation: fadeIn 0.5s ease-in-out;
}
@keyframes fadeIn {
    from { opacity: 0; transform: translateY(-10px); }
    to { opacity: 1; transform: translateY(0); }
}
`;
const styleSheet = document.createElement("style");
styleSheet.innerText = globalStyles;
document.head.appendChild(styleSheet);


export default CharacterCreationScreen;