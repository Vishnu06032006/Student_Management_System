import Documentation from './Documentation';
import { adminIntro, adminSections } from '../../docs/adminDocsContent';

function AdminDocs() {
  return <Documentation roleLabel="Admin" intro={adminIntro} sections={adminSections} />;
}

export default AdminDocs;
