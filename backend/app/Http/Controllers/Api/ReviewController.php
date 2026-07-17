<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreReviewRequest;
use App\Http\Requests\UpdateReviewRequest;
use App\Http\Resources\ReviewResource;
use App\Models\Course;
use App\Models\Review;
use App\Services\ReviewService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\Gate;

class ReviewController extends Controller
{
    public function index(Course $course): AnonymousResourceCollection
    {
        abort_unless($course->status === 'published', 404);
        return ReviewResource::collection($course->reviews()->published()->with('user:id,name')->latest()->paginate(10));
    }

    public function statistics(Course $course, ReviewService $service): JsonResponse
    {
        abort_unless($course->status === 'published', 404);
        return response()->json(['data' => $service->statistics($course)]);
    }

    public function own(Request $request, Course $course): JsonResponse|ReviewResource
    {
        $review = $course->reviews()->where('user_id', $request->user()->id)->with('user:id,name')->first();
        return $review ? new ReviewResource($review) : response()->json(['data' => null]);
    }

    public function store(StoreReviewRequest $request, Course $course, ReviewService $service): ReviewResource
    {
        return new ReviewResource($service->create($request->user(), $course, $request->validated()));
    }

    public function update(UpdateReviewRequest $request, Review $review, ReviewService $service): ReviewResource
    {
        return new ReviewResource($service->update($review, $request->validated()));
    }

    public function destroy(Review $review, ReviewService $service): JsonResponse
    {
        Gate::authorize('delete', $review);
        $service->delete($review);
        return response()->json(status: 204);
    }
}
