<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\AdminCourseIndexRequest;
use App\Http\Resources\CourseResource;
use App\Models\Course;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class AdminCourseController extends Controller
{
    public function index(AdminCourseIndexRequest $request): AnonymousResourceCollection
    {
        $query = Course::query()->with(['instructor:id,name,email', 'category'])
            ->withCount(['enrollments', 'reviews as review_count'])
            ->withAvg('reviews', 'rating');
        $query->when($request->validated('search'), fn ($query, $search) => $query->where(fn ($query) => $query->where('title', 'like', "%{$search}%")->orWhere('description', 'like', "%{$search}%")));
        $query->when($request->validated('status'), fn ($query, $status) => $query->where('status', $status));
        $query->when($request->validated('category_id'), fn ($query, $categoryId) => $query->where('category_id', $categoryId));

        return CourseResource::collection($query->latest()->paginate($request->integer('per_page', 20))->withQueryString());
    }
}
