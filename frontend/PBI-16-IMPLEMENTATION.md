# PBI-16 Implementation: Secretary Appointment Management

## Overview
This implementation provides Secretarios (Secretaries) with a secure appointment scheduling system while preventing access to sensitive clinical records.

## Frontend Implementation

### 1. Routes & Role Protection

**New Route Added:**
```
/secretario/citas → AppointmentSchedulingPage
```

**Protection Implemented:**
- Route requires `requiredRole="Secretario"` via ProtectedRoute component
- ProtectedRoute blocks access to any `/historial/*` or `/historiales` paths for Secretarios
- Returns 403 Forbidden page when attempting access

### 2. AppointmentSchedulingPage Component

**Location:** `src/design-system/pages/AppointmentScheduling/AppointmentSchedulingPage.tsx`

**Features:**
- ✅ View all appointments (mock data)
- ✅ Create new appointments (date, time, doctor, patient selection)
- ✅ Edit existing appointments
- ✅ Delete appointments
- ✅ Patient list with demographic data only (name, cedula, phone)
- ✅ Doctor list with specialization
- ✅ Appointment status tracking (scheduled, completed, cancelled)
- ✅ Responsive table with mobile support
- ✅ Security note footer reminding of data isolation

**Styling:** SCSS Modules with design tokens
- Form section with grid layout
- Table with hover effects and status badges
- Mobile-responsive design
- Error alerts with proper color coding

### 3. Forbidden403Page Component

**Location:** `src/design-system/pages/Forbidden403/Forbidden403Page.tsx`

**Purpose:**
- Displays when Secretario attempts to access historial routes
- Provides explanation of access restrictions
- Links to allowed sections (Inicio, Agendamiento)
- References PBI-16 security policy

### 4. Header Updates

**File:** `src/design-system/organisms/Header/Header.tsx`

**Changes:**
- Added Calendar icon import
- Updated Secretario nav item:
  - Old: `/historiales` (Historiales)
  - New: `/secretario/citas` (Agendamiento)
- Maintains consistent role-based color styling (tertiary = Secretario)

### 5. ProtectedRoute Enhancements

**File:** `src/components/ProtectedRoute.tsx`

**Security Checks Added:**
```typescript
// PBI-16: Secretario cannot access clinical records
if (user?.role === 'Secretario' && (location.pathname.includes('/historial') || location.pathname === '/historiales')) {
  return <Forbidden403Page />;
}
```

**Flow:**
1. Check if authenticated
2. Block Secretarios from historial paths → Show 403
3. Check role-based access
4. Render children if all checks pass

## Data Security (PBI-16)

### What Secretarios Can Access:
- ✅ Appointment scheduling interface
- ✅ Patient demographic data (name, cedula, phone)
- ✅ Doctor information
- ✅ Appointment CRUD operations

### What Secretarios CANNOT Access:
- ❌ Clinical records (`/historial/*`)
- ❌ Patient medical history
- ❌ Consultation details
- ❌ Medications list
- ❌ Laboratory results
- ❌ Any path containing `/historial`

### Storage Isolation:
- Patient appointment data: Mock (frontend state only)
- NO clinical data stored in localStorage for Secretarios
- Token and user info only in localStorage (as per PBI-14)

## Role Color Coding

**Secretario Role:**
- Design Token: `secondary` color (for appointment-related items)
- Header NavItem Color: `tertiary` (blue/purple accent)
- Alert/Warning Colors: Consistent with role theme

## Acceptance Criteria

- ✅ Secretario can access `/secretario/citas`
- ✅ Secretario sees patient list with name + phone only
- ✅ Secretario cannot access any `/historial*` paths
- ✅ Secretario gets 403 page if attempting to access clinical records
- ✅ Navigation menu shows "Agendamiento" instead of "Historiales" for Secretario
- ✅ No links to clinical records visible in Secretary UI
- ✅ Header color reflects Secretary role
- ✅ All routes properly protected by ProtectedRoute component

## Type Safety

**Appointment TypeScript Types:**
```typescript
type Patient = {
  id: string;
  name: string;
  cedula: string;
  phone: string;  // Demographic only, no medical fields
};

type Doctor = {
  id: string;
  name: string;
  specialization: string;
};

type Appointment = {
  id: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  date: string;
  time: string;
  status: 'scheduled' | 'completed' | 'cancelled';
};

type AppointmentForm = {
  patientId: string;
  doctorId: string;
  date: string;
  time: string;
};
```

## Testing Scenarios

1. **Scenario: Login as Secretario**
   - Navigate to `/secretario/citas`
   - Should display AppointmentSchedulingPage
   - Should see patient list, doctor list, appointments table

2. **Scenario: Secretario tries to access `/historial`**
   - Navigate to `/historiales` or `/medico/pacientes/1/historial`
   - Should display Forbidden403Page
   - Should have buttons to return to Inicio or Agendamiento

3. **Scenario: Create Appointment**
   - Select patient, doctor, date, time
   - Click "Crear Cita"
   - Appointment should appear in table

4. **Scenario: Edit Appointment**
   - Click "Editar" on any appointment
   - Form should populate with existing data
   - Should update appointment in table

5. **Scenario: Delete Appointment**
   - Click "Eliminar" on any appointment
   - Appointment should be removed from table

## Files Created/Modified

### Created:
- `src/design-system/pages/AppointmentScheduling/AppointmentSchedulingPage.tsx`
- `src/design-system/pages/AppointmentScheduling/AppointmentSchedulingPage.module.scss`
- `src/design-system/pages/Forbidden403/Forbidden403Page.tsx`
- `src/design-system/pages/Forbidden403/Forbidden403Page.module.scss`

### Modified:
- `src/App.tsx` (added Secretario route + import)
- `src/components/ProtectedRoute.tsx` (added historial access block for Secretarios)
- `src/design-system/organisms/Header/Header.tsx` (updated Secretario nav item)

## Future Enhancements (Backend Integration)

When integrating with backend (PBI-16 backend requirements):
1. Replace mock data with API calls:
   - `GET /api/secretary/appointments`
   - `GET /api/secretary/patients` (demographic data only)
   - `GET /api/secretary/doctors`
   - `POST /api/secretary/appointments`
   - `PUT /api/secretary/appointments/:id`
   - `DELETE /api/secretary/appointments/:id`

2. Add loading states during API calls
3. Implement error handling for API failures
4. Add form validation feedback
5. Implement appointment confirmation/cancellation workflows

## PBI-16 Security Policy Summary

**The Secretario role exists to:**
- Schedule appointments efficiently
- Access basic patient demographic information
- Manage doctor availability

**The Secretario role MUST NOT:**
- Access any clinical or medical information
- Modify patient medical records
- View consultation history
- Access medication or lab data
- See sensitive patient information

This is enforced through:
1. Route-level access control (ProtectedRoute)
2. Role-based navigation (Header)
3. Explicit 403 page for unauthorized access attempts
4. Limited data in patient list (demographic only)

---

**Status:** ✅ READY FOR TESTING  
**PBI:** PBI-16  
**Feature:** Secretary Appointment Management  
**Security Level:** Role-Protected with 403 Fallback
