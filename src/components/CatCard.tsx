import React from 'react';
import { Link } from 'react-router-dom';
import { calculateAge } from '../utils/calculateAge';
import type { Cat } from '../types';

interface CatCardProps {
  cat: Cat;
}

export default function CatCard({ cat }: CatCardProps) {
  const age = calculateAge(cat.birthdate);

  return (
    <Link to={`/cats/${cat.id}`} className="block">
      <div className="bg-white rounded-lg shadow-md overflow-hidden transform transition-all hover:scale-[1.02]">
        <div className="relative h-48">
          <img
            src={cat.image_url}
            alt={cat.name}
            className="w-full h-full object-cover"
          />
          <button
            onClick={(e) => {
              e.preventDefault();
              // いいね機能の実装（今後追加予定）
            }}
            // className="absolute top-3 right-3 p-2 bg-white/80 rounded-full hover:bg-white transition-colors"
          >
            {/* <Heart className="h-5 w-5 text-pink-500" /> */}
          </button>
        </div>
        <div className="p-4">
          <h3 className="text-lg font-semibold text-gray-800">{cat.name}</h3>
          <p className="text-sm text-gray-600 mt-1">{cat.breed} | {age}歳</p>
          <p className="text-sm text-gray-700 mt-2 line-clamp-2">{cat.description}</p>
        </div>
      </div>
    </Link>
  );
}