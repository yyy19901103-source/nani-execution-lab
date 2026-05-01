"""Generate test spec PDFs from .txt files using reportlab."""
import os, re
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, HRFlowable
from reportlab.lib.enums import TA_LEFT, TA_CENTER

W, H = A4
MARGIN = 20 * mm

styles = getSampleStyleSheet()

style_body = ParagraphStyle(
    "body", fontName="Courier", fontSize=8, leading=11,
    textColor=colors.HexColor("#1e1e1e"), spaceAfter=0,
)
style_h1 = ParagraphStyle(
    "h1", fontName="Helvetica-Bold", fontSize=10, leading=14,
    textColor=colors.HexColor("#143c78"), spaceBefore=8, spaceAfter=2,
)
style_h2 = ParagraphStyle(
    "h2", fontName="Helvetica-Bold", fontSize=9, leading=13,
    textColor=colors.HexColor("#2a2a2a"), spaceBefore=4, spaceAfter=1,
)
style_title = ParagraphStyle(
    "title", fontName="Helvetica-Bold", fontSize=11, leading=15,
    textColor=colors.black, alignment=TA_CENTER, spaceBefore=2, spaceAfter=2,
)


def classify(line: str):
    """Return (style_key, text) based on line content."""
    stripped = line.strip()
    if not stripped:
        return "blank", ""
    if re.match(r"^=+$", stripped):
        return "hr", ""
    # top-level section heading: single digit + dot + space + ALL CAPS word
    m = re.match(r"^(\d+)\.\s+([A-Z][A-Z\s/()&–-]{4,})$", stripped)
    if m:
        return "h1", stripped
    # sub-clause: digit.digit
    if re.match(r"^\d+\.\d+", stripped):
        return "h2", stripped
    # title-like lines: all upper, no lowercase
    if stripped.isupper() and len(stripped) > 6:
        return "title", stripped
    return "body", line.rstrip()


def txt_to_pdf(txt_path: str, pdf_path: str):
    doc = SimpleDocTemplate(
        pdf_path,
        pagesize=A4,
        leftMargin=MARGIN, rightMargin=MARGIN,
        topMargin=MARGIN, bottomMargin=MARGIN + 6 * mm,
        title=os.path.basename(txt_path),
    )
    story = []

    with open(txt_path, encoding="utf-8") as f:
        lines = f.readlines()

    for line in lines:
        kind, text = classify(line)
        # escape XML special chars for reportlab
        text = text.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
        # replace en-dash with plain hyphen for safe encoding
        text = text.replace("–", "-").replace("—", "--")

        if kind == "blank":
            story.append(Spacer(1, 3))
        elif kind == "hr":
            story.append(HRFlowable(width="100%", thickness=0.5, color=colors.grey))
            story.append(Spacer(1, 2))
        elif kind == "h1":
            story.append(Paragraph(text, style_h1))
        elif kind == "h2":
            story.append(Paragraph(text, style_h2))
        elif kind == "title":
            story.append(Paragraph(text, style_title))
        else:
            story.append(Paragraph(text, style_body))

    doc.build(story)
    print(f"Generated: {pdf_path}  ({os.path.getsize(pdf_path)//1024} KB, {len(lines)} lines)")


base = os.path.dirname(os.path.abspath(__file__))
txt_to_pdf(os.path.join(base, "spec_medium_EN.txt"), os.path.join(base, "spec_medium_EN.pdf"))
txt_to_pdf(os.path.join(base, "spec_long_EN.txt"),   os.path.join(base, "spec_long_EN.pdf"))
print("Done.")
