import os
from PIL import Image
import sys

def convert_pngs_to_webp(directory):
    for filename in os.listdir(directory):
        if filename.endswith(".png"):
            png_path = os.path.join(directory, filename)
            webp_filename = filename.replace(".png", ".webp")
            webp_path = os.path.join(directory, webp_filename)
            
            if not os.path.exists(webp_path):
                print(f"Converting {filename} to WebP...")
                try:
                    with Image.open(png_path) as img:
                        # Convert to RGB if needed, WebP handles RGBA
                        img.save(webp_path, "webp", quality=85)
                except Exception as e:
                    print(f"Failed to convert {filename}: {e}")
            else:
                print(f"{webp_filename} already exists.")

if __name__ == "__main__":
    current_dir = os.path.dirname(os.path.abspath(__file__))
    convert_pngs_to_webp(current_dir)
