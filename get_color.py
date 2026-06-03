import AppKit

img = AppKit.NSImage.alloc().initWithContentsOfFile_("public/trax-logo-polished.jpg")
if not img:
    print("Failed to load image")
    exit(1)
rep = AppKit.NSBitmapImageRep.alloc().initWithData_(img.TIFFRepresentation())
if not rep:
    print("Failed to get bitmap")
    exit(1)
color = rep.colorAtX_y_(0, 0)
r = int(color.redComponent() * 255)
g = int(color.greenComponent() * 255)
b = int(color.blueComponent() * 255)
print(f"{r:02x}{g:02x}{b:02x}")
