import AVFoundation
import CoreGraphics
import CoreVideo
import Foundation
import ImageIO

guard CommandLine.arguments.count == 4 else {
    fatalError("Usage: swift encode_film.swift <frame-directory> <output.mp4> <fps>")
}

let frameDirectory = URL(fileURLWithPath: CommandLine.arguments[1], isDirectory: true)
let outputURL = URL(fileURLWithPath: CommandLine.arguments[2])
let fps = Int32(CommandLine.arguments[3])!
let firstFrame = frameDirectory.appendingPathComponent("frame-0001.png")
guard let firstSource = CGImageSourceCreateWithURL(firstFrame as CFURL, nil), let firstImage = CGImageSourceCreateImageAtIndex(firstSource, 0, nil) else {
    fatalError("Could not read first PNG frame: \(firstFrame.path)")
}
let width = firstImage.width
let height = firstImage.height - (firstImage.height % 2)
let frames = try FileManager.default.contentsOfDirectory(at: frameDirectory, includingPropertiesForKeys: nil)
    .filter { $0.lastPathComponent.hasPrefix("frame-") && $0.pathExtension == "png" }
    .sorted { $0.lastPathComponent < $1.lastPathComponent }
guard !frames.isEmpty, frames.count == 2520 else {
    fatalError("Expected 2520 numbered frames, found \(frames.count)")
}
try? FileManager.default.removeItem(at: outputURL)

let writer = try AVAssetWriter(outputURL: outputURL, fileType: .mov)
let settings: [String: Any] = [
    AVVideoCodecKey: AVVideoCodecType.jpeg,
    AVVideoWidthKey: width,
    AVVideoHeightKey: height,
]
let input = AVAssetWriterInput(mediaType: .video, outputSettings: settings)
input.expectsMediaDataInRealTime = false
let attributes: [String: Any] = [
    kCVPixelBufferPixelFormatTypeKey as String: Int(kCVPixelFormatType_32BGRA),
    kCVPixelBufferWidthKey as String: width,
    kCVPixelBufferHeightKey as String: height,
    kCVPixelBufferCGImageCompatibilityKey as String: true,
    kCVPixelBufferCGBitmapContextCompatibilityKey as String: true,
]
let adaptor = AVAssetWriterInputPixelBufferAdaptor(assetWriterInput: input, sourcePixelBufferAttributes: attributes)
guard writer.canAdd(input) else { fatalError("AVAssetWriter rejected the H.264 video input") }
writer.add(input)
guard writer.startWriting() else { fatalError("Could not start MP4 writer: \(writer.error?.localizedDescription ?? "unknown error")") }
writer.startSession(atSourceTime: .zero)

let colorSpace = CGColorSpaceCreateDeviceRGB()
let bitmapInfo = CGBitmapInfo.byteOrder32Little.rawValue | CGImageAlphaInfo.premultipliedFirst.rawValue
for (index, url) in frames.enumerated() {
    while !input.isReadyForMoreMediaData { Thread.sleep(forTimeInterval: 0.002) }
    guard let source = CGImageSourceCreateWithURL(url as CFURL, nil), let image = CGImageSourceCreateImageAtIndex(source, 0, nil) else {
        fatalError("Could not decode frame: \(url.lastPathComponent)")
    }
    var pixelBuffer: CVPixelBuffer?
    guard CVPixelBufferPoolCreatePixelBuffer(kCFAllocatorDefault, adaptor.pixelBufferPool!, &pixelBuffer) == kCVReturnSuccess,
          let buffer = pixelBuffer,
          CVPixelBufferLockBaseAddress(buffer, []) == kCVReturnSuccess,
          let baseAddress = CVPixelBufferGetBaseAddress(buffer),
          let context = CGContext(data: baseAddress, width: width, height: height, bitsPerComponent: 8,
                                  bytesPerRow: CVPixelBufferGetBytesPerRow(buffer), space: colorSpace,
                                  bitmapInfo: bitmapInfo) else {
        fatalError("Could not allocate an H.264 pixel buffer for frame \(index + 1)")
    }
    context.draw(image, in: CGRect(x: 0, y: 0, width: width, height: firstImage.height))
    CVPixelBufferUnlockBaseAddress(buffer, [])
    guard adaptor.append(buffer, withPresentationTime: CMTime(value: Int64(index), timescale: fps)) else {
        fatalError("Could not append frame \(index + 1): \(writer.error?.localizedDescription ?? "unknown error")")
    }
    if index == 0 || (index + 1) % 240 == 0 || index + 1 == frames.count {
        print("ENCODE_PROGRESS \(index + 1)/\(frames.count)")
    }
}
input.markAsFinished()
let completion = DispatchSemaphore(value: 0)
writer.finishWriting { completion.signal() }
completion.wait()
guard writer.status == .completed else { fatalError("MP4 encoding failed: \(writer.error?.localizedDescription ?? "unknown error")") }
print("ENCODED_MOTION_JPEG \(outputURL.path) \(width)x\(height) \(fps)fps \(frames.count) frames")
