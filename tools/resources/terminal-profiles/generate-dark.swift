#!/usr/bin/env swift

import Foundation
import AppKit

// Themodynamic Stark - Dark (Low Contrast)
// Background: Void.0 (#131114)
// Foreground: Silver.2 (#5a708f) - Low contrast for eye comfort

func colorData(_ r: CGFloat, _ g: CGFloat, _ b: CGFloat) -> Data {
    let color = NSColor(calibratedRed: r/255.0, green: g/255.0, blue: b/255.0, alpha: 1.0)
    return try! NSKeyedArchiver.archivedData(withRootObject: color, requiringSecureCoding: false)
}

let profile: [String: Any] = [
    "name": "Themodynamic Dark",
    "type": "Window Settings",

    // Background: Void.0
    "BackgroundColor": colorData(19, 17, 20),

    // Foreground: Silver.2 (low contrast)
    "TextColor": colorData(90, 112, 143),
    "TextBoldColor": colorData(90, 112, 143),

    // Cursor: Silver.0 (brighter for visibility)
    "CursorColor": colorData(180, 198, 224),

    // Selection: Grace with transparency
    "SelectionColor": colorData(163, 69, 122),

    // ANSI Colors
    // Black
    "ANSIBlackColor": colorData(19, 17, 20),      // Void.0
    "ANSIBrightBlackColor": colorData(32, 29, 33),  // Void.1

    // Red
    "ANSIRedColor": colorData(92, 40, 40),          // Whispers.2
    "ANSIBrightRedColor": colorData(173, 118, 118), // Whispers.0

    // Green
    "ANSIGreenColor": colorData(109, 143, 91),      // Sage.2
    "ANSIBrightGreenColor": colorData(146, 178, 130), // Sage.1

    // Yellow
    "ANSIYellowColor": colorData(173, 165, 108),    // Garden.2
    "ANSIBrightYellowColor": colorData(209, 201, 151), // Garden.1

    // Blue
    "ANSIBlueColor": colorData(90, 112, 143),       // Silver.2
    "ANSIBrightBlueColor": colorData(132, 154, 184), // Silver.1

    // Magenta
    "ANSIMagentaColor": colorData(122, 38, 86),     // Grace.2
    "ANSIBrightMagentaColor": colorData(163, 69, 122), // Grace.1

    // Cyan
    "ANSICyanColor": colorData(74, 107, 58),        // Sage.3
    "ANSIBrightCyanColor": colorData(109, 143, 91), // Sage.2

    // White
    "ANSIWhiteColor": colorData(132, 154, 184),     // Silver.1
    "ANSIBrightWhiteColor": colorData(180, 198, 224), // Silver.0

    // Font
    "Font": try! NSKeyedArchiver.archivedData(withRootObject: NSFont(name: "FiraCode-Regular", size: 13)!, requiringSecureCoding: false),

    // Window settings
    "columnCount": 120,
    "rowCount": 40,
    "useOptionAsMetaKey": true,
]

let plist = try! PropertyListSerialization.data(fromPropertyList: profile, format: .binary, options: 0)
try! plist.write(to: URL(fileURLWithPath: "Themodynamic Dark.terminal"))

print("✓ Generated Themodynamic Dark.terminal with low-contrast foreground")
