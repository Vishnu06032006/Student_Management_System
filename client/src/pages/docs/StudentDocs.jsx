import Documentation from './Documentation';
import { studentIntro, studentSections } from '../../docs/studentDocsContent';

function StudentDocs() {
  return <Documentation roleLabel="Student" intro={studentIntro} sections={studentSections} />;
}

export default StudentDocs;
