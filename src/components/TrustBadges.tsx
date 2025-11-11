import { Shield, Truck, Heart, Award, Leaf, MapPin } from 'lucide-react';

interface TrustBadgesProps {
  variant?: 'horizontal' | 'vertical' | 'compact';
  showAll?: boolean;
}

export default function TrustBadges({ variant = 'horizontal', showAll = true }: TrustBadgesProps) {
  const badges = [
    {
      icon: Shield,
      text: '30-Day Guarantee',
      subtext: 'Money back promise',
      color: 'green'
    },
    {
      icon: Truck,
      text: 'Free Shipping',
      subtext: 'On orders over $50',
      color: 'blue'
    },
    {
      icon: Heart,
      text: 'Made with Kindness',
      subtext: 'Handcrafted with love',
      color: 'pink'
    },
    {
      icon: Leaf,
      text: 'Natural Ingredients',
      subtext: 'Eco-friendly & safe',
      color: 'green'
    },
    {
      icon: MapPin,
      text: 'Maryland Made',
      subtext: 'Local artisan crafted',
      color: 'purple'
    },
    {
      icon: Award,
      text: '5-Star Reviews',
      subtext: 'Customer approved',
      color: 'amber'
    }
  ];

  const displayBadges = showAll ? badges : badges.slice(0, 3);

  const getColorClasses = (color: string) => {
    switch (color) {
      case 'green':
        return 'text-green-700 bg-green-100 border-green-200';
      case 'blue':
        return 'text-blue-700 bg-blue-100 border-blue-200';
      case 'pink':
        return 'text-pink-700 bg-pink-100 border-pink-200';
      case 'purple':
        return 'text-purple-700 bg-purple-100 border-purple-200';
      case 'amber':
        return 'text-amber-700 bg-amber-100 border-amber-200';
      default:
        return 'text-gray-700 bg-gray-100 border-gray-200';
    }
  };

  if (variant === 'compact') {
    return (
      <div className="flex flex-wrap gap-2 justify-center">
        {displayBadges.map((badge, index) => (
          <div
            key={index}
            className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getColorClasses(badge.color)}`}
          >
            <badge.icon className="h-3 w-3" />
            <span>{badge.text}</span>
          </div>
        ))}
      </div>
    );
  }

  if (variant === 'vertical') {
    return (
      <div className="space-y-4">
        {displayBadges.map((badge, index) => (
          <div
            key={index}
            className={`flex items-center gap-3 p-3 rounded-lg border ${getColorClasses(badge.color)}`}
          >
            <badge.icon className="h-5 w-5 flex-shrink-0" />
            <div>
              <div className="font-semibold text-sm">{badge.text}</div>
              <div className="text-xs opacity-80">{badge.subtext}</div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Horizontal variant (default)
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {displayBadges.map((badge, index) => (
        <div
          key={index}
          className={`text-center p-4 rounded-lg border transition-all duration-300 hover:shadow-md ${getColorClasses(badge.color)}`}
        >
          <badge.icon className="h-6 w-6 mx-auto mb-2" />
          <div className="font-semibold text-sm mb-1">{badge.text}</div>
          <div className="text-xs opacity-80">{badge.subtext}</div>
        </div>
      ))}
    </div>
  );
}
