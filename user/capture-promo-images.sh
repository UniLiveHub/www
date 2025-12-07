#!/bin/bash
# Capture HTML as images using Chrome/Chromium headless

OUTPUT_DIR="images"
mkdir -p "$OUTPUT_DIR"

for file in promo-html/*.html; do
    if [ -f "$file" ]; then
        basename=$(basename "$file" .html)
        echo "Capturing $basename..."
        
        # Using Chrome headless to capture
        # On macOS: /Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome
        # On Linux: google-chrome or chromium
        
        if command -v google-chrome &> /dev/null; then
            google-chrome --headless --disable-gpu --screenshot="$OUTPUT_DIR/$basename.png" --window-size=650,1080 "file://$(pwd)/$file"
        elif command -v chromium &> /dev/null; then
            chromium --headless --disable-gpu --screenshot="$OUTPUT_DIR/$basename.png" --window-size=650,1080 "file://$(pwd)/$file"
        elif [ -f "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" ]; then
            "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless --disable-gpu --screenshot="$OUTPUT_DIR/$basename.png" --window-size=650,1080 "file://$(pwd)/$file"
        else
            echo "Chrome/Chromium not found. Please install Chrome or Chromium."
            exit 1
        fi
    fi
done

echo "Capture complete! Images saved to $OUTPUT_DIR/"
