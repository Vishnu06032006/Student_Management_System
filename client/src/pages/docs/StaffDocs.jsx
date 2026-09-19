import Documentation from './Documentation';
import { staffIntro, staffSections } from '../../docs/staffDocsContent';

function StaffDocs() {
  return <Documentation roleLabel="Staff" intro={staffIntro} sections={staffSections} />;
}

export default StaffDocs;
