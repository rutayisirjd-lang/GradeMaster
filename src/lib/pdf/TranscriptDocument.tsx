import { Document, Page, Text, View, StyleSheet, Image, Font } from '@react-pdf/renderer'
import { format } from 'date-fns'

// Font registration (optional, using standard Helvetica for now for reliability)
const styles = StyleSheet.create({
    page: {
        padding: 40,
        backgroundColor: '#fff',
        fontFamily: 'Helvetica',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        borderBottomWidth: 2,
        borderBottomColor: '#10b981',
        paddingBottom: 20,
        marginBottom: 30,
    },
    schoolLogo: {
        width: 60,
        height: 60,
    },
    schoolInfo: {
        width: '70%',
    },
    schoolName: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#0f172a',
        textTransform: 'uppercase',
    },
    schoolSub: {
        fontSize: 10,
        color: '#64748b',
        marginTop: 4,
    },
    transcriptTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#fff',
        backgroundColor: '#10b981',
        padding: '8 20',
        textAlign: 'center',
        marginBottom: 20,
        textTransform: 'uppercase',
    },
    studentSection: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 30,
        backgroundColor: '#f8fafc',
        padding: 15,
        borderRadius: 4,
    },
    infoCol: {
        width: '48%',
    },
    infoLabel: {
        fontSize: 8,
        color: '#94a3b8',
        textTransform: 'uppercase',
        marginBottom: 2,
    },
    infoValue: {
        fontSize: 11,
        color: '#1e293b',
        fontWeight: 'bold',
        marginBottom: 8,
    },
    table: {
        marginTop: 10,
    },
    tableHeader: {
        flexDirection: 'row',
        backgroundColor: '#1e293b',
        padding: '8 4',
        borderBottomWidth: 1,
        borderBottomColor: '#10b981',
    },
    headerText: {
        color: '#fff',
        fontSize: 9,
        fontWeight: 'bold',
        textTransform: 'uppercase',
    },
    row: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
        padding: '8 4',
        alignItems: 'center',
    },
    rowText: {
        fontSize: 10,
        color: '#334155',
    },
    score: {
        fontSize: 10,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    footer: {
        marginTop: 50,
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingTop: 20,
        borderTopWidth: 1,
        borderTopColor: '#e2e8f0',
    },
    signatureBox: {
        width: '40%',
        alignItems: 'center',
    },
    signatureLine: {
        width: '100%',
        borderBottomWidth: 1,
        borderBottomColor: '#64748b',
        marginBottom: 5,
    },
    signatureLabel: {
        fontSize: 10,
        color: '#64748b',
    }
})

interface TranscriptData {
    schoolName: string
    schoolAddress: string
    studentName: string
    studentId: string
    className: string
    term: string
    year: string
    subjects: {
        name: string
        ca: string
        exam: string
        total: string
        grade: string
        remark: string
    }[]
    summary: {
        totalMarks: string
        average: string
        rank: string
        decision: string
    }
}

export const TranscriptDocument = ({ data }: { data: TranscriptData }) => (
    <Document>
        <Page size="A4" style={styles.page}>
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.schoolInfo}>
                    <Text style={styles.schoolName}>{data.schoolName}</Text>
                    <Text style={styles.schoolSub}>{data.schoolAddress}</Text>
                    <Text style={styles.schoolSub}>Academic Report Card • Internal Verification Document</Text>
                </View>
                <Image style={styles.schoolLogo} src="/placeholder-logo.png" />
            </View>

            <Text style={styles.transcriptTitle}>Report Card: {data.term} ({data.year})</Text>

            {/* Student Details */}
            <View style={styles.studentSection}>
                <View style={styles.infoCol}>
                    <Text style={styles.infoLabel}>Student Name</Text>
                    <Text style={styles.infoValue}>{data.studentName}</Text>
                    <Text style={styles.infoLabel}>Student ID</Text>
                    <Text style={styles.infoValue}>{data.studentId}</Text>
                </View>
                <View style={styles.infoCol}>
                    <Text style={styles.infoLabel}>Class Group</Text>
                    <Text style={styles.infoValue}>{data.className}</Text>
                    <Text style={styles.infoLabel}>Report Generated</Text>
                    <Text style={styles.infoValue}>{format(new Date(), 'PPpp')}</Text>
                </View>
            </View>

            {/* Marks Table */}
            <View style={styles.table}>
                <View style={styles.tableHeader}>
                    <View style={{ width: '35%' }}><Text style={styles.headerText}>Subject</Text></View>
                    <View style={{ width: '12%' }}><Text style={[styles.headerText, { textAlign: 'center' }]}>CA (/50)</Text></View>
                    <View style={{ width: '12%' }}><Text style={[styles.headerText, { textAlign: 'center' }]}>Exam (/50)</Text></View>
                    <View style={{ width: '12%' }}><Text style={[styles.headerText, { textAlign: 'center' }]}>Total (/100)</Text></View>
                    <View style={{ width: '10%' }}><Text style={[styles.headerText, { textAlign: 'center' }]}>Grade</Text></View>
                    <View style={{ width: '19%' }}><Text style={[styles.headerText, { textAlign: 'right' }]}>Remarks</Text></View>
                </View>

                {data.subjects.map((sub, i) => (
                    <View key={i} style={[styles.row, { backgroundColor: i % 2 === 0 ? '#fff' : '#f8fafc' }]}>
                        <View style={{ width: '35%' }}><Text style={[styles.rowText, { fontWeight: 'bold' }]}>{sub.name}</Text></View>
                        <View style={{ width: '12%' }}><Text style={styles.score}>{sub.ca}</Text></View>
                        <View style={{ width: '12%' }}><Text style={styles.score}>{sub.exam}</Text></View>
                        <View style={{ width: '12%' }}><Text style={[styles.score, { color: '#10b981' }]}>{sub.total}</Text></View>
                        <View style={{ width: '10%' }}><Text style={[styles.score, { color: '#10b981' }]}>{sub.grade}</Text></View>
                        <View style={{ width: '19%' }}><Text style={[styles.rowText, { textAlign: 'right', fontSize: 8 }]}>{sub.remark}</Text></View>
                    </View>
                ))}
            </View>

            {/* Summary Section */}
            <View style={{ marginTop: 20, padding: 10, borderTopWidth: 2, borderTopColor: '#1e293b', flexDirection: 'row', justifyContent: 'space-between' }}>
                <View>
                    <Text style={styles.infoLabel}>Performance Summary</Text>
                    <Text style={[styles.infoValue, { fontSize: 14 }]}>Average: {data.summary.average}%</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                    <Text style={styles.infoLabel}>Class Standing</Text>
                    <Text style={[styles.infoValue, { fontSize: 14 }]}>Rank: {data.summary.rank}</Text>
                </View>
            </View>

            {/* Footer / Signatures */}
            <View style={styles.footer}>
                <View style={styles.signatureBox}>
                    <View style={styles.signatureLine} />
                    <Text style={styles.signatureLabel}>Class Teacher Signature</Text>
                </View>
                <View style={styles.signatureBox}>
                    <View style={styles.signatureLine} />
                    <Text style={styles.signatureLabel}>Principal Approval</Text>
                </View>
            </View>

            <Text style={{ position: 'absolute', bottom: 30, left: 40, right: 40, textAlign: 'center', fontSize: 8, color: '#94a3b8' }}>
                This transcript is an official digital record generated by GradeMaster academic management engine on {format(new Date(), 'PP')}.
            </Text>
        </Page>
    </Document>
)
