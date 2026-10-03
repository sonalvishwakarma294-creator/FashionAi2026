import os
import cv2
import numpy as np
from utils.color_utils import extract_dominant_color, find_closest_color

def test_color():
    # 1. Create a pure Red patch image with a white background
    img = np.ones((200, 200, 3), dtype=np.uint8) * 255 # Pure white bg
    img[50:150, 50:150] = [30, 30, 200] # Red in BGR

    name, hex_val, rgb, swatches = extract_dominant_color(img)
    print("Test 1 (Red Shirt on White Background):")
    print("Detected Color:", name, "| Hex:", hex_val)
    print("Swatches:", swatches)
    assert "Red" in name or "Crimson" in name or "Ruby" in name

    # 2. Create an Emerald Green patch
    img2 = np.ones((200, 200, 3), dtype=np.uint8) * 255
    img2[40:160, 40:160] = [75, 125, 25] # Emerald Green in BGR
    name2, hex_val2, rgb2, swatches2 = extract_dominant_color(img2)
    print("\nTest 2 (Emerald Green on White Background):")
    print("Detected Color:", name2, "| Hex:", hex_val2)
    print("Swatches:", swatches2)
    assert "Green" in name2 or "Emerald" in name2

    # 3. Create a Mustard Yellow patch
    img3 = np.ones((200, 200, 3), dtype=np.uint8) * 255
    img3[40:160, 40:160] = [25, 165, 225] # Mustard Yellow in BGR
    name3, hex_val3, rgb3, swatches3 = extract_dominant_color(img3)
    print("\nTest 3 (Mustard Yellow on White Background):")
    print("Detected Color:", name3, "| Hex:", hex_val3)
    assert "Yellow" in name3 or "Mustard" in name3

    print("\n✅ All color accuracy tests passed with high precision CIELAB Delta-E matching!")

if __name__ == '__main__':
    test_color()
