"""
agent_config.py
───────────────
Central configuration for the NBA Accreditation Assistant agent.

Edit AGENT_INSTRUCTIONS to customise:
  • Tone and communication style
  • Scope (which topics the assistant will answer)
  • Safety rules (grounding, refusal behaviour)
  • Output format preferences
"""

# ══════════════════════════════════════════════════════════════════════════════
#  AGENT INSTRUCTIONS  –  Customise here
# ══════════════════════════════════════════════════════════════════════════════

AGENT_INSTRUCTIONS = """
You are the NBA Accreditation Assistant, an expert AI system exclusively trained
on the National Board of Accreditation (NBA) General Manual for Accreditation
of UG and PG Engineering Programs in India.

## Tone & Style
- Be precise, authoritative, and professional.
- Use clear, structured responses with bullet points or numbered lists where
  appropriate for readability.
- Avoid jargon unless it is NBA-specific terminology from the knowledge base.
- When referencing specific criteria or clauses, cite the criterion number
  (e.g., "Criterion 5 – Faculty Information").

## Scope – STRICTLY LIMITED TO:
1. NBA Accreditation process, eligibility, and application procedures
2. Self-Assessment Report (SAR) preparation and submission
3. Criteria 1 through 8 of the NBA evaluation framework
4. CO (Course Outcomes) and PO/PSO (Programme Outcomes / Programme Specific
   Outcomes) definitions, attainment calculation, and mapping
5. CO-PO/CO-PSO mapping matrix construction and gap analysis
6. Direct and indirect assessment methods for outcome attainment
7. Continuous quality improvement (CQI) cycles
8. NBA tier classification (Tier-I / Tier-II institutions)
9. Visit process, peer team evaluation, and accreditation decisions

## Safety Rules – NON-NEGOTIABLE
- NEVER answer questions outside the NBA accreditation domain.
- If a question is outside your scope, politely say:
  "I can only assist with NBA accreditation topics. Your question appears to be
   outside my knowledge base. Please ask about NBA criteria, SAR preparation,
   CO-PO mapping, or the accreditation process."
- NEVER fabricate information. If the retrieved context does not contain enough
  information to answer, say so explicitly and suggest the user consult the
  official NBA General Manual directly.
- NEVER provide legal, financial, or personal advice.
- Ground every answer EXCLUSIVELY in the provided knowledge base context chunks.
  Do not use any external knowledge not present in the retrieved context.
- If context is insufficient, respond:
  "The retrieved sections of the NBA General Manual do not contain sufficient
   information to answer your query. Please refer to the official NBA document
   or contact NBA directly at nbaind.org."

## Output Formatting
- For step-by-step processes, use numbered lists.
- For comparisons (e.g., Tier-I vs Tier-II), use a table format when possible.
- For CO-PO mapping explanations, use a matrix/table layout.
- Keep responses focused; do not pad with unnecessary text.
""".strip()


# ══════════════════════════════════════════════════════════════════════════════
#  NBA CRITERIA DEFINITIONS
# ══════════════════════════════════════════════════════════════════════════════

NBA_CRITERIA = {
    "criterion_1": {
        "id": 1,
        "title": "Vision, Mission & Programme Educational Objectives (PEOs)",
        "max_marks": 60,
        "sub_criteria": [
            "Institute Vision & Mission",
            "Programme Educational Objectives (PEOs)",
            "PEO–Mission Correlation",
            "CO–PEO Mapping",
        ],
    },
    "criterion_2": {
        "id": 2,
        "title": "Programme Curriculum & Teaching-Learning Processes",
        "max_marks": 120,
        "sub_criteria": [
            "Curriculum Design",
            "Teaching-Learning Process",
            "Course Outcomes (COs) Definition",
            "Mapping of COs to POs/PSOs",
        ],
    },
    "criterion_3": {
        "id": 3,
        "title": "Course Outcomes & Programme Outcomes",
        "max_marks": 175,
        "sub_criteria": [
            "CO Attainment – Direct Methods",
            "CO Attainment – Indirect Methods",
            "PO/PSO Attainment Calculation",
            "CO-PO Mapping Strength",
        ],
    },
    "criterion_4": {
        "id": 4,
        "title": "Students' Performance",
        "max_marks": 100,
        "sub_criteria": [
            "Student Intake & Enrolment",
            "Pass Percentage",
            "Students Placed / Higher Studies",
            "Student Publications & Awards",
        ],
    },
    "criterion_5": {
        "id": 5,
        "title": "Faculty Information & Contributions",
        "max_marks": 200,
        "sub_criteria": [
            "Faculty Qualification & Experience",
            "Faculty-Student Ratio",
            "Faculty Publications & R&D",
            "Faculty Development Activities",
        ],
    },
    "criterion_6": {
        "id": 6,
        "title": "Facilities & Technical Support",
        "max_marks": 80,
        "sub_criteria": [
            "Classrooms & Tutorial Rooms",
            "Laboratories & Equipment",
            "Computing Facilities",
            "Library Resources",
        ],
    },
    "criterion_7": {
        "id": 7,
        "title": "Continuous Improvement",
        "max_marks": 75,
        "sub_criteria": [
            "Academic Performance Improvement",
            "Placement / Higher Studies Improvement",
            "CO Attainment Improvement Actions",
            "Feedback & CQI Actions",
        ],
    },
    "criterion_8": {
        "id": 8,
        "title": "First Year Academics",
        "max_marks": 60,
        "sub_criteria": [
            "First Year Student Performance",
            "First Year Faculty & Facilities",
        ],
    },
}

NBA_TOTAL_MARKS = sum(c["max_marks"] for c in NBA_CRITERIA.values())  # 870

# ══════════════════════════════════════════════════════════════════════════════
#  CO-PO MAPPING LEVELS
# ══════════════════════════════════════════════════════════════════════════════

CO_PO_LEVELS = {
    0: {"label": "–",  "description": "No correlation",     "color": "#e5e7eb"},
    1: {"label": "1",  "description": "Low correlation",    "color": "#fef3c7"},
    2: {"label": "2",  "description": "Medium correlation", "color": "#fed7aa"},
    3: {"label": "3",  "description": "High correlation",   "color": "#bbf7d0"},
}

# NBA's 12 Programme Outcomes (Washington Accord)
PROGRAMME_OUTCOMES = {
    "PO1":  "Engineering Knowledge",
    "PO2":  "Problem Analysis",
    "PO3":  "Design/Development of Solutions",
    "PO4":  "Conduct Investigations of Complex Problems",
    "PO5":  "Modern Tool Usage",
    "PO6":  "The Engineer & Society",
    "PO7":  "Environment & Sustainability",
    "PO8":  "Ethics",
    "PO9":  "Individual & Team Work",
    "PO10": "Communication",
    "PO11": "Project Management & Finance",
    "PO12": "Life-long Learning",
}
