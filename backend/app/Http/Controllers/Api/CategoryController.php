<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\CategoryRequest;
use App\Http\Resources\CategoryResource;
use App\Models\Category;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Str;

class CategoryController extends Controller
{
    public function index(): AnonymousResourceCollection
    {
        abort_unless(request()->user()->can('categories.manage'), 403);

        return CategoryResource::collection(Category::with('children')->orderBy('sort_order')->orderBy('name')->get());
    }

    public function store(CategoryRequest $request): CategoryResource
    {
        $data = $request->validated();
        $data['slug'] = $this->uniqueSlug($data['name']);

        return new CategoryResource(Category::create($data));
    }

    public function update(CategoryRequest $request, Category $category): CategoryResource
    {
        $data = $request->validated();
        if ($data['name'] !== $category->name) {
            $data['slug'] = $this->uniqueSlug($data['name'], $category->id);
        }
        $category->update($data);

        return new CategoryResource($category->fresh('children'));
    }

    public function destroy(Category $category): JsonResponse
    {
        abort_unless(request()->user()->can('categories.manage'), 403);
        abort_if($category->children()->exists() || $category->courses()->exists(), 422, 'Categories with children or courses cannot be deleted.');
        $category->delete();

        return response()->json(status: 204);
    }

    private function uniqueSlug(string $name, ?int $ignoreId = null): string
    {
        $base = Str::slug($name) ?: 'category';
        $slug = $base;
        $counter = 2;
        while (Category::where('slug', $slug)->when($ignoreId, fn ($query) => $query->whereKeyNot($ignoreId))->exists()) {
            $slug = "{$base}-{$counter}";
            $counter++;
        }

        return $slug;
    }
}
