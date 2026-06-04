"""Render specific pages of Skript.pdf to PNG so they can be read visually.
Usage: python render_pages.py 233 234 235   (1-indexed printed/physical page numbers)
       python render_pages.py 154-162        (inclusive range)
Outputs into ./pages/page_NNN.png at 200 DPI.
"""
import sys, os
import fitz  # PyMuPDF

def parse_args(args):
    pages = []
    for a in args:
        if "-" in a:
            lo, hi = a.split("-")
            pages.extend(range(int(lo), int(hi) + 1))
        else:
            pages.append(int(a))
    return pages

def main():
    if len(sys.argv) < 2:
        print("give page numbers"); return
    pages = parse_args(sys.argv[1:])
    os.makedirs("pages", exist_ok=True)
    doc = fitz.open("Skript.pdf")
    zoom = 200 / 72.0
    mat = fitz.Matrix(zoom, zoom)
    for p in pages:
        idx = p - 1  # to 0-indexed
        if idx < 0 or idx >= doc.page_count:
            print(f"skip {p} (out of range)"); continue
        pix = doc.load_page(idx).get_pixmap(matrix=mat)
        out = os.path.join("pages", f"page_{p:03d}.png")
        pix.save(out)
        print(out)

if __name__ == "__main__":
    main()
