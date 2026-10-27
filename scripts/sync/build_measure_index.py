"""Build an estimated, edition-bound measure index from scanned barlines.

The bars are score locations. Times are allocated inside existing video/audio
page windows and are explicitly not note-onset or reviewed bar boundaries.
"""
import hashlib
import json
from pathlib import Path

import numpy as np


def read(path):
    return json.loads(Path(path).read_text(encoding="utf-8-sig"))


score = read("content/real/score-sync.json")
layout = read("content/real/score-layout.json")
detected = read("scripts/sync/score-barlines-detected.json")
time_map = read("tmp/sync/nyp-time-map.json")
third = read("content/real/third-movement.json")
pdf = Path("tmp/pdfs/mahler2-hofmeister-ue.pdf")
assert score["scoreFingerprint"] == "sha256:" + hashlib.sha256(pdf.read_bytes()).hexdigest()
assert time_map["inputs"]["referenceAudioSHA256"] == hashlib.sha256(Path("tmp/sync/score-audio.m4a").read_bytes()).hexdigest()
assert time_map["inputs"]["targetFingerprints"] == [p["fingerprint"] for p in third["parts"]]

# Inspectable corrections to the automated raster detector (911 x 1232 basis).
# Compare each listed x with the corresponding high-resolution scan before
# changing it. The sum alone is insufficient to validate measure locations.
corrections = [
    {"page": 84, "system": 1, "action": "remove", "xs": [206], "reason": "A note stem before the Nicht eilen barline was counted as a barline."},
    {"page": 88, "system": 0, "action": "insert", "xs": [107, 219, 309, 380, 453, 523, 607, 695, 775, 856], "reason": "Upper system omitted by layout detector; nine bars checked against the scan."},
    {"page": 89, "system": 0, "action": "remove", "xs": [737], "reason": "A note stem before the last barline was counted as a barline."},
    {"page": 100, "system": 0, "action": "insert", "xs": [433, 498, 569], "reason": "Three visible full-height barlines inside an erroneously merged wide bar; checked against scan and pixel projection."},
    {"page": 117, "system": 0, "action": "remove", "xs": [156, 420], "reason": "Two note stems were counted as barlines; checked against full page scan."},
    {"page": 118, "system": 0, "action": "remove", "xs": [155], "reason": "A note stem in the first sustained bar was counted as a barline."},
]

pages = {}
for p in detected:
    number = p["page"]
    systems = [{"xs": list(s["xs"]), "y": layout["pages"][str(number)]["systems"][i+(1 if number == 88 else 0)]} for i, s in enumerate(p["systems"])]
    for fix in (f for f in corrections if f["page"] == number):
        si = fix["system"]
        if number == 88:
            systems.insert(si, {"xs": fix["xs"], "y": layout["pages"]["88"]["systems"][si]})
        elif fix["action"] == "insert":
            systems[si]["xs"] = sorted(systems[si]["xs"] + fix["xs"])
        else:
            assert all(x in systems[si]["xs"] for x in fix["xs"]), fix
            systems[si]["xs"] = [x for x in systems[si]["xs"] if x not in fix["xs"]]
    pages[number] = systems

measures = []
for page in range(80, 128):
    for system, item in enumerate(pages[page]):
        xs = item["xs"]
        assert len(xs) >= 2 and all(b > a for a, b in zip(xs, xs[1:])), (page, system)
        for a, b in zip(xs, xs[1:]):
            number = len(measures) + 1
            y0, y1 = item["y"]
            measures.append({
                "id": f"ue-iii-m{number:03}", "number": number,
                "page": page, "system": system,
                "box": [round(a / 911, 5), round(y0, 5), round((b - a) / 911, 5), round(y1 - y0, 5)],
                "status": "needs_review",
            })
assert len(measures) == 581, f"Expected 581 score measures, got {len(measures)}"

by_location = {(m["page"], m["system"]): [] for m in measures}
for m in measures:
    by_location[(m["page"], m["system"])].append(m)

assigned = set()
for region in score["regions"]:
    selected = []
    for crop in region["pages"]:
        p = crop["page"]
        cy0, cy1 = crop["box"][1], crop["box"][1] + crop["box"][3]
        for si, system in enumerate(pages[p]):
            sy0, sy1 = system["y"]
            overlap = max(0, min(cy1, sy1) - max(cy0, sy0))
            if overlap >= (sy1 - sy0) * .45:
                selected.extend(by_location[(p, si)])
    for m in selected:
        assert m["id"] not in assigned, f"Repeated score location: {m['id']}"
        assigned.add(m["id"])
    n = len(selected)
    assert n, f"No score measures in video region {region['id']}"
    # Video cuts denote page visibility. Uniform allocation within a view is
    # a navigational estimate; neither note-onsets nor tempo are inferred here.
    for i, m in enumerate(selected):
        a = region["sourceStart"] + (region["sourceEnd"] - region["sourceStart"]) * i / n
        b = region["sourceStart"] + (region["sourceEnd"] - region["sourceStart"]) * (i + 1) / n
        m["sourceStart"] = round(a, 5)
        m["sourceEnd"] = round(b, 5)
        m["regionId"] = region["id"]
assert len(assigned) == len(measures), f"Unassigned measures: {len(measures)-len(assigned)}"
assert all(b["sourceStart"] >= a["sourceEnd"] - .00002 for a, b in zip(measures, measures[1:])), "Non-monotone measure windows"

warp = np.asarray(time_map["anchors"])
tracks = []
total = sum(p["duration"] for p in third["parts"])
for part in third["parts"]:
    offset = part["movementOffset"]
    end = offset + part["duration"]
    spans = []
    for m in measures:
        a = 0 if m["sourceStart"] == 0 else float(np.interp(m["sourceStart"], warp[:, 0], warp[:, 1]))
        b = total if m["sourceEnd"] == 650 else float(np.interp(m["sourceEnd"], warp[:, 0], warp[:, 1]))
        start, stop = max(a, offset) - offset, min(b, end) - offset
        if stop > start:
            # Preserve source half-open boundaries but avoid round-to-zero
            # windows, which can occur when the reference warp plateaus.
            start = round(start, 4)
            stop = min(part["duration"], round(stop, 4))
            if stop > start:
                spans.append({"measureId": m["id"], "start": start, "end": stop, "status": "needs_review"})
    tracks.append({"id": part["trackId"], "fingerprint": part["fingerprint"], "duration": part["duration"], "intervals": spans})

out = {
    "version": 1,
    "movement": 3,
    "edition": score["edition"],
    "scoreFingerprint": score["scoreFingerprint"],
    "granularity": "estimated_measure",
    "status": "needs_review",
    "method": "Raster barline index with two documented visual corrections; 52 score-video view windows; uniform within-view subdivision; NYP audio warp. Bounds are navigation estimates, not measured note onsets.",
    "corrections": corrections,
    "sources": [
        {"title": "IMSLP #415748 historical UE reprint", "url": "https://imslp.org/wiki/Symphony_No.2_(Mahler,_Gustav)", "usage": "Printed pages 80–127; measure positions checked as raster line candidates."},
        {"title": "Sophia Louisa Tsougaraki, Spiritual Conflict in Gustav Mahler's First and Second Symphonies (2004), table 4.3", "url": "https://etheses.whiterose.ac.uk/id/eprint/26101/1/411605.pdf", "usage": "Independent end-point cross-check: movement III ends at bar 581; the thesis does not verify every detected line."},
    ],
    "measures": measures,
    "tracks": tracks,
    "evidence": {"pdfSHA256": score["scoreFingerprint"], "referenceVideoSHA256": score["evidence"]["referenceVideoSha256"], "referenceAudioSHA256": score["evidence"]["referenceAudioSha256"], "targetFingerprints": [p["fingerprint"] for p in third["parts"]], "humanAuditionVerified": False},
}
Path("content/real/measure-sync.json").write_text(json.dumps(out, ensure_ascii=False, indent=2), encoding="utf-8")
print(f"{len(measures)} score measures; {sum(len(t['intervals']) for t in tracks)} file-local estimated windows")
