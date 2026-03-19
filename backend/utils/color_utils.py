import cv2
import numpy as np
from collections import Counter

COLOR_NAMES = {
    (255,0,0): "Red",
    (0,255,0): "Green",
    (0,0,255): "Blue",
    # Add more RGB -> name mapping...
    # Full palette from fashion domain
}

def extract_dominant_color(image_path):
    """Extract dominant color using KMeans OpenCV"""
    img = cv2.imread(image_path)
    img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
    img = img.reshape((img.shape[0] * img.shape[1], 3))
    
    criteria = (cv2.TERM_CRITERIA_EPS + cv2.TERM_CRITERIA_MAX_ITER, 10, 1.0)
    _, labels, centers = cv2.kmeans(img.astype(np.float32), 5, None, criteria, 10, cv2.KMEANS_RANDOM_CENTERS)
    
    centers = np.uint8(centers)
    dominant = centers[np.argmax([np.sum(label==i) for i in range(5)])]
    
    # Map to name
    min_diff = min(COLOR_NAMES, key=lambda k: np.sum((dominant - k)**2))
    return COLOR_NAMES[min_diff], dominant.tolist()

def color_similarity(color1, color2):
    return 1 - np.linalg.norm(np.array(color1) - np.array(color2)) / 255

if __name__ == '__main__':
    print("Color utils ready")

