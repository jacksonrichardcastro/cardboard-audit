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
    
    # Flood fill from (0,0) with magenta to identify background
    # Add a 1-pixel border to allow flood fill to wrap around if badges touch the edges
    mask = np.zeros((h + 2, w + 2), np.uint8)
    flood_filled = img.copy()
    cv2.floodFill(flood_filled, mask, (0, 0), (255, 0, 255), (10, 10, 10), (10, 10, 10), flags=8)

    # Create alpha channel
    # Magenta is (255, 0, 255) in BGR
    b, g, r = cv2.split(flood_filled)
    is_bg = (b == 255) & (g == 0) & (r == 255)
    alpha = np.where(is_bg, 0, 255).astype(np.uint8)
    
    # Combine original image with alpha
    rgba = cv2.cvtColor(img, cv2.COLOR_BGR2BGRA)
    rgba[:, :, 3] = alpha

    # Find contours
    contours, _ = cv2.findContours(alpha, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    
    # Filter and sort contours
    valid_contours = []
    for c in contours:
        x, y, cw, ch = cv2.boundingRect(c)
        if cw > 50 and ch > 50: # Ignore tiny noise
            valid_contours.append((x, y, cw, ch))
            
    print(f"Found {len(valid_contours)} badges.")
    if len(valid_contours) != 5:
        print("Warning: Expected 5 badges, found", len(valid_contours))

    # Sort contours into rows: 
    # Group by y coordinate. Since top row vs bottom row has large Y gap.
    # Simple sort by Y, then split into top 3 and bottom 2, then sort by X
    valid_contours.sort(key=lambda b: b[1]) # Sort by Y
    
    top_row = valid_contours[:3]
    bottom_row = valid_contours[3:]
    
    top_row.sort(key=lambda b: b[0]) # Sort by X
    bottom_row.sort(key=lambda b: b[0]) # Sort by X
    
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
        if i >= len(filenames):
            break
            
        # Calculate padding (5% of max dimension)
        pad = int(max(cw, ch) * 0.05)
        
        # Padded bounding box
        x1 = max(0, x - pad)
        y1 = max(0, y - pad)
        x2 = min(w, x + cw + pad)
        y2 = min(h, y + ch + pad)
        
        # Crop from rgba image
        cropped = rgba[y1:y2, x1:x2]
        
        out_path = os.path.join(output_dir, filenames[i])
        cv2.imwrite(out_path, cropped)
        print(f"Saved {out_path}")

if __name__ == "__main__":
    input_file = "/Users/jacksoncastro/Downloads/trax-badges-v5-png-pack-v2/v5-composite-preview.png"
    out_dir = "public/badges"
    process_badges(input_file, out_dir)
