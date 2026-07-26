<?php

namespace App\Jobs;

use App\Models\Certificate;
use Barryvdh\DomPDF\Facade\Pdf;
use Endroid\QrCode\QrCode;
use Endroid\QrCode\Writer\SvgWriter;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Throwable;

class GenerateCertificatePdf implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;

    public int $timeout = 60;

    public bool $failOnTimeout = true;

    public function __construct(public int $certificateId)
    {
        $this->onQueue('certificates');
    }

    public function handle(): void
    {
        $certificate = Certificate::query()->with(['user:id,name', 'course:id,title,instructor_id', 'course.instructor:id,name'])->findOrFail($this->certificateId);
        if ($certificate->status === 'revoked') {
            return;
        }
        if ($certificate->status === 'issued' && $certificate->pdf_path && Storage::disk('certificates')->exists($certificate->pdf_path)) {
            return;
        }

        $verificationUrl = rtrim((string) config('app.frontend_url'), '/').'/verify/'.$certificate->verification_code;
        $qrCode = new QrCode(data: $verificationUrl, size: 220, margin: 8);
        $qrDataUri = (new SvgWriter)->write($qrCode)->getDataUri();
        $pdf = Pdf::loadView('certificates.course-completion', compact('certificate', 'verificationUrl', 'qrDataUri'))
            ->setPaper('a4', 'landscape');
        $path = $certificate->issued_at->format('Y/m').'/'.$certificate->certificate_number.'.pdf';

        Storage::disk('certificates')->put($path, $pdf->output());
        $certificate->update(['pdf_path' => $path, 'status' => 'issued']);
    }

    public function backoff(): array
    {
        return [5, 30, 120];
    }

    public function failed(?Throwable $exception): void
    {
        Log::error('Certificate PDF generation failed.', [
            'certificate_id' => $this->certificateId,
            'exception' => $exception ? $exception::class : null,
        ]);
    }
}
