import os
import sys
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.enum.text import PP_ALIGN
from pptx.dml.color import RGBColor
from pptx.enum.shapes import MSO_SHAPE

# Design System Color Palette (from design.md and globals.css)
BG_COLOR = RGBColor(250, 252, 254)         # #FAFCFE Atmospheric White
CARD_BG = RGBColor(255, 255, 255)          # #FFFFFF Surface
CARD_ALT_BG = RGBColor(243, 247, 251)      # #F3F7FB App Canvas Tint
BORDER_COLOR = RGBColor(216, 225, 236)     # #D8E1EC Hairline Border
BORDER_STRONG = RGBColor(185, 199, 216)    # #B9C7D8 Input/Card Border

INK_PRIMARY = RGBColor(15, 27, 43)         # #0F1B2B Primary Text
INK_HEADING = RGBColor(29, 43, 61)         # #1D2B3D Headings
INK_SECONDARY = RGBColor(51, 71, 95)       # #33475F Body Copy
INK_MUTED = RGBColor(102, 123, 147)        # #667B93 Metadata & Captions

SKY_PRIMARY = RGBColor(35, 95, 160)        # #235FA0 Primary Action
SKY_PALE = RGBColor(238, 245, 252)         # #EEF5FC Soft Highlight
SKY_BORDER = RGBColor(147, 184, 227)       # #93B8E3 Sky Accent Line

VERIFIED_GREEN = RGBColor(22, 133, 90)     # #16855A Verified Status
VERIFIED_BG = RGBColor(225, 243, 234)      # #E1F3EA Verified Soft BG
REVIEW_AMBER = RGBColor(183, 121, 31)      # #B7791F Review Status
REVIEW_BG = RGBColor(251, 240, 217)        # #FBF0D9 Review Soft BG
FLAGGED_RED = RGBColor(196, 61, 78)        # #C43D4E Flagged Status
FLAGGED_BG = RGBColor(251, 229, 232)       # #FBE5E8 Flagged Soft BG

ATMOSPHERE_DARK = RGBColor(12, 26, 46)     # #0C1A2E Deep Navy Hero

FONT_DISPLAY = "Georgia"
FONT_BODY = "Arial"
FONT_MONO = "Consolas"

def create_deck():
    prs = Presentation()
    prs.slide_width = Inches(13.333)
    prs.slide_height = Inches(7.5)
    blank_layout = prs.slide_layouts[6]

    def set_slide_background(slide, color=BG_COLOR):
        background = slide.background
        fill = background.fill
        fill.solid()
        fill.fore_color.rgb = color

    def add_header(slide, tracker_text, title_text, subtitle_text=None):
        # Tracker Pill
        tx_box = slide.shapes.add_textbox(Inches(0.8), Inches(0.5), Inches(11.733), Inches(0.35))
        tf = tx_box.text_frame
        tf.word_wrap = True
        tf.margin_left = tf.margin_top = tf.margin_right = tf.margin_bottom = 0
        p = tf.paragraphs[0]
        p.text = tracker_text.upper()
        p.font.name = FONT_BODY
        p.font.size = Pt(9.5)
        p.font.bold = True
        p.font.color.rgb = SKY_PRIMARY

        # Headline
        p2 = tf.add_paragraph()
        p2.text = title_text
        p2.font.name = FONT_DISPLAY
        p2.font.size = Pt(22)
        p2.font.bold = True
        p2.font.color.rgb = INK_PRIMARY
        p2.space_before = Pt(4)

        if subtitle_text:
            p3 = tf.add_paragraph()
            p3.text = subtitle_text
            p3.font.name = FONT_BODY
            p3.font.size = Pt(11)
            p3.font.color.rgb = INK_MUTED
            p3.space_before = Pt(3)

    def add_card(slide, left, top, width, height, bg=CARD_BG, border=BORDER_COLOR):
        shape = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, left, top, width, height)
        shape.fill.solid()
        shape.fill.fore_color.rgb = bg
        shape.line.color.rgb = border
        shape.line.width = Pt(1)
        shape.adjustments[0] = 0.04
        return shape

    # ==========================================================
    # SLIDE 1: COVER
    # ==========================================================
    s1 = prs.slides.add_slide(blank_layout)
    set_slide_background(s1, BG_COLOR)

    # Left content box
    c1 = add_card(s1, Inches(0.8), Inches(0.8), Inches(6.0), Inches(5.9), CARD_BG, BORDER_COLOR)
    tb1 = s1.shapes.add_textbox(Inches(1.15), Inches(1.1), Inches(5.3), Inches(5.3))
    tf1 = tb1.text_frame
    tf1.word_wrap = True
    tf1.margin_left = tf1.margin_top = tf1.margin_right = tf1.margin_bottom = 0

    p = tf1.paragraphs[0]
    p.text = "CODE CUBICLE 6.0 · CLOUDINARY TRACK (PS-02)"
    p.font.name = FONT_BODY
    p.font.size = Pt(10)
    p.font.bold = True
    p.font.color.rgb = SKY_PRIMARY

    p = tf1.add_paragraph()
    p.text = "Pramaan (प्रमाण)"
    p.font.name = FONT_DISPLAY
    p.font.size = Pt(36)
    p.font.bold = True
    p.font.color.rgb = INK_PRIMARY
    p.space_before = Pt(12)

    p = tf1.add_paragraph()
    p.text = "Proof for Every Photo: The Verifiable Field Media Pipeline"
    p.font.name = FONT_DISPLAY
    p.font.size = Pt(15)
    p.font.color.rgb = SKY_PRIMARY
    p.space_before = Pt(6)

    p = tf1.add_paragraph()
    p.text = (
        "An evidence pipeline that turns unstructured field photos into cryptographic, "
        "explainable proof for CSR, climate & public infrastructure monitoring. "
        "Every photo carries an unbroken chain of custody from capture to report."
    )
    p.font.name = FONT_BODY
    p.font.size = Pt(11)
    p.font.color.rgb = INK_SECONDARY
    p.space_before = Pt(16)

    p = tf1.add_paragraph()
    p.text = "CORE IMPLEMENTATION STACK"
    p.font.name = FONT_BODY
    p.font.size = Pt(9.5)
    p.font.bold = True
    p.font.color.rgb = INK_MUTED
    p.space_before = Pt(28)

    p = tf1.add_paragraph()
    p.text = "Next.js 15 (App Router) · Cloudinary AI · Supabase PostGIS · LangGraph + Gemini"
    p.font.name = FONT_MONO
    p.font.size = Pt(10)
    p.font.color.rgb = INK_PRIMARY
    p.space_before = Pt(4)

    p = tf1.add_paragraph()
    p.text = "INTEGRITY GUARANTEE"
    p.font.name = FONT_BODY
    p.font.size = Pt(9.5)
    p.font.bold = True
    p.font.color.rgb = INK_MUTED
    p.space_before = Pt(14)

    p = tf1.add_paragraph()
    p.text = "8-Signal Explainable Trust Engine · Generative Firewall · Tamper-Evident Ledger"
    p.font.name = FONT_MONO
    p.font.size = Pt(10)
    p.font.color.rgb = VERIFIED_GREEN
    p.space_before = Pt(4)

    # Right hero image
    img1_path = "pitch/real_screenshots/crops/crop_hero.png"
    if os.path.exists(img1_path):
        add_card(s1, Inches(7.05), Inches(0.8), Inches(5.48), Inches(5.9), CARD_ALT_BG, BORDER_STRONG)
        s1.shapes.add_picture(img1_path, Inches(7.15), Inches(0.9), Inches(5.28), Inches(5.7))

    # ==========================================================
    # SLIDE 2: THE PROBLEM
    # ==========================================================
    s2 = prs.slides.add_slide(blank_layout)
    set_slide_background(s2, BG_COLOR)
    add_header(
        s2,
        "The Problem · Ground Reality",
        "Visual claims without cryptographic custody fail under scrutiny.",
        "Over ₹35,000 Cr in annual Indian CSR and ₹1.4 lakh Cr in public rural schemes rely on field photos that anyone can restage, recycle, or rephotograph off a screen."
    )

    card_w = Inches(3.64)
    card_h = Inches(4.7)
    gap = Inches(0.4)
    left_start = Inches(0.8)

    # Col 1: Context-Stripped Ingestion
    add_card(s2, left_start, Inches(1.9), card_w, card_h)
    tb = s2.shapes.add_textbox(left_start + Inches(0.25), Inches(2.1), card_w - Inches(0.5), card_h - Inches(0.4))
    tf = tb.text_frame
    tf.word_wrap = True
    p = tf.paragraphs[0]
    p.text = "01 / THE DATA LOSS"
    p.font.name = FONT_BODY
    p.font.size = Pt(9.5)
    p.font.bold = True
    p.font.color.rgb = REVIEW_AMBER

    p = tf.add_paragraph()
    p.text = "Context-Stripped Ingestion"
    p.font.name = FONT_DISPLAY
    p.font.size = Pt(16)
    p.font.bold = True
    p.font.color.rgb = INK_PRIMARY
    p.space_before = Pt(6)

    p = tf.add_paragraph()
    p.text = (
        "Field photos arrive via consumer messaging apps that automatically strip EXIF timestamps "
        "and GPS coordinates.\n\n"
        "Without device-level binding, photos cannot prove where or when they were captured. "
        "Auditors are forced to accept unauthenticated image files with zero chain of custody."
    )
    p.font.name = FONT_BODY
    p.font.size = Pt(11)
    p.font.color.rgb = INK_SECONDARY
    p.space_before = Pt(12)

    p = tf.add_paragraph()
    p.text = "RESULT: Metadata vacuum at the point of origin"
    p.font.name = FONT_MONO
    p.font.size = Pt(9.5)
    p.font.color.rgb = INK_MUTED
    p.space_before = Pt(18)

    # Col 2: Screen Recapture Fraud
    add_card(s2, left_start + card_w + gap, Inches(1.9), card_w, card_h)
    tb = s2.shapes.add_textbox(left_start + card_w + gap + Inches(0.25), Inches(2.1), card_w - Inches(0.5), card_h - Inches(0.4))
    tf = tb.text_frame
    tf.word_wrap = True
    p = tf.paragraphs[0]
    p.text = "02 / THE FRAUD ADAPTATION"
    p.font.name = FONT_BODY
    p.font.size = Pt(9.5)
    p.font.bold = True
    p.font.color.rgb = FLAGGED_RED

    p = tf.add_paragraph()
    p.text = "Photos of Photographs"
    p.font.name = FONT_DISPLAY
    p.font.size = Pt(16)
    p.font.bold = True
    p.font.color.rgb = INK_PRIMARY
    p.space_before = Pt(6)

    p = tf.add_paragraph()
    p.text = (
        "When India enforced geotagged photo monitoring for MGNREGS, ₹2,600 Cr in fake wage claims "
        "were uncovered in Rajasthan in just 7 months.\n\n"
        "Fraud then adapted: field operators photographed laptop screens displaying old photos. "
        "By July 2025, the Ministry ordered emergency manual verification due to screen recaptures."
    )
    p.font.name = FONT_BODY
    p.font.size = Pt(11)
    p.font.color.rgb = INK_SECONDARY
    p.space_before = Pt(12)

    p = tf.add_paragraph()
    p.text = "RESULT: Re-photographed media bypasses naive checks"
    p.font.name = FONT_MONO
    p.font.size = Pt(9.5)
    p.font.color.rgb = FLAGGED_RED
    p.space_before = Pt(18)

    # Col 3: Compliance & Audit Crisis
    add_card(s2, left_start + (card_w + gap) * 2, Inches(1.9), card_w, card_h)
    tb = s2.shapes.add_textbox(left_start + (card_w + gap) * 2 + Inches(0.25), Inches(2.1), card_w - Inches(0.5), card_h - Inches(0.4))
    tf = tb.text_frame
    tf.word_wrap = True
    p = tf.paragraphs[0]
    p.text = "03 / THE REGULATORY RISK"
    p.font.name = FONT_BODY
    p.font.size = Pt(9.5)
    p.font.bold = True
    p.font.color.rgb = SKY_PRIMARY

    p = tf.add_paragraph()
    p.text = "Mandated Impact Audits"
    p.font.name = FONT_DISPLAY
    p.font.size = Pt(16)
    p.font.bold = True
    p.font.color.rgb = INK_PRIMARY
    p.space_before = Pt(6)

    p = tf.add_paragraph()
    p.text = (
        "Companies Act Rule 8(3) mandates independent impact assessments for major CSR projects, "
        "yet 42% of non-profits face soaring audit demands without verifiable media pipelines.\n\n"
        "Simultaneously, India's DPDP Act requires strict beneficiary consent, making unredacted "
        "community photos a serious regulatory compliance liability."
    )
    p.font.name = FONT_BODY
    p.font.size = Pt(11)
    p.font.color.rgb = INK_SECONDARY
    p.space_before = Pt(12)

    p = tf.add_paragraph()
    p.text = "RESULT: Institutional compliance exposure"
    p.font.name = FONT_MONO
    p.font.size = Pt(9.5)
    p.font.color.rgb = INK_MUTED
    p.space_before = Pt(18)

    # ==========================================================
    # SLIDE 3: OUR SOLUTION
    # ==========================================================
    s3 = prs.slides.add_slide(blank_layout)
    set_slide_background(s3, BG_COLOR)
    add_header(
        s3,
        "Our Solution · The Evidence Pipeline",
        "From field capture to cited report: every pixel traceable.",
        "Pramaan establishes an unbroken cryptographic chain of custody, ensuring only authentic, in-geofence, non-synthetic media supports institutional impact claims."
    )

    # Left: 4-stage pipeline description
    c3 = add_card(s3, Inches(0.8), Inches(1.9), Inches(5.6), Inches(4.8), CARD_BG, BORDER_COLOR)
    tb = s3.shapes.add_textbox(Inches(1.05), Inches(2.1), Inches(5.1), Inches(4.4))
    tf = tb.text_frame
    tf.word_wrap = True

    stages = [
        ("01 / CAPTURE", "Client-Side Binding & Gating", "Device records SHA-256 and locks GPS before direct upload; Cloudinary eval gate rejects corrupted or non-compliant files before storage."),
        ("02 / PERCEPTION", "Deterministic Visual Analysis", "Cloudinary webhook extracts EXIF, computes 64-bit pHash, detects faces for privacy, and queries AI Vision JSON schemas for activity match."),
        ("03 / VERIFICATION", "Explainable Trust Engine", "8 weighted signals score evidence (0-100). Dual hard caps isolate duplicates (pHash <= 4), screen recaptures, and out-of-geofence submissions."),
        ("04 / PROVENANCE", "Tamper-Evident Ledger & QR", "Every decision, derivative, and citation is recorded in a SHA-256 hash-chained ledger. External auditors verify lineage via QR link.")
    ]

    for i, (num, title, desc) in enumerate(stages):
        p = tf.paragraphs[0] if i == 0 else tf.add_paragraph()
        p.text = num
        p.font.name = FONT_BODY
        p.font.size = Pt(9)
        p.font.bold = True
        p.font.color.rgb = SKY_PRIMARY
        if i > 0:
            p.space_before = Pt(10)

        p = tf.add_paragraph()
        p.text = title
        p.font.name = FONT_DISPLAY
        p.font.size = Pt(13)
        p.font.bold = True
        p.font.color.rgb = INK_PRIMARY
        p.space_before = Pt(2)

        p = tf.add_paragraph()
        p.text = desc
        p.font.name = FONT_BODY
        p.font.size = Pt(10)
        p.font.color.rgb = INK_SECONDARY
        p.space_before = Pt(2)

    # Right: Prototype Hub Screenshot
    img3_path = "pitch/real_screenshots/crops/crop_prototype.png"
    if os.path.exists(img3_path):
        add_card(s3, Inches(6.65), Inches(1.9), Inches(5.88), Inches(4.8), CARD_ALT_BG, BORDER_STRONG)
        s3.shapes.add_picture(img3_path, Inches(6.75), Inches(2.0), Inches(5.68), Inches(4.6))

    # ==========================================================
    # SLIDE 4: HOW IT WORKS (ARCHITECTURE)
    # ==========================================================
    s4 = prs.slides.add_slide(blank_layout)
    set_slide_background(s4, BG_COLOR)
    add_header(
        s4,
        "System Architecture · Technical Implementation",
        "Perception, reasoning, and custody operating in strict isolation.",
        "Cloudinary inspects and transforms; Supabase enforces spatial boundaries and cryptographic custody; Gemini reasons strictly over structured records."
    )

    # Left: Architecture Diagram Screenshot
    img4_path = "pitch/real_screenshots/crops/crop_architecture.png"
    if os.path.exists(img4_path):
        add_card(s4, Inches(0.8), Inches(1.9), Inches(6.8), Inches(4.8), CARD_ALT_BG, BORDER_STRONG)
        s4.shapes.add_picture(img4_path, Inches(0.9), Inches(2.0), Inches(6.6), Inches(4.6))

    # Right: 3 Pillars Card
    c4 = add_card(s4, Inches(7.85), Inches(1.9), Inches(4.68), Inches(4.8), CARD_BG, BORDER_COLOR)
    tb = s4.shapes.add_textbox(Inches(8.1), Inches(2.1), Inches(4.18), Inches(4.4))
    tf = tb.text_frame
    tf.word_wrap = True

    arch_points = [
        ("INGESTION & PERCEPTION", "Cloudinary Media Engine", "Signed direct uploads restricted to upload presets. Cloudinary computes 64-bit perceptual hash, extracts EXIF, detects faces, and executes AI Vision with JSON schemas."),
        ("VERIFICATION & CUSTODY", "PostGIS & Trust Engine", "Next.js executes 8-signal scoring math. Supabase PostGIS verifies geofence containment with 150 m tolerance. Bitwise popcount pHash matching detects reused media. All events written to SHA-256 ledger."),
        ("AGENTIC REASONING", "LangGraph & Gemini", "Gemini acts as an auditor, not an evidence generator. Orchestrated by LangGraph with human-in-the-loop checkpoints, generating impact reports citing evidence IDs.")
    ]

    for i, (tag, title, desc) in enumerate(arch_points):
        p = tf.paragraphs[0] if i == 0 else tf.add_paragraph()
        p.text = tag
        p.font.name = FONT_BODY
        p.font.size = Pt(9)
        p.font.bold = True
        p.font.color.rgb = SKY_PRIMARY
        if i > 0:
            p.space_before = Pt(14)

        p = tf.add_paragraph()
        p.text = title
        p.font.name = FONT_DISPLAY
        p.font.size = Pt(14)
        p.font.bold = True
        p.font.color.rgb = INK_PRIMARY
        p.space_before = Pt(3)

        p = tf.add_paragraph()
        p.text = desc
        p.font.name = FONT_BODY
        p.font.size = Pt(10)
        p.font.color.rgb = INK_SECONDARY
        p.space_before = Pt(4)

    # ==========================================================
    # SLIDE 5: CORE PRODUCT EXPERIENCE
    # ==========================================================
    s5 = prs.slides.add_slide(blank_layout)
    set_slide_background(s5, BG_COLOR)
    add_header(
        s5,
        "Core Product Experience · Human Verification",
        "Explainable trust scoring replaces black-box guessing.",
        "Reviewers inspect flagged media with transparent signal breakdowns, impact claims reflect verified evidence, and temporal change is proven through baseline alignment."
    )

    card3_w = Inches(3.64)
    card3_h = Inches(4.8)

    # Step 1: Review Queue
    add_card(s5, left_start, Inches(1.9), card3_w, card3_h)
    img_rev = "pitch/real_screenshots/crops/crop_review.png"
    if os.path.exists(img_rev):
        s5.shapes.add_picture(img_rev, left_start + Inches(0.15), Inches(2.05), card3_w - Inches(0.3), Inches(2.3))

    tb = s5.shapes.add_textbox(left_start + Inches(0.2), Inches(4.45), card3_w - Inches(0.4), Inches(2.1))
    tf = tb.text_frame
    tf.word_wrap = True
    p = tf.paragraphs[0]
    p.text = "STEP 01 / MODERATION"
    p.font.name = FONT_BODY
    p.font.size = Pt(9)
    p.font.bold = True
    p.font.color.rgb = FLAGGED_RED

    p = tf.add_paragraph()
    p.text = "Review Queue & Hard Flags"
    p.font.name = FONT_DISPLAY
    p.font.size = Pt(13)
    p.font.bold = True
    p.font.color.rgb = INK_PRIMARY
    p.space_before = Pt(2)

    p = tf.add_paragraph()
    p.text = (
        "Evidence ev_jh04_after_wronggeo flagged with Trust Score 40. "
        "Alert: 'EXIF GPS is 6,327 m outside site geofence.' "
        "Hotkeys V (verify) and R (reject) commit decisions directly to audit ledger."
    )
    p.font.name = FONT_BODY
    p.font.size = Pt(9.5)
    p.font.color.rgb = INK_SECONDARY
    p.space_before = Pt(4)

    # Step 2: Impact Claims
    add_card(s5, left_start + card3_w + gap, Inches(1.9), card3_w, card3_h)
    img_claims = "pitch/real_screenshots/crops/crop_claims.png"
    if os.path.exists(img_claims):
        s5.shapes.add_picture(img_claims, left_start + card3_w + gap + Inches(0.15), Inches(2.05), card3_w - Inches(0.3), Inches(2.3))

    tb = s5.shapes.add_textbox(left_start + card3_w + gap + Inches(0.2), Inches(4.45), card3_w - Inches(0.4), Inches(2.1))
    tf = tb.text_frame
    tf.word_wrap = True
    p = tf.paragraphs[0]
    p.text = "STEP 02 / CLAIMS"
    p.font.name = FONT_BODY
    p.font.size = Pt(9)
    p.font.bold = True
    p.font.color.rgb = SKY_PRIMARY

    p = tf.add_paragraph()
    p.text = "Impact Claims Coverage"
    p.font.name = FONT_DISPLAY
    p.font.size = Pt(13)
    p.font.bold = True
    p.font.color.rgb = INK_PRIMARY
    p.space_before = Pt(2)

    p = tf.add_paragraph()
    p.text = (
        "Claims scored solely against verified proof. "
        "Check dam construction: Strong (5/5 verified). "
        "Water retention: Moderate (4/6). Bank vegetation: Weak (2/6). "
        "Unverified and flagged photos are mathematically excluded."
    )
    p.font.name = FONT_BODY
    p.font.size = Pt(9.5)
    p.font.color.rgb = INK_SECONDARY
    p.space_before = Pt(4)

    # Step 3: Compare Slider
    add_card(s5, left_start + (card3_w + gap) * 2, Inches(1.9), card3_w, card3_h)
    img_comp = "pitch/real_screenshots/crops/crop_compare.png"
    if os.path.exists(img_comp):
        s5.shapes.add_picture(img_comp, left_start + (card3_w + gap) * 2 + Inches(0.15), Inches(2.05), card3_w - Inches(0.3), Inches(2.3))

    tb = s5.shapes.add_textbox(left_start + (card3_w + gap) * 2 + Inches(0.2), Inches(4.45), card3_w - Inches(0.4), Inches(2.1))
    tf = tb.text_frame
    tf.word_wrap = True
    p = tf.paragraphs[0]
    p.text = "STEP 03 / TEMPORAL PROOF"
    p.font.name = FONT_BODY
    p.font.size = Pt(9)
    p.font.bold = True
    p.font.color.rgb = VERIFIED_GREEN

    p = tf.add_paragraph()
    p.text = "Before & After Alignment"
    p.font.name = FONT_DISPLAY
    p.font.size = Pt(13)
    p.font.bold = True
    p.font.color.rgb = INK_PRIMARY
    p.space_before = Pt(2)

    p = tf.add_paragraph()
    p.text = (
        "Interactive comparison slider locks baseline dry gully (May 2026) "
        "against completed post-monsoon check dam (Sep 2026) from identical surveyed vantage. "
        "Proves physical structure and water impoundment over time."
    )
    p.font.name = FONT_BODY
    p.font.size = Pt(9.5)
    p.font.color.rgb = INK_SECONDARY
    p.space_before = Pt(4)

    # ==========================================================
    # SLIDE 6: TECHNICAL INNOVATION / AI
    # ==========================================================
    s6 = prs.slides.add_slide(blank_layout)
    set_slide_background(s6, BG_COLOR)
    add_header(
        s6,
        "Technical Innovation · Integrity Engineering",
        "Deterministic perception paired with agentic reasoning.",
        "Pramaan enforces strict architectural boundaries so AI models provide high-level reasoning without ever contaminating the underlying evidence layer."
    )

    # Left: 3 Technical Pillars
    c6 = add_card(s6, Inches(0.8), Inches(1.9), Inches(5.8), Inches(4.8), CARD_BG, BORDER_COLOR)
    tb = s6.shapes.add_textbox(Inches(1.05), Inches(2.1), Inches(5.3), Inches(4.4))
    tf = tb.text_frame
    tf.word_wrap = True

    innovations = [
        ("01 / EVIDENCE INTEGRITY", "The Generative Firewall (assertGenerativeFirewall)", "Transforms classified as transcoded, redacted, edited, or ai_generated. assertGenerativeFirewall throws on e_gen_*, b_gen_fill, background removal, or upscaling. Generative pixels are strictly banned from evidence."),
        ("02 / SPATIAL & FORENSIC MATH", "PostGIS Containment & 64-bit pHash Matching", "check_site_geofence RPC calculates polygon boundary distance; >150 m triggers hard flag cap (Score 40). Bitwise popcount pHash matching in SQL identifies reused media (<=4 bits) even if resized or recompressed."),
        ("03 / ORCHESTRATION & GROUNDING", "LangGraph 6-Agent Pipeline with HITL", "Specialized agents (understand, organize, analyze, identify, compare, synthesize, discover, report). Flagged evidence halts execution at HITL checkpoint. Uncited claims are pruned; search loops capped at 3.")
    ]

    for i, (tag, title, desc) in enumerate(innovations):
        p = tf.paragraphs[0] if i == 0 else tf.add_paragraph()
        p.text = tag
        p.font.name = FONT_BODY
        p.font.size = Pt(9)
        p.font.bold = True
        p.font.color.rgb = SKY_PRIMARY
        if i > 0:
            p.space_before = Pt(12)

        p = tf.add_paragraph()
        p.text = title
        p.font.name = FONT_DISPLAY
        p.font.size = Pt(13)
        p.font.bold = True
        p.font.color.rgb = INK_PRIMARY
        p.space_before = Pt(2)

        p = tf.add_paragraph()
        p.text = desc
        p.font.name = FONT_BODY
        p.font.size = Pt(9.5)
        p.font.color.rgb = INK_SECONDARY
        p.space_before = Pt(3)

    # Right: Firewall Lab Screenshot
    img6_path = "pitch/real_screenshots/crops/crop_firewall.png"
    if os.path.exists(img6_path):
        add_card(s6, Inches(6.85), Inches(1.9), Inches(5.68), Inches(4.8), CARD_ALT_BG, BORDER_STRONG)
        s6.shapes.add_picture(img6_path, Inches(6.95), Inches(2.0), Inches(5.48), Inches(4.6))

    # ==========================================================
    # SLIDE 7: KEY DIFFERENTIATORS
    # ==========================================================
    s7 = prs.slides.add_slide(blank_layout)
    set_slide_background(s7, BG_COLOR)
    add_header(
        s7,
        "Key Differentiators · Forensic Standard",
        "Built for institutional credibility, not casual photo sharing.",
        "Every technical decision in Pramaan is engineered to survive independent auditor scrutiny, corporate ESG audits, and regulatory inspection."
    )

    # Left: 4 Differentiators
    c7 = add_card(s7, Inches(0.8), Inches(1.9), Inches(5.8), Inches(4.8), CARD_BG, BORDER_COLOR)
    tb = s7.shapes.add_textbox(Inches(1.05), Inches(2.1), Inches(5.3), Inches(4.4))
    tf = tb.text_frame
    tf.word_wrap = True

    diffs = [
        ("01 / EXPLAINABLE SCORING", "Pure Transparent Math vs Black-Box AI", "8 weighted signals (P1-P3, I1-I3, R1, Q1) produce a 0-100 score. Hard cap (Score 40) on duplicates or geofence breaches. No-GPS cap (Score 79) prevents unverified claims."),
        ("02 / CODE-LEVEL FIREWALL", "Zero Synthetic Pixels in Evidence", "Generative AI is quarantined to Story Studio and explicitly labelled 'AI-assisted'. Evidence delivery URLs strictly permit only deterministic redaction (e_pixelate_faces)."),
        ("03 / CRYPTOGRAPHIC AUDIT", "SHA-256 Hash-Chained Audit Ledger", "Every event (ingest, review, derivative, report) is linked cryptographically: entry_hash = sha256(prevHash + event + subject + payload + time). Tampering breaks the chain visibly."),
        ("04 / PUBLIC LINEAGE", "Verify QR & Recipe Inspection (/verify/[id])", "Auditors scan a QR code on any published impact report to inspect the transformation recipe, SHA-256 hashes, and base parent evidence.")
    ]

    for i, (tag, title, desc) in enumerate(diffs):
        p = tf.paragraphs[0] if i == 0 else tf.add_paragraph()
        p.text = tag
        p.font.name = FONT_BODY
        p.font.size = Pt(9)
        p.font.bold = True
        p.font.color.rgb = VERIFIED_GREEN
        if i > 0:
            p.space_before = Pt(8)

        p = tf.add_paragraph()
        p.text = title
        p.font.name = FONT_DISPLAY
        p.font.size = Pt(13)
        p.font.bold = True
        p.font.color.rgb = INK_PRIMARY
        p.space_before = Pt(2)

        p = tf.add_paragraph()
        p.text = desc
        p.font.name = FONT_BODY
        p.font.size = Pt(9.5)
        p.font.color.rgb = INK_SECONDARY
        p.space_before = Pt(2)

    # Right: Verify Lineage Screenshot
    img7_path = "pitch/real_screenshots/crops/crop_verify.png"
    if os.path.exists(img7_path):
        add_card(s7, Inches(6.85), Inches(1.9), Inches(5.68), Inches(4.8), CARD_ALT_BG, BORDER_STRONG)
        s7.shapes.add_picture(img7_path, Inches(6.95), Inches(2.0), Inches(5.48), Inches(4.6))

    # ==========================================================
    # SLIDE 8: IMPACT, VALIDATION & ROADMAP
    # ==========================================================
    s8 = prs.slides.add_slide(blank_layout)
    set_slide_background(s8, BG_COLOR)
    add_header(
        s8,
        "Validation & Roadmap · Real-World Impact",
        "Validated against actual field fraud patterns.",
        "Benchmarked against real test cases from the JalSetu Foundation Check Dam JH-04 dataset, detecting 100% of synthetic, recycled, and location-spoofed assets."
    )

    card_half_w = Inches(5.66)
    card_half_h = Inches(4.8)

    # Left: Test Dataset Validation
    add_card(s8, Inches(0.8), Inches(1.9), card_half_w, card_half_h)
    tb = s8.shapes.add_textbox(Inches(1.05), Inches(2.1), card_half_w - Inches(0.5), card_half_h - Inches(0.4))
    tf = tb.text_frame
    tf.word_wrap = True

    p = tf.paragraphs[0]
    p.text = "PROTOTYPE VALIDATION EVIDENCE"
    p.font.name = FONT_BODY
    p.font.size = Pt(9.5)
    p.font.bold = True
    p.font.color.rgb = VERIFIED_GREEN

    p = tf.add_paragraph()
    p.text = "Jhabua JH-04 Benchmark Suite"
    p.font.name = FONT_DISPLAY
    p.font.size = Pt(16)
    p.font.bold = True
    p.font.color.rgb = INK_PRIMARY
    p.space_before = Pt(4)

    val_points = [
        "20 Seeded Evidence Test Rows: 14 verified, 2 needs review, 3 flagged, 1 rejected.",
        "Screen Recapture Detection: Caught phone photographing screen displaying check dam (Score 40).",
        "Perceptual Hash Deduplication: Identified recycled photo with bitwise Hamming distance 0 (Score 40).",
        "PostGIS Geofence Containment: Flagged farm pond photo 6,327 m outside site boundaries (Score 40).",
        "Missing Metadata Gating: Capped photo lacking EXIF GPS at 79, routing to review queue.",
        "14 Automated Checks Passing: 100% test coverage across dataset math, pHash distance, and agent graphs."
    ]

    for vp in val_points:
        p = tf.add_paragraph()
        p.text = f"•  {vp}"
        p.font.name = FONT_BODY
        p.font.size = Pt(10)
        p.font.color.rgb = INK_SECONDARY
        p.space_before = Pt(8)

    # Right: Roadmap
    add_card(s8, Inches(6.86), Inches(1.9), card_half_w, card_half_h)
    tb = s8.shapes.add_textbox(Inches(7.11), Inches(2.1), card_half_w - Inches(0.5), card_half_h - Inches(0.4))
    tf = tb.text_frame
    tf.word_wrap = True

    p = tf.paragraphs[0]
    p.text = "PRODUCTION EVOLUTION"
    p.font.name = FONT_BODY
    p.font.size = Pt(9.5)
    p.font.bold = True
    p.font.color.rgb = SKY_PRIMARY

    p = tf.add_paragraph()
    p.text = "Built Today vs Scaled Tomorrow"
    p.font.name = FONT_DISPLAY
    p.font.size = Pt(16)
    p.font.bold = True
    p.font.color.rgb = INK_PRIMARY
    p.space_before = Pt(4)

    p = tf.add_paragraph()
    p.text = "CURRENT WORKING PROTOTYPE (BUILT)"
    p.font.name = FONT_BODY
    p.font.size = Pt(10)
    p.font.bold = True
    p.font.color.rgb = INK_PRIMARY
    p.space_before = Pt(10)

    p = tf.add_paragraph()
    p.text = (
        "• End-to-end evidence pipeline: Capture -> Cloudinary AI -> PostGIS -> Gemini.\n"
        "• 8-signal explainable Trust Engine with dual hard caps.\n"
        "• Generative Firewall blocking synthetic media from evidence.\n"
        "• LangGraph 6-agent workflow with HITL and cited reports.\n"
        "• Cryptographic SHA-256 audit ledger and public QR lineage."
    )
    p.font.name = FONT_BODY
    p.font.size = Pt(9.5)
    p.font.color.rgb = INK_SECONDARY
    p.space_before = Pt(3)

    p = tf.add_paragraph()
    p.text = "NEXT SCALE & ENTERPRISE DEPLOYMENT (PLANNED)"
    p.font.name = FONT_BODY
    p.font.size = Pt(10)
    p.font.bold = True
    p.font.color.rgb = SKY_PRIMARY
    p.space_before = Pt(14)

    p = tf.add_paragraph()
    p.text = (
        "• Offline-first PWA sync using IndexedDB for zero-connectivity field sites.\n"
        "• Hardware-backed C2PA cryptographic signature embedding (fl_c2pa).\n"
        "• Enterprise multi-organisation tenant isolation with fine-grained RLS."
    )
    p.font.name = FONT_BODY
    p.font.size = Pt(9.5)
    p.font.color.rgb = INK_SECONDARY
    p.space_before = Pt(3)

    # Bottom Tagline
    p = tf.add_paragraph()
    p.text = "Proof for every photo. Accountability for every rupee."
    p.font.name = FONT_DISPLAY
    p.font.size = Pt(11)
    p.font.bold = True
    p.font.color.rgb = VERIFIED_GREEN
    p.space_before = Pt(16)

    # Save presentation
    out_path = "pitch/Pramaan_Pitch_Deck_Final.pptx"
    prs.save(out_path)
    print(f"Successfully created presentation: {out_path}")

if __name__ == "__main__":
    create_deck()
