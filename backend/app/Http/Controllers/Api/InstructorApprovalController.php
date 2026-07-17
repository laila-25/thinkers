<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Http\Resources\Json\ResourceCollection;

class InstructorApprovalController extends Controller
{
    public function index(Request $request): ResourceCollection
    {
        abort_unless($request->user()->can('instructors.approve'), 403);
        $status = $request->string('status')->value();
        $instructors = User::role('instructor')
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

        $user->syncRoles('instructor');
        $user->update([
            'instructor_status' => 'pending',
            'instructor_approved_at' => null,
            'instructor_approved_by' => null,
            'instructor_rejection_reason' => null,
        ]);

        return response()->json([
            'message' => 'Instructor application submitted successfully.',
            'user' => $user->fresh()->load('roles:id,name'),
        ]);
    }

    public function update(Request $request, User $user): JsonResponse
    {
        abort_unless($request->user()->can('instructors.approve'), 403);
        abort_unless($user->hasRole('instructor'), 422, 'The selected user is not an instructor.');
        $data = $request->validate([
            'status' => ['required', Rule::in(['pending', 'approved', 'rejected'])],
            'reason' => ['required_if:status,rejected', 'nullable', 'string', 'max:255'],
        ]);

        $user->update([
            'instructor_status' => $data['status'],
            'instructor_approved_at' => $data['status'] === 'approved' ? now() : null,
            'instructor_approved_by' => $request->user()->id,
            'instructor_rejection_reason' => $data['status'] === 'rejected' ? $data['reason'] : null,
        ]);

        return response()->json([
            'message' => 'Instructor status updated successfully.',
            'user' => $user->fresh()->load('roles:id,name'),
        ]);
    }
}
