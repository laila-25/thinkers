<?php

namespace App\Services;

use App\Models\Course;
use App\Models\Enrollment;
use App\Models\Lesson;
use App\Models\Review;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class ReviewService
{
    public function create(User $user, Course $course, array $data): Review
    {
        $this->assertEligible($user, $course);
        if (Review::where('user_id', $user->id)->where('course_id', $course->id)->exists()) {
            throw ValidationException::withMessages(['review' => 'You have already reviewed this course.']);
        }
        return DB::transaction(fn () => Review::create($data + ['user_id' => $user->id, 'course_id' => $course->id, 'status' => 'published']))->load('user:id,name');
    }

    public function update(Review $review, array $data): Review
    {
        abort_unless($review->course->status === 'published', 422, 'Reviews cannot be changed while the course is unpublished.');
        $review->update($data);
        return $review->fresh('user:id,name');
    }

    public function delete(Review $review): void { DB::transaction(fn () => $review->delete()); }
    public function moderate(Review $review, string $status): Review { $review->update(['status' => $status]); return $review->fresh(['user:id,name', 'course:id,title,slug,instructor_id']); }

    public function statistics(Course $course): array
    {
        $query = $course->reviews()->published();
        $summary = (clone $query)->selectRaw('COUNT(*) as total, COALESCE(AVG(rating), 0) as average')->first();
        $counts = (clone $query)->selectRaw('rating, COUNT(*) as total')->groupBy('rating')->pluck('total', 'rating');
        return [
            'average_rating' => round((float) $summary->average, 2), 'review_count' => (int) $summary->total,
            'distribution' => collect([5,4,3,2,1])->mapWithKeys(fn ($rating) => [(string) $rating => (int) ($counts[$rating] ?? 0)])->all(),
        ];
    }

    private function assertEligible(User $user, Course $course): void
    {
        if ($course->status !== 'published') throw ValidationException::withMessages(['course' => 'Only published courses can be reviewed.']);
        $enrollment = Enrollment::where('user_id', $user->id)->where('course_id', $course->id)->whereIn('status', ['active', 'completed'])->first();
        if (! $enrollment) throw ValidationException::withMessages(['course' => 'You must be enrolled in this course to review it.']);
        if (! $enrollment->last_accessed_lesson_id) throw ValidationException::withMessages(['course' => 'Access course lessons before submitting a review.']);
        $total = Lesson::whereHas('section', fn ($query) => $query->where('course_id', $course->id))->where('is_published', true)->count();
        $completed = $enrollment->progress()->where('status', 'completed')->count();
        $percentage = $total > 0 ? ($completed / $total) * 100 : 0;
        if ($percentage < 20) throw ValidationException::withMessages(['course' => 'Complete at least 20% of the course before submitting a review.']);
    }
}
