<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

class RolePermissionSeeder extends Seeder
{
    public function run(): void
    {
        app(PermissionRegistrar::class)->forgetCachedPermissions();

        $permissions = [
            'courses.create', 'courses.update.own', 'courses.submit', 'courses.moderate',
            'categories.manage', 'instructors.approve', 'users.manage', 'reports.view',
        ];

        foreach ($permissions as $permission) {
            Permission::findOrCreate($permission, 'web');
        }

        Role::findOrCreate('student', 'web');
        Role::findOrCreate('instructor', 'web')->syncPermissions([
            'courses.create', 'courses.update.own', 'courses.submit',
        ]);
        Role::findOrCreate('admin', 'web')->syncPermissions($permissions);
    }
}
