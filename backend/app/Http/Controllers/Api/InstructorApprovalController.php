<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Notifications\PlatformNotification;
use App\Services\AdminAuditService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\ResourceCollection;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class InstructorApprovalController extends Controller
{
    public function index(Request $request): ResourceCollection
    {
        abort_unless($request->user()->can('instructors.approve'), 403);
        $status = $request->string('status')->value();
        $instructors = User::query()
            ->whereNotNull('instructor_status')
            ->when($status, fn ($query) => $query->where('instructor_status', $status))
            ->latest()->paginate(20);

        return new class($instructors) extends ResourceCollection
        {
            public function toArray($request): array
            {
                return $this->collection->map(fn (User $user) => [
                    'id' => $user->id, 'name' => $user->name, 'email' => $user->email,
                    'instructor_status' => $user->instructor_status,
                    'instructor_rejection_reason' => $user->instructor_rejection_reason,
                    'created_at' => $user->created_at,
                ])->all();
            }
        };
    }

    public function apply(Request $request): JsonResponse
    {
        $user = $request->user();
        abort_if($user->hasRole('admin'), 422, 'Administrators cannot apply as instructors.');
        abort_if($user->instructor_status === 'pending', 422, 'Your instructor application is already pending.');
        abort_if($user->instructor_status === 'approved', 422, 'Your instructor account is already approved.');

        $user->update([
            'instructor_status' => 'pending',
            'instructor_approved_at' => null,
            'instructor_approved_by' => null,
            'instructor_rejection_reason' => null,
        ]);
        User::role('admin')->get()->filter(fn (User $admin) => $admin->allowsNotification('platform_alerts'))
            ->each(fn (User $admin) => $admin->notify(new PlatformNotification(
                'instructor_application', 'New instructor application', "{$user->name} submitted an instructor application.",
                '/admin/instructors', 'Review application', 'instructor',
            )));

        return response()->json([
            'message' => 'Instructor application submitted successfully.',
            'user' => $user->fresh()->load('roles:id,name'),
        ]);
    }

    public function update(Request $request, User $user, AdminAuditService $audit): JsonResponse
    {
        abort_unless($request->user()->can('instructors.approve'), 403);
        abort_unless($user->instructor_status !== null, 422, 'The selected user has not applied as an instructor.');
        $data = $request->validate([
            'status' => ['required', Rule::in(['pending', 'approved', 'rejected'])],
            'reason' => ['required_if:status,rejected', 'nullable', 'string', 'max:255'],
        ]);

        DB::transaction(function () use ($data, $request, $user): void {
            $user->update([
                'instructor_status' => $data['status'],
                'instructor_approved_at' => $data['status'] === 'approved' ? now() : null,
                'instructor_approved_by' => $request->user()->id,
                'instructor_rejection_reason' => $data['status'] === 'rejected' ? $data['reason'] : null,
            ]);

            if ($data['status'] === 'approved') {
                $user->assignRole('instructor');
            } else {
                $user->removeRole('instructor');
                if (! $user->hasRole('student')) {
                    $user->assignRole('student');
                }
            }
        });
        $audit->record($request, 'instructor.'.$data['status'], $user, [
            'reason' => $data['status'] === 'rejected' ? $data['reason'] : null,
        ]);

        return response()->json([
            'message' => 'Instructor status updated successfully.',
            'user' => $user->fresh()->load('roles:id,name'),
        ]);
    }
}
