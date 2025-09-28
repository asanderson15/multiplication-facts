#!/bin/bash

# Generate PWA icons from SVG template with proper scaling
# Requires imagemagick (brew install imagemagick)

cd "$(dirname "$0")"

# Check if ImageMagick is installed
if ! command -v magick &> /dev/null; then
    echo "ImageMagick is not installed. Please install it with:"
    echo "brew install imagemagick"
    exit 1
fi

# Function to generate icon with proper scaling
generate_icon() {
    local size=$1
    local output=$2
    local description=$3

    magick -density 300 -background transparent \
           icons/icon-template.svg -resize "${size}x${size}" \
           -gravity center -extent "${size}x${size}" \
           "$output"

    echo "Created $description (${size}x${size})..."
}

# Icon sizes needed for PWA
sizes=(72 96 128 144 152 192 384 512)

echo "Generating PWA icons..."

for size in "${sizes[@]}"; do
    generate_icon "$size" "icons/icon-${size}x${size}.png" "${size}x${size} icon"
done

# Also create apple-touch-icon sizes
echo "Creating Apple touch icons..."
generate_icon "180" "icons/apple-touch-icon.png" "Apple touch icon"
generate_icon "167" "icons/apple-touch-icon-167x167.png" "Apple touch icon 167x167"

echo "Icon generation complete!"
echo "Generated icons:"
ls -la icons/*.png