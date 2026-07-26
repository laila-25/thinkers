<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <title>{{ $certificate->certificate_number }}</title>
    <style>
        @page { margin: 0; }
        body { margin: 0; color: #0f172a; font-family: DejaVu Sans, sans-serif; }
        .page { position: relative; width: 100%; height: 100%; min-height: 740px; background: #fffdf7; text-align: center; }
        .frame { position: absolute; inset: 28px; border: 4px solid #0b1b3b; }
        .inner { position: absolute; inset: 40px; border: 1px solid #d9a91a; padding: 45px 70px; }
        .brand { color: #0b1b3b; font-size: 30px; font-weight: 800; letter-spacing: 5px; }
        .brand-mark { display: inline-block; width: 34px; height: 34px; margin-right: 10px; border-radius: 50%; background: #f5c542; color: #0b1b3b; line-height: 34px; }
        .eyebrow { margin-top: 42px; color: #a16207; font-size: 13px; font-weight: 700; letter-spacing: 4px; text-transform: uppercase; }
        h1 { margin: 12px 0 6px; font-family: Georgia, serif; font-size: 47px; font-weight: normal; }
        .lead { color: #475569; font-size: 17px; }
        .student { margin: 24px auto 12px; width: 70%; padding-bottom: 8px; border-bottom: 1px solid #d9a91a; font-family: Georgia, serif; font-size: 35px; }
        .course { margin: 16px 0; color: #0b1b3b; font-size: 25px; font-weight: 700; }
        .details { table-layout: fixed; margin-top: 30px; width: 100%; font-size: 12px; color: #475569; }
        .details td { width: 33.33%; padding: 0 12px; vertical-align: bottom; }
        .details strong { display: block; margin-top: 5px; color: #0f172a; font-size: 14px; }
        .qr { width: 92px; height: 92px; }
        .verify { margin-top: 4px; font-size: 9px; }
        .certificate-id { overflow-wrap: anywhere; word-break: break-all; line-height: 1.35; }
        .code { margin: 13px auto 0; width: 82%; color: #64748b; font-size: 8px; letter-spacing: .6px; overflow-wrap: anywhere; word-break: break-all; }
    </style>
</head>
<body><main class="page"><div class="frame"></div><div class="inner">
    <div class="brand"><span class="brand-mark">T</span>THINKERS</div>
    <div class="eyebrow">Certificate of Completion</div>
    <h1>Certificate of Achievement</h1>
    <p class="lead">This certificate is proudly presented to</p>
    <div class="student">{{ $certificate->user->name }}</div>
    <p class="lead">for successfully completing all required lessons in</p>
    <div class="course">{{ $certificate->course->title }}</div>
    <table class="details"><tr>
        <td>Instructor<strong>{{ $certificate->course->instructor?->name ?? 'Thinkers Academy' }}</strong></td>
        <td><img class="qr" src="{{ $qrDataUri }}" alt="Verification QR"><div class="verify">Scan to verify this certificate</div></td>
        <td>Issued {{ $certificate->issued_at->format('F j, Y') }}<strong class="certificate-id">{{ $certificate->certificate_number }}</strong></td>
    </tr></table>
    <div class="code">Verification code: {{ $certificate->verification_code }}</div>
</div></main></body></html>
