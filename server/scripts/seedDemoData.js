require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');

const User = require('../models/User');
const Counter = require('../models/Counter');
const AcademicYear = require('../models/AcademicYear');
const Class = require('../models/Class');
const Section = require('../models/Section');
const Subject = require('../models/Subject');
const Enrollment = require('../models/Enrollment');
const TeacherAssignment = require('../models/TeacherAssignment');
const Timetable = require('../models/Timetable');
const Attendance = require('../models/Attendance');
const Exam = require('../models/Exam');
const ExamSchedule = require('../models/ExamSchedule');
const ExamResult = require('../models/ExamResult');
const LeaveRequest = require('../models/LeaveRequest');
const Announcement = require('../models/Announcement');
const Notification = require('../models/Notification');
const RefreshSession = require('../models/RefreshSession');
const PasswordResetOTP = require('../models/PasswordResetOTP');
const ODRequest = require('../models/ODRequest');
const StudentProfile = require('../models/StudentProfile');
const StaffProfile = require('../models/StaffProfile');

const { generateTempPassword } = require('../utils/tempPassword');
const { hashPassword } = require('../utils/password');
const { calculateGrade } = require('../utils/grading');

// ---------------------------------------------------------------------------
// This script does a FULL RESET of every Student/Staff/academic-structure
// record and rebuilds a single, internally-consistent B.E/B.Tech Computer
// Science and Engineering department: 4 currently-active semesters (one per
// year of study, since on any given calendar date only the odd OR even
// semester of the academic year is actually running), 3 sections each,
// 6 subjects per semester (drawn from the Anna University CSE 2023
// regulation curriculum), 20+ dedicated subject staff, a Monday-Friday
// 8-period timetable with real free periods and zero staff double-booking,
// and attendance history that mirrors the actual generated timetable
// (instead of pretending every subject meets every day).
//
// Rebuilding everything from one pass, with every Class/Section/Subject/
// Timetable/Enrollment row created against the SAME AcademicYear document
// in this same run, is what actually fixes the "OD compute-classes shows no
// subjects/staff" bug: that bug's root cause was IDs drifting apart across
// repeated partial re-seeds (a stale Enrollment pointing at a Class/Section
// that a later run had recreated with new _ids), not a logic bug in
// od.service.js itself.
// ---------------------------------------------------------------------------

const FIRST_NAMES_M = [
  'Arjun', 'Rohan', 'Karthik', 'Vikram', 'Aditya', 'Sanjay', 'Rahul', 'Nikhil', 'Suresh', 'Manoj',
  'Vignesh', 'Praveen', 'Harish', 'Dinesh', 'Ajay', 'Bala', 'Ganesh', 'Kiran', 'Mohan', 'Naveen',
  'Ramesh', 'Siva', 'Tarun', 'Uday', 'Vishal', 'Yogesh', 'Ashwin', 'Bharath', 'Chandru', 'Deepak',
];
const FIRST_NAMES_F = [
  'Priya', 'Ananya', 'Divya', 'Kavya', 'Meera', 'Sneha', 'Pooja', 'Lakshmi', 'Anjali', 'Deepa',
  'Nithya', 'Swathi', 'Ramya', 'Keerthi', 'Aishwarya', 'Bhavani', 'Charu', 'Devi', 'Gayathri', 'Harini',
  'Indhu', 'Janani', 'Kamakshi', 'Malini', 'Nandhini', 'Preethi', 'Radha', 'Sandhya', 'Tejasvi', 'Vidya',
];
const LAST_NAMES = ['Sharma', 'Verma', 'Iyer', 'Reddy', 'Nair', 'Gupta', 'Menon', 'Rao', 'Pillai', 'Das', 'Krishnan', 'Subramanian'];
const DESIGNATIONS = ['Assistant Professor', 'Associate Professor', 'Professor', 'Senior Lecturer'];
const QUALIFICATIONS = ['M.E. CSE', 'M.Tech CSE', 'Ph.D. CSE', 'M.Sc. Computer Science'];
const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const DEPARTMENT_NAME = 'Computer Science and Engineering';

// The current-term subjects for each year of study, taken from the Anna
// University B.E. CSE Regulation 2023 curriculum (six core/taught subjects
// per semester; elective slots are filled with a concrete elective title
// rather than left as a generic placeholder).
const SEMESTER_CLASS_DEFS = [
  {
    yearLabel: 'I Year',
    semester: 1,
    admissionYear: 2026,
    className: 'B.E. CSE - Semester 1',
    subjects: [
      ['EN23C01', 'Foundation English'],
      ['MA23C01', 'Matrices and Calculus'],
      ['PH23C01', 'Engineering Physics'],
      ['EE23C02', 'Fundamentals of Electrical and Electronics Engineering'],
      ['CS23C04', 'Programming in C'],
      ['CS23101', 'Computational Thinking'],
    ],
  },
  {
    yearLabel: 'II Year',
    semester: 3,
    admissionYear: 2025,
    className: 'B.E. CSE - Semester 3',
    subjects: [
      ['MA23C05', 'Probability and Statistics'],
      ['CS23301', 'Software Engineering'],
      ['CS23302', 'Data Structures'],
      ['CS23303', 'Digital System Design'],
      ['CS23304', 'Java Programming'],
      ['CS23U01', 'Professional Standards - CS & Engineering'],
    ],
  },
  {
    yearLabel: 'III Year',
    semester: 5,
    admissionYear: 2024,
    className: 'B.E. CSE - Semester 5',
    subjects: [
      ['CS23501', 'Operating Systems'],
      ['CS23502', 'Networks and Data Communication'],
      ['CS23503', 'Theory of Computation'],
      ['CS23L01', 'Self Learning Course'],
      ['UC23E01', 'Engineering Entrepreneurship Development'],
      ['CS23019', 'Cloud Computing'],
    ],
  },
  {
    yearLabel: 'IV Year',
    semester: 7,
    admissionYear: 2023,
    className: 'B.E. CSE - Semester 7',
    subjects: [
      ['CS23E01', 'Embedded Systems and IoT'],
      ['CS23E02', 'Artificial Intelligence'],
      ['CS23057', 'Deep Learning'],
      ['CS23015', 'Web Application Security'],
      ['CS23028', 'Ethical Hacking'],
      ['CS23010', 'Web Technologies'],
    ],
  },
];

const SECTION_NAMES = ['A', 'B', 'C'];

// Exact timetable the user specified: Monday-Friday, 8 periods, with the
// standard break/lunch gaps baked into the start/end times.
const PERIOD_SLOTS = [
  { period: 1, startTime: '08:30', endTime: '09:20' },
  { period: 2, startTime: '09:25', endTime: '10:15' },
  { period: 3, startTime: '10:30', endTime: '11:20' },
  { period: 4, startTime: '11:25', endTime: '12:15' },
  { period: 5, startTime: '13:10', endTime: '14:00' },
  { period: 6, startTime: '14:05', endTime: '14:55' },
  { period: 7, startTime: '15:00', endTime: '15:55' },
  { period: 8, startTime: '16:00', endTime: '16:45' },
];
const TIMETABLE_DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI'];
const FREE_PERIODS_PER_DAY = 2; // out of 8 - keeps periods free instead of packing every slot.

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min, max) {
  return min + Math.floor(Math.random() * (max - min + 1));
}

function shuffle(arr) {
  const copy = arr.slice();
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function randomName(gender) {
  const first = gender === 'MALE' ? pick(FIRST_NAMES_M) : pick(FIRST_NAMES_F);
  return `${first} ${pick(LAST_NAMES)}`;
}

function weightedStatus() {
  const r = Math.random();
  if (r < 0.8) return 'PRESENT';
  if (r < 0.9) return 'ABSENT';
  if (r < 0.95) return 'LATE';
  if (r < 0.98) return 'ON_DUTY';
  return 'EXCUSED';
}

async function reserveIdRange(counterName, prefix, count, padLength = 4) {
  const counter = await Counter.findByIdAndUpdate(counterName, { $inc: { seq: count } }, { new: true, upsert: true });
  const end = counter.seq;
  const start = end - count + 1;
  const ids = [];
  for (let n = start; n <= end; n += 1) ids.push(`${prefix}${String(n).padStart(padLength, '0')}`);
  return ids;
}

// bcrypt is deliberately slow; hashing hundreds of temp passwords one at a
// time would take minutes. Hashing is CPU-bound work handed off to libuv's
// thread pool, so batching many hash() calls together with Promise.all
// actually runs them concurrently and cuts wall-clock time drastically.
async function hashPasswordsInParallel(count, chunkSize = 40) {
  const passwords = Array.from({ length: count }, () => generateTempPassword());
  const hashes = new Array(count);
  for (let i = 0; i < count; i += chunkSize) {
    const chunk = passwords.slice(i, i + chunkSize);
    const chunkHashes = await Promise.all(chunk.map((p) => hashPassword(p)));
    chunkHashes.forEach((h, j) => {
      hashes[i + j] = h;
    });
  }
  return passwords.map((password, i) => ({ password, hash: hashes[i] }));
}

async function wipeExistingData() {
  console.log('Wiping existing Student/Staff and academic-structure data...');
  await Promise.all([
    Attendance.deleteMany({}),
    ODRequest.deleteMany({}),
    ExamResult.deleteMany({}),
    ExamSchedule.deleteMany({}),
    Exam.deleteMany({}),
    Timetable.deleteMany({}),
    TeacherAssignment.deleteMany({}),
    Enrollment.deleteMany({}),
    Subject.deleteMany({}),
    Section.deleteMany({}),
    Class.deleteMany({}),
    LeaveRequest.deleteMany({}),
    Notification.deleteMany({}),
    RefreshSession.deleteMany({}),
    PasswordResetOTP.deleteMany({}),
  ]);
  await StudentProfile.deleteMany({});
  await StaffProfile.deleteMany({});
  await User.deleteMany({ role: { $in: ['STUDENT', 'STAFF'] } });
  await Counter.findByIdAndUpdate('studentId', { seq: 0 }, { upsert: true });
  await Counter.findByIdAndUpdate('staffId', { seq: 0 }, { upsert: true });
  console.log('  done.');
}

async function ensureAcademicYear() {
  await AcademicYear.updateMany({}, { $set: { isActive: false } });
  let year = await AcademicYear.findOne({ name: '2026-27' });
  if (!year) {
    year = await AcademicYear.create({
      name: '2026-27',
      startDate: new Date('2026-06-01'),
      endDate: new Date('2027-04-30'),
      isActive: true,
    });
  } else {
    year.isActive = true;
    await year.save();
  }
  return year;
}

async function buildAcademicStructure(year) {
  console.log('Creating classes, sections and subjects for all 4 years...');
  const structure = [];
  for (const def of SEMESTER_CLASS_DEFS) {
    const cls = await Class.create({ className: def.className, academicYearId: year._id });

    const sections = [];
    for (const name of SECTION_NAMES) {
      sections.push(await Section.create({ name, classId: cls._id, capacity: 80 }));
    }

    const subjects = [];
    for (const [code, name] of def.subjects) {
      subjects.push(await Subject.create({ subjectCode: code, subjectName: name, classId: cls._id, maximumMarks: 100, passMarks: 35 }));
    }

    structure.push({ def, cls, sections, subjects });
  }
  return structure;
}

async function createStaffPool(structure) {
  console.log('Creating CSE teaching staff (one per subject, covering all sections)...');
  const totalStaff = structure.reduce((sum, s) => sum + s.subjects.length, 0);
  const staffIds = await reserveIdRange('staffId', 'STF', totalStaff);
  const creds = await hashPasswordsInParallel(totalStaff);

  const userDocs = [];
  const staffMeta = [];
  let cursor = 0;
  for (const { def, subjects } of structure) {
    for (const subject of subjects) {
      const gender = cursor % 2 === 0 ? 'MALE' : 'FEMALE';
      const fullName = randomName(gender);
      const loginId = staffIds[cursor];
      userDocs.push({
        loginId,
        email: `${fullName.toLowerCase().replace(/\s+/g, '.')}.${cursor + 1}@cse.demo.edu`,
        passwordHash: creds[cursor].hash,
        role: 'STAFF',
        status: 'ENABLED',
        mustChangePassword: true,
      });
      staffMeta.push({ loginId, fullName, gender, semesterLabel: def.yearLabel, subjectCode: subject.subjectCode, subjectId: subject._id });
      cursor += 1;
    }
  }

  const users = await User.insertMany(userDocs);
  const usersByLoginId = new Map(users.map((u) => [u.loginId, u]));

  const staffProfileDocs = staffMeta.map((meta, i) => ({
    userId: usersByLoginId.get(meta.loginId)._id,
    staffId: meta.loginId,
    fullName: meta.fullName,
    dateOfBirth: new Date(1978 + (i % 20), i % 12, (i % 27) + 1),
    gender: meta.gender,
    phone: `9${String(100000000 + i).padStart(9, '0')}`,
    address: `${randomInt(1, 200)}, Anna Nagar, Chennai`,
    qualification: pick(QUALIFICATIONS),
    department: DEPARTMENT_NAME,
    designation: pick(DESIGNATIONS),
    joiningDate: new Date(2010 + (i % 14), i % 12, (i % 27) + 1),
    experience: randomInt(1, 20),
    employmentType: 'FULL_TIME',
  }));
  const staffProfiles = await StaffProfile.insertMany(staffProfileDocs);

  // subjectId -> staff profile, one dedicated teacher per subject across all
  // of that subject's sections - this is what lets the timetable builder
  // guarantee "no collision" with a simple per-staff busy-slot tracker.
  const subjectStaffMap = new Map();
  staffMeta.forEach((meta, i) => {
    subjectStaffMap.set(meta.subjectId.toString(), staffProfiles[i]._id);
  });

  return { staffProfiles, subjectStaffMap, credentials: staffMeta.map((m, i) => ({ ...m, password: creds[i].password })) };
}

async function createTeacherAssignments(structure, subjectStaffMap, year) {
  console.log('Assigning each subject teacher to every section that studies it...');
  const docs = [];
  for (const { cls, sections, subjects } of structure) {
    for (const section of sections) {
      subjects.forEach((subject, i) => {
        docs.push({
          staffId: subjectStaffMap.get(subject._id.toString()),
          academicYearId: year._id,
          classId: cls._id,
          sectionId: section._id,
          subjectId: subject._id,
          isClassTeacher: i === 0,
        });
      });
    }
  }
  await TeacherAssignment.insertMany(docs);
}

// Places each of a section's subjects into the day's 8 periods (2 of them
// deliberately left free) such that no subject repeats within a day and the
// subject's dedicated staff member is never double-booked at the same
// day+period against any of the OTHER sections they also teach - the
// `staffBusy` set is shared across the whole run for exactly that reason.
function buildSectionTimetable({ subjects, subjectStaffMap, staffBusy, academicYearId, classId, sectionId, room }) {
  const entries = [];
  for (const day of TIMETABLE_DAYS) {
    const allPeriods = PERIOD_SLOTS.map((s) => s.period);
    const freeToday = new Set(shuffle(allPeriods).slice(0, FREE_PERIODS_PER_DAY));
    const teachingSlots = shuffle(allPeriods.filter((p) => !freeToday.has(p)));
    const subjectsToday = shuffle(subjects);
    const takenToday = new Set();

    for (const subject of subjectsToday) {
      const staffId = subjectStaffMap.get(subject._id.toString());
      for (const period of teachingSlots) {
        if (takenToday.has(period)) continue;
        const busyKey = `${staffId}:${day}:${period}`;
        if (staffBusy.has(busyKey)) continue;

        takenToday.add(period);
        staffBusy.add(busyKey);
        const slot = PERIOD_SLOTS[period - 1];
        entries.push({
          academicYearId,
          classId,
          sectionId,
          day,
          period,
          subjectId: subject._id,
          staffId,
          startTime: slot.startTime,
          endTime: slot.endTime,
          room,
        });
        break;
      }
      // If every teaching slot for this staff member is already taken today
      // (rare - a subject's staff only ever teaches 3 sections total), the
      // subject simply doesn't meet that day; that's just an extra free
      // period for the section, not a failure.
    }
  }
  return entries;
}

async function buildTimetable(structure, subjectStaffMap, year) {
  console.log('Building the Mon-Fri, 8-period timetable with zero staff collisions...');
  const staffBusy = new Set();
  const allEntries = [];
  const timetableBySection = new Map(); // `${classId}:${sectionId}` -> entries
  let roomCursor = 0;

  for (const { cls, sections, subjects } of structure) {
    for (const section of sections) {
      roomCursor += 1;
      const room = `CSE-${100 + roomCursor}`;
      const entries = buildSectionTimetable({
        subjects,
        subjectStaffMap,
        staffBusy,
        academicYearId: year._id,
        classId: cls._id,
        sectionId: section._id,
        room,
      });
      timetableBySection.set(`${cls._id}:${section._id}`, entries);
      allEntries.push(...entries);
    }
  }

  if (allEntries.length) {
    await Timetable.insertMany(allEntries, { ordered: false });
  }
  console.log(`  ${allEntries.length} timetable entries generated across ${structure.length * SECTION_NAMES.length} sections`);
  return timetableBySection;
}

async function createStudents(structure, year) {
  console.log('Creating students for all 4 years (70-80 per section)...');
  const rosterByClassSection = new Map(); // `${classId}:${sectionId}` -> [{ profileId, rollNumber }]
  let totalStudents = 0;

  for (const { def, cls, sections } of structure) {
    for (const section of sections) {
      const count = randomInt(70, 80);
      totalStudents += count;

      const creds = await hashPasswordsInParallel(count);
      const meta = [];
      for (let i = 0; i < count; i += 1) {
        const gender = i % 2 === 0 ? 'MALE' : 'FEMALE';
        const fullName = randomName(gender);
        const rollNumber = `${String(def.admissionYear).slice(-2)}CSE${section.name}${String(i + 1).padStart(3, '0')}`;
        meta.push({ fullName, gender, rollNumber });
      }

      const loginIds = await reserveIdRange('studentId', 'STU', count);
      const finalUserDocs = meta.map((m, i) => ({
        loginId: loginIds[i],
        email: `${m.fullName.toLowerCase().replace(/\s+/g, '.')}.${m.rollNumber.toLowerCase()}@cse.demo.edu`,
        passwordHash: creds[i].hash,
        role: 'STUDENT',
        status: 'ENABLED',
        mustChangePassword: true,
      }));
      const users = await User.insertMany(finalUserDocs);

      const studentProfileDocs = meta.map((m, i) => ({
        userId: users[i]._id,
        studentId: loginIds[i],
        rollNumber: m.rollNumber,
        fullName: m.fullName,
        dateOfBirth: new Date(def.admissionYear - 18, i % 12, (i % 27) + 1),
        gender: m.gender,
        bloodGroup: pick(BLOOD_GROUPS),
        phone: `8${String(200000000 + totalStudents + i).padStart(9, '0')}`,
        address: `${randomInt(1, 500)}, ${pick(['T. Nagar', 'Adyar', 'Velachery', 'Tambaram', 'Porur', 'Anna Nagar'])}, Chennai`,
        fatherName: randomName('MALE'),
        motherName: randomName('FEMALE'),
        parentPhone: `9${String(300000000 + totalStudents + i).padStart(9, '0')}`,
        admissionDate: new Date(def.admissionYear, 6, 1),
        studentStatus: 'ACTIVE',
      }));
      const profiles = await StudentProfile.insertMany(studentProfileDocs);

      const enrollmentDocs = profiles.map((profile, i) => ({
        studentId: profile._id,
        academicYearId: year._id,
        classId: cls._id,
        sectionId: section._id,
        rollNumber: meta[i].rollNumber,
        status: 'ACTIVE',
      }));
      await Enrollment.insertMany(enrollmentDocs);

      const key = `${cls._id}:${section._id}`;
      rosterByClassSection.set(
        key,
        profiles.map((p, i) => ({ profileId: p._id, rollNumber: meta[i].rollNumber }))
      );
    }
  }

  console.log(`  ${totalStudents} students created and enrolled`);
  return rosterByClassSection;
}

// Walks backward from today over the last N *school* weekdays and, for each
// one, only creates attendance for the subjects that ACTUALLY had a period
// that weekday per the generated timetable - so attendance history matches
// the timetable instead of pretending every subject met every day.
async function generateAttendance(structure, rosterByClassSection, timetableBySection, year, actingAdmin, schoolDaysBack = 15) {
  console.log(`Generating attendance history for the last ${schoolDaysBack} school days (from the real timetable)...`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const schoolDays = [];
  const cursor = new Date(today);
  while (schoolDays.length < schoolDaysBack) {
    cursor.setDate(cursor.getDate() - 1);
    const jsDay = cursor.getDay(); // 0=Sun .. 6=Sat
    if (jsDay >= 1 && jsDay <= 5) {
      const dayCode = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'][jsDay];
      schoolDays.push({ date: new Date(cursor), dayCode });
    }
  }

  let totalDocs = 0;
  for (const { cls, sections } of structure) {
    for (const section of sections) {
      const key = `${cls._id}:${section._id}`;
      const roster = rosterByClassSection.get(key) || [];
      const timetableEntries = timetableBySection.get(key) || [];
      if (!roster.length || !timetableEntries.length) continue;

      const entriesByDay = new Map();
      timetableEntries.forEach((e) => {
        if (!entriesByDay.has(e.day)) entriesByDay.set(e.day, []);
        entriesByDay.get(e.day).push(e);
      });

      const docs = [];
      for (const { date, dayCode } of schoolDays) {
        const dayEntries = entriesByDay.get(dayCode) || [];
        // One attendance record per subject per day (matching the schema's
        // unique index), even if the timetable happens to place it more
        // than once in a day.
        const subjectsToday = [...new Set(dayEntries.map((e) => e.subjectId.toString()))];
        for (const subjectId of subjectsToday) {
          for (const { profileId } of roster) {
            docs.push({
              studentId: profileId,
              academicYearId: year._id,
              classId: cls._id,
              sectionId: section._id,
              subjectId,
              date,
              status: weightedStatus(),
              markedBy: actingAdmin._id,
            });
          }
        }
      }

      if (docs.length) {
        await Attendance.insertMany(docs, { ordered: false }).catch(() => {});
        totalDocs += docs.length;
      }
    }
  }
  console.log(`  ${totalDocs} attendance records generated`);
}

async function createExamsAndResults(structure, rosterByClassSection, year, actingAdmin) {
  console.log('Creating exams, schedules and results...');
  const today = new Date();

  const exam1 = await Exam.create({
    examName: 'Quarterly Examination',
    academicYearId: year._id,
    startDate: new Date(today.getTime() - 20 * 86400000),
    endDate: new Date(today.getTime() - 15 * 86400000),
    status: 'COMPLETED',
  });
  const exam2 = await Exam.create({
    examName: 'Half-Yearly Examination',
    academicYearId: year._id,
    startDate: new Date(today.getTime() + 30 * 86400000),
    endDate: new Date(today.getTime() + 35 * 86400000),
    status: 'DRAFT',
  });

  const scheduleDocs = [];
  for (const { cls, subjects } of structure) {
    for (const subject of subjects) {
      scheduleDocs.push({
        examId: exam1._id,
        subjectId: subject._id,
        classId: cls._id,
        examDate: exam1.startDate,
        startTime: '09:00',
        endTime: '10:30',
        maximumMarks: 100,
        passMarks: 35,
      });
      scheduleDocs.push({
        examId: exam2._id,
        subjectId: subject._id,
        classId: cls._id,
        examDate: exam2.startDate,
        startTime: '09:00',
        endTime: '10:30',
        maximumMarks: 100,
        passMarks: 35,
      });
    }
  }
  if (scheduleDocs.length) await ExamSchedule.insertMany(scheduleDocs, { ordered: false });

  const resultDocs = [];
  for (const { cls, sections, subjects } of structure) {
    for (const subject of subjects) {
      for (const section of sections) {
        const key = `${cls._id}:${section._id}`;
        const roster = rosterByClassSection.get(key) || [];
        for (const { profileId } of roster) {
          const marksObtained = Math.floor(Math.random() * 65) + 30;
          const { grade } = calculateGrade(marksObtained, 100);
          resultDocs.push({
            examId: exam1._id,
            studentId: profileId,
            subjectId: subject._id,
            marksObtained,
            maximumMarks: 100,
            passMarks: 35,
            grade,
            resultStatus: marksObtained >= 35 ? 'PASS' : 'FAIL',
            enteredBy: actingAdmin._id,
          });
        }
      }
    }
  }
  if (resultDocs.length) await ExamResult.insertMany(resultDocs, { ordered: false });
  console.log(`  ${resultDocs.length} exam results generated`);
}

async function createLeaveAndAnnouncements(rosterByClassSection, staffProfiles, actingAdmin) {
  console.log('Creating sample leave requests and announcements...');
  const today = new Date();
  const someRoster = [...rosterByClassSection.values()][0] || [];

  const leaveSamples = [
    { status: 'PENDING', leaveType: 'SICK', reason: 'Fever and cold' },
    { status: 'APPROVED', leaveType: 'CASUAL', reason: 'Family function' },
    { status: 'REJECTED', leaveType: 'OTHER', reason: 'Personal work' },
  ];
  for (let i = 0; i < leaveSamples.length && i < someRoster.length; i += 1) {
    const profile = await StudentProfile.findById(someRoster[i].profileId);
    const sample = leaveSamples[i];
    await LeaveRequest.create({
      userId: profile.userId,
      role: 'STUDENT',
      leaveType: sample.leaveType,
      fromDate: new Date(today.getTime() + 2 * 86400000),
      toDate: new Date(today.getTime() + 3 * 86400000),
      reason: sample.reason,
      status: sample.status,
      approvedBy: sample.status === 'PENDING' ? null : actingAdmin._id,
      approvalComment: sample.status === 'APPROVED' ? 'Approved, get well soon' : sample.status === 'REJECTED' ? 'Please reschedule' : null,
    });
  }

  const announcementSamples = [
    { title: 'Welcome to the new academic year', message: 'We wish all CSE students and staff a productive year ahead.', audience: 'ALL', priority: 'NORMAL' },
    { title: 'Quarterly exam results published', message: 'Students can now view their Quarterly Examination results.', audience: 'ALL_STUDENTS', priority: 'IMPORTANT' },
    { title: 'Department staff meeting on Monday', message: 'All CSE staff are requested to attend the meeting at 9 AM in the staff room.', audience: 'ALL_STAFF', priority: 'URGENT' },
  ];
  for (const sample of announcementSamples) {
    await Announcement.create({ ...sample, createdBy: actingAdmin._id });
  }
}

async function seed() {
  await connectDB();

  const actingAdmin = await User.findOne({ role: 'ADMIN' });
  if (!actingAdmin) {
    throw new Error('No admin account found - run npm run seed:admin first');
  }

  await wipeExistingData();

  console.log('Setting up academic year...');
  const year = await ensureAcademicYear();

  const structure = await buildAcademicStructure(year);
  const { staffProfiles, subjectStaffMap } = await createStaffPool(structure);
  await createTeacherAssignments(structure, subjectStaffMap, year);
  const timetableBySection = await buildTimetable(structure, subjectStaffMap, year);
  const rosterByClassSection = await createStudents(structure, year);
  await generateAttendance(structure, rosterByClassSection, timetableBySection, year, actingAdmin);
  await createExamsAndResults(structure, rosterByClassSection, year, actingAdmin);
  await createLeaveAndAnnouncements(rosterByClassSection, staffProfiles, actingAdmin);

  const totalStudents = [...rosterByClassSection.values()].reduce((sum, r) => sum + r.length, 0);
  console.log('\nCSE demo data seeding complete.');
  console.log(
    `Department: ${DEPARTMENT_NAME} | Semesters: ${structure.length} (years I-IV) | Sections/semester: ${SECTION_NAMES.length} | Staff: ${staffProfiles.length} | Students: ${totalStudents}`
  );
}

seed()
  .catch((err) => {
    console.error('Seeding failed:', err);
    process.exitCode = 1;
  })
  .finally(() => mongoose.connection.close());
