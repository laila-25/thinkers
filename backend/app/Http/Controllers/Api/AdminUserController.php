<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\AdminAccessUpdateRequest;
use App\Http\Requests\AdminUserIndexRequest;
use App\Http\Resources\AdminUserResource;
use App\Models\User;
use App\Services\AdminAuditService;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\DB;

class AdminUserController extends Controller
{
    public function index(AdminUserIndexRequest $request): AnonymousResourceCollection
    {
        $query = User::query()->with('roles:id,name')->withCount(['courses', 'enrollments', 'aiConversations']);
        $query->when($request->validated('search'), fn ($query, $search) => $query->where(fn ($query) => $query->where('name', 'like', "%{$search}%")->orWhere('email', 'like', "%{$search}%")));
        $query->when($request->validated('role'), fn ($query, $role) => $query->role($role));
        $query->when($request->validated('verification'), fn ($query, $status) => $status === 'verified' ? $query->whereNotNull('email_verified_at') : $query->whereNull('email_verified_at'));

        return AdminUserResource::collection($query->latest()->paginate($request->integer('per_page', 20))->withQueryString());
    }

    public function show(Request $request, User $user): AdminUserResource
    {
        abort_unless($request->user()->can('users.manage'), 403);

        return new AdminUserResource($user->load('roles:id,name')->loadCount(['courses', 'enrollments', 'aiConversations']));
    }

    public function updateAdminAccess(AdminAccessUpdateRequest $request, User $user, AdminAuditService $audit): AdminUserResource
    {
        abort_if($request->user()->is($user), 422, 'You cannot change your own administrator access.');

        DB::transaction(function () use ($request, $user): void {
            $lockedUser = User::query()->lockForUpdate()->findOrFail($user->id);
            $grantAccess = $request->boolean('is_admin');

            if ($grantAccess) {
                $lockedUser->assignRole('admin');

                return;
            }

            abort_if(
                $lockedUser->hasRole('admin') && User::role('admin')->lockForUpdate()->count() <= 1,
                422,
                'The last administrator cannot be demoted.'
            );

            $lockedUser->removeRole('admin');
            if (! $lockedUser->roles()->exists()) {
                $lockedUser->assignRole('student');
            }
        });
        $audit->record($request, $request->boolean('is_admin') ? 'admin.granted' : 'admin.revoked', $user);

        return new AdminUserResource($user->fresh()->load('roles:id,name')->loadCount(['courses', 'enrollments', 'aiConversations']));
    }
}
