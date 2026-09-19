import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const schema = z.object({
  fullName: z.string().trim().min(1, 'Full name is required'),
  email: z.string().trim().email('Invalid email address'),
  phone: z.string().trim().min(1, 'Phone number is required'),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER', '']).optional(),
  dateOfBirth: z.string().optional(),
  bloodGroup: z.string().optional(),
  address: z.string().optional(),
  admissionNumber: z.string().optional(),
  rollNumber: z.string().optional(),
  admissionDate: z.string().optional(),
  fatherName: z.string().optional(),
  motherName: z.string().optional(),
  guardianName: z.string().optional(),
  parentPhone: z.string().optional(),
  parentEmail: z.string().email('Invalid parent email').optional().or(z.literal('')),
});

function StudentForm({ defaultValues, onSubmit, submitting, submitLabel = 'Create Student' }) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: zodResolver(schema), defaultValues });

  return (
    <form className="entity-form" onSubmit={handleSubmit(onSubmit)} noValidate>
      <div className="form-section">
        <h3>Personal information</h3>
        <div className="form-grid">
          <div className="form-field">
            <label>Full name *</label>
            <input {...register('fullName')} />
            {errors.fullName && <p className="field-error">{errors.fullName.message}</p>}
          </div>
          <div className="form-field">
            <label>Email *</label>
            <input type="email" {...register('email')} />
            {errors.email && <p className="field-error">{errors.email.message}</p>}
          </div>
          <div className="form-field">
            <label>Phone *</label>
            <input {...register('phone')} />
            {errors.phone && <p className="field-error">{errors.phone.message}</p>}
          </div>
          <div className="form-field">
            <label>Gender</label>
            <select {...register('gender')}>
              <option value="">Select</option>
              <option value="MALE">Male</option>
              <option value="FEMALE">Female</option>
              <option value="OTHER">Other</option>
            </select>
          </div>
          <div className="form-field">
            <label>Date of birth</label>
            <input type="date" {...register('dateOfBirth')} />
          </div>
          <div className="form-field">
            <label>Blood group</label>
            <input {...register('bloodGroup')} />
          </div>
          <div className="form-field form-field--wide">
            <label>Address</label>
            <input {...register('address')} />
          </div>
        </div>
      </div>

      <div className="form-section">
        <h3>Admission</h3>
        <div className="form-grid">
          <div className="form-field">
            <label>Admission number</label>
            <input {...register('admissionNumber')} />
          </div>
          <div className="form-field">
            <label>Roll number</label>
            <input {...register('rollNumber')} />
          </div>
          <div className="form-field">
            <label>Admission date</label>
            <input type="date" {...register('admissionDate')} />
          </div>
        </div>
      </div>

      <div className="form-section">
        <h3>Parent / Guardian</h3>
        <div className="form-grid">
          <div className="form-field">
            <label>Father's name</label>
            <input {...register('fatherName')} />
          </div>
          <div className="form-field">
            <label>Mother's name</label>
            <input {...register('motherName')} />
          </div>
          <div className="form-field">
            <label>Guardian's name</label>
            <input {...register('guardianName')} />
          </div>
          <div className="form-field">
            <label>Parent phone</label>
            <input {...register('parentPhone')} />
          </div>
          <div className="form-field">
            <label>Parent email</label>
            <input type="email" {...register('parentEmail')} />
            {errors.parentEmail && <p className="field-error">{errors.parentEmail.message}</p>}
          </div>
        </div>
      </div>

      <div className="form-actions">
        <button type="submit" disabled={submitting}>
          {submitting ? 'Saving...' : submitLabel}
        </button>
      </div>
    </form>
  );
}

export default StudentForm;
