#!/bin/bash

# Configuration
PRIMARY_COLOR="#689F38"
SVG_SOURCE="arkadas-web/public/images/favicon.svg"
OUTPUT_DIR="tmp_icons"
mkdir -p $OUTPUT_DIR

# 1. Generate Master Icon (1024x1024)
# Create a square with primary color and overlay the SVG
magick -size 1024x1024 canvas:$PRIMARY_COLOR master_bg.png
magick -background none -size 800x800 $SVG_SOURCE logo_render.png
magick composite -gravity center logo_render.png master_bg.png master_icon.png

# 2. Android Icons (Legacy Mipmaps)
ANDROID_RES="arkadas-android/app/src/main/res"
magick master_icon.png -resize 48x48 $ANDROID_RES/mipmap-mdpi/ic_launcher.png
magick master_icon.png -resize 72x72 $ANDROID_RES/mipmap-hdpi/ic_launcher.png
magick master_icon.png -resize 96x96 $ANDROID_RES/mipmap-xhdpi/ic_launcher.png
magick master_icon.png -resize 144x144 $ANDROID_RES/mipmap-xxhdpi/ic_launcher.png
magick master_icon.png -resize 192x192 $ANDROID_RES/mipmap-xxxhdpi/ic_launcher.png

# 3. iOS Icons (AppIcon.appiconset)
IOS_ASSETS="arkadas-ios/Brand/Custom.xcassets/AppIcon.appiconset"

# Function to resize and save for iOS
generate_ios() {
    local size=$1
    local scale=$2
    local filename=$3
    local dim=$(awk "BEGIN {print $size * $scale}")
    magick master_icon.png -resize ${dim}x${dim} $IOS_ASSETS/$filename
}

# Based on Contents.json found earlier
generate_ios 20 2 "arkadas-icon40@2x.png"
generate_ios 20 3 "arkadas-icon60@3x.png"
generate_ios 29 1 "arkadas-icon29@1x.png"
generate_ios 29 2 "arkadas-icon58@2x.png"
generate_ios 29 3 "arkadas-icon87@3x.png"
generate_ios 40 2 "arkadas-icon80@2x.png"
generate_ios 40 3 "arkadas-icon120@3x.png"
generate_ios 57 1 "arkadas-icon57@1x.png"
generate_ios 57 2 "arkadas-icon114@2x.png"
generate_ios 60 2 "arkadas-icon120@2x.png"
generate_ios 60 3 "arkadas-icon180@3x.png"
generate_ios 20 1 "arkadas-icon20@1x.png"
generate_ios 29 1 "arkadas-icon29@1x-1.png"
generate_ios 29 2 "arkadas-icon58@2x-1.png"
generate_ios 40 1 "arkadas-icon40@1x-1.png"
generate_ios 40 2 "arkadas-icon80@2x-1.png"
generate_ios 50 1 "arkadas-icon50@1x.png"
generate_ios 50 2 "arkadas-icon100@2x.png"
generate_ios 72 1 "arkadas-icon72@1x.png"
generate_ios 72 2 "arkadas-icon144@2x.png"
generate_ios 76 1 "arkadas-icon76@1x.png"
generate_ios 76 2 "arkadas-icon152@2x.png"
generate_ios 83.5 2 "arkadas-icon167@2x.png"
generate_ios 1024 1 "arkadas-icon1024@1x.png"

# Cleanup
rm master_bg.png logo_render.png master_icon.png
echo "App icons generated successfully!"
