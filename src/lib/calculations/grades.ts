export const GRADE_TABLE = [
    { min: 90, max: 100, letter: 'A+', gpa: 4.0, descriptor: 'Distinction' },
    { min: 80, max: 89, letter: 'A', gpa: 3.7, descriptor: 'Excellent' },
    { min: 70, max: 79, letter: 'B+', gpa: 3.3, descriptor: 'Very Good' },
    { min: 60, max: 69, letter: 'B', gpa: 3.0, descriptor: 'Good' },
    { min: 50, max: 59, letter: 'C+', gpa: 2.7, descriptor: 'Satisfactory' },
    { min: 40, max: 49, letter: 'C', gpa: 2.3, descriptor: 'Pass' },
    { min: 30, max: 39, letter: 'D', gpa: 1.0, descriptor: 'Below Average' },
    { min: 0, max: 29, letter: 'F', gpa: 0.0, descriptor: 'Fail' },
] as const

export function getLetterGrade(score: number) {
    const rounded = Math.round(score * 100) / 100
    return (
        GRADE_TABLE.find((g) => rounded >= g.min && rounded <= g.max) ??
        GRADE_TABLE[GRADE_TABLE.length - 1]
    )
}


export interface AssessmentMark {
    category: 'quiz' | 'homework' | 'exercise' | 'exam'
    normalizedScore: number | null
    absenceType: 'present' | 'excused' | 'unexcused' | 'not_applicable'
}

export function computeSubjectResult(marks: AssessmentMark[]) {
    const caMarks = marks.filter(
        (m) =>
            ['quiz', 'homework', 'exercise'].includes(m.category) &&
            m.absenceType === 'present' &&
            m.normalizedScore !== null
    )
    const examMark = marks.find(
        (m) => m.category === 'exam' && m.absenceType === 'present'
    )

    const hasCAAssessments = marks.some((m) =>
        ['quiz', 'homework', 'exercise'].includes(m.category)
    )
    const hasExamAssessment = marks.some((m) => m.category === 'exam')

    const isCAIncomplete = hasCAAssessments && caMarks.length === 0
    const isExamIncomplete = hasExamAssessment && !examMark

    if (isCAIncomplete || isExamIncomplete) {
        return {
            caAverage: null,
            examScore: null,
            finalScore: null,
            letterGrade: null,
            isIncomplete: true,
            incompleteReason: [
                isCAIncomplete ? 'Missing CA marks' : null,
                isExamIncomplete ? 'Missing exam mark' : null,
            ]
                .filter(Boolean)
                .join('; '),
        }
    }

    const caAverage =
        caMarks.length > 0
            ? caMarks.reduce((sum, m) => sum + m.normalizedScore!, 0) / caMarks.length
            : 0
    const examScore = examMark?.normalizedScore ?? 0
    const finalScore =
        Math.round((caAverage * 0.5 + examScore * 0.5) * 100) / 100

    return {
        caAverage: Math.round(caAverage * 100) / 100,
        examScore: Math.round(examScore * 100) / 100,
        finalScore,
        letterGrade: getLetterGrade(finalScore).letter,
        isIncomplete: false,
        incompleteReason: null,
    }
}

export function computeTermAverage(
    subjectFinalScores: (number | null)[]
): number | null {
    const valid = subjectFinalScores.filter((s): s is number => s !== null)
    if (!valid.length) return null
    return Math.round((valid.reduce((a, b) => a + b, 0) / valid.length) * 100) / 100
}

export function computeAnnualAverage(
    t1: number | null,
    t2: number | null,
    t3: number | null
): number | null {
    const terms = [t1, t2, t3].filter((t): t is number => t !== null)
    if (!terms.length) return null
    return Math.round((terms.reduce((a, b) => a + b, 0) / terms.length) * 100) / 100
}
