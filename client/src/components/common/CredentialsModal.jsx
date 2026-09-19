import { useState } from 'react';
import { FiCopy, FiCheck } from 'react-icons/fi';
import Modal from './Modal';

function CopyField({ label, value }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard API can be unavailable (e.g. insecure context); the value is still visible to copy manually.
    }
  };

  return (
    <div className="copy-field">
      <label>{label}</label>
      <div className="copy-field__row">
        <code>{value}</code>
        <button type="button" className="icon-button" onClick={copy} aria-label={`Copy ${label}`}>
          {copied ? <FiCheck /> : <FiCopy />}
        </button>
      </div>
    </div>
  );
}

function CredentialsModal({ loginId, temporaryPassword, onClose }) {
  return (
    <Modal
      title="Account created"
      onClose={onClose}
      footer={
        <button type="button" onClick={onClose}>
          Done
        </button>
      }
    >
      <p>Share these credentials with the user. The temporary password is shown only once and cannot be retrieved later — use Reset Password if it's lost.</p>
      <CopyField label="Login ID" value={loginId} />
      <CopyField label="Temporary password" value={temporaryPassword} />
    </Modal>
  );
}

export default CredentialsModal;
