<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\ModerateReviewRequest;
use App\Http\Resources\ReviewModerationResource;
use App\Models\Course;
use App\Models\Review;
use App\Services\ReviewService;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\Gate;

class ReviewModerationController extends Controller
{
    public function course(Course $course): AnonymousResourceCollection
    {
        Gate::authorize('viewCourse', [Review::class, $course]);
        return ReviewModerationResource::collection($course->reviews()->with(['user:id,name', 'course:id,title,slug'])->latest()->paginate(20));
    }

    public function index(Request $request): AnonymousResourceCollection
    {
        abort_unless($request->user()->hasRole('admin'), 403);
        return ReviewModerationResource::collection(Review::with(['user:id,name', 'course:id,title,slug'])->latest()->paginate(30));
    }

    public function update(ModerateReviewRequest $request, Review $review, ReviewService $service): ReviewModerationResource
    {
        return new ReviewModerationResource($service->moderate($review, $request->validated('status')));
    }
}
