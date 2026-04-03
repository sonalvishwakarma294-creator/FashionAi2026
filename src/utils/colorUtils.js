
const fashionColors = {
  // Fair/Light skin tones
  'peach': '#FFE5B4',
  'rose gold': '#B76E79',
  'ivory': '#FFFFF0',
  'blush': '#FADADD',
  'pastel yellow': '#FDFD96',
  'champagne': '#F7E7CE',
  'pearl white': '#F0F0F0',
  'soft coral': '#FF8B8B',
  'shell pink': '#F3C1C6',
  'apricot': '#FBCEB1',
  'powder blue': '#B0E0E6',
  'baby blue': '#89CFF0',
  'mint green': '#98FF98',
  'soft lavender': '#E6E6FA',
  'sky blue': '#87CEEB',

  // Medium/Wheatish skin tones
  'teal': '#008080',
  'emerald': '#50C878',
  'navy': '#000080',
  'navy blue': '#000080',
  'gold': '#FFD700',
  'burgundy': '#800020',
  'coral': '#FF7F50',
  'mustard': '#FFDB58',
  'khaki': '#C3B091',
  'sapphire': '#0F52BA',
  'ochre': '#CC7722',
  'taupe': '#483C32',
  'camel': '#C19A6B',
  'plum': '#8E4585',
  'brick red': '#CB4154',
  'forest green': '#228B22',
  'olive': '#808000',

  // Olive skin tones
  'terracotta': '#E2725B',
  'warm gold': '#E1AD01',
  'copper': '#B87333',
  'bronze': '#CD7F32',
  'saffron': '#F4C430',
  'amber': '#FFBF00',
  'burnt orange': '#CC5500',
  'mahogany': '#C04000',
  'rich brown': '#593E30',
  'rust': '#B7410E',
  'turquoise': '#40E0D0',

  // Deep/Dark skin tones
  'royal purple': '#7851A9',
  'crimson': '#DC143C',
  'emerald green': '#50C878',
  'sapphire blue': '#0F52BA',
  'ruby': '#E0115F',
  'onyx': '#353839',
  'jet black': '#000000',
  'maroon': '#800000',

  // Common/Basic colors
  'white': '#FFFFFF',
  'pure white': '#FFFFFF',
  'black': '#000000',
  'stark black': '#000000',
  'grey': '#808080',
  'gray': '#808080',
  'charcoal': '#36454F',
  'silver': '#C0C0C0',
  'red': '#FF0000',
  'blue': '#0000FF',
  'green': '#008000',
  'yellow': '#FFFF00',
  'orange': '#FFA500',
  'pink': '#FFC0CB',
  'purple': '#800080',
  'beige': '#F5F5DC',
  'tan': '#D2B48C',
  'royal blue': '#4169E1',

  // Others
  'icy pastels': '#E0FFFF',
  'cool pink': '#FF69B4',
  'icy blue': '#AFEEEE',
  'ash gray': '#B2BEB5',
  'pale yellow': '#FFF9E3',
  'light orange': '#FFAD60',
};

export const getColorHex = (colorName) => {
  if (!colorName) return '#CCCCCC';
  
  // If it's already a hex code, return it
  if (colorName.startsWith('#')) return colorName;

  const normalizedName = colorName.toLowerCase().trim();
  
  // Check if it's in our map
  if (fashionColors[normalizedName]) {
    return fashionColors[normalizedName];
  }

  // Fallback to standard CSS colors if it's a valid color name, 
  // or return the grey fallback
  return fashionColors[normalizedName] || '#CCCCCC';
};
