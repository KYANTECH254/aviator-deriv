"use client";

import { KEYS } from '@/lib/Setting';
import React, { useState, useEffect, useRef } from 'react';

type Gif = {
  media_formats: {
    gif: {
      url: string;
    };
  };
};

export default function GifPopup({
  onSelectGif,
  onClose,
}: {
  onSelectGif: (url: string) => void;
  onClose: () => void;
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [gifs, setGifs] = useState<Gif[]>([]);
  const [loading, setLoading] = useState(false);
  const popupRef = useRef<HTMLDivElement>(null);

  const apikey = KEYS.TENOR_API_KEY;
  const clientkey = KEYS.TENOR_APP_NAME;
  const limit = 10;

  useEffect(() => {
    const fetchGifs = async () => {
      setLoading(true);
      try {
        const search_url = `https://tenor.googleapis.com/v2/search?q=${encodeURIComponent(
          searchTerm || "trending"
        )}&key=${apikey}&client_key=${clientkey}&limit=${limit}`;
        const response = await fetch(search_url);
        if (response.ok) {
          const data = await response.json();
          setGifs(data.results);
        }
      } catch (error) {
        console.error("Error fetching GIFs:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchGifs();
  }, [searchTerm, apikey, clientkey]);

  return (
    <div ref={popupRef} className="aviator-emojis-popup">
      <div className="aviator-popup-header">
        <div className="aviator-popup-header-left">GIF</div>
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
          placeholder="Search gif..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="aviator-emoji-search"
        />
      </div>

      <div className="aviator-popup-emojis-body">
        {loading ? (
          <div className="popup-loader"></div>
        ) : (
          gifs.map((gif, index) => (
            <img
              key={index}
              src={gif.media_formats.gif.url}
              alt={`GIF ${index + 1}`}
              onClick={() => onSelectGif(gif.media_formats.gif.url)}
              className="gif-image"
            />
          ))
        )}
      </div>
    </div>
  );
}
