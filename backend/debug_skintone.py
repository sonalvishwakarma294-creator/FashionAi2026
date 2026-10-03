from flask import Flask, request, jsonify
import cv2
import numpy as np
import os

app = Flask(__name__)

@app.route('/test-skin-tone', methods=['POST'])
def test_skin_tone():
    try:
        print('Received skin-tone request')
        if 'image' not in request.files:
            return jsonify({"error": "No image"}), 400
        
        file = request.files['image']
        print(f'File received: {file.filename}, size: {len(file.read())}')
        file.seek(0)
        
        nparr = np.frombuffer(file.read(), np.uint8)
        print(f'NumPy array shape: {nparr.shape if len(nparr) > 0 else "empty"}')
        
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        if img is None:
            print('ERROR: cv2.imdecode failed')
            return jsonify({"error": "Invalid image"}), 400
        
        print(f'Image decoded: shape {img.shape}')
        img = cv2.resize(img, (224, 224))
        h, w = img.shape[:2]
        crop = img[h//4:3*h//4, w//4:3*w//4]
        avg_color = np.average(np.average(crop, axis=0), axis=0)
        mean_r, mean_g, mean_b = avg_color[::-1].astype(int)
        
        print(f'RGB avg: R={mean_r}, G={mean_g}, B={mean_b}')
        
        if mean_r > 210: tone = "Fair"
        elif mean_r > 180: tone = "Light"
        elif mean_g < 100: tone = "Olive"
        else: tone = "Medium/Wheatish"
        
        hex_color = '#{:02x}{:02x}{:02x}'.format(mean_r, mean_g, mean_b)
        print(f'Result: tone={tone}, hex={hex_color}')
        
        return jsonify({"skin_tone": tone, "skin_hex": hex_color})
    except Exception as e:
        print(f'SKIN TONE ERROR: {str(e)}')
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5002)

