import { FiGrid, FiCalendar, FiClock, FiAward, FiFileText, FiClipboard, FiMessageSquare } from 'react-icons/fi';

const media = (slug) => `/docs-media/student/${slug}.png`;

export const studentIntro =
  "As a Student you can track your attendance subject-by-subject on a live calendar, view your weekly timetable, check published exam results, apply for On-Duty (OD) leave when you attend a college event, apply for regular leave, and read department announcements. This guide covers every field on every form you'll fill in, and what to do when something doesn't look right.";

export const studentSections = [
  {
    id: 'dashboard',
    title: 'Dashboard',
    icon: FiGrid,
    summary: 'Your landing page after login: attendance percentage, today\'s timetable, recent results and announcements at a glance.',
    steps: [
      'Sign in by choosing "Student" on the role-select screen, then entering your Student login ID (e.g. STU0303) and password.',
      'Stat cards show your overall attendance percentage and how many classes you have scheduled today.',
      'A donut chart breaks your attendance down by status: Present, Late, Excused, Absent and On Duty, across every subject combined.',
      'A "Today\'s Timetable" list shows each period you have today in order, with subject, teacher and room.',
      'A Recent Announcements panel shows the latest messages targeted at students or everyone.',
    ],
    tips: ['On your very first login you\'ll be forced through a "Set a new password" screen before you can reach the Dashboard — this is expected, not an error.'],
    screenshots: [{ src: media('dashboard'), alt: 'Student dashboard', caption: 'Student dashboard overview' }],
  },
  {
    id: 'attendance',
    title: 'Attendance Calendar',
    icon: FiCalendar,
    summary: 'A month calendar showing your attendance status day by day, plus a subject-by-subject breakdown and percentage.',
    steps: [
      'Open Academics → Attendance.',
      'Use the arrows next to the month label to move to the previous or next month.',
      'Each day cell is color-coded by status: Present, Absent, Late, Excused, or On Duty. Hover (or tap, on touch devices) a day to see the exact per-subject breakdown for that date, since you can have different statuses for different subjects on the same day.',
      'Under "By Subject", every subject you\'re enrolled in appears as its own chip showing its individual attendance percentage. Click a chip to filter the calendar, the stat numbers and the donut chart down to just that subject; click "All Subjects" to return to the combined view.',
    ],
    tips: [
      'Below the eligibility threshold (75%), a subject\'s percentage chip is highlighted in a warning/critical color so you notice it before it becomes a problem — the same 75% threshold the Admin uses on their Attendance shortage report.',
      'A day showing "On Duty" means a staff member approved an OD request that covered that subject on that date — you don\'t need to do anything further for it.',
    ],
    screenshots: [{ src: media('attendance-calendar'), alt: 'Attendance calendar', caption: 'Month calendar with subject-by-subject drill-down' }],
  },
  {
    id: 'timetable',
    title: 'Timetable',
    icon: FiClock,
    summary: 'Your weekly class schedule, plus a focused view of today\'s classes with your attendance status for each one.',
    steps: [
      'Open Academics → Timetable.',
      '"Today" lists each period you have today: subject, teacher, room, and a status tag showing whether that period is already marked (with your status), still upcoming, or has passed with no attendance record yet.',
      'The weekly grid below shows every period across Monday-Saturday for your exact class and section, including any genuinely free periods (a healthy timetable will have a few of these — not every slot is meant to have a class).',
    ],
    tips: ['If your timetable looks empty or wrong, it means your Enrollment record (class/section for the current academic year) may not match what you expect — ask the Admin or your class teacher to check Academic Structure → Enrollment for you.'],
    screenshots: [{ src: media('timetable'), alt: 'Student timetable', caption: 'Today\'s schedule and full weekly timetable' }],
  },
  {
    id: 'results',
    title: 'Results',
    icon: FiAward,
    summary: 'View your exam results once the Admin or your subject teacher has entered and the exam has been published.',
    steps: [
      'Open Academics → Results.',
      'Each published exam lists your marks, grade and pass/fail status per subject.',
      'A subject with no row yet under a given exam simply hasn\'t had marks entered or published for it — check back later or ask your subject teacher.',
    ],
    screenshots: [{ src: media('results'), alt: 'Student results page', caption: 'Published exam results' }],
  },
  {
    id: 'od-requests',
    title: 'OD Requests (On-Duty)',
    icon: FiFileText,
    summary:
      'Apply for On-Duty status when you miss class for an official college event (competition, workshop, cultural event, symposium, etc.), so the classes you miss count as "On Duty" instead of "Absent" once the concerned teacher approves it.',
    steps: [
      'Open Academics → OD Requests.',
      'Fill in the Event name, Start date and End date of the event.',
      'Choose the Session: Full Day, or Half Day — if you pick Half Day, a second dropdown appears to choose Forenoon or Afternoon.',
      'Upload your Proof document: a photo or scan of the event circular, permission letter, or certificate. Accepted formats are JPG, PNG, WEBP or PDF, up to 5 MB — a larger or unsupported file is rejected immediately with an error before you can submit.',
      'Click "Compute Classes". The system reads your actual timetable for the exact dates and session you selected, and lists precisely which subjects/periods you will miss — it does not guess; a date with no scheduled classes for you will simply contribute nothing to the list.',
      'Tick the checkboxes next to the subjects you actually want covered as OD (you can leave unchecked any you don\'t need — e.g. a free period, or a class you plan to attend anyway), then submit.',
      'Your request is split behind the scenes into one item per selected subject, and each item is routed to the exact staff member who teaches that subject to your section — not to a single generic approver.',
      'Track every item under "My OD Requests" below the form, each with its own independent status: Pending, Approved, or Declined.',
      'If a subject\'s item is approved, your attendance for that subject on that date is automatically set to "On Duty" — no further action needed. If declined, you\'ll see the teacher\'s comment (by default: "Your OD request is declined. Come and meet me for further process.", possibly extended by the teacher) explaining next steps.',
    ],
    fields: [
      { label: 'Event name *', required: true, notes: 'Free text.' },
      { label: 'Start date *', required: true, notes: 'Date picker.' },
      { label: 'End date *', required: true, notes: 'Date picker — must be on or after the start date.' },
      { label: 'Session *', required: true, notes: 'Select: Full Day, or Half Day (reveals a Forenoon/Afternoon sub-choice).' },
      { label: 'Proof document *', required: true, notes: 'File upload — JPG, PNG, WEBP or PDF, maximum 5 MB.' },
      { label: 'Subjects to apply for *', required: true, notes: 'Checkbox list, populated only after clicking "Compute Classes"; you must tick at least one before submitting.' },
    ],
    workflow: {
      title: 'Applying for OD after representing college at an inter-college event',
      steps: [
        'You attended a 2-day symposium and missed classes on both days — open Academics → OD Requests.',
        'Enter the event name, set Start date and End date to the two days of the symposium, and leave Session as Full Day.',
        'Upload the participation certificate or permission letter as your proof document (PDF or photo, under 5 MB).',
        'Click "Compute Classes" — every period scheduled for your section on those two days appears, grouped by subject.',
        'Tick every subject except one elective you actually managed to attend online, then submit.',
        'Watch "My OD Requests" — each subject you selected shows its own status as the respective teachers decide; once approved, that subject\'s attendance for that date shows "On Duty" on your Attendance Calendar automatically.',
      ],
    },
    tips: [
      '"Compute Classes" only shows subjects that are actually scheduled on your timetable for the dates and session you picked — if a date has no classes at all (e.g. a genuinely free day), there will be nothing to select for it, which is expected, not a bug.',
      'You can apply again for a different date range at any time; there is no limit on how many OD requests you submit, but each one still needs the relevant teacher\'s approval individually.',
    ],
    troubleshooting: [
      {
        issue: 'Clicking "Compute Classes" shows no subjects at all.',
        solution: 'Either your date range genuinely has no scheduled periods for your section (check your Timetable page for those dates), or your Enrollment/section assignment may be incorrect — ask the Admin to verify Academic Structure → Enrollment.',
      },
      {
        issue: 'My proof document upload is rejected.',
        solution: 'Confirm the file is one of JPG, PNG, WEBP or PDF and is under 5 MB — compress an oversized image/PDF or take a lower-resolution photo and try again.',
      },
      {
        issue: 'An item shows "Declined".',
        solution: 'Read the teacher\'s comment on that item — it will ask you to meet them in person for further process. Approaching the teacher directly is the correct next step; there is no in-app appeal button.',
      },
    ],
    screenshots: [{ src: media('od-requests'), alt: 'Student OD request form and history', caption: 'Applying for OD and tracking request status' }],
  },
  {
    id: 'leave',
    title: 'Leave',
    icon: FiClipboard,
    summary: 'Apply for regular leave (e.g. sick leave) and track its approval — separate from OD, which is specifically for official college events.',
    steps: [
      'Open Communication → Leave.',
      'Click "Apply for Leave", choose the leave type, from/to dates and a reason, then submit.',
      'Track the status (Pending / Approved / Rejected) on the same page; a request still Pending can be cancelled by you.',
    ],
    fields: [
      { label: 'Leave type *', required: true, notes: 'Select, e.g. Sick, Casual, Other.' },
      { label: 'From date *', required: true, notes: 'Date picker.' },
      { label: 'To date *', required: true, notes: 'Date picker — must be on or after the from date.' },
      { label: 'Reason *', required: true, notes: 'Free text.' },
    ],
    tips: ['Use Leave for personal/medical absences and OD Requests for official college-representative events — the two are tracked and approved completely separately, and only OD auto-updates your attendance status.'],
    screenshots: [{ src: media('leave'), alt: 'Student leave requests', caption: 'Applying for leave and tracking status' }],
  },
  {
    id: 'announcements',
    title: 'Announcements',
    icon: FiMessageSquare,
    summary: 'Read announcements published by the Admin that target your class/section, all students, or everyone.',
    steps: ['Open Communication → Announcements to see the latest messages, sorted by priority and date.'],
    tips: ['You will only see announcements whose audience matches you specifically: Everyone, All Students, your exact Class, or your exact Section — never another section\'s or another department\'s targeted messages.'],
    screenshots: [{ src: media('announcements'), alt: 'Student announcements', caption: 'Viewing published announcements' }],
  },
];
