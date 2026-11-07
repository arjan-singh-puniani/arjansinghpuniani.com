"""Render public PTB-XL samples at an explicit physical paper scale; no clinical labels."""
import csv
import hashlib
import json
import struct
from pathlib import Path
from reportlab.pdfgen import canvas
from reportlab.lib.units import mm

root = Path("public/ecg-reference/ptb-xl-1.0.3")
target = Path("public/reasonos/review")
target.mkdir(parents=True, exist_ok=True)
(target / "LICENSE.txt").write_bytes((root / "LICENSE.txt").read_bytes())
raw = (root / "00010_hr.dat").read_bytes()
manifest = json.loads((root / "provenance.json").read_text())
record = next(r for r in manifest["records"] if r["id"] == "00010")
assert hashlib.sha256(raw).hexdigest() == record["sha256"]["dat"]
values = struct.unpack("<60000h", raw)
leads = [c["lead"] for c in record["channels"]]
signal = [[(v - c["baseline"]) / c["gain"] for v in values[i::12]] for i, c in enumerate(record["channels"])]

with (target / "reference-00010.csv").open("w", newline="") as file:
    writer = csv.writer(file)
    writer.writerow(["time_ms"] + [name + "_mV" for name in leads])
    writer.writerows([[i * 2] + [f"{v[i]:.3f}" for v in signal] for i in range(5000)])

output = Path("output/pdf/reasonos-reference-00010.pdf")
output.parent.mkdir(parents=True, exist_ok=True)
pdf = canvas.Canvas(str(output), pagesize=(300 * mm, 185 * mm), invariant=1)
pdf.setTitle("ReasonOS public ECG reference - PTB-XL 00010")
pdf.setAuthor("Arjan Singh Puniani - derived from PTB-XL, Wagner et al.")

def header(subtitle):
    pdf.setFillColorRGB(.08, .21, .17)
    pdf.setFont("Helvetica-Bold", 15)
    pdf.drawString(10 * mm, 173 * mm, "ReasonOS | Public ECG reference")
    pdf.setFont("Helvetica", 9)
    pdf.drawString(10 * mm, 165 * mm, subtitle)

def footer(page):
    pdf.setFillColorRGB(.25, .34, .29)
    pdf.setFont("Helvetica", 7)
    pdf.drawString(10 * mm, 16 * mm, "Rendered from recorded digital samples. Not an original hospital printout. No diagnostic interpretation.")
    pdf.drawString(10 * mm, 11 * mm, "Wagner et al. | PTB-XL 1.0.3, record 00010 | CC BY 4.0 | doi:10.13026/kfzx-aw45")
    pdf.drawRightString(290 * mm, 11 * mm, f"{page} / 2")

def trace(name, x, y, width, half_height, seconds):
    pdf.saveState()
    clip = pdf.beginPath()
    clip.rect(x * mm, (y - half_height) * mm, width * mm, 2 * half_height * mm)
    pdf.clipPath(clip, stroke=0)
    for i in range(int(width) + 1):
        pdf.setStrokeColorRGB(*((.69, .78, .72) if i % 5 == 0 else (.85, .9, .86)))
        pdf.setLineWidth(.35 if i % 5 == 0 else .16)
        pdf.line((x + i) * mm, (y - half_height) * mm, (x + i) * mm, (y + half_height) * mm)
    for i in range(-half_height, half_height + 1):
        pdf.setStrokeColorRGB(*((.69, .78, .72) if i % 5 == 0 else (.85, .9, .86)))
        pdf.setLineWidth(.35 if i % 5 == 0 else .16)
        pdf.line(x * mm, (y + i) * mm, (x + width) * mm, (y + i) * mm)
    data = signal[leads.index(name)]
    count = min(5000, int(seconds * 500))
    assert max(abs(v) for v in data[:count]) * 5 < half_height - 1, "Reference plot would clip a peak"
    path = pdf.beginPath()
    for i, v in enumerate(data[:count]):
        px, py = (x + i / 500 * 25) * mm, (y + v * 5) * mm
        (path.moveTo if i == 0 else path.lineTo)(px, py)
    pdf.setStrokeColorRGB(.09, .19, .15)
    pdf.setLineWidth(.6)
    pdf.drawPath(path)
    pdf.restoreState()
    pdf.setFillColorRGB(.08, .21, .17)
    pdf.setFont("Helvetica-Bold", 8)
    pdf.drawString((x + 1) * mm, (y + half_height - 4) * mm, name.replace("AV", "aV"))

header("PTB-XL 00010 | 500 Hz | 25 mm/s | 5 mm/mV | Each panel shows the same 0-2.5 s window")
order = [["I", "AVR", "V1", "V4"], ["II", "AVL", "V2", "V5"], ["III", "AVF", "V3", "V6"]]
for row, names in enumerate(order):
    for col, name in enumerate(names):
        trace(name, 10 + col * 70, 143 - row * 42, 62.5, 17, 2.5)
footer(1)
pdf.showPage()
header("Lead II | Original ten-second recording | 25 mm/s | 5 mm/mV | One small grid square = 1 mm")
trace("II", 20, 110, 250, 30, 10)
pdf.setFont("Helvetica", 8)
for i in range(11):
    pdf.drawCentredString((20 + i * 25) * mm, 74 * mm, f"{i} s")
pdf.setFont("Helvetica", 10)
pdf.drawString(20 * mm, 52 * mm, "Calibration exercise: 25 mm of horizontal grid equals 1 second at the printed speed.")
pdf.drawString(20 * mm, 44 * mm, "A 20 mm horizontal interval equals 800 ms. These are time-scale checks, not rhythm labels.")
footer(2)
pdf.save()
(target / "reference-00010.pdf").write_bytes(output.read_bytes())
print(f"Created {output} and public review fixtures; source digest verified.")
