import cv2
import numpy as np
import os
import sys

def process_badges(input_path, output_dir):
    print(f"Loading {input_path}")
    img = cv2.imread(input_path, cv2.IMREAD_UNCHANGED)
    if img is None:
        print("Failed to load image.")
        sys.exit(1)

    # Ensure it's BGR
    if len(img.shape) == 3 and img.shape[2] == 4:
        img = cv2.cvtColor(img, cv2.COLOR_BGRA2BGR)
    elif len(img.shape) == 2:
        img = cv2.cvtColor(img, cv2.COLOR_GRAY2BGR)

    h, w = img.shape[:2]
    
    mask = np.zeros((h + 2, w + 2), np.uint8)
    flood_filled = img.copy()
    cv2.floodFill(flood_filled, mask, (0, 0), (255, 0, 255), (10, 10, 10), (10, 10, 10), flags=8)

    b, g, r = cv2.split(flood_filled)
    is_bg = (b == 255) & (g == 0) & (r == 255)
    alpha = np.where(is_bg, 0, 255).astype(np.uint8)
    
    rgba = cv2.cvtColor(img, cv2.COLOR_BGR2BGRA)
    rgba[:, :, 3] = alpha

    contours, _ = cv2.findContours(alpha, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    
    # Get bounding boxes
    boxes = [cv2.boundingRect(c) for c in contours]
    
    # Sort by area descending and take top 5
    boxes.sort(key=lambda b: b[2] * b[3], reverse=True)
    top_5_boxes = boxes[:5]
    
    print(f"Selected {len(top_5_boxes)} largest badges.")

    # Sort the 5 boxes by Y to separate rows
    top_5_boxes.sort(key=lambda b: b[1])
    
    # The first 3 are the top row, the last 2 are the bottom row
    top_row = top_5_boxes[:3]
    bottom_row = top_5_boxes[3:]
    
    # Sort each row by X (left to right)
    top_row.sort(key=lambda b: b[0])
    bottom_row.sort(key=lambda b: b[0])
    
    sorted_boxes = top_row + bottom_row
    
    filenames = [
        "badge-founding-seller.png",
        "badge-gold-medal.png",
        "badge-certified-badge.png",
        "badge-verified-pin.png",
        "badge-trax-ambassador.png"
    ]
    
    os.makedirs(output_dir, exist_ok=True)
    
    for i, (x, y, cw, ch) in enumerate(sorted_boxes):
        pad = int(max(cw, ch) * 0.05)
        
        x1 = max(0, x - pad)
        y1 = max(0, y - pad)
        x2 = min(w, x + cw + pad)
        y2 = min(h, y + ch + pad)
        
        cropped = rgba[y1:y2, x1:x2]
        out_path = os.path.join(output_dir, filenames[i])
        cv2.imwrite(out_path, cropped)
        print(f"Saved {out_path} (width: {cw}, height: {ch})")

if __name__ == "__main__":
    input_file = "/Users/jacksoncastro/Downloads/trax-badges-v5-png-pack-v2/v5-composite-preview.png"
    out_dir = "public/badges"
    process_badges(input_file, out_dir)
