import { emojiCategories } from '@/lib/Setting';
import React, { useState, useRef } from 'react';

interface EmojiCategory {
  emoji: string;
  name: string;
}

interface EmojiProps {
  onSelectEmoji: (emoji: string) => void;
  onClose: () => void;
}

export default function Emoji({ onSelectEmoji, onClose }: EmojiProps) {
  const [IsOpen, setIsOpen] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const popupRef = useRef<HTMLDivElement | null>(null);

  const filterEmojis = (category: EmojiCategory[]): EmojiCategory[] => {
    if (!searchTerm) return category;
    return category.filter((emoji) =>
      emoji.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  return (
    <div ref={popupRef} className="aviator-emojis-popup">
      <div className="aviator-popup-header">
        <div className="aviator-popup-header-left">EMOJI</div>
        <div
          onClick={onClose}
          id="aviator-gamelimits-popup-close"
          className="aviator-popup-header-right"
        >
          <i className="fa fa-times" aria-hidden="true"></i>
        </div>
      </div>
      <div className="emoji-search-container">
        <input
          type="text"
          placeholder="Search emoji..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="aviator-emoji-search"
        />
      </div>
      <div className="aviator-popup-emojis-body">
        {Object.entries(emojiCategories).map(([category, emojis]) => {
          const filteredEmojis = filterEmojis(emojis as EmojiCategory[]);
          return (
            filteredEmojis.length > 0 && (
              <div key={category}>
                <h4>{category.charAt(0).toUpperCase() + category.slice(1)}</h4>
                <div
                  style={{
                    marginTop: '-20px',
                    display: 'flex',
                    flexWrap: 'wrap',
                  }}
                >
                  {filteredEmojis.map(({ emoji, name }, index) => (
                    <span
                      key={index}
                      title={name}
                      onClick={() => {
                        onSelectEmoji(emoji);
                        setIsOpen(false);
                      }}
                      style={{
                        fontSize: '18px',
                        margin: '5px',
                        cursor: 'pointer',
                      }}
                    >
                      {emoji}
                    </span>
                  ))}
                </div>
              </div>
            )
          );
        })}
      </div>
    </div>
  );
}
