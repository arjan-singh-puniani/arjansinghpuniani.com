import AVFoundation
import Foundation
import ImageIO
import UniformTypeIdentifiers

guard CommandLine.arguments.count == 3 else {
    fatalError("Usage: swift inspect_video.swift <film.mp4> <review-frame-directory>")
}

let url = URL(fileURLWithPath: CommandLine.arguments[1])
let reviewDirectory = URL(fileURLWithPath: CommandLine.arguments[2], isDirectory: true)
let asset = AVURLAsset(url: url)
let loaded = DispatchGroup()
loaded.enter()
asset.loadValuesAsynchronously(forKeys: ["duration", "tracks"]) { loaded.leave() }
loaded.wait()

let duration = CMTimeGetSeconds(asset.duration)
let videoTracks = asset.tracks(withMediaType: .video)
let audioTracks = asset.tracks(withMediaType: .audio)
guard videoTracks.count == 1, let track = videoTracks.first else { fatalError("Expected one encoded video track") }
let size = track.naturalSize.applying(track.preferredTransform)
let width = Int(abs(size.width))
let height = Int(abs(size.height))
let fps = track.nominalFrameRate
guard abs(duration - 105) < 0.1, width == 720, height == 405, abs(fps - 24) < 0.1 else {
    fatalError("Unexpected encoded media properties: duration=\(duration), size=\(width)x\(height), fps=\(fps)")
}

try FileManager.default.createDirectory(at: reviewDirectory, withIntermediateDirectories: true)
let generator = AVAssetImageGenerator(asset: asset)
generator.appliesPreferredTrackTransform = true
generator.maximumSize = CGSize(width: 720, height: 405)
for (index, seconds) in [0.1, 15, 30, 45, 60, 75, 90, 104.9].enumerated() {
    let image = try generator.copyCGImage(at: CMTime(seconds: seconds, preferredTimescale: 600), actualTime: nil)
    let output = reviewDirectory.appendingPathComponent(String(format: "encoded-%02d.png", index + 1))
    guard let destination = CGImageDestinationCreateWithURL(output as CFURL, UTType.png.identifier as CFString, 1, nil) else {
        fatalError("Could not create review frame \(output.path)")
    }
    CGImageDestinationAddImage(destination, image, nil)
    guard CGImageDestinationFinalize(destination) else { fatalError("Could not write review frame \(output.path)") }
}

print("VIDEO_VERIFIED duration=\(duration) size=\(width)x\(height) fps=\(fps) video_tracks=\(videoTracks.count) audio_tracks=\(audioTracks.count)")
print("ENCODED_REVIEW_FRAMES=\(reviewDirectory.path)")
