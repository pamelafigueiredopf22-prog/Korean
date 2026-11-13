"""Page geometry, fonts and shared front/back-matter pages for every book."""
import os
from reportlab.lib.units import inch
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas as rl_canvas

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FONT_DIR = os.path.join(ROOT, "fonts")

# --- Print spec: 8.5 x 11 in, no bleed ---------------------------------
PAGE_W, PAGE_H = 8.5 * inch, 11 * inch
SAFE = 0.5 * inch          # hard limit checked by QA (KDP minimum is lower)
MARGIN = 0.75 * inch       # what we actually design to (extra room for the gutter)
CONTENT_L, CONTENT_R = MARGIN, PAGE_W - MARGIN
CONTENT_B, CONTENT_T = MARGIN, PAGE_H - MARGIN
CONTENT_W, CONTENT_H = CONTENT_R - CONTENT_L, CONTENT_T - CONTENT_B

# --- Fonts (all SIL Open Font License, commercial use OK) -------------
DISPLAY = "Sniglet-ExtraBold"
DISPLAY_REG = "Sniglet"
BODY = "Atkinson"
BODY_BOLD = "Atkinson-Bold"
_FONTS = {
    DISPLAY: "Sniglet-ExtraBold.ttf",
    DISPLAY_REG: "Sniglet-Regular.ttf",
    BODY: "AtkinsonHyperlegible-Regular.ttf",
    BODY_BOLD: "AtkinsonHyperlegible-Bold.ttf",
}
for _name, _file in _FONTS.items():
    pdfmetrics.registerFont(TTFont(_name, os.path.join(FONT_DIR, _file)))


class Book:
    """Thin wrapper over a reportlab canvas that tracks pages and numbering."""

    def __init__(self, path, title, author="", number_pages=True):
        self.path = path
        self.c = rl_canvas.Canvas(path, pagesize=(PAGE_W, PAGE_H),
                                  initialFontName=BODY, initialFontSize=12)
        self.c.setTitle(title)
        self.c.setAuthor(author)
        self.c.setCreator("kdpbooks")
        self.page = 0
        self.number_pages = number_pages
        self.title = title
        self.page_roles = []   # role of each page, e.g. "puzzle", "blank", "front"

    def new_page(self, role="content", show_number=True):
        """Finish the current page (if any) and return the canvas for a new one."""
        if self.page:
            self.c.showPage()
        self.page += 1
        self.page_roles.append(role)
        if self.number_pages and show_number and role != "blank":
            self.c.setFont(BODY, 10)
            self.c.setFillGray(0.35)
            self.c.drawCentredString(PAGE_W / 2, MARGIN - 0.12 * inch, str(self.page))
            self.c.setFillGray(0)
        return self.c

    def blank_page(self):
        self.new_page(role="blank", show_number=False)

    def pad_to_even(self, filler=None):
        if self.page % 2:
            if filler:
                filler(self)
            else:
                self.blank_page()

    def save(self):
        self.c.showPage()
        self.c.save()


# ----------------------------------------------------------------------
# Text helpers
# ----------------------------------------------------------------------
def centred(c, text, y, font=DISPLAY, size=24, gray=0.0):
    c.setFont(font, size)
    c.setFillGray(gray)
    c.drawCentredString(PAGE_W / 2, y, text)
    c.setFillGray(0)


def fit_size(text, font, size, max_w):
    while pdfmetrics.stringWidth(text, font, size) > max_w and size > 6:
        size -= 0.5
    return size


def wrap(text, font, size, max_w):
    words, lines, cur = text.split(), [], ""
    for w in words:
        trial = (cur + " " + w).strip()
        if pdfmetrics.stringWidth(trial, font, size) <= max_w:
            cur = trial
        else:
            lines.append(cur)
            cur = w
    if cur:
        lines.append(cur)
    return lines


def paragraph(c, text, x, y, max_w, font=BODY, size=14, leading=None):
    """Draw wrapped text with top-left at (x, y); return y after the last line."""
    leading = leading or size * 1.35
    c.setFont(font, size)
    for line in wrap(text, font, size, max_w):
        c.drawString(x, y, line)
        y -= leading
    return y


def rounded_frame(c, x, y, w, h, r=18, lw=3, dash=None):
    c.setLineWidth(lw)
    if dash:
        c.setDash(*dash)
    c.roundRect(x, y, w, h, r, stroke=1, fill=0)
    c.setDash()


# ----------------------------------------------------------------------
# Shared front matter
# ----------------------------------------------------------------------
def title_page(book, title, subtitle, tagline="", decorate=None):
    c = book.new_page(role="front", show_number=False)
    size = fit_size(title, DISPLAY, 52, CONTENT_W)
    lines = [title] if size >= 34 else wrap(title, DISPLAY, 46, CONTENT_W)
    size = size if len(lines) == 1 else 46
    y = PAGE_H * 0.66
    for line in lines:
        centred(c, line, y, DISPLAY, size)
        y -= size * 1.1
    y -= 10
    for line in wrap(subtitle, BODY_BOLD, 20, CONTENT_W - 40):
        centred(c, line, y, BODY_BOLD, 20)
        y -= 26
    if tagline:
        centred(c, tagline, y - 10, BODY, 15, gray=0.25)
    if decorate:
        decorate(c)


def copyright_page(book, title, year, extra=""):
    c = book.new_page(role="front", show_number=False)
    y = CONTENT_B + 2.4 * inch
    lines = [
        title,
        f"Copyright © {year}. All rights reserved.",
        "No part of this book may be reproduced or distributed in any form",
        "without written permission from the publisher, except for personal",
        "non-commercial use by the purchaser (e.g. copying a page for a child).",
    ]
    if extra:
        lines.append(extra)
    for i, line in enumerate(lines):
        centred(c, line, y - i * 18, BODY_BOLD if i == 0 else BODY, 11, gray=0.2)


def belongs_to_page(book, decorate=None, line_count=1):
    c = book.new_page(role="front", show_number=False)
    w, h = CONTENT_W - 0.5 * inch, 3.6 * inch
    x, y = (PAGE_W - w) / 2, PAGE_H / 2 - h / 2
    rounded_frame(c, x, y, w, h, r=30, lw=5)
    rounded_frame(c, x + 12, y + 12, w - 24, h - 24, r=22, lw=1.5, dash=(6, 5))
    label = "This book belongs to"
    centred(c, label, y + h - 1.15 * inch, DISPLAY, fit_size(label, DISPLAY, 38, w - 0.9 * inch))
    c.setLineWidth(2.5)
    c.line(x + 0.6 * inch, y + 1.05 * inch, x + w - 0.6 * inch, y + 1.05 * inch)
    if decorate:
        decorate(c)


def how_to_page(book, heading, bullets, tip=None, decorate=None, size=17):
    c = book.new_page(role="front", show_number=False)
    centred(c, heading, CONTENT_T - 0.9 * inch, DISPLAY, 40)
    y = CONTENT_T - 1.9 * inch
    x = CONTENT_L + 0.55 * inch
    max_w = CONTENT_W - 1.0 * inch
    for i, b in enumerate(bullets, 1):
        c.setLineWidth(2.5)
        c.circle(x - 0.25 * inch, y + size * 0.33, 13, stroke=1, fill=0)
        c.setFont(DISPLAY, 15)
        c.drawCentredString(x - 0.25 * inch, y + size * 0.33 - 5.5, str(i))
        y = paragraph(c, b, x + 0.12 * inch, y, max_w - 0.12 * inch, BODY, size) - 16
    if tip:
        tw = CONTENT_W - 1.2 * inch
        n = len(wrap(tip, BODY, 13, tw))
        bh = 0.85 * inch + n * 13 * 1.35
        by = max(CONTENT_B + 0.4 * inch, y - bh - 0.2 * inch)
        rounded_frame(c, CONTENT_L + 0.3 * inch, by, CONTENT_W - 0.6 * inch, bh, r=16, lw=2.5)
        c.setFont(DISPLAY, 18)
        c.drawString(CONTENT_L + 0.6 * inch, by + bh - 0.42 * inch, "Grown-up tip")
        paragraph(c, tip, CONTENT_L + 0.6 * inch, by + bh - 0.72 * inch, tw, BODY, 13)
    if decorate:
        decorate(c)


def section_page(book, heading, sub=""):
    c = book.new_page(role="section")
    centred(c, heading, PAGE_H / 2 + 20, DISPLAY, 48)
    if sub:
        centred(c, sub, PAGE_H / 2 - 30, BODY, 18, gray=0.2)
    return c
