// prisma/seed-academic.ts
// Seeds the Ethiopian education system academic structure:
// Academic Year → Grades (9-12) → Sections → Subjects → Sample assignments
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding academic structure...');

  // 1. Academic Year
  const currentYear = new Date().getFullYear();
  const academicYear = await prisma.academicYear.upsert({
    where: { name: `${currentYear}-${currentYear + 1}` },
    update: {},
    create: {
      name: `${currentYear}-${currentYear + 1}`,
      startDate: new Date(`${currentYear}-09-01`),
      endDate: new Date(`${currentYear + 1}-06-30`),
      isCurrent: true,
      status: 'ACTIVE',
    },
  });
  console.log(`  ✓ Academic Year: ${academicYear.name}`);

  // 2. Grades (9-12, Ethiopian secondary school)
  const gradeData = [
    { name: 'Grade 9', level: 9 },
    { name: 'Grade 10', level: 10 },
    { name: 'Grade 11', level: 11 },
    { name: 'Grade 12', level: 12 },
  ];
  const grades: any[] = [];
  for (const g of gradeData) {
    const grade = await prisma.grade.upsert({ where: { name: g.name }, update: {}, create: g });
    grades.push(grade);
  }
  console.log(`  ✓ Grades: ${grades.map((g) => g.name).join(', ')}`);

  // 3. Subjects (Ethiopian curriculum)
  const subjectData = [
    { name: 'Mathematics', code: 'MATH' },
    { name: 'English', code: 'ENG' },
    { name: 'Amharic', code: 'AMH' },
    { name: 'Biology', code: 'BIO' },
    { name: 'Chemistry', code: 'CHEM' },
    { name: 'Physics', code: 'PHY' },
    { name: 'Geography', code: 'GEO' },
    { name: 'History', code: 'HIST' },
    { name: 'Civics', code: 'CIV' },
    { name: 'Information Technology', code: 'IT' },
  ];
  const subjects: any[] = [];
  for (const s of subjectData) {
    const subject = await prisma.subject.upsert({ where: { name: s.name }, update: {}, create: s });
    subjects.push(subject);
  }
  console.log(`  ✓ Subjects: ${subjects.length} subjects`);

  // 4. Sections (2 sections per grade: A and B)
  const sections: any[] = [];
  for (const grade of grades) {
    for (const suffix of ['A', 'B']) {
      const sectionName = `${grade.level}${suffix}`;
      const section = await prisma.section.upsert({
        where: { name_academicYearId: { name: sectionName, academicYearId: academicYear.id } },
        update: {},
        create: {
          name: sectionName,
          gradeId: grade.id,
          academicYearId: academicYear.id,
          capacity: 40,
        },
      });
      sections.push(section);
    }
  }
  console.log(`  ✓ Sections: ${sections.length} sections (${sections.map(s => s.name).join(', ')})`);

  // 5. Assign existing teachers to section-subjects
  const teachers = await prisma.user.findMany({ where: { role: 'TEACHER' } });
  if (teachers.length > 0) {
    console.log(`  ✓ Assigning ${teachers.length} teachers to section-subjects...`);
    let teacherIdx = 0;
    for (const section of sections) {
      for (const subject of subjects) {
        const teacher = teachers[teacherIdx % teachers.length];
        await prisma.sectionSubject.upsert({
          where: { sectionId_subjectId: { sectionId: section.id, subjectId: subject.id } },
          update: { teacherId: teacher.id },
          create: {
            sectionId: section.id,
            subjectId: subject.id,
            teacherId: teacher.id,
          },
        });
        teacherIdx++;
      }
    }
    console.log(`    ✓ Created ${sections.length * subjects.length} section-subject assignments`);
  }

  // 6. Assign existing students to sections (distribute evenly)
  const students = await prisma.user.findMany({ where: { role: 'STUDENT' } });
  if (students.length > 0 && sections.length > 0) {
    console.log(`  ✓ Assigning ${students.length} students to sections...`);
    for (let i = 0; i < students.length; i++) {
      const section = sections[i % sections.length];
      await prisma.studentSection.upsert({
        where: {
          studentId_sectionId_academicYearId: {
            studentId: students[i].id,
            sectionId: section.id,
            academicYearId: academicYear.id,
          },
        },
        update: {},
        create: {
          studentId: students[i].id,
          sectionId: section.id,
          academicYearId: academicYear.id,
          status: 'ACTIVE',
        },
      });
    }
    console.log(`    ✓ All students assigned to sections`);
  }

  console.log('\n✅ Academic structure seeding complete!');
  console.log(`   - Academic Year: ${academicYear.name}`);
  console.log(`   - Grades: ${grades.length}`);
  console.log(`   - Subjects: ${subjects.length}`);
  console.log(`   - Sections: ${sections.length}`);
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
