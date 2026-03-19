
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiCalendar, FiArrowRight, FiUser, FiZap, FiBox, FiCheck, FiHeart, FiMapPin, FiMoon, FiSun, FiActivity, FiBriefcase, FiAward, FiDroplet, FiSave } from 'react-icons/fi';
import { recommendationService } from '../services/api';

const Occasion = () => {
  const [selectedGender, setSelectedGender] = useState('female');
  const [selectedOccasion, setSelectedOccasion] = useState(null);
  const [isSaved, setIsSaved] = useState(false);

  const saveReport = async () => {
    try {
      await recommendationService.saveRecommendation({
        type: 'occasion_report',
        date: new Date().toLocaleDateString(),
        occasion: selectedOccasion,
        gender: selectedGender,
        title: occasionLogic[selectedOccasion].title,
        look: occasionLogic[selectedOccasion][selectedGender].look,
        formula: occasionLogic[selectedOccasion][selectedGender].formula,
        tip: occasionLogic[selectedOccasion][selectedGender].tip,
        mood: occasionLogic[selectedOccasion][selectedGender].mood,
        colors: occasionLogic[selectedOccasion].colors
      });
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
    } catch (error) {
      alert('Save failed. Please login to save reports.');
      console.error(error);
    }
  };


  const occasionLogic = {
    wedding: {
      title: "Wedding & Festive",
      icon: <FiHeart />,
      colors: [
        { name: "Royal Gold", hex: "#D4AF37" },
        { name: "Deep Maroon", hex: "#800000" },
        { name: "Ivory", hex: "#FFFFF0" }
      ],
      male: {
        look: "Modern Jodhpuri or Sharp Tuxedo",
        formula: "Embroidered Sherwani + Tapered Trousers + Velvet Mojaris + Traditional Brooch",
        tip: "Stick to jewel tones like Deep Emerald or Royal Navy for evening weddings.",
        mood: "Grand & Sophisticated"
      },
      female: {
        look: "Designer Lehanga or Sequin Saree",
        formula: "Silk Saree + Sleeveless Blouse + Heavy Jhumkas + Embroidered Clutch",
        tip: "Pastels work best for morning ceremonies; save the shimmer for the reception.",
        mood: "Elegant & Traditional"
      }
    },
    party: {
      title: "Night Out & Party",
      icon: <FiMoon />,
      colors: [
        { name: "Midnight Black", hex: "#000000" },
        { name: "Electric Silver", hex: "#C0C0C0" },
        { name: "Wine Red", hex: "#722F37" }
      ],
      male: {
        look: "Street-Style Edgy",
        formula: "Leather Biker Jacket + Graphic Tee + Ripped Black Denim + Chelsea Boots",
        tip: "One statement accessory (like a silver chain) is enough to elevate this look.",
        mood: "Bold & Vibrant"
      },
      female: {
        look: "Chic Cocktail",
        formula: "Satin Slip Dress + Oversized Blazer + Strappy Heels + Metallic Bag",
        tip: "Balance the shimmer of the dress with a matte blazer for a high-fashion look.",
        mood: "Glamorous & Modern"
      }
    },
    corporate: {
      title: "Business & Office",
      icon: <FiBriefcase />,
      colors: [
        { name: "Navy Blue", hex: "#000080" },
        { name: "Slate Grey", hex: "#708090" },
        { name: "Pure White", hex: "#FFFFFF" }
      ],
      male: {
        look: "The Power Executive",
        formula: "Tailored Navy Blazer + Crisp White Shirt + Grey Chinos + Brown Derbies",
        tip: "Ensure your belt color strictly matches your shoe color for a professional finish.",
        mood: "Authoritative & Clean"
      },
      female: {
        look: "Corporate Chic",
        formula: "High-Waisted Wide Leg Trousers + Silk Blouse + Pointed Pumps + Minimalist Watch",
        tip: "Monochrome outfits (same color top and bottom) make you look taller and more polished.",
        mood: "Professional & Poised"
      }
    },
    casual: {
      title: "Everyday & Weekend",
      icon: <FiSun />,
      colors: [
        { name: "Sage Green", hex: "#BCB88A" },
        { name: "Beige", hex: "#F5F5DC" },
        { name: "Denim Blue", hex: "#1560BD" }
      ],
      male: {
        look: "The Urban Minimalist",
        formula: "Heavyweight Tee + Relaxed Fit Cargoes + Retro Sneakers + Canvas Tote",
        tip: "Quality of fabric matters more than branding in a minimalist casual look.",
        mood: "Relaxed & Effortless"
      },
      female: {
        look: "Casual Aesthetic",
        formula: "Straight Leg Jeans + Tucked-in Crop Top + White Sneakers + Baggy Shacket",
        tip: "Layering a shirt over a crop top adds depth without adding heat.",
        mood: "Comfortable & Trendy"
      }
    },
    date: {
      title: "Date Night",
      icon: <FiActivity />,
      colors: [
        { name: "Blush Pink", hex: "#FE828C" },
        { name: "Burgundy", hex: "#800020" },
        { name: "Charcoal", hex: "#36454F" }
      ],
      male: {
        look: "Sophisticated Casual",
        formula: "Knit Polo + Dark Indigo Denim + Loafers + Subtle Fragrance",
        tip: "A knit polo looks more expensive and intentional than a standard cotton one.",
        mood: "Charming & Approachable"
      },
      female: {
        look: "Romantic Evening",
        formula: "Midi Wrap Dress + Delicate Gold Jewelry + Block Heels + Small Satchel",
        tip: "Wrap dresses are universally flattering and perfect for dinner settings.",
        mood: "Romantic & Soft"
      }
    },
    vacation: {
      title: "Travel & Resort",
      icon: <FiMapPin />,
      colors: [
        { name: "Turquoise", hex: "#40E0D0" },
        { name: "Coral", hex: "#FF7F50" },
        { name: "Sunny Yellow", hex: "#FFDB58" }
      ],
      male: {
        look: "Resort Bound",
        formula: "Linen Button-Down + Drawstring Shorts + Leather Slides + Straw Hat",
        tip: "Linen is your best friend for tropical weather—it breathes and looks better when slightly wrinkled.",
        mood: "Breezy & Luxurious"
      },
      female: {
        look: "Tropical Wanderer",
        formula: "Floral Maxi Dress + Woven Sandals + Oversized Sunglasses + Macramé Bag",
        tip: "Choose breathable natural fibers like cotton or rayon for all-day comfort.",
        mood: "Free-Spirited & Sun-Kissed"
      }
    }
  };

  return (
    <div className="min-h-screen pt-24 pb-16 bg-background dark:bg-darkBackground">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-16">
          <span className="text-primary font-black uppercase text-xs tracking-[0.3em] mb-4 block">Occasion Intelligence</span>
          <h1 className="text-5xl md:text-7xl font-black mb-6 tracking-tighter uppercase">Dress For The <span className="text-primary">Moment</span></h1>
          <p className="text-gray-500 max-w-2xl mx-auto text-lg font-medium leading-relaxed">Select an occasion and your gender to receive a professionally curated outfit blueprint with a custom color palette.</p>
        </motion.div>

        {/* Gender Toggle */}
        <div className="flex justify-center gap-4 mb-16">
          {['male', 'female'].map(g => (
            <button 
              key={g} 
              onClick={() => setSelectedGender(g)} 
              className={`px-10 py-4 rounded-2xl font-black uppercase text-xs tracking-widest transition-all flex items-center gap-3 ${selectedGender === g ? 'bg-primary text-white shadow-xl shadow-primary/20 scale-105' : 'bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 text-gray-400'}`}
            >
              <FiUser /> {g}
            </button>
          ))}
        </div>

        {/* Occasion Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-20">
          {Object.entries(occasionLogic).map(([key, data]) => (
            <motion.div 
              key={key}
              whileHover={{ y: -10 }}
              onClick={() => setSelectedOccasion(key)}
              className={`cursor-pointer p-10 rounded-[3rem] border-2 transition-all relative overflow-hidden group ${selectedOccasion === key ? 'border-primary bg-primary/5 shadow-2xl shadow-primary/10' : 'bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800 hover:border-primary/30'}`}
            >
              <div className={`w-16 h-16 rounded-3xl flex items-center justify-center text-2xl mb-8 transition-colors ${selectedOccasion === key ? 'bg-primary text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-400 group-hover:text-primary'}`}>
                {data.icon}
              </div>
              <h3 className="text-2xl font-black uppercase tracking-tight mb-4">{data.title}</h3>
              
              {/* Mini Palette Preview */}
              <div className="flex gap-2">
                {data.colors.map(c => (
                    <div key={c.hex} className="w-4 h-4 rounded-full border border-gray-200" style={{ backgroundColor: c.hex }} title={c.name} />
                ))}
              </div>
              
              <div className="absolute -bottom-4 -right-4 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity">
                {React.cloneElement(data.icon, { size: 150 })}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Recommendation Detail Section */}
        <AnimatePresence mode="wait">
          {selectedOccasion && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="grid lg:grid-cols-12 gap-12 items-stretch"
            >
              {/* Left: The Visual Card */}
              <div className="lg:col-span-5">
                <div className="bg-black text-white p-12 rounded-[4rem] h-full shadow-2xl relative overflow-hidden">
                  <div className="relative z-10 flex flex-col h-full justify-between">
                    <div>
                        <span className="text-primary font-black uppercase text-[10px] tracking-[0.3em] mb-4 block">Blueprint Active</span>
                        <h2 className="text-5xl font-black tracking-tighter uppercase mb-10 leading-tight">{occasionLogic[selectedOccasion].title}</h2>
                        
                        <div className="space-y-10">
                            <div>
                                <span className="text-[10px] font-black uppercase opacity-40 tracking-widest block mb-4">Recommended Look</span>
                                <p className="text-3xl font-black text-primary leading-tight uppercase">{occasionLogic[selectedOccasion][selectedGender].look}</p>
                            </div>

                            {/* OCCASION COLOR PALETTE */}
                            <div>
                                <span className="text-[10px] font-black uppercase opacity-40 tracking-widest block mb-4 flex items-center gap-2"><FiDroplet /> Recommended Palette</span>
                                <div className="flex gap-4">
                                    {occasionLogic[selectedOccasion].colors.map(c => (
                                        <div key={c.hex} className="flex flex-col items-center gap-2">
                                            <div className="w-12 h-12 rounded-full border-2 border-white/20 shadow-lg" style={{ backgroundColor: c.hex }} />
                                            <span className="text-[8px] font-black uppercase opacity-60">{c.name}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <span className="text-[10px] font-black uppercase opacity-40 tracking-widest block mb-2">The Mood</span>
                                <p className="text-lg font-bold italic opacity-90">"{occasionLogic[selectedOccasion][selectedGender].mood}"</p>
                            </div>
                        </div>
                    </div>
                    <FiAward size={100} className="text-primary opacity-20 mt-12" />
                  </div>
                  <div className="absolute top-0 right-0 p-10 opacity-10">
                    {React.cloneElement(occasionLogic[selectedOccasion].icon, { size: 200 })}
                  </div>
                </div>
              </div>

              {/* Right: The Breakdown */}
              <div className="lg:col-span-7 space-y-8">
                <div className="bg-white dark:bg-gray-900 p-12 rounded-[4rem] border border-gray-100 dark:border-gray-800 shadow-xl">
                    <div className="flex items-center gap-3 mb-10">
                        <FiBox className="text-primary" />
                        <h4 className="font-black uppercase text-xs tracking-widest">The Outfit Formula</h4>
                    </div>
                    <div className="p-10 bg-gray-50 dark:bg-gray-800/50 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 mb-10">
                        <p className="text-2xl font-black leading-tight text-text dark:text-darkText uppercase tracking-tight">
                            {occasionLogic[selectedOccasion][selectedGender].formula}
                        </p>
                    </div>
                    
                    <div className="flex items-start gap-6 bg-primary/5 p-8 rounded-[2rem] border border-primary/10">
                        <div className="w-12 h-12 bg-primary text-white rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg">
                            <FiZap />
                        </div>
                        <div>
                            <h5 className="font-black uppercase text-[10px] tracking-widest text-primary mb-2">Stylist Pro-Tip</h5>
                            <p className="text-sm font-bold leading-relaxed opacity-80">{occasionLogic[selectedOccasion][selectedGender].tip}</p>
                        </div>
                    </div>
                </div>

                <div className="flex gap-6">
                    <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="flex-1 py-6 bg-gray-100 dark:bg-gray-800 rounded-3xl font-black uppercase text-xs tracking-widest hover:bg-primary hover:text-white transition-all">Try Another Event</button>
                    <button onClick={saveReport} disabled={isSaved} className={`flex-1 py-6 rounded-3xl font-black uppercase text-xs tracking-widest hover:shadow-2xl transition-all flex items-center justify-center gap-3 ${isSaved ? 'bg-green-500 text-white shadow-lg' : 'bg-primary text-white hover:shadow-primary/30 shadow-primary/20'}`}>
                        {isSaved ? <FiCheck className="animate-pulse" /> : <FiSave />} {isSaved ? 'Saved Report!' : 'Save Report'}
                    </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
};

export default Occasion;
