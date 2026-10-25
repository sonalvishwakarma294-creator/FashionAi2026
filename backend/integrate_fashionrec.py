import os
import json
import random
from flask import Flask
from config.db import db, init_db
from models.outfit import Outfit

BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.abspath(os.path.join(BACKEND_DIR, ".."))
IMAGES_DIR = os.path.join(PROJECT_ROOT, 'images')
GALLERY_JSON = os.path.join(BACKEND_DIR, 'gallery.json')

app = Flask(__name__)
init_db(app)

OCCASION_KEYWORDS = {
    'Office': ['office', 'work', 'blazer', 'trench', 'suit', 'formal', 'business', 'workwear', 'professional', 'skinny jeans', 'pump', 'tailored'],
    'Party': ['party', 'dress', 'evening', 'gown', 'glitter', 'sparkle', 'elegant', 'prom', 'cocktail', 'stiletto', 'shiny', 'floral dress', 'maxi dress', 'pearl'],
    'Traditional': ['traditional', 'ethnic', 'vintage', 'gingham', 'peter pan', 'retro', 'classical', 'french-style'],
}

COLOR_KEYWORDS = {
    'Red': ['red', 'crimson', 'ruby', 'burgundy'],
    'Blue': ['blue', 'navy', 'indigo', 'azure', 'denim'],
    'Green': ['green', 'emerald', 'olive', 'mint'],
    'Black': ['black', 'onyx', 'jet'],
    'White': ['white', 'ivory', 'cream', 'pearl'],
    'Pink': ['pink', 'rose', 'blush', 'magenta'],
    'Yellow': ['yellow', 'gold', 'mustard', 'amber', 'tan', 'beige'],
    'Purple': ['purple', 'violet', 'lavender', 'lilac'],
}

def classify_occasion(description, category):
    desc_lower = description.lower()
    scores = {}
    for occ, keywords in OCCASION_KEYWORDS.items():
        scores[occ] = sum(1 for kw in keywords if kw in desc_lower)
    if category in ['Jewelry', 'Bags', 'Shoes', 'Accessories']:
        scores['Party'] += 2
    max_score = max(scores.values()) if scores else 0
    if max_score > 0:
        return max(scores, key=scores.get)
    return 'Casual'

def extract_color(description):
    desc_lower = description.lower()
    for color, keywords in COLOR_KEYWORDS.items():
        for kw in keywords:
            if kw in desc_lower:
                return color
    return None

def extract_category(ds_category):
    mapping = {
        'Clothing': 'Full Look',
        'Accessories': 'Tops',
        'Jewelry': 'Bottoms',
        'Bags': 'Full Look',
        'Shoes': 'Bottoms',
    }
    return mapping.get(ds_category, 'Full Look')

def main(num_images=80):
    with app.app_context():
        existing_ids = {o.id for o in Outfit.query.all()}
        next_id = max(existing_ids) + 1 if existing_ids else 1

        gallery_entries = []
        if os.path.exists(GALLERY_JSON):
            with open(GALLERY_JSON, 'r') as f:
                gallery_entries = json.load(f)
            existing_json_ids = {e['id'] for e in gallery_entries}
            next_id = max(next_id, max(existing_json_ids) + 1 if existing_json_ids else next_id)

        print(f"ℹ️ Next outfit ID: #{next_id}")
        print(f"📥 Integrating {num_images} images from Anony100/FashionRec via direct HF CDN URLs...")

        base_url = "https://datasets-server.huggingface.co/assets/Anony100/FashionRec/--/8df8181ad5c1d269e47f675c431b320b4893f170/--/default/train"
        sample_items = [
            (0, "A long-sleeved gingham dress. A black and white checkered design floor-length garment, V-neckline, drawstring waist.", "Clothing"),
            (1, "A belted olive green trench coat with wide lapel collar, long sleeves, and self-fabric belt.", "Clothing"),
            (2, "A cream-colored baseball cap with curved brim, red embroidered 'BEARD BOY' text.", "Accessories"),
            (3, "A high-waisted purple dragon-printed floral maxi dress, long-sleeved, V-neckline, waist-tied.", "Clothing"),
            (4, "A black sleeveless floor-length dress with thin straps, ruffled bodice, soft flowing silhouette.", "Clothing"),
            (5, "Silver pearl earrings with delicate flower design, four pearls and one gemstone on gold hoop.", "Jewelry"),
            (6, "A white leather quilted shoulder bag with gold chain strap and decorative metal plate flap.", "Bags"),
            (7, "A one-shoulder shiny fabric dress with subtle diamond pattern, long flared skirt, high waist.", "Clothing"),
            (8, "A cream leather quilted shoulder bag with gold-tone chain strap and button-closure flap.", "Bags"),
            (9, "A French-style floral dress with high waist, flowy skirt, Peter Pan collar, ribbon belt.", "Clothing"),
            (10, "Black suede stiletto pump with red insole, 5-inch high heel, pointed toe.", "Shoes"),
            (11, "Women's blue light-wash skinny jeans with subtle fade, distressed knees, slim fit.", "Clothing"),
            (12, "A white polka dot blouse with long sleeves, collar and tie at the neck.", "Clothing"),
            (13, "A white vintage midi dress with V-neckline, collar, belted waist, lightweight.", "Clothing"),
            (14, "Rich red smooth leather small shoulder bag with gold chain straps, geometric metal closure.", "Bags"),
            (15, "Butterfly-shaped earrings with white mother-of-pearl shell design and gold trim.", "Jewelry"),
            (16, "Small black rectangular glittery crossbody bag with pearl buttons, gold-tone metal plate.", "Bags"),
            (17, "Pure silver wave-shaped pearl earrings with single white pearl suspended at each end.", "Jewelry"),
            (18, "Men's navy blue suit blazer with notched lapels, double-breasted design, tailored fit.", "Clothing"),
            (19, "A pair of white low-top canvas sneakers with rubber sole and lace-up closure.", "Shoes"),
            (20, "Classic blue denim jacket with button front, chest pockets, and collar.", "Clothing"),
            (21, "A beige wide-brimmed sun hat with woven straw texture and decorative band.", "Accessories"),
            (22, "A little black dress with fitted bodice, flared skirt, and sleeveless design.", "Clothing"),
            (23, "Gold hoop earrings with polished finish and medium-sized circular shape.", "Jewelry"),
            (24, "A tan leather tote bag with dual handles and spacious interior design.", "Bags"),
            (25, "A pastel pink chiffon blouse with ruffled details and bow neckline.", "Clothing"),
            (26, "A pair of red patent leather high heels with platform sole and ankle strap.", "Shoes"),
            (27, "A grey merino wool sweater with crew neck, ribbed cuffs, and relaxed fit.", "Clothing"),
            (28, "A silk patterned scarf with vibrant floral print and rolled edges.", "Accessories"),
            (29, "Elegant diamond stud earrings with round-cut stones in classic four-prong setting.", "Jewelry"),
            (30, "A black leather biker jacket with zipper details, quilted panels, and lapel collar.", "Clothing"),
            (31, "A royal blue satin evening gown with cowl neckline and draped mermaid skirt.", "Clothing"),
            (32, "A camel wool coat with double-breasted front, wide lapels, and midi length.", "Clothing"),
            (33, "A delicate gold pendant necklace featuring a small star on a fine chain.", "Jewelry"),
            (34, "A structured black leather briefcase with gold hardware and adjustable strap.", "Bags"),
            (35, "A white cotton button-down shirt with pointed collar and long sleeves.", "Clothing"),
            (36, "Olive green cargo pants with multiple pockets, drawstring waist, and tapered fit.", "Clothing"),
            (37, "A burgundy velvet blazer with shawl collar, single button, and tailored silhouette.", "Clothing"),
            (38, "Crystal drop earrings with teardrop-shaped gems set in silver-tone metal.", "Jewelry"),
            (39, "A light blue chambray shirt with chest pocket and button-down collar.", "Clothing"),
            (40, "Tan suede ankle boots with low block heel, inside zip, and rounded toe.", "Shoes"),
            (41, "A cream cable-knit turtleneck sweater with ribbed hem and cuffs.", "Clothing"),
            (42, "A plaid mini skirt with pleated design, high waist, and schoolgirl silhouette.", "Clothing"),
            (43, "Layered gold chain necklaces with varied lengths and small circular pendants.", "Jewelry"),
            (44, "A pink leather crossbody bag with tassel detail and adjustable strap.", "Bags"),
            (45, "A black cashmere turtleneck sweater, soft and luxurious knit, slim fit silhouette.", "Clothing"),
            (46, "Emerald green silk slip dress with thin spaghetti straps and bias cut midi length.", "Clothing"),
            (47, "A brown leather fedora hat with pinched crown and wide grosgrain band.", "Accessories"),
            (48, "Chunky white platform sneakers with thick rubber sole and retro styling.", "Shoes"),
            (49, "A yellow raincoat with hood, snap button closure, and front patch pockets.", "Clothing"),
            (50, "A turquoise beaded statement necklace with multiple strands and ethnic design.", "Jewelry"),
            (51, "A grey leather messenger bag with flap closure and adjustable shoulder strap.", "Bags"),
            (52, "A floral wrap dress with surplice neckline, waist tie, and flowing chiffon skirt.", "Clothing"),
            (53, "A brown shearling aviator jacket with fur lining, buckle straps, and zipper front.", "Clothing"),
            (54, "A mint green knit cardigan with pearl buttons and V-neckline, cropped length.", "Clothing"),
            (55, "A leopard print silk scarf with animal pattern, hand-rolled edges, square shape.", "Accessories"),
            (56, "Strappy nude block heel sandals with ankle buckle, open toe, evening wear style.", "Shoes"),
            (57, "A cropped white puffer vest with stand collar, zip front, and quilted pattern.", "Clothing"),
            (58, "Lavender lace bralette with delicate scalloped edges and adjustable straps.", "Clothing"),
            (59, "A silver cuff bracelet with engraved geometric pattern, minimalist design.", "Jewelry"),
            (60, "A nylon backpack in bright orange with multiple compartments and padded straps.", "Bags"),
            (61, "Mustard yellow corduroy trousers with high waist, wide leg, and retro flare.", "Clothing"),
            (62, "A charcoal grey wool overcoat with notch lapel, single-breasted, knee length.", "Clothing"),
            (63, "Black and white striped Breton shirt with boat neck and three-quarter sleeves.", "Clothing"),
            (64, "A satin hair scrunchie set in jewel tones, velvet texture, assorted colors.", "Accessories"),
            (65, "Classic white leather loafers with penny slot detail, moc-toe construction.", "Shoes"),
            (66, "A dark wash denim jumpsuit with button front, belted waist, and straight legs.", "Clothing"),
            (67, "Blush pink tulle midi skirt with layered tiers, elastic waistband, ballerina style.", "Clothing"),
            (68, "Gold initial pendant necklace with personalized letter on dainty cable chain.", "Jewelry"),
            (69, "A woven rattan handbag with top handle, round shape, and summer straw design.", "Bags"),
            (70, "A black ribbed knit bodycon midi dress with long sleeves and turtleneck.", "Clothing"),
            (71, "A cream faux fur coat with shawl collar, plush texture, and knee length.", "Clothing"),
            (72, "Terracotta colored linen wide-leg pants with drawstring waist and breathable fabric.", "Clothing"),
            (73, "Cat-eye sunglasses with tortoiseshell acetate frame and gradient tinted lenses.", "Accessories"),
            (74, "Over-the-knee black suede boots with stiletto heel and partial side zip closure.", "Shoes"),
            (75, "A vintage band graphic t-shirt in faded black, crew neck, cotton jersey.", "Clothing"),
            (76, "A satin slip skirt in champagne color, bias cut, midi length, silky sheen.", "Clothing"),
            (77, "Hammered gold hoop earrings with textured finish and modern sculptural shape.", "Jewelry"),
            (78, "A mini bucket bag in deep emerald velvet with drawstring and gold chain strap.", "Bags"),
            (79, "A forest green ribbed knit sweater dress, midi length, turtleneck silhouette.", "Clothing"),
        ]

        items_to_process = sample_items[:num_images]
        count_saved = 0

        for ds_idx, description, category in items_to_process:
            try:
                occasion = classify_occasion(description, category)
                color = extract_color(description)
                outfit_category = extract_category(category)
                image_url = f"{base_url}/{ds_idx}/jpg/image.jpg"
                short_desc = description[:80] + ('...' if len(description) > 80 else '')
                outfit_name = f"{category} #{next_id}: {short_desc}"

                new_outfit = Outfit(
                    id=next_id,
                    name=outfit_name,
                    image_path=image_url,
                    occasion=occasion,
                    category=outfit_category,
                    primary_color=color,
                    likes=random.randint(10, 350),
                    is_active=True,
                    extra_metadata={
                        'source': 'Anony100/FashionRec',
                        'dataset_category': category,
                        'description': description,
                        'remote_image': True,
                    }
                )
                db.session.add(new_outfit)

                gallery_entries.append({
                    'id': next_id,
                    'name': outfit_name,
                    'image': image_url,
                    'occasion': occasion,
                    'likes': random.randint(10, 350),
                    'color': color,
                    'category': outfit_category,
                    'source': 'Anony100/FashionRec'
                })

                print(f"  ✅ Added #{next_id} [{occasion}] {category}: {short_desc[:60]}")
                next_id += 1
                count_saved += 1

            except Exception as e:
                print(f"  ❌ Error item {ds_idx}: {e}")
                continue

        try:
            db.session.commit()
            print(f"\n💾 Database committed: {count_saved} new FashionRec outfits added")
        except Exception as e:
            db.session.rollback()
            print(f"❌ DB commit failed: {e}")
            return

        try:
            with open(GALLERY_JSON, 'w') as f:
                json.dump(gallery_entries, f, indent=2)
            print(f"📝 gallery.json updated: {len(gallery_entries)} total outfits")
        except Exception as e:
            print(f"❌ gallery.json write failed: {e}")

        occasion_counts = {}
        color_counts = {}
        cat_counts = {}
        for entry in gallery_entries[-count_saved:]:
            o = entry.get('occasion', 'Unknown')
            occasion_counts[o] = occasion_counts.get(o, 0) + 1
            c = entry.get('color')
            if c:
                color_counts[c] = color_counts.get(c, 0) + 1
            cc = entry.get('category', 'Unknown')
            cat_counts[cc] = cat_counts.get(cc, 0) + 1

        print(f"\n📊 FashionRec Distribution Summary:")
        print(f"   By Occasion: {', '.join(f'{k}={v}' for k,v in occasion_counts.items())}")
        if color_counts:
            print(f"   By Color:    {', '.join(f'{k}={v}' for k,v in color_counts.items())}")
        print(f"   By Category: {', '.join(f'{k}={v}' for k,v in cat_counts.items())}")
        print(f"\n🎉 Successfully integrated {count_saved} images from Anony100/FashionRec into your gallery!")
        print(f"   These images appear alongside your existing {len(gallery_entries) - count_saved} gallery images.")

if __name__ == '__main__':
    import sys
    num = int(sys.argv[1]) if len(sys.argv) > 1 else 80
    print("=" * 70)
    print("🎨 Anony100/FashionRec Dataset -> Gallery Integrator (Direct URL Mode)")
    print("=" * 70)
    main(num)
