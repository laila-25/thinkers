<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\SubmitQuizAttemptRequest;
use App\Http\Resources\QuizAttemptResource;
use App\Http\Resources\StudentQuizResource;
use App\Models\Lesson;
use App\Models\Quiz;
use App\Models\QuizAttempt;
use App\Services\QuizAttemptService;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\Gate;

class StudentQuizController extends Controller
{
    public function show(Lesson $lesson): StudentQuizResource
    {
        abort_unless($lesson->content_type === 'quiz' && $lesson->quiz?->status === 'published', 404);
        Gate::authorize('view', $lesson->quiz);
        return new StudentQuizResource($lesson->quiz->load('questions.answers'));
    }

    public function start(Request $request, Quiz $quiz, QuizAttemptService $service): QuizAttemptResource
    {
        $attempt = $service->start($request->user(), $quiz);
        return new QuizAttemptResource($attempt->load('quiz.questions.answers'));
    }

    public function index(Request $request, Quiz $quiz): AnonymousResourceCollection
    {
        Gate::authorize('view', $quiz);
        return QuizAttemptResource::collection($quiz->attempts()->where('user_id', $request->user()->id)->with('quiz.questions.answers')->latest('attempt_number')->get());
    }

    public function showAttempt(QuizAttempt $attempt): QuizAttemptResource
    {
        Gate::authorize('view', $attempt);
        return new QuizAttemptResource($attempt->load('quiz.questions.answers'));
    }

    public function submit(SubmitQuizAttemptRequest $request, QuizAttempt $attempt, QuizAttemptService $service): QuizAttemptResource
    {
        return new QuizAttemptResource($service->submit($attempt, $request->validated('answers')));
    }
}
