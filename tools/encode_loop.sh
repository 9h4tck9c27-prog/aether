#!/bin/sh
# Encode rendered frames into the brand motion MP4s.
F=$1; OUT=$2
ffmpeg -y -loglevel error -framerate 30 -i $F/vertical/f%04d.jpg -c:v libx264 -pix_fmt yuv420p -crf 18 -preset slow -movflags +faststart $OUT/aether-motion-vertical-clean.mp4
ffmpeg -y -loglevel error -framerate 30 -i $F/vertical/f%04d.jpg -loop 1 -i $OUT/aether-video-overlay.png \
  -filter_complex "[1:v]format=rgba,fade=t=in:st=10.4:d=1.2:alpha=1[o];[0:v][o]overlay=0:0:shortest=1" \
  -c:v libx264 -pix_fmt yuv420p -crf 18 -preset slow -movflags +faststart $OUT/aether-motion-vertical.mp4
ffmpeg -y -loglevel error -framerate 30 -i $F/square/f%04d.jpg -c:v libx264 -pix_fmt yuv420p -crf 18 -preset slow -movflags +faststart $OUT/aether-motion-square.mp4
ls -la $OUT/*.mp4
