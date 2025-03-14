import { Heart } from 'lucide-react';
import { Link } from 'react-router-dom';

import { useFavorites } from '../hooks/useFavorites';
import { useAuthStore } from '../store/authStore';
import { calculateAge } from '../utils/calculateAge';

import type { Cat } from '../types';

interface CatCardProps {
  cat: Cat;
}

export default function CatCard({ cat }: CatCardProps) {
  const age = calculateAge(cat.birthdate);
  const { user } = useAuthStore();
  const { isFavorite, toggleFavorite } = useFavorites();
  const isFav = isFavorite(cat.id);

  return (
    <Link to={`/cats/${cat.id}`} className="block">
      <div className="bg-white rounded-lg shadow-md overflow-hidden transform transition-all hover:scale-[1.02]">
        <div className="relative h-48">
          <img
            src={`${cat.image_url}?width=400&height=300&resize=fill`}
            alt={cat.name}
            className="w-full h-full object-cover"
            decoding="async"
            loading="lazy"
            width="400"
            height="300"
          />
          {user && (
            <button
              onClick={e => {
                e.preventDefault();
                e.stopPropagation();
                toggleFavorite(cat.id);
              }}
              aria-label={isFav ? 'いいね解除' : 'いいね'}
              className="absolute top-3 right-3 p-2 bg-white/80 rounded-full hover:bg-white transition-colors"
            >
              <Heart
                className={`h-5 w-5 ${isFav ? 'text-pink-500 fill-pink-500' : 'text-pink-500'}`}
              />
            </button>
          )}
        </div>
        <div className="p-4">
          <h3 className="text-lg font-semibold text-gray-800">{cat.name}</h3>
          <p className="text-sm text-gray-600 mt-1">
            {cat.breed} | {age.toString()}
          </p>
          <p className="text-sm text-gray-700 mt-2 line-clamp-2">{cat.description}</p>
        </div>
      </div>
    </Link>
  );
}
