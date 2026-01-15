# PBI-16 Testing & Verification Guide

## Quick Start Verification

### 1. Build Verification
```powershell
# Verify the build was successful
cd frontend
npm run build
# Should see: ✓ built in X.XXs
```

### 2. Local Development Server
```powershell
# Start dev server
npm run dev
# Should see: Local: http://localhost:5173/
```

### 3. Manual Testing Steps

#### Test 3.1: Secretario Can Access Appointments
1. Navigate to `http://localhost:5173/login`
2. Enter credentials:
   - Email: `secretario@test.com`
   - Password: `test123`
3. After login, you should see:
   - ✅ Header with "Agendamiento" nav item (with calendar icon)
   - ✅ NO "Historiales" link
   - ✅ NO "Mis Pacientes" link
4. Click "Agendamiento"
5. Verify you can see:
   - ✅ "Agendamiento de Citas" title
   - ✅ "Nueva Cita" button
   - ✅ Patient list with name, cedula, phone
   - ✅ Doctor list with names and specializations
   - ✅ Appointments table with existing appointments
   - ✅ Security note about data isolation

#### Test 3.2: Secretario Blocked from Clinical Records
1. While logged in as Secretario
2. Try to navigate directly to:
   - `http://localhost:5173/historiales`
   - `http://localhost:5173/medico/pacientes/1/historial`
3. Verify:
   - ✅ Redirected to Forbidden403Page
   - ✅ See 403 error message with lock icon
   - ✅ See explanation of restrictions
   - ✅ See "Ir al Inicio" and "Ir a Agendamiento" buttons
   - ✅ See "Nota PBI-16 (Seguridad)" section

#### Test 3.3: Create New Appointment
1. On Appointments page, click "Nueva Cita"
2. Form should appear with fields:
   - Patient (dropdown)
   - Doctor (dropdown)
   - Date (date picker)
   - Time (time picker)
3. Fill in all fields:
   - Patient: "Juan Pérez"
   - Doctor: "Dr. Roberto García"
   - Date: "2026-02-15"
   - Time: "10:30"
4. Click "Crear Cita"
5. Verify:
   - ✅ New appointment appears in table
   - ✅ Table shows correct data
   - ✅ Form closes after creation

#### Test 3.4: Edit Appointment
1. In appointments table, click "Editar" on any appointment
2. Form should appear with existing data populated
3. Change one field (e.g., time to "11:00")
4. Click "Actualizar Cita"
5. Verify:
   - ✅ Table updates with new data
   - ✅ Form closes

#### Test 3.5: Delete Appointment
1. In appointments table, click "Eliminar" on any appointment
2. Verify:
   - ✅ Appointment is removed from table immediately
   - ✅ No confirmation dialog (current behavior)

#### Test 3.6: Form Validation
1. Click "Nueva Cita"
2. Try to submit without filling fields
3. Click "Crear Cita" with empty form
4. Verify:
   - ✅ Error message appears: "Por favor completa todos los campos"
   - ✅ Appointment is not created

#### Test 3.7: Other Roles Still Have Access
1. Login as Doctor:
   - Navigate to `/medico/pacientes`
   - Should work normally ✅
   - Should see patient list and history access
2. Login as Admin:
   - Navigate to `/admin/usuarios`
   - Should work normally ✅
   - Should NOT see `/secretario/citas` in header

#### Test 3.8: Responsive Design
1. On Appointments page, open DevTools (F12)
2. Toggle device toolbar (Ctrl+Shift+M)
3. Test on mobile (375px width):
   - ✅ Form grid stacks vertically
   - ✅ Buttons stack vertically
   - ✅ Table scrolls horizontally
   - ✅ No overflow issues
4. Test on tablet (768px):
   - ✅ Layout is readable
   - ✅ Form has 2 columns
5. Test on desktop (1920px):
   - ✅ Form has 4 columns
   - ✅ Table is fully visible

## Code Review Checklist

### TypeScript & Type Safety
- ✅ No `any` types used
- ✅ All props properly typed
- ✅ All state properly typed
- ✅ Event handlers properly typed
- ✅ No TypeScript compilation errors

### Component Structure
- ✅ React functional components
- ✅ Proper use of hooks (useState, useEffect)
- ✅ No prop drilling (uses Context if needed)
- ✅ Components are reusable and modular
- ✅ Error boundaries could be added (optional enhancement)

### Security
- ✅ Secretario cannot access historial routes
- ✅ Patient data is demographic only
- ✅ No sensitive medical data exposed
- ✅ Role checking at route level
- ✅ 403 page provides clear feedback

### Styling
- ✅ Uses CSS custom properties (var--)
- ✅ Responsive design implemented
- ✅ SCSS modules for scope isolation
- ✅ Consistent with design tokens
- ✅ No hardcoded colors (uses vars)

### Performance
- ✅ No unnecessary re-renders
- ✅ Event handlers properly bound
- ✅ Data is mocked (no API latency)
- ✅ CSS is minified in production
- ✅ JS is properly bundled

### Accessibility
- ✅ Form labels associated with inputs (htmlFor)
- ✅ Select inputs are semantic
- ✅ Icons have aria-hidden where needed
- ✅ Buttons have descriptive text
- ✅ Error messages are visible
- ✅ Color not sole indicator of status

## Browser Compatibility Testing

### Desktop Browsers
- [ ] Chrome 90+ (Latest)
- [ ] Firefox 88+ (Latest)
- [ ] Safari 14+ (Latest)
- [ ] Edge 90+ (Latest)

### Mobile Browsers
- [ ] Chrome Mobile
- [ ] Safari iOS
- [ ] Firefox Mobile

### Testing Checklist
- [ ] Can login as Secretario
- [ ] Appointments page loads
- [ ] Create appointment works
- [ ] Edit appointment works
- [ ] Delete appointment works
- [ ] Access denied to historial
- [ ] Forms validate correctly
- [ ] Layout is responsive
- [ ] No console errors
- [ ] Performance is good (< 1s load)

## Common Issues & Solutions

### Issue: "Can't find stylesheet to import"
**Solution:** Check SCSS import paths use `@use` not `@import`
```scss
@use '../../../styles/tokens/_index' as *;
```

### Issue: "Undefined variable"
**Solution:** Make sure using `var(--name)` for CSS custom properties
```scss
border-color: var(--border-color);  // ✅ Correct
border-color: $color-neutral-200;  // ❌ Wrong (variable doesn't exist)
```

### Issue: 403 Page not showing
**Solution:** Verify ProtectedRoute has historial blocking logic:
```typescript
if (user?.role === 'Secretario' && 
    (location.pathname.includes('/historial') || 
     location.pathname === '/historiales')) {
  return <Forbidden403Page />;
}
```

### Issue: Secretario sees historial links in navigation
**Solution:** Check Header.tsx has updated nav items for Secretario:
```typescript
case 'Secretario':
  items.push({
    id: 'appointments',
    icon: <Calendar size={18} />,
    label: 'Agendamiento',
    path: '/secretario/citas',
  });
  break;
```

## Documentation Files

Reference these files for detailed information:
1. **PBI-16-IMPLEMENTATION.md** - Comprehensive technical documentation
2. **PBI-16-IMPLEMENTATION-SUMMARY.md** - High-level overview and checklist
3. **BACKEND_PBI_14_16_17.md** - Backend requirements (when available)

## Performance Metrics

**Expected Build Size:**
```
CSS: ~58 KB (gzip: ~10 KB)
JS: ~319 KB (gzip: ~97 KB)
HTML: ~1 KB (gzip: ~0.5 KB)
```

**Expected Performance:**
- First load: < 2 seconds (with network)
- Interaction (click): < 100ms
- Form submission: Instant (mock data)

## Sign-Off Checklist

After testing, verify:

- [ ] All test cases pass
- [ ] No console errors
- [ ] No TypeScript errors
- [ ] Build successful (< 5 seconds)
- [ ] Responsive on mobile/tablet/desktop
- [ ] Secretario cannot access historial
- [ ] 403 page shows correctly
- [ ] Appointments CRUD works
- [ ] Other roles unaffected
- [ ] Documentation is complete

## Next Phase: Backend Integration

Once testing is complete, backend team should:
1. Create `/api/secretary/patients` endpoint (demographic only)
2. Create `/api/secretary/doctors` endpoint
3. Create `/api/secretary/appointments` CRUD endpoints
4. Implement audit logging (PBI-17)
5. Add error handling for API failures

See `BACKEND_PBI_14_16_17.md` for API specifications.

---

**Last Updated:** Today  
**Version:** 1.0  
**Status:** Ready for Testing
