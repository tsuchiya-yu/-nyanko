import { Heart } from 'lucide-react';
import { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';

import OptimizedImage from './OptimizedImage';
import { useFavorites } from '../hooks/useFavorites';
import { useAuthStore } from '../store/authStore';
import { calculateAge } from '../utils/calculateAge';

import type { Cat } from '../types';

interface CatCardProps {
  cat: Cat;
  actions?: ReactNode;
}

export default function CatCard({ cat, actions }: CatCardProps) {
  const age = calculateAge(cat.birthdate);
  const { user } = useAuthStore();
  const { isFavorite, toggleFavorite } = useFavorites();
  const isFav = isFavorite(cat.id);
  const navigate = useNavigate();

  const handleCardClick = () => {
    navigate(`/cats/${cat.id}`);
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden transform transition-all hover:scale-[1.02]">
      <div onClick={handleCardClick} className="cursor-pointer">
        <div className="relative h-48">
          <OptimizedImage
            src={cat.image_url}
            alt={cat.name}
            width={400}
            height={300}
            className="w-full h-full object-cover"
            decoding="async"
            loading="lazy"
            options={{ resize: 'fill', quality: 80 }}
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
          <h3 className="text-lg font-semibold text-gray-800 truncate">{cat.name}</h3>
          <p className="text-sm text-gray-600 mt-1">
            {cat.breed} | {age.toString()}
          </p>
          <p className="text-sm text-gray-700 mt-2 line-clamp-2 min-h-[2.5rem]">
            {cat.description}
          </p>
        </div>
      </div>
      {actions && <div className="px-4 pb-4 pt-0 flex gap-2 justify-between">{actions}</div>}
    </div>
  );
}
