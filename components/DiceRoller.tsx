
import React, { useState, useMemo } from 'react';
import { DiceCheck, Stats, DiceCheckResult } from '../types';

interface DiceRollerProps {
  check: DiceCheck;
  stats: Stats;
  onRollComplete: (result: DiceCheckResult) => void;
}

const DiceRoller: React.FC<DiceRollerProps> = ({ check, stats, onRollComplete }) => {
  const [roll, setRoll] = useState<number | null>(null);
  const [rolling, setRolling] = useState(false);
  
  const modifier = useMemo(() => {
    return Math.floor((stats[check.stat] - 10) / 2);
  }, [stats, check.stat]);

  const total = roll !== null ? roll + modifier : null;
  const result: DiceCheckResult | null = total !== null ? (total >= check.dc ? 'success' : 'fail') : null;

  const handleRoll = () => {
    if (rolling) return;
    setRolling(true);
    setRoll(null);

    let currentDisplay = 0;
    const rollInterval = setInterval(() => {
        currentDisplay = Math.ceil(Math.random() * 20);
        setRoll(currentDisplay);
    }, 50);

    setTimeout(() => {
        clearInterval(rollInterval);
        const finalRoll = Math.ceil(Math.random() * 20);
        setRoll(finalRoll);
        setTimeout(() => {
            const finalResult: DiceCheckResult = (finalRoll + modifier) >= check.dc ? 'success' : 'fail';
            onRollComplete(finalResult);
        }, 2000); // Wait 2 seconds to show result before moving on
    }, 1000); // Roll animation duration
  };

  const modifierString = modifier >= 0 ? `+${modifier}` : modifier;
  const resultText = result === 'success' ? 'Success!' : 'Failure!';
  const resultColor = result === 'success' ? 'text-green-400' : 'text-red-400';

  return (
    <div className="p-6 bg-gray-900/50 rounded-lg border-2 border-amber-600/50 flex flex-col items-center space-y-4">
      <h3 className="text-xl font-medieval text-amber-300">Skill Check Required!</h3>
      <p className="text-gray-300">You must make a <span className="font-bold">{check.stat}</span> check against a DC of <span className="font-bold">{check.dc}</span>.</p>
      <p className="text-gray-400">Your modifier is: <span className="font-bold text-amber-400">{modifierString}</span></p>

      {!total ? (
        <button 
          onClick={handleRoll} 
          disabled={rolling}
          className="px-8 py-4 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg transition-colors text-xl disabled:opacity-50"
        >
          {rolling ? 'Rolling...' : 'Roll d20'}
        </button>
      ) : null}

      <div className="h-32 flex items-center justify-center">
        {roll !== null && (
            <div className="text-center animate-fade-in">
                <p className="text-lg">You rolled a <span className="font-bold text-4xl mx-2">{roll}</span> + {modifier} = <span className="font-bold text-5xl text-amber-400 mx-2">{total}</span></p>
                <p className={`text-4xl font-medieval mt-4 ${resultColor}`}>{resultText}</p>
            </div>
        )}
      </div>
    </div>
  );
};

export default DiceRoller;
