// prisma/seed-academic.ts
// Seeds the Ethiopian education system academic structure:
// Academic Year → Grades (9-12) → Sections → Subjects → Sample assignments
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding academic structure...');

  // 1. Academic Year
  const currentYear = new Date().getFullYear();
  let academicYear = await prisma.academicYear.findFirst({ where: { name: `${currentYear}-${currentYear + 1}` } });
  if (!academicYear) {
    academicYear = await prisma.academicYear.create({
      data: {
        name: `${currentYear}-${currentYear + 1}`,
        startDate: new Date(`${currentYear}-09-01`),
        endDate: new Date(`${currentYear + 1}-06-30`),
        isCurrent: true,
        status: 'ACTIVE',
      },
    });
  }
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
    let grade = await prisma.grade.findUnique({ where: { name: g.name } });
    if (!grade) grade = await prisma.grade.create({ data: g });
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
    let subject = await prisma.subject.findUnique({ where: { name: s.name } });
    if (!subject) subject = await prisma.subject.create({ data: s });
    subjects.push(subject);
  }
  console.log(`  ✓ Subjects: ${subjects.length} subjects`);

  // 4. Sections (2 sections per grade: A and B)
  const sections: any[] = [];
  for (const grade of grades) {
    for (const suffix of ['A', 'B']) {
      const sectionName = `${grade.level}${suffix}`;
      let section = await prisma.section.findUnique({ where: { name_academicYearId: { name: sectionName, academicYearId: academicYear.id } } });
      if (!section) {
        section = await prisma.section.create({
          data: {
            name: sectionName,
            gradeId: grade.id,
            academicYearId: academicYear.id,
            capacity: 40,
          },
        });
      }
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
        const existingSS = await prisma.sectionSubject.findUnique({ where: { sectionId_subjectId: { sectionId: section.id, subjectId: subject.id } } });
        if (existingSS) {
          await prisma.sectionSubject.update({ where: { id: existingSS.id }, data: { teacherId: teacher.id } });
        } else {
          await prisma.sectionSubject.create({ data: { sectionId: section.id, subjectId: subject.id, teacherId: teacher.id } });
        }
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
      const existingStu = await prisma.studentSection.findUnique({ where: { studentId_sectionId_academicYearId: { studentId: students[i].id, sectionId: section.id, academicYearId: academicYear.id } } });
      if (!existingStu) {
        await prisma.studentSection.create({ data: { studentId: students[i].id, sectionId: section.id, academicYearId: academicYear.id, status: 'ACTIVE' } });
      }
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
