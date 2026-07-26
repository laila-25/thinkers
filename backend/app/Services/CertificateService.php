<?php

namespace App\Services;

use App\Jobs\GenerateCertificatePdf;
use App\Models\Certificate;
use App\Models\Enrollment;
use App\Models\Lesson;
use App\Notifications\PlatformNotification;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class CertificateService
{
    public function issueForCompletedEnrollment(Enrollment $enrollment): ?Certificate
    {
        return DB::transaction(function () use ($enrollment): ?Certificate {
            $locked = Enrollment::query()->lockForUpdate()->findOrFail($enrollment->id);
            $totalRequired = Lesson::query()
                ->whereHas('section', fn ($query) => $query->where('course_id', $locked->course_id))
                ->where('is_published', true)
                ->count();
            $completedRequired = $locked->progress()
                ->where('status', 'completed')
                ->whereHas('lesson', fn ($query) => $query
                    ->where('is_published', true)
                    ->whereHas('section', fn ($section) => $section->where('course_id', $locked->course_id)))
                ->count();

            if ($locked->status !== 'completed' || $totalRequired === 0 || $completedRequired !== $totalRequired) {
                return null;
            }

            $certificate = Certificate::query()->firstOrCreate(
                ['user_id' => $locked->user_id, 'course_id' => $locked->course_id],
                [
                    'certificate_number' => 'THK-'.now()->format('Y').'-'.Str::upper(Str::random(12)),
                    'verification_code' => Str::random(64),
                    'issued_at' => $locked->completed_at ?? now(),
                    'status' => 'pending',
                ]
            );

            if ($certificate->wasRecentlyCreated || ($certificate->status === 'pending' && ! $certificate->pdf_path)) {
                GenerateCertificatePdf::dispatch($certificate->id)->afterCommit();
            }
            if ($certificate->wasRecentlyCreated && $locked->user->allowsNotification('learning_activity')) {
                $locked->user->notify(new PlatformNotification(
                    'certificate_issued', 'Certificate earned', "Your certificate for {$locked->course->title} is being prepared.",
                    '/certificates', 'View certificates', 'certificate',
                ));
            }

            return $certificate;
        });
    }
}
