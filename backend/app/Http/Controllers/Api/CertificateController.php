<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\CertificateResource;
use App\Models\Certificate;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\StreamedResponse;

class CertificateController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $certificates = Certificate::query()
            ->when(! $request->user()->hasRole('admin'), function ($query) use ($request): void {
                abort_unless($request->user()->hasRole('student'), 403);
                $query->where('user_id', $request->user()->id);
            })
            ->with(['course:id,title,instructor_id', 'course.instructor:id,name'])
            ->latest('issued_at')
            ->paginate(20);

        return CertificateResource::collection($certificates);
    }

    public function show(Certificate $certificate): CertificateResource
    {
        Gate::authorize('view', $certificate);

        return new CertificateResource($certificate->load(['course:id,title,instructor_id', 'course.instructor:id,name']));
    }

    public function download(Certificate $certificate): StreamedResponse
    {
        Gate::authorize('download', $certificate);
        abort_unless($certificate->status === 'issued' && $certificate->pdf_path, 409, 'The certificate PDF is not ready yet.');
        abort_unless(Storage::disk('certificates')->exists($certificate->pdf_path), 404);

        return Storage::disk('certificates')->download(
            $certificate->pdf_path,
            $certificate->certificate_number.'.pdf',
            ['Content-Type' => 'application/pdf']
        );
    }

    public function verify(string $code): JsonResponse
    {
        $certificate = Certificate::query()
            ->where('verification_code', $code)
            ->with(['user:id,name', 'course:id,title,instructor_id', 'course.instructor:id,name'])
            ->firstOrFail();

        return response()->json(['data' => [
            'certificate_number' => $certificate->certificate_number,
            'owner_name' => $certificate->user->name,
            'course_title' => $certificate->course->title,
            'instructor_name' => $certificate->course->instructor?->name,
            'issued_at' => $certificate->issued_at?->toDateString(),
            'status' => $certificate->status,
            'valid' => $certificate->status === 'issued',
        ]]);
    }

    public function revoke(Certificate $certificate): CertificateResource
    {
        Gate::authorize('revoke', $certificate);
        $certificate->update(['status' => 'revoked']);

        return new CertificateResource($certificate->load(['course:id,title,instructor_id', 'course.instructor:id,name']));
    }
}
