<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreCourseRequest;
use App\Http\Requests\UpdateCourseRequest;
use App\Http\Resources\CourseResource;
use App\Models\Course;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Str;

class CourseController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        abort_unless($request->user()->hasAnyRole(['instructor', 'admin']), 403);
        $query = Course::query()->with(['instructor:id,name', 'category']);
        if (! $request->user()->hasRole('admin')) {
            $query->where('instructor_id', $request->user()->id);
        }

        return CourseResource::collection($query->latest()->paginate(15));
    }

    public function store(StoreCourseRequest $request): CourseResource
    {
        $data = $request->validated();
        $data['instructor_id'] = $request->user()->id;
        $data['slug'] = $this->uniqueSlug($data['title']);
        $data['currency'] = 'USD';
        $data['price'] = $data['type'] === 'free' ? 0 : $data['price'];
        $course = Course::create($data);

        return new CourseResource($course->load(['instructor:id,name', 'category']));
    }

    public function update(UpdateCourseRequest $request, Course $course): CourseResource
    {
        $data = $request->validated();
        if (isset($data['title']) && $data['title'] !== $course->title) {
            $data['slug'] = $this->uniqueSlug($data['title'], $course->id);
        }
        if (($data['type'] ?? $course->type) === 'free') {
            $data['price'] = 0;
        }
        $course->update($data);

        return new CourseResource($course->fresh(['instructor:id,name', 'category']));
    }

    public function destroy(Course $course): JsonResponse
    {
        Gate::authorize('delete', $course);
        $course->delete();

        return response()->json(status: 204);
    }

    public function submit(Course $course): CourseResource
    {
        Gate::authorize('submit', $course);
        $course->update(['status' => 'pending_review', 'rejection_reason' => null]);

        return new CourseResource($course->fresh(['instructor:id,name', 'category']));
    }

    private function uniqueSlug(string $title, ?int $ignoreId = null): string
    {
        $base = Str::slug($title) ?: 'course';
        $slug = $base;
        $counter = 2;
        while (Course::where('slug', $slug)->when($ignoreId, fn ($query) => $query->whereKeyNot($ignoreId))->exists()) {
            $slug = "{$base}-{$counter}";
            $counter++;
        }

        return $slug;
    }
}
