import { Link } from 'react-router-dom';

import OptimizedImage from './OptimizedImage';
import styles from './OwnerCatsSection.module.css';

interface Cat {
  id: string;
  name: string;
  description: string;
  image_url: string;
}

interface OwnerCatsSectionProps {
  cats: Cat[];
  textColor?: string;
  title?: string;
}

export default function OwnerCatsSection({
  cats,
  textColor = '#000000',
  title = '同じ飼い主の猫ちゃん',
}: OwnerCatsSectionProps) {
  if (!cats || cats.length === 0) return null;

  return (
    <div className="mt-10 px-3">
      <h2 className="text-lg font-semibold mb-4" style={{ color: textColor }}>{title}</h2>
      <div 
        className={`overflow-x-auto pb-4 -mx-3 px-3 ${styles.scrollContainer} ${styles.hideScrollbar}`}
      >
        {/* Chrome, Safari, Opera向けのスクロールバー非表示 */}
        <style>
          {`
            .overflow-x-auto::-webkit-scrollbar {
              display: none;
            }
          `}
        </style>
        <div className="flex gap-3">
          {cats.map(cat => (
            <div key={cat.id} className="w-[140px] sm:w-[160px] flex-shrink-0">
              <Link to={`/cats/${cat.id}`} className="block">
                <div className="bg-white rounded-lg shadow-md overflow-hidden transform transition-all hover:scale-[1.02]">
                  <div className="aspect-square overflow-hidden">
                    <OptimizedImage
                      src={cat.image_url}
                      alt={cat.name}
                      width={160}
                      height={160}
                      className="w-full h-full object-cover"
                      decoding="async"
                      loading="lazy"
                      options={{ resize: 'fill', quality: 80 }}
                    />
                  </div>
                  <div className="p-2 bg-white">
                    <h3 className="text-sm font-semibold text-gray-800 truncate">{cat.name}</h3>
                    <div className="h-[2.5rem] overflow-hidden mt-1">
                      <p className="text-xs text-gray-600 leading-normal line-clamp-2">
                        {cat.description || '　'}
                      </p>
                    </div>
                  </div>
                </div>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
