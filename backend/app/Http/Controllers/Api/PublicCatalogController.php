<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\CategoryResource;
use App\Http\Resources\CourseResource;
use App\Models\Category;
use App\Models\Course;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class PublicCatalogController extends Controller
{
    public function categories(): AnonymousResourceCollection
    {
        $categories = Category::query()
            ->whereNull('parent_id')
            ->where('is_active', true)
            ->with(['children' => fn ($query) => $query->where('is_active', true)])
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get();

        return CategoryResource::collection($categories);
    }

    public function index(Request $request): AnonymousResourceCollection
    {
        $query = Course::query()->published()
            ->with(['instructor:id,name', 'category:id,parent_id,name,slug,description,is_active,sort_order'])
            ->withAvg(['reviews as average_rating' => fn ($query) => $query->published()], 'rating')
            ->withCount(['reviews as review_count' => fn ($query) => $query->published()]);

        $query->when($request->string('search')->trim()->value(), function ($query, string $search): void {
            $query->where(function ($query) use ($search): void {
                $query->where('title', 'like', "%{$search}%")
                    ->orWhere('short_description', 'like', "%{$search}%");
            });
        });
        $query->when($request->string('category')->value(), fn ($query, $slug) => $query->whereHas('category', fn ($query) => $query->where('slug', $slug)));
        $query->when($request->string('level')->value(), fn ($query, $level) => $query->where('level', $level));
        $query->when($request->string('type')->value(), fn ($query, $type) => $query->where('type', $type));
        $query->when($request->string('language')->value(), fn ($query, $language) => $query->where('language', $language));

        return CourseResource::collection($query->latest('published_at')->paginate(12)->withQueryString());
    }

    public function show(string $slug): CourseResource
    {
        $course = Course::query()->published()->where('slug', $slug)->with(['instructor:id,name', 'category'])
            ->withAvg(['reviews as average_rating' => fn ($query) => $query->published()], 'rating')
            ->withCount(['reviews as review_count' => fn ($query) => $query->published()])->firstOrFail();

        return new CourseResource($course);
    }
}
