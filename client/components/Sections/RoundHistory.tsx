import React, { useState, useEffect, useRef } from 'react';

interface RoundData {
  id: string;
  value: number;
}

interface RoundHistoryProps {
  multipliers: RoundData[];
}

export default function RoundHistory({ multipliers }: RoundHistoryProps) {
  const [isHeader2Visible, setIsHeader2Visible] = useState(false);
  const [recentMultipliers, setRecentMultipliers] = useState<RoundData[]>([]);
  const prevMultipliersRef = useRef<RoundData[]>([]);

  const toggleHeader2 = () => {
    setIsHeader2Visible((prev) => !prev);
  };

  const getSizeForMultiplier = (value: number): string => {
    if (value >= 1 && value < 2) {
      return 'small';
    } else if (value >= 2 && value <= 10) {
      return 'medium';
    } else if (value > 10) {
      return 'large';
    }
    return '';
  };

  useEffect(() => {
    const updatedMultipliers = multipliers.filter((round) => round.value);
    if (recentMultipliers.length === 0 && updatedMultipliers.length > 0) {
      setRecentMultipliers(updatedMultipliers.slice(-30).reverse());
    } else if (updatedMultipliers.length > prevMultipliersRef.current.length) {
      const latestMultiplier = updatedMultipliers[updatedMultipliers.length - 1];
      const updatedRecentMultipliers = [latestMultiplier, ...recentMultipliers];
      const uniqueMultipliers = [
        ...new Map(updatedRecentMultipliers.map((item) => [item.id, item])).values(),
      ];
      setRecentMultipliers(uniqueMultipliers.slice(0, 100));
    }

    prevMultipliersRef.current = updatedMultipliers;
  }, [multipliers]);

  return (
    <div className="aviator-round-history">
      <div className="aviator-round-history-header-1">
        <div className="aviator-round-history-header-1-outcomes">
          {recentMultipliers.map((round, index) => {
            const size = getSizeForMultiplier(round.value);
            return (
              <div
                key={`${round.id}-${round.value || index}`}
                className={`aviator-round-history-outcome aviator-bets-multiplier ${size}`}
                style={{
                  animation: index === 0 ? 'slideIn 1s ease-out' : 'none',
                }}
              >
                {String(round.value)}x
              </div>
            );
          })}
        </div>
        <div className="aviator-round-history-btn" id="open-round-history" onClick={toggleHeader2}>
          <i className="fa fa-history" aria-hidden="true"></i>
          <i className="fa fa-arrow-circle-down" aria-hidden="true"></i>
        </div>
      </div>
      {isHeader2Visible && (
        <div className="aviator-round-history-header-2">
          <div className="aviator-round-history-header-top">
            <div className="aviator-round-history-header-title">ROUND HISTORY</div>
            <div className="aviator-round-history-btn header-2" onClick={toggleHeader2}>
              <i className="fa fa-history" aria-hidden="true"></i>
              <i className="fa fa-arrow-circle-up" aria-hidden="true"></i>
            </div>
          </div>
          <div className="aviator-round-history-header-bottom">
            {recentMultipliers.map((round, index) => {
              const size = getSizeForMultiplier(round.value);
              return (
                <div
                  key={`${round.id}-${round.value || index}`}
                  className={`aviator-round-history-outcome aviator-bets-multiplier ${size}`}
                  style={{
                    animation: index === 0 ? 'slideIn 1s ease-out' : 'none',
                  }}
                >
                  {String(round.value)}x
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
