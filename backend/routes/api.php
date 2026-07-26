<?php

use App\Http\Controllers\Api\AdminCourseController;
use App\Http\Controllers\Api\AdminDashboardController;
use App\Http\Controllers\Api\AdminOperationsController;
use App\Http\Controllers\Api\AdminUserController;
use App\Http\Controllers\Api\AIController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\CertificateController;
use App\Http\Controllers\Api\CourseBuilderController;
use App\Http\Controllers\Api\CourseController;
use App\Http\Controllers\Api\CourseMediaController;
use App\Http\Controllers\Api\CourseModerationController;
use App\Http\Controllers\Api\CoursePlayerController;
use App\Http\Controllers\Api\CurriculumController;
use App\Http\Controllers\Api\EmailVerificationController;
use App\Http\Controllers\Api\EnrollmentController;
use App\Http\Controllers\Api\EnrollmentStatisticsController;
use App\Http\Controllers\Api\GamificationController;
use App\Http\Controllers\Api\InstructorApprovalController;
use App\Http\Controllers\Api\InstructorCurriculumController;
use App\Http\Controllers\Api\InstructorQuizController;
use App\Http\Controllers\Api\LessonContentController;
use App\Http\Controllers\Api\LessonPreviewController;
use App\Http\Controllers\Api\MediaDeliveryController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\OrderController;
use App\Http\Controllers\Api\PasswordResetController;
use App\Http\Controllers\Api\PaymentController;
use App\Http\Controllers\Api\PublicCatalogController;
use App\Http\Controllers\Api\RevenueController;
use App\Http\Controllers\Api\ReviewController;
use App\Http\Controllers\Api\ReviewModerationController;
use App\Http\Controllers\Api\StudentQuizController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::middleware('guest')->group(function () {
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login', [AuthController::class, 'login']);
    Route::post('/forgot-password', [PasswordResetController::class, 'forgot'])->middleware('throttle:5,1')->name('password.email');
    Route::post('/reset-password', [PasswordResetController::class, 'reset'])->middleware('throttle:10,1')->name('password.update');
});
Route::get('/categories', [PublicCatalogController::class, 'categories']);
Route::get('/courses', [PublicCatalogController::class, 'index']);
Route::get('/courses/{slug}', [PublicCatalogController::class, 'show']);
Route::get('/courses/{course}/reviews', [ReviewController::class, 'index']);
Route::get('/courses/{course}/rating', [ReviewController::class, 'statistics']);
Route::get('/preview/lessons/{lesson}', [LessonPreviewController::class, 'show']);
Route::get('/preview/lessons/{lesson}/video', [LessonPreviewController::class, 'video']);
Route::get('/certificates/verify/{code}', [CertificateController::class, 'verify'])->middleware('throttle:60,1');
Route::post('/payment/webhook/stripe', [PaymentController::class, 'stripeWebhook'])
    ->middleware('throttle:120,1');

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/user', fn (Request $request) => $request->user()->load('roles:id,name'));
    Route::get('/csrf-cookie', fn () => response()->noContent());
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/email/verify/{id}/{hash}', [EmailVerificationController::class, 'verify'])
        ->middleware(['signed:relative', 'throttle:6,1'])
        ->name('verification.verify');
    Route::post('/email/verification-notification', [EmailVerificationController::class, 'resend'])
        ->middleware('throttle:6,1')
        ->name('verification.send');

    Route::middleware('verified')->group(function () {
        Route::prefix('ai')->group(function () {
            Route::middleware('throttle:60,1')->group(function () {
                Route::get('/conversations', [AIController::class, 'conversations']);
                Route::post('/conversations', [AIController::class, 'createConversation']);
                Route::get('/conversations/{conversation}', [AIController::class, 'showConversation']);
                Route::delete('/conversations/{conversation}', [AIController::class, 'deleteConversation']);
            });
            Route::middleware('throttle:20,5')->group(function () {
                Route::post('/chat', [AIController::class, 'chat']);
                Route::post('/explain-lesson', [AIController::class, 'explainLesson']);
            });
            Route::middleware(['throttle:ai-generation', 'ai.concurrency'])->group(function () {
                Route::post('/summarize-lesson', [AIController::class, 'summarizeLesson']);
                Route::post('/summarize', [AIController::class, 'summarize']);
                Route::post('/generate-quiz', [AIController::class, 'generateQuiz']);
            });
        });
        Route::get('/manage/courses', [CourseController::class, 'index']);
        Route::get('/manage/courses/{course}/builder', [CourseBuilderController::class, 'show']);
        Route::patch('/manage/courses/{course}/builder', [CourseBuilderController::class, 'update']);
        Route::get('/manage/courses/{course}/preview', [CourseBuilderController::class, 'preview']);
        Route::post('/manage/courses/{course}/thumbnail', [CourseMediaController::class, 'thumbnail']);
        Route::post('/manage/courses/{course}/promotional-video', [CourseMediaController::class, 'promotionalVideo']);
        Route::get('/manage/courses/{course}/promotional-video', [CourseMediaController::class, 'stream'])->name('courses.promotional-video');
        Route::post('/manage/courses', [CourseController::class, 'store']);
        Route::put('/manage/courses/{course}', [CourseController::class, 'update']);
        Route::delete('/manage/courses/{course}', [CourseController::class, 'destroy']);
        Route::post('/manage/courses/{course}/submit', [CourseController::class, 'submit']);
        Route::post('/instructor/apply', [InstructorApprovalController::class, 'apply']);
        Route::get('/courses/{course}/my-review', [ReviewController::class, 'own']);
        Route::post('/courses/{course}/reviews', [ReviewController::class, 'store']);
        Route::put('/reviews/{review}', [ReviewController::class, 'update']);
        Route::delete('/reviews/{review}', [ReviewController::class, 'destroy']);
        Route::get('/enrollments', [EnrollmentController::class, 'index']);
        Route::get('/orders', [OrderController::class, 'index']);
        Route::get('/notifications', [NotificationController::class, 'index']);
        Route::patch('/notifications/read-all', [NotificationController::class, 'readAll']);
        Route::patch('/notifications/{notification}/read', [NotificationController::class, 'read']);
        Route::get('/notification-settings', [NotificationController::class, 'settings']);
        Route::patch('/notification-settings', [NotificationController::class, 'updateSettings']);
        Route::post('/orders', [OrderController::class, 'store']);
        Route::get('/checkout/courses/{course}', [OrderController::class, 'course']);
        Route::get('/orders/{order}', [OrderController::class, 'show']);
        Route::post('/orders/{order}/payment', [PaymentController::class, 'store'])
            ->middleware('throttle:10,1');
        Route::get('/instructor/earnings', [RevenueController::class, 'instructor']);
        Route::get('/gamification', [GamificationController::class, 'show']);
        Route::get('/certificates', [CertificateController::class, 'index']);
        Route::get('/certificates/{certificate}', [CertificateController::class, 'show']);
        Route::get('/certificates/{certificate}/download', [CertificateController::class, 'download']);
        Route::patch('/certificates/{certificate}/revoke', [CertificateController::class, 'revoke']);
        Route::get('/leaderboard', [GamificationController::class, 'leaderboard']);
        Route::patch('/gamification/settings', [GamificationController::class, 'updateSettings']);
        Route::post('/courses/{course}/enroll', [EnrollmentController::class, 'store']);
        Route::get('/enrollments/{enrollment}/progress', [EnrollmentController::class, 'show']);
        Route::patch('/enrollments/{enrollment}/cancel', [EnrollmentController::class, 'cancel']);
        Route::put('/enrollments/{enrollment}/lessons/{lesson}/progress', [EnrollmentController::class, 'updateProgress']);
        Route::patch('/enrollments/{enrollment}/lessons/{lesson}/interaction', [EnrollmentController::class, 'updateInteraction']);
        Route::get('/manage/courses/{course}/enrollment-statistics', [EnrollmentStatisticsController::class, 'show']);
        Route::get('/manage/courses/{course}/curriculum', [InstructorCurriculumController::class, 'show']);
        Route::post('/manage/courses/{course}/sections', [CurriculumController::class, 'storeSection']);
        Route::put('/manage/courses/{course}/sections/reorder', [CurriculumController::class, 'reorderSections']);
        Route::put('/manage/sections/{section}', [CurriculumController::class, 'updateSection']);
        Route::delete('/manage/sections/{section}', [CurriculumController::class, 'destroySection']);
        Route::post('/manage/sections/{section}/lessons', [CurriculumController::class, 'storeLesson']);
        Route::put('/manage/sections/{section}/lessons/reorder', [CurriculumController::class, 'reorderLessons']);
        Route::put('/manage/lessons/{lesson}', [CurriculumController::class, 'updateLesson']);
        Route::delete('/manage/lessons/{lesson}', [CurriculumController::class, 'destroyLesson']);
        Route::put('/manage/lessons/{lesson}/content', [LessonContentController::class, 'updateText']);
        Route::post('/manage/lessons/{lesson}/video', [LessonContentController::class, 'storeVideo']);
        Route::delete('/manage/lessons/{lesson}/video', [LessonContentController::class, 'destroyVideo']);
        Route::post('/manage/lessons/{lesson}/attachments', [LessonContentController::class, 'storeAttachment']);
        Route::delete('/manage/attachments/{attachment}', [LessonContentController::class, 'destroyAttachment']);
        Route::get('/manage/lessons/{lesson}/quiz', [InstructorQuizController::class, 'show']);
        Route::post('/manage/lessons/{lesson}/quiz', [InstructorQuizController::class, 'store']);
        Route::put('/manage/quizzes/{quiz}', [InstructorQuizController::class, 'update']);
        Route::post('/manage/quizzes/{quiz}/questions', [InstructorQuizController::class, 'storeQuestion']);
        Route::put('/manage/questions/{question}', [InstructorQuizController::class, 'updateQuestion']);
        Route::delete('/manage/questions/{question}', [InstructorQuizController::class, 'destroyQuestion']);
        Route::put('/manage/quizzes/{quiz}/reorder', [InstructorQuizController::class, 'reorder']);
        Route::post('/manage/quizzes/{quiz}/publish', [InstructorQuizController::class, 'publish']);
        Route::get('/manage/quizzes/{quiz}/preview', [InstructorQuizController::class, 'preview']);
        Route::get('/learning/enrollments/{enrollment}', [CoursePlayerController::class, 'enrollment']);
        Route::get('/learning/lessons/{lesson}', [CoursePlayerController::class, 'lesson']);
        Route::get('/learning/lessons/{lesson}/video', [MediaDeliveryController::class, 'video'])->name('lessons.video.stream');
        Route::get('/learning/attachments/{attachment}', [MediaDeliveryController::class, 'attachment'])->name('attachments.download');
        Route::get('/learning/lessons/{lesson}/quiz', [StudentQuizController::class, 'show']);
        Route::post('/learning/quizzes/{quiz}/attempts', [StudentQuizController::class, 'start']);
        Route::get('/learning/quizzes/{quiz}/attempts', [StudentQuizController::class, 'index']);
        Route::get('/learning/quiz-attempts/{attempt}', [StudentQuizController::class, 'showAttempt']);
        Route::post('/learning/quiz-attempts/{attempt}/submit', [StudentQuizController::class, 'submit']);
        Route::get('/admin/dashboard', [AdminDashboardController::class, 'overview']);
        Route::get('/admin/revenue', [RevenueController::class, 'admin']);
        Route::get('/admin/activity', [AdminOperationsController::class, 'activity']);
        Route::get('/admin/notifications', [AdminOperationsController::class, 'notifications']);
        Route::get('/admin/ai-usage', [AdminDashboardController::class, 'aiUsage']);
        Route::get('/admin/users', [AdminUserController::class, 'index']);
        Route::get('/admin/users/{user}', [AdminUserController::class, 'show']);
        Route::patch('/admin/users/{user}/admin-access', [AdminUserController::class, 'updateAdminAccess']);
        Route::get('/admin/courses', [AdminCourseController::class, 'index']);
        Route::apiResource('/admin/categories', CategoryController::class)->except('show');
        Route::post('/admin/courses/{course}/approve', [CourseModerationController::class, 'approve']);
        Route::post('/admin/courses/{course}/reject', [CourseModerationController::class, 'reject']);
        Route::post('/admin/courses/{course}/archive', [CourseModerationController::class, 'archive']);
        Route::patch('/admin/instructors/{user}/status', [InstructorApprovalController::class, 'update']);
        Route::get('/admin/instructors', [InstructorApprovalController::class, 'index']);
        Route::get('/manage/courses/{course}/reviews', [ReviewModerationController::class, 'course']);
        Route::get('/admin/reviews', [ReviewModerationController::class, 'index']);
        Route::patch('/admin/reviews/{review}', [ReviewModerationController::class, 'update']);
    });
});
