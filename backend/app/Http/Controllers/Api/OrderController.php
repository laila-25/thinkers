<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreOrderRequest;
use App\Http\Resources\CourseResource;
use App\Http\Resources\OrderResource;
use App\Models\Course;
use App\Models\Order;
use App\Services\OrderService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\Gate;

class OrderController extends Controller
{
    public function course(Course $course): CourseResource
    {
        abort_unless(request()->user()->hasRole('student'), 403);
        abort_unless($course->status === 'published' && $course->published_at, 404);

        return new CourseResource($course->load('instructor:id,name'));
    }

    public function index(): AnonymousResourceCollection
    {
        Gate::authorize('viewAny', Order::class);
        $user = request()->user();
        $orders = Order::query()
            ->when(! $user->hasRole('admin'), fn ($query) => $query->where('user_id', $user->id))
            ->when($user->hasRole('admin') && request()->filled('status'), fn ($query) => $query->where('status', request()->string('status')->value()))
            ->when(request()->filled('course_id'), fn ($query) => $query->where('course_id', request()->integer('course_id')))
            ->with(['course:id,title', 'user:id,name,email'])
            ->latest()
            ->paginate(15);

        if ($user->hasRole('student')) {
            $enrollments = $user->enrollments()
                ->whereIn('course_id', $orders->getCollection()->pluck('course_id'))
                ->whereNot('status', 'cancelled')
                ->get(['id', 'course_id'])
                ->keyBy('course_id');
            $orders->getCollection()->each(fn (Order $order) => $order->setAttribute(
                'enrollment_id',
                $enrollments->get($order->course_id)?->id,
            ));
        }

        return OrderResource::collection($orders);
    }

    public function store(StoreOrderRequest $request, OrderService $service): JsonResponse
    {
        $course = Course::query()->findOrFail($request->integer('course_id'));
        $order = $service->createPending($request->user(), $course);

        return (new OrderResource($order->load('course:id,title')))
            ->response()
            ->setStatusCode(201);
    }

    public function show(Order $order): OrderResource
    {
        Gate::authorize('view', $order);

        $order->load('course:id,title');
        if (request()->user()->hasRole('student')) {
            $order->setAttribute('enrollment_id', request()->user()->enrollments()
                ->where('course_id', $order->course_id)
                ->whereNot('status', 'cancelled')
                ->value('id'));
        }

        return new OrderResource($order);
    }
}
