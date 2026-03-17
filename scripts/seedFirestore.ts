// scripts/seedFirestore.ts
import { db } from '../src/lib/firebase';
import { doc, writeBatch, collection, Timestamp } from 'firebase/firestore';
import { 
    MOCK_ROLES, 
    MOCK_PERMISSIONS, 
    MOCK_ROLE_PERMISSIONS,
    MOCK_DEPARTMENTS 
} from '../src/mocks/mockUsers';

async function seed() {
    console.log('Starting seed...');
    const batch = writeBatch(db);
    const now = Timestamp.now();

    // 1. Roles
    console.log('Seeding roles...');
    MOCK_ROLES.forEach(role => {
        const ref = doc(db, 'roles', role.id);
        batch.set(ref, {
            role_code: role.role_code,
            name: role.name
        });
    });

    // 2. Permissions
    console.log('Seeding permissions...');
    MOCK_PERMISSIONS.forEach(perm => {
        const ref = doc(db, 'permissions', perm.id);
        batch.set(ref, {
            perm_code: perm.perm_code,
            name: perm.name
        });
    });

    // 3. Role-Permissions mapping
    console.log('Seeding role_permissions...');
    MOCK_ROLE_PERMISSIONS.forEach((rp, index) => {
        // Use a composite ID or let Firestore generate one
        const ref = doc(collection(db, 'role_permissions'));
        batch.set(ref, {
            role_id: rp.role_id,
            permission_id: rp.permission_id,
            created_at: now
        });
    });

    // 4. Departments
    console.log('Seeding departments...');
    MOCK_DEPARTMENTS.forEach(dept => {
        const ref = doc(db, 'departments', dept.id.toString());
        batch.set(ref, {
            name: dept.name,
            parent_id: dept.parent_id,
            org_path: dept.org_path
        });
    });

    await batch.commit();
    console.log('Seed completed successfully!');
}

seed().catch(err => {
    console.error('Seed failed:', err);
});
