import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const schema = z.object({
  fullName: z.string().trim().min(1, 'Full name is required'),
  email: z.string().trim().email('Invalid email address'),
  phone: z.string().trim().min(1, 'Phone number is required'),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER', '']).optional(),
  dateOfBirth: z.string().optional(),
  address: z.string().optional(),
  qualification: z.string().optional(),
  department: z.string().optional(),
  designation: z.string().optional(),
  joiningDate: z.string().optional(),
  experience: z.string().optional(),
  employmentType: z.enum(['FULL_TIME', 'PART_TIME', 'CONTRACT', 'VISITING']).optional(),
});

function StaffForm({ defaultValues, onSubmit, submitting, submitLabel = 'Create Staff' }) {
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
          <div className="form-field form-field--wide">
            <label>Address</label>
            <input {...register('address')} />
          </div>
        </div>
      </div>

      <div className="form-section">
        <h3>Employment</h3>
        <div className="form-grid">
          <div className="form-field">
            <label>Qualification</label>
            <input {...register('qualification')} />
          </div>
          <div className="form-field">
            <label>Department</label>
            <input {...register('department')} />
          </div>
          <div className="form-field">
            <label>Designation</label>
            <input {...register('designation')} />
          </div>
          <div className="form-field">
            <label>Joining date</label>
            <input type="date" {...register('joiningDate')} />
          </div>
          <div className="form-field">
            <label>Experience (years)</label>
            <input type="number" min="0" step="0.5" {...register('experience')} />
          </div>
          <div className="form-field">
            <label>Employment type</label>
            <select {...register('employmentType')}>
              <option value="FULL_TIME">Full time</option>
              <option value="PART_TIME">Part time</option>
              <option value="CONTRACT">Contract</option>
              <option value="VISITING">Visiting</option>
            </select>
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

export default StaffForm;
