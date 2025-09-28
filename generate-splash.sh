#!/bin/bash

# Generate PWA splash screens for various iPad sizes
# Requires imagemagick (brew install imagemagick)

cd "$(dirname "$0")"

# Check if ImageMagick is installed
if ! command -v magick &> /dev/null; then
    echo "ImageMagick is not installed. Please install it with:"
    echo "brew install imagemagick"
    exit 1
fi

# Create splash directory
mkdir -p splash

echo "Generating PWA splash screens..."

# Function to generate splash screen with proper centering and scaling
generate_splash() {
    local width=$1
    local height=$2
    local output=$3
    local description=$4

    # Calculate the size to fit the content properly while maintaining aspect ratio
    # We'll scale to fit the smaller dimension and center
    local size="1200x1200"  # Base size for scaling

    magick -density 300 -background "#0b1020" \
           splash-template.svg -resize "${size}" \
           -gravity center -extent "${width}x${height}" \
           "$output"

    echo "Created $description ($width x $height)..."
}

# iPad splash screen sizes (width x height)
# Generate each one individually with proper centering
generate_splash "1536" "2048" "splash/apple-launch-ipad-portrait.png" "iPad portrait splash screen"
generate_splash "2048" "1536" "splash/apple-launch-ipad-landscape.png" "iPad landscape splash screen"
generate_splash "1668" "2224" "splash/apple-launch-ipad-pro-105-portrait.png" "iPad Pro 10.5\" portrait splash screen"
generate_splash "2224" "1668" "splash/apple-launch-ipad-pro-105-landscape.png" "iPad Pro 10.5\" landscape splash screen"
generate_splash "1668" "2388" "splash/apple-launch-ipad-pro-11-portrait.png" "iPad Pro 11\" portrait splash screen"
generate_splash "2388" "1668" "splash/apple-launch-ipad-pro-11-landscape.png" "iPad Pro 11\" landscape splash screen"
generate_splash "2048" "2732" "splash/apple-launch-ipad-pro-129-portrait.png" "iPad Pro 12.9\" portrait splash screen"
generate_splash "2732" "2048" "splash/apple-launch-ipad-pro-129-landscape.png" "iPad Pro 12.9\" landscape splash screen"

echo "Splash screen generation complete!"
echo "Generated splash screens:"
ls -la splash/