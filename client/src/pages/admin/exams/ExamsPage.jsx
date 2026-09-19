import { useEffect, useState } from 'react';
import PageHeader from '../../../components/common/PageHeader';
import Tabs from '../../../components/common/Tabs';
import * as academicService from '../../../services/academicService';
import * as examService from '../../../services/examService';
import ExamsTab from './ExamsTab';
import ScheduleTab from './ScheduleTab';
import MarksEntryTab from './MarksEntryTab';

const TABS = [
  { key: 'exams', label: 'Exams' },
  { key: 'schedule', label: 'Exam Schedule' },
  { key: 'marks', label: 'Marks Entry' },
];

function ExamsPage() {
  const [active, setActive] = useState('exams');
  const [years, setYears] = useState([]);
  const [classes, setClasses] = useState([]);
  const [exams, setExams] = useState([]);

  const reloadReferenceData = async () => {
    const [yearsRes, classesRes, examsRes] = await Promise.all([
      academicService.listAcademicYears(),
      academicService.listClasses(),
      examService.listExams(),
    ]);
    setYears(yearsRes.data.data.items);
    setClasses(classesRes.data.data.items);
    setExams(examsRes.data.data.items);
  };

  useEffect(() => {
    reloadReferenceData();
  }, []);

  return (
    <div>
      <PageHeader title="Examinations" subtitle="Exams, schedules, marks entry and result publishing" />
      <Tabs tabs={TABS} active={active} onChange={setActive} />

      <div style={{ marginTop: 16 }}>
        {active === 'exams' && <ExamsTab years={years} onChanged={reloadReferenceData} />}
        {active === 'schedule' && <ScheduleTab exams={exams} classes={classes} />}
        {active === 'marks' && <MarksEntryTab exams={exams} />}
      </div>
    </div>
  );
}

export default ExamsPage;
