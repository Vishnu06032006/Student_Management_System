import Modal from './Modal';

function ConfirmDialog({ title, message, confirmLabel = 'Confirm', danger, onConfirm, onCancel, submitting }) {
  return (
    <Modal
      title={title}
      onClose={onCancel}
      width={400}
      footer={
        <>
          <button type="button" className="button--secondary" onClick={onCancel} disabled={submitting}>
            Cancel
          </button>
          <button type="button" className={danger ? 'button--danger' : ''} onClick={onConfirm} disabled={submitting}>
            {submitting ? 'Please wait...' : confirmLabel}
          </button>
        </>
      }
    >
      <p>{message}</p>
    </Modal>
  );
}

export default ConfirmDialog;
