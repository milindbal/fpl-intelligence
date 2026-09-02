import type { FPLPlayer } from '../types';


interface PlayerCardProps {
  player: FPLPlayer;
  isCaptain?: boolean;
  isViceCaptain?: boolean;
}

export function PlayerCard({ player, isCaptain, isViceCaptain }: PlayerCardProps) {
  return (
    <div className="bg-bg-card rounded-lg p-3 border border-white/5 flex flex-col justify-between hover:border-white/20 transition-colors">
      <div className="flex justify-between items-start mb-2">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-sm truncate max-w-[120px]">{player.web_name}</h3>
            {isCaptain && <span className="bg-fpl-purple text-white text-xs px-1.5 rounded font-bold">C</span>}
            {isViceCaptain && <span className="bg-fpl-purple text-white text-xs px-1.5 rounded font-bold">V</span>}
          </div>
          <p className="text-xs text-text-secondary">{player.teamName} - {player.position}</p>
        </div>
        <div className="text-right">
          <p className="text-sm font-bold text-fpl-green">£{player.price.toFixed(1)}</p>
          <p className="text-xs text-text-secondary">{player.fpl.ownership}% sel.</p>
        </div>
      </div>
      
      <div className="grid grid-cols-3 gap-2 mt-2 pt-2 border-t border-white/10 text-center">
        <div>
          <p className="text-[10px] text-text-secondary">Points</p>
          <p className="font-semibold text-sm">{player.fpl.totalPoints}</p>
        </div>
        <div>
          <p className="text-[10px] text-text-secondary">Form</p>
          <p className="font-semibold text-sm">{player.fpl.form}</p>
        </div>
        <div>
          <p className="text-[10px] text-text-secondary">xG</p>
          <p className="font-semibold text-sm">{player.underlying?.xG.toFixed(2) || player.fpl.xG.toFixed(2)}</p>
        </div>
      </div>
    </div>
  );
}
