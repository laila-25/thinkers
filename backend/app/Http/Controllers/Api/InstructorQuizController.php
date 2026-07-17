<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\QuestionRequest;
use App\Http\Requests\QuizSettingsRequest;
use App\Http\Requests\ReorderQuestionsRequest;
use App\Http\Resources\InstructorQuizResource;
use App\Http\Resources\StudentQuizResource;
use App\Models\Lesson;
use App\Models\Question;
use App\Models\Quiz;
use App\Services\QuizManagementService;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Gate;

class InstructorQuizController extends Controller
{
    public function show(Lesson $lesson): InstructorQuizResource
    {
        abort_unless($lesson->quiz, 404);
        Gate::authorize('manage', $lesson->quiz);
        return new InstructorQuizResource($lesson->quiz->load('questions.answers'));
    }

    public function store(QuizSettingsRequest $request, Lesson $lesson, QuizManagementService $service): InstructorQuizResource
    {
        return new InstructorQuizResource($service->create($lesson, $request->validated())->load('questions.answers'));
    }

    public function update(QuizSettingsRequest $request, Quiz $quiz, QuizManagementService $service): InstructorQuizResource
    {
        return new InstructorQuizResource($service->update($quiz, $request->validated()));
    }

    public function storeQuestion(QuestionRequest $request, Quiz $quiz, QuizManagementService $service): InstructorQuizResource
    {
        $service->saveQuestion($quiz, $request->validated());
        return new InstructorQuizResource($quiz->fresh('questions.answers'));
    }

    public function updateQuestion(QuestionRequest $request, Question $question, QuizManagementService $service): InstructorQuizResource
    {
        $service->saveQuestion($question->quiz, $request->validated(), $question);
        return new InstructorQuizResource($question->quiz->fresh('questions.answers'));
    }

    public function destroyQuestion(Question $question, QuizManagementService $service): JsonResponse
    {
        Gate::authorize('manage', $question->quiz);
        $service->deleteQuestion($question);
        return response()->json(status: 204);
    }

    public function reorder(ReorderQuestionsRequest $request, Quiz $quiz, QuizManagementService $service): InstructorQuizResource
    {
        return new InstructorQuizResource($service->reorder($quiz, $request->validated('question_ids')));
    }

    public function publish(Quiz $quiz, QuizManagementService $service): InstructorQuizResource
    {
        Gate::authorize('manage', $quiz);
        return new InstructorQuizResource($service->publish($quiz));
    }

    public function preview(Quiz $quiz): StudentQuizResource
    {
        Gate::authorize('manage', $quiz);
        return new StudentQuizResource($quiz->load('questions.answers'));
    }
}
