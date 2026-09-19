import { FiGrid, FiCalendar, FiEdit3, FiClipboard, FiMessageSquare, FiFileText } from 'react-icons/fi';

const media = (slug) => `/docs-media/staff/${slug}.png`;

export const staffIntro =
  "As Staff you mark attendance for every subject/section you're assigned to teach, enter exam marks, review and decide On-Duty (OD) requests from your students, apply for your own leave, and stay up to date with department announcements. Everything you see is automatically scoped to your own Teacher Assignments — you never need to hunt through other teachers' classes.";

export const staffSections = [
  {
    id: 'dashboard',
    title: 'Dashboard',
    icon: FiGrid,
    summary: 'Your landing page after login: a snapshot of your teaching load, today\'s schedule, and anything waiting on a decision from you.',
    steps: [
      'Sign in by choosing "Staff" on the role-select screen, then entering your Staff login ID (e.g. STF0007) and password.',
      'Stat cards summarize your total assigned subjects/sections, total students across them, and how many OD requests are currently pending your decision.',
      'A "Today\'s Classes" list shows every period you teach today, in order, with subject/section/room, pulled straight from the Timetable.',
      'A Recent Announcements panel surfaces the latest messages targeted at staff or everyone, so you don\'t have to visit the Announcements page separately just to check.',
    ],
    tips: ['If "Today\'s Classes" is empty, check the Timetable page — either nothing is scheduled for you today, or Academic Structure → Teacher Assignments doesn\'t yet have you assigned to any section for the active term.'],
    screenshots: [{ src: media('dashboard'), alt: 'Staff dashboard', caption: 'Staff dashboard overview' }],
  },
  {
    id: 'attendance',
    title: 'Mark Attendance',
    icon: FiCalendar,
    summary:
      'A guided 3-step flow built specifically so a teacher who handles several subjects and sections never has to guess which roster they\'re marking: pick the subject, then the batch, then mark each student and save.',
    steps: [
      'Open My Work → Attendance.',
      'Step 1 — Choose a subject: every subject you are currently assigned to teach appears as its own selectable tile, labeled with the subject name. If you only teach one subject, you\'ll still see this step once — it keeps the flow consistent.',
      'Step 2 — Choose a batch: the same subject may be taught to more than one class/section (e.g. you teach "Data Structures" to both Section A and Section B) — each is listed separately as "{className} - Section {sectionName}". Pick the exact one you\'re about to take class for.',
      'Step 3 — Mark the roster: pick the date (defaults to today), then for every student in that batch click either the Present or Absent chip. Click "Mark all Present" first if most of the class is here, then flip just the few who are absent — this is almost always faster than clicking every student individually.',
      'Click "Save Attendance" to submit the whole roster in one request.',
      'To review or correct a day you already marked, come back to the exact same subject → batch → date; every student\'s chip pre-loads with whatever status you saved last time, so you can simply change the ones that were wrong and save again.',
      'Use the "Change batch" link to jump back to Step 2 (same subject, pick a different section), or "Change subject" to jump all the way back to Step 1 — neither one discards data you already saved.',
    ],
    fields: [
      { label: 'Date', required: true, notes: 'Defaults to today; you can pick any past date to backfill or correct attendance.' },
      { label: 'Per-student status', required: true, notes: 'Two-state chip per row: Present or Absent — there is no separate manual "Late" or "Excused" option here; those statuses are set automatically elsewhere (see tips below).' },
    ],
    workflow: {
      title: 'Take attendance for a normal class period',
      steps: [
        'Open My Work → Attendance right after your class or during it.',
        'Step 1: tap the subject you just taught.',
        'Step 2: tap the exact section you taught it to (important if you teach the same subject to multiple sections back-to-back).',
        'Step 3: leave the date on today, tap "Mark all Present", then tap "Absent" for the handful of students who are missing.',
        'Tap "Save Attendance". Done — the roster is now recorded for today\'s date for that subject/section.',
      ],
    },
    tips: [
      'You can only ever mark attendance for a subject/section combination you are actually assigned to via Academic Structure → Teacher Assignments — this is enforced server-side, not just hidden in the UI, so there is no way to accidentally mark the wrong teacher\'s class.',
      'When a student\'s OD (On-Duty) request for that exact subject and date is approved by you (see OD Requests below), their attendance record for that period is created/overwritten automatically as "On Duty" — you never need to manually set that status yourself.',
      'Marking attendance twice for the same subject/batch/date does not create duplicates — it updates the existing record for each student.',
    ],
    troubleshooting: [
      {
        issue: 'A subject I teach isn\'t showing up in Step 1.',
        solution: 'Ask the Admin to confirm your Teacher Assignment for that subject/section/academic-year actually exists and that the academic year is still the active one — Step 1 only lists subjects with a live assignment.',
      },
      {
        issue: 'A student is missing from the Step 3 roster.',
        solution: 'The student likely has no active Enrollment in that exact class/section for the current academic year — ask the Admin to check Academic Structure → Enrollment for that student.',
      },
    ],
    screenshots: [
      { src: media('attendance-step1-subject'), alt: 'Step 1 - select subject', caption: 'Step 1 of 3 - choose the subject to mark' },
      { src: media('attendance-step2-batch'), alt: 'Step 2 - select batch', caption: 'Step 2 of 3 - choose which batch/section' },
      { src: media('attendance-step3-roster'), alt: 'Step 3 - mark roster', caption: 'Step 3 of 3 - mark each student Present or Absent and save' },
    ],
  },
  {
    id: 'marks-entry',
    title: 'Marks Entry',
    icon: FiEdit3,
    summary: 'Enter exam marks for any class/subject you\'re assigned to teach, with grade and pass/fail computed for you automatically.',
    steps: [
      'Open My Work → Marks Entry.',
      'Select an exam from "Select exam" — only exams currently in a Published/Ongoing status are meant to be entered against.',
      'Select a subject from "Select subject" — the list is limited to subjects, within that exam, that you are actually assigned to teach.',
      'The roster loads: Roll No., Student name, and a marks input capped to that subject\'s maximum marks (entering a number above the maximum is rejected). Grade and Result columns are read-only and stay blank until you save.',
      'Fill in as many students\' marks as you have on hand and click "Save Marks" — you do not have to finish the whole class in one sitting; re-opening the same exam/subject later reloads whatever you already saved so you can finish the rest.',
      'After saving, the Grade and Result columns populate automatically based on the subject\'s pass-marks threshold (below pass marks shows as Fail; at or above shows a pass grade).',
    ],
    tips: ['If Save Marks does nothing and shows a toast instead, it means every field was left empty — enter at least one student\'s marks before saving.'],
    screenshots: [{ src: media('marks-entry'), alt: 'Marks entry screen', caption: 'Entering exam marks for an assigned class and subject' }],
  },
  {
    id: 'od-requests',
    title: 'OD Requests',
    icon: FiFileText,
    summary: 'Review On-Duty requests from students in the subjects you teach, verify their proof document, and approve or decline each one — your decision writes directly into that student\'s attendance record.',
    steps: [
      'Open My Work → OD Requests to see every request — pending and already-decided — for subjects assigned to you.',
      'Each row shows the requesting student, the event name, the date, the subject, and a link to their uploaded proof document (image or PDF) — open it before deciding.',
      'Click the Approve action to accept the request. This immediately writes/overwrites that student\'s attendance for that exact subject and date as "On Duty", and the student is notified.',
      'Click the Decline action to open a decision modal. The comment box comes pre-filled with the default message "Your OD request is declined. Come and meet me for further process." — you can edit or extend this text, or leave it as-is, before confirming. The student sees this exact message once you confirm.',
    ],
    fields: [
      { label: 'Decision comment', required: false, notes: 'Pre-filled on Decline with "Your OD request is declined. Come and meet me for further process." — freely editable. No comment box appears for Approve.' },
    ],
    tips: [
      'You will only ever see OD items for subjects you are actually assigned to teach for that specific student\'s section — there is no way to see or decide on another teacher\'s OD queue.',
      'A request only reaches your queue for the subjects the student actually ticked when applying — if a student was scheduled for 3 of your periods across the OD date range but only ticked 2, you will only see those 2.',
    ],
    troubleshooting: [
      {
        issue: 'I approved an OD request but the student\'s attendance still shows Absent for that day.',
        solution: 'Check that you approved the request against the correct subject and date — a student can have multiple OD line items (one per subject) for the same date range, and approving one does not affect the others; each must be decided individually.',
      },
    ],
    screenshots: [{ src: media('od-requests'), alt: 'Staff OD request queue', caption: 'Reviewing and deciding on student OD requests' }],
  },
  {
    id: 'leave',
    title: 'Leave',
    icon: FiClipboard,
    summary: 'Apply for your own leave and track its approval status.',
    steps: [
      'Open Communication → Leave.',
      'Click "Apply for Leave", choose the leave type, from/to dates and a reason, then submit.',
      'Track the status (Pending / Approved / Rejected) on the same page; a request that is still Pending can be cancelled by you at any time.',
    ],
    fields: [
      { label: 'Leave type *', required: true, notes: 'Select, e.g. Sick, Casual, Other.' },
      { label: 'From date *', required: true, notes: 'Date picker.' },
      { label: 'To date *', required: true, notes: 'Date picker — must be on or after the from date.' },
      { label: 'Reason *', required: true, notes: 'Free text.' },
    ],
    tips: ['The Admin decides your leave request from their own Leave Management queue — there is no self-approval, even for staff accounts.'],
    screenshots: [{ src: media('leave'), alt: 'Staff leave requests', caption: 'Applying for leave and tracking status' }],
  },
  {
    id: 'announcements',
    title: 'Announcements',
    icon: FiMessageSquare,
    summary: 'Read announcements published by the Admin that target all staff or everyone.',
    steps: ['Open Communication → Announcements to see the latest messages, sorted by priority and date.'],
    tips: ['An announcement targeted at "Specific Class" or "Specific Section" (rather than "All Staff"/"Everyone") is a student-facing broadcast and will not appear here — this page only shows announcements meant for staff.'],
    screenshots: [{ src: media('announcements'), alt: 'Staff announcements', caption: 'Viewing published announcements' }],
  },
];
