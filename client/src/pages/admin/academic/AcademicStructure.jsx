import { useEffect, useState } from 'react';
import PageHeader from '../../../components/common/PageHeader';
import Tabs from '../../../components/common/Tabs';
import * as academicService from '../../../services/academicService';
import AcademicYearsTab from './AcademicYearsTab';
import ClassesTab from './ClassesTab';
import SectionsTab from './SectionsTab';
import SubjectsTab from './SubjectsTab';
import EnrollmentTab from './EnrollmentTab';
import TeacherAssignmentTab from './TeacherAssignmentTab';

const TABS = [
  { key: 'years', label: 'Academic Years' },
  { key: 'classes', label: 'Classes' },
  { key: 'sections', label: 'Sections' },
  { key: 'subjects', label: 'Subjects' },
  { key: 'enrollment', label: 'Enrollment' },
  { key: 'assignments', label: 'Teacher Assignments' },
];

function AcademicStructure() {
  const [active, setActive] = useState('years');
  const [years, setYears] = useState([]);
  const [classes, setClasses] = useState([]);

  // Years and classes are shared reference data across several tabs (class
  // dropdowns, enrollment/assignment cascades), so they're loaded once here.
  const reloadReferenceData = async () => {
    const [yearsRes, classesRes] = await Promise.all([
      academicService.listAcademicYears(),
      academicService.listClasses(),
    ]);
    setYears(yearsRes.data.data.items);
    setClasses(classesRes.data.data.items);
  };

  useEffect(() => {
    reloadReferenceData();
  }, []);

  return (
    <div>
      <PageHeader title="Academic Structure" subtitle="Academic years, classes, sections, subjects, enrollment and teacher assignments" />
      <Tabs tabs={TABS} active={active} onChange={setActive} />

      <div style={{ marginTop: 16 }}>
        {active === 'years' && <AcademicYearsTab onChanged={reloadReferenceData} />}
        {active === 'classes' && <ClassesTab years={years} onChanged={reloadReferenceData} />}
        {active === 'sections' && <SectionsTab classes={classes} />}
        {active === 'subjects' && <SubjectsTab classes={classes} />}
        {active === 'enrollment' && <EnrollmentTab years={years} classes={classes} />}
        {active === 'assignments' && <TeacherAssignmentTab years={years} classes={classes} />}
      </div>
    </div>
  );
}

export default AcademicStructure;
